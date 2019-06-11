---
layout: post
title: "你大爷永远是你大爷，RDD血缘关系源码详解！"
date: 2018-06-13
comments: true
tags: 
	- spark
	- 高级
categories: Spark Core
---

#### 一、RDD的依赖关系

　RDD的依赖关系分为两类：宽依赖和窄依赖。我们可以这样认为：
- （1）窄依赖：每个parent RDD 的 partition 最多被 child RDD 的一个partition 使用。

- （2）宽依赖：每个parent RDD partition 被多个 child RDD 的partition 使用。

窄依赖每个 child RDD 的 partition 的生成操作都是可以并行的，而宽依赖则需要所有的 parent RDD partition shuffle 结果得到后再进行。
<!--more--> 

#### 二、org.apache.spark.Dependency.scala 源码解析
Dependency是一个抽象类：
```
// Denpendency.scala
abstract class Dependency[T] extends Serializable {
  def rdd: RDD[T]
}

```
   它有两个子类：NarrowDependency 和 ShuffleDenpendency，分别对应窄依赖和宽依赖。
##### （1）NarrowDependency也是一个抽象类
定义了抽象方法getParents，输入partitionId，用于获得child RDD 的某个partition依赖的parent RDD的所有 partitions。
```
// Denpendency.scala
abstract class NarrowDependency[T](_rdd: RDD[T]) extends Dependency[T] {  
/**
   * Get the parent partitions for a child partition.
   * @param partitionId a partition of the child RDD
   * @return the partitions of the parent RDD that the child partition depends upon
   */
  def getParents(partitionId: Int): Seq[Int]

  override def rdd: RDD[T] = _rdd
}
```
窄依赖又有两个具体的实现：OneToOneDependency和RangeDependency。
 （a）OneToOneDependency指child RDD的partition只依赖于parent RDD 的一个partition，产生OneToOneDependency的算子有map，filter，flatMap等。可以看到getParents实现很简单，就是传进去一个partitionId，再把partitionId放在List里面传出去。
```
// Denpendency.scala
class OneToOneDependency[T](rdd: RDD[T]) extends NarrowDependency[T](rdd) {
  override def getParents(partitionId: Int): List[Int] = List(partitionId)
}
        （b）RangeDependency指child RDD partition在一定的范围内一对一的依赖于parent RDD partition，主要用于union。

// Denpendency.scala
class RangeDependency[T](rdd: RDD[T], inStart: Int, outStart: Int, length: Int)  
  extends NarrowDependency[T](rdd) {//inStart表示parent RDD的开始索引，outStart表示child RDD 的开始索引
  override def getParents(partitionId: Int): List[Int] = {    
    if (partitionId >= outStart && partitionId < outStart + length) {
      List(partitionId - outStart + inStart)//表示于当前索引的相对位置
    } else {
      Nil
    }
  }
}
```
##### （2）ShuffleDependency指宽依赖
表示一个parent RDD的partition会被child RDD的partition使用多次。需要经过shuffle才能形成。

```
// Denpendency.scala
class ShuffleDependency[K: ClassTag, V: ClassTag, C: ClassTag](
    @transient private val _rdd: RDD[_ <: Product2[K, V]],    
    val partitioner: Partitioner,    
    val serializer: Serializer = SparkEnv.get.serializer,
    val keyOrdering: Option[Ordering[K]] = None,
    val aggregator: Option[Aggregator[K, V, C]] = None,
    val mapSideCombine: Boolean = false)
  extends Dependency[Product2[K, V]] {  //shuffle都是基于PairRDD进行的，所以传入的RDD要是key-value类型的
  override def rdd: RDD[Product2[K, V]] = _rdd.asInstanceOf[RDD[Product2[K, V]]]

  private[spark] val keyClassName: String = reflect.classTag[K].runtimeClass.getName
  private[spark] val valueClassName: String = reflect.classTag[V].runtimeClass.getName
  private[spark] val combinerClassName: Option[String] =
    Option(reflect.classTag[C]).map(_.runtimeClass.getName)  //获取shuffleId
  val shuffleId: Int = _rdd.context.newShuffleId()  //向shuffleManager注册shuffle信息
  val shuffleHandle: ShuffleHandle = _rdd.context.env.shuffleManager.registerShuffle(
    shuffleId, _rdd.partitions.length, this)

  _rdd.sparkContext.cleaner.foreach(_.registerShuffleForCleanup(this))
}
```
由于shuffle涉及到网络传输，所以要有序列化serializer，为了减少网络传输，可以map端聚合，通过mapSideCombine和aggregator控制，还有key排序相关的keyOrdering，以及重输出的数据如何分区的partitioner，还有一些class信息。Partition之间的关系在shuffle处戛然而止，因此shuffle是划分stage的依据。
#### 三、两种依赖的区分

　首先，窄依赖允许在一个集群节点上以流水线的方式（pipeline）计算所有父分区。例如，逐个元素地执行map、然后filter操作；而宽依赖则需要首先计算好所有父分区数据，然后在节点之间进行Shuffle，这与MapReduce类似。第二，窄依赖能够更有效地进行失效节点的恢复，即只需重新计算丢失RDD分区的父分区，而且不同节点之间可以并行计算；而对于一个宽依赖关系的Lineage图，单个节点失效可能导致这个RDD的所有祖先丢失部分分区，因而需要整体重新计算。