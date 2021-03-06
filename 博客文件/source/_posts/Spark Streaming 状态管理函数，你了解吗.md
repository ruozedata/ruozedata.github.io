---
layout: post
title: "Spark Streaming 状态管理函数，你了解吗"
date: 2018-06-25
comments: true
tags: 
	- spark
	- 高级
categories: Spark Streaming
---

<!--more--> 
Spark Streaming 状态管理函数包括updateStateByKey和mapWithState

#### 一、updateStateByKey

官网原话：In every batch, Spark will apply the state update function for all existing keys, regardless of whether they have new data in a batch or not. If the update function returns None then the key-value pair will be eliminated.

统计全局的key的状态，但是就算没有数据输入，他也会在每一个批次的时候返回之前的key的状态。

这样的缺点：如果数据量太大的话，我们需要checkpoint数据会占用较大的存储。而且效率也不高
```
//[root@bda3 ~]# nc -lk 9999  
object StatefulWordCountApp {  

  def main(args: Array[String]) {  
    StreamingExamples.setStreamingLogLevels()  
    val sparkConf = new SparkConf()  
      .setAppName("StatefulWordCountApp")  
      .setMaster("local[2]")  
    val ssc = new StreamingContext(sparkConf, Seconds(10))  
    //注意：updateStateByKey必须设置checkpoint目录  
    ssc.checkpoint("hdfs://bda2:8020/logs/realtime")  

    val lines = ssc.socketTextStream("bda3",9999)  

    lines.flatMap(_.split(",")).map((_,1))  
      .updateStateByKey(updateFunction).print()  

    ssc.start()  // 一定要写  
    ssc.awaitTermination()  
  }  
  /*状态更新函数  
  * @param currentValues  key相同value形成的列表  
  * @param preValues      key对应的value，前一状态  
  * */  
  def updateFunction(currentValues: Seq[Int], preValues: Option[Int]): Option[Int] = {  
    val curr = currentValues.sum   //seq列表中所有value求和  
    val pre = preValues.getOrElse(0)  //获取上一状态值  
    Some(curr + pre)  
  }  
} 
```

#### 二、mapWithState  (效率更高，生产中建议使用)

mapWithState：也是用于全局统计key的状态，但是它如果没有数据输入，便不会返回之前的key的状态，有一点增量的感觉。

这样做的好处是，我们可以只是关心那些已经发生的变化的key，对于没有数据输入，则不会返回那些没有变化的key的数据。这样的话，即使数据量很大，checkpoint也不会像updateStateByKey那样，占用太多的存储。

官方代码如下：
```
/**  
 * Counts words cumulatively in UTF8 encoded, '\n' delimited text received from the network every  
 * second starting with initial value of word count.  
 * Usage: StatefulNetworkWordCount <hostname> <port>  
 *   <hostname> and <port> describe the TCP server that Spark Streaming would connect to receive  
 *   data.  
 *  
 * To run this on your local machine, you need to first run a Netcat server  
 *    `$ nc -lk 9999`  
 * and then run the example  
 *    `$ bin/run-example  
 *      org.apache.spark.examples.streaming.StatefulNetworkWordCount localhost 9999`  
 */  
object StatefulNetworkWordCount {  
  def main(args: Array[String]) {  
    if (args.length < 2) {  
      System.err.println("Usage: StatefulNetworkWordCount <hostname> <port>")  
      System.exit(1)  
    }  

    StreamingExamples.setStreamingLogLevels()  

    val sparkConf = new SparkConf().setAppName("StatefulNetworkWordCount")  
    // Create the context with a 1 second batch size  
    val ssc = new StreamingContext(sparkConf, Seconds(1))  
    ssc.checkpoint(".")  

    // Initial state RDD for mapWithState operation  
    val initialRDD = ssc.sparkContext.parallelize(List(("hello", 1), ("world", 1)))  

    // Create a ReceiverInputDStream on target ip:port and count the  
    // words in input stream of \n delimited test (eg. generated by 'nc')  
    val lines = ssc.socketTextStream(args(0), args(1).toInt)  
    val words = lines.flatMap(_.split(" "))  
    val wordDstream = words.map(x => (x, 1))  

    // Update the cumulative count using mapWithState  
    // This will give a DStream made of state (which is the cumulative count of the words)  
    val mappingFunc = (word: String, one: Option[Int], state: State[Int]) => {  
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