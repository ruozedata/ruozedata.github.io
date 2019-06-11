---
layout: post
title: "SparkStreaming 状态管理函数的选择比较"
date: 2018-06-06
comments: true
tags: [高级,spark]
categories: Spark Streaming
---

<!--more--> 
#### 一、updateStateByKey

官网原话：
```
In every batch, Spark will apply the state update function for all existing keys, regardless of whether they have new data in a batch or not. If the update function returns None then the key-value pair will be eliminated.
```
也即是说它会统计全局的key的状态，就算没有数据输入，它也会在每一个批次的时候返回之前的key的状态。

缺点：若数据量太大的话，需要checkpoint的数据会占用较大的存储，效率低下。

程序示例如下：

```
object StatefulWordCountApp {  
  def main(args: Array[String]) {  
    StreamingExamples.setStreamingLogLevels()  
    val sparkConf = new SparkConf()  
      .setAppName("StatefulWordCountApp")  
      .setMaster("local[2]")  
    val ssc = new StreamingContext(sparkConf, Seconds(10))  
    //注意：要使用updateStateByKey必须设置checkpoint目录  
    ssc.checkpoint("hdfs://bda2:8020/logs/realtime")  

    val lines = ssc.socketTextStream("bda3",9999)  

    lines.flatMap(_.split(",")).map((_,1))  
      .updateStateByKey(updateFunction).print()  

    ssc.start() 
    ssc.awaitTermination()  
  }   
 /*状态更新函数  
  * @param currentValues  key相同value形成的列表  
  * @param preValues      key对应的value，前一状态  
  * */  
def updateFunction(currentValues: Seq[Int], preValues: Option[Int]):                                Option[Int] = {  
    val curr = currentValues.sum   //seq列表中所有value求和  
    val pre = preValues.getOrElse(0)  //获取上一状态值  
    Some(curr + pre)  
  }  
}
```

#### 二、mapWithState

mapWithState：也是用于全局统计key的状态，但是它如果没有数据输入，便不会返回之前的key的状态，有一点增量的感觉。效率更高，生产中建议使用

官方代码如下：
```
object StatefulNetworkWordCount {  
  def main(args: Array[String]) {  
    if (args.length < 2) {  
      System.err.println("Usage: StatefulNetworkWordCount 
      <hostname> <port>")  
      System.exit(1)  
    }  
    StreamingExamples.setStreamingLogLevels()  
    val sparkConf = new SparkConf()
      .setAppName("StatefulNetworkWordCount")
    val ssc = new StreamingContext(sparkConf, Seconds(1))  
    ssc.checkpoint(".")   
    val initialRDD = ssc.sparkContext
      .parallelize(List(("hello", 1),("world", 1)))  
    val lines = ssc.socketTextStream(args(0), args(1).toInt)  
    val words = lines.flatMap(_.split(" "))  
    val wordDstream = words.map(x => (x, 1))  

    val mappingFunc = (word: String, one: Option[Int], 
     state: State[Int]) => {  
      val sum = one.getOrElse(0) + state.getOption.getOrElse(0)  
      val output = (word, sum)  
      state.update(sum)  
      output  
    }  
    val stateDstream = wordDstream.mapWithState(  
    StateSpec.function(mappingFunc).initialState(initialRDD))  
    stateDstream.print()  
    ssc.start()  
    ssc.awaitTermination()  
  }  
}
```
#### 三、源码分析

##### upateStateByKey：
- map返回的是MappedDStream，而MappedDStream并没有updateStateByKey方法，并且它的父类DStream中也没有该方法。但是DStream的伴生对象中有一个隐式转换函数：

```
object DStream {
  implicit def toPairDStreamFunctions[K, V](stream: DStream[(K, V)])
      (implicit kt: ClassTag[K], vt: ClassTag[V], ord: Ordering[K] = null):
    PairDStreamFunctions[K, V] = {
    new PairDStreamFunctions[K, V](stream)
  }
```
跟进去 PairDStreamFunctions ，发现最终调用的是自己的updateStateByKey。
其中updateFunc就要传入的参数，他是一个函数，Seq[V]表示当前key对应的所有值，
```
Option[S] 是当前key的历史状态，返回的是新的状态。
def updateStateByKey[S: ClassTag](
    updateFunc: (Seq[V], Option[S]) => Option[S]
  ): DStream[(K, S)] = ssc.withScope {
  updateStateByKey(updateFunc, defaultPartitioner())
}
```
最终调用：
```
def updateStateByKey[S: ClassTag](
    updateFunc: (Iterator[(K, Seq[V], Option[S])]) => Iterator[(K, S)],
    partitioner: Partitioner,
    rememberPartitioner: Boolean): DStream[(K, S)] = ssc.withScope {
  val cleanedFunc = ssc.sc.clean(updateFunc)
  val newUpdateFunc = (_: Time, it: Iterator[(K, Seq[V], Option[S])]) => {
    cleanedFunc(it)
  }
  new StateDStream(self, newUpdateFunc, partitioner, rememberPartitioner, None)
}
```
再跟进去 new StateDStream:
在这里面new出了一个StateDStream对象。在其compute方法中，会先获取上一个batch计算出的RDD（包含了至程序开始到上一个batch单词的累计计数），然后在获取本次batch中StateDStream的父类计算出的RDD（本次batch的单词计数）分别是prevStateRDD和parentRDD，然后在调用 computeUsingPreviousRDD 方法：
```
private [this] def computeUsingPreviousRDD(
    batchTime: Time,
    parentRDD: RDD[(K, V)],
    prevStateRDD: RDD[(K, S)]) = {
  // Define the function for the mapPartition operation on cogrouped RDD;
  // first map the cogrouped tuple to tuples of required type,
  // and then apply the update function
  val updateFuncLocal = updateFunc
  val finalFunc = (iterator: Iterator[(K, (Iterable[V], Iterable[S]))]) => {
    val i = iterator.map { t =>
      val itr = t._2._2.iterator
      val headOption = if (itr.hasNext) Some(itr.next()) else None
      (t._1, t._2._1.toSeq, headOption)
    }
    updateFuncLocal(batchTime, i)
  }
  val cogroupedRDD = parentRDD.cogroup(prevStateRDD, partitioner)
  val stateRDD = cogroupedRDD.mapPartitions(finalFunc, preservePartitioning)
  Some(stateRDD)
}
```
在这里两个RDD进行cogroup然后应用updateStateByKey传入的函数。我们知道cogroup的性能是比较低下，参考http://lxw1234.com/archives/2015/07/384.htm。
##### mapWithState:
```
@Experimental
def mapWithState[StateType: ClassTag, MappedType: ClassTag](
    spec: StateSpec[K, V, StateType, MappedType]
  ): MapWithStateDStream[K, V, StateType, MappedType] = {
  new MapWithStateDStreamImpl[K, V, StateType, MappedType](
    self,
    spec.asInstanceOf[StateSpecImpl[K, V, StateType, MappedType]]
  )
}
```
说明：StateSpec 封装了状态管理函数，并在该方法中创建了MapWithStateDStreamImpl对象。

MapWithStateDStreamImpl 中创建了一个InternalMapWithStateDStream类型对象internalStream，在MapWithStateDStreamImpl的compute方法中调用了internalStream的getOrCompute方法。
```
private[streaming] class MapWithStateDStreamImpl[
    KeyType: ClassTag, ValueType: ClassTag, StateType: ClassTag, MappedType: ClassTag](
    dataStream: DStream[(KeyType, ValueType)],
    spec: StateSpecImpl[KeyType, ValueType, StateType, MappedType])
  extends MapWithStateDStream[KeyType, ValueType, StateType, MappedType](dataStream.context) {

  private val internalStream =
    new InternalMapWithStateDStream[KeyType, ValueType, StateType, MappedType](dataStream, spec)

  override def slideDuration: Duration = internalStream.slideDuration

  override def dependencies: List[DStream[_]] = List(internalStream)

  override def compute(validTime: Time): Option[RDD[MappedType]] = {
    internalStream.getOrCompute(validTime).map { _.flatMap[MappedType] { _.mappedData } }
  }
  ```
InternalMapWithStateDStream中没有getOrCompute方法，这里调用的是其父类 DStream 的getOrCpmpute方法，该方法中最终会调用InternalMapWithStateDStream的Compute方法：
```
/** Method that generates an RDD for the given time */
override def compute(validTime: Time): Option[RDD[MapWithStateRDDRecord[K, S, E]]] = {
  // Get the previous state or create a new empty state RDD
  val prevStateRDD = getOrCompute(validTime - slideDuration) match {
    case Some(rdd) =>
      if (rdd.partitioner != Some(partitioner)) {
        // If the RDD is not partitioned the right way, let us repartition it using the
        // partition index as the key. This is to ensure that state RDD is always partitioned
        // before creating another state RDD using it
        MapWithStateRDD.createFromRDD[K, V, S, E](
          rdd.flatMap { _.stateMap.getAll() }, partitioner, validTime)
      } else {
        rdd
      }
    case None =>
      MapWithStateRDD.createFromPairRDD[K, V, S, E](
        spec.getInitialStateRDD().getOrElse(new EmptyRDD[(K, S)](ssc.sparkContext)),
        partitioner,
        validTime
      )
  }
  // Compute the new state RDD with previous state RDD and partitioned data RDD
  // Even if there is no data RDD, use an empty one to create a new state RDD
  val dataRDD = parent.getOrCompute(validTime).getOrElse {
    context.sparkContext.emptyRDD[(K, V)]
  }
  val partitionedDataRDD = dataRDD.partitionBy(partitioner)
  val timeoutThresholdTime = spec.getTimeoutInterval().map { interval =>
    (validTime - interval).milliseconds
  }
  Some(new MapWithStateRDD(
    prevStateRDD, partitionedDataRDD, mappingFunction, 
    validTime, timeoutThresholdTime))
}
```
根据给定的时间生成一个MapWithStateRDD，首先获取了先前状态的RDD：preStateRDD和当前时间的RDD:dataRDD，然后对dataRDD基于先前状态RDD的分区器进行重新分区获取partitionedDataRDD。最后将preStateRDD，partitionedDataRDD和用户定义的函数mappingFunction传给新生成的MapWithStateRDD对象返回。

后续若有兴趣可以继续跟进MapWithStateRDD的compute方法，限于篇幅不再展示。
