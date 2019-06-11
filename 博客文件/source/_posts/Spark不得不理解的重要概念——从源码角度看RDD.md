---
layout: post
title: "Spark不得不理解的重要概念——从源码角度看RDD"
date: 2018-05-20
comments: true
tags: [spark,高级]
categories:  Spark Core
---



<font color=#FF4500 >
</font>

#### 1.RDD是什么 
   Resilient Distributed Dataset（弹性分布式数据集），是一个能够并行操作不可变的分区元素的集合

#### 2.RDD五大特性
<!--more--> 
1. A list of partitions 
每个rdd有多个分区 
protected def getPartitions: Array[Partition]

2. A function for computing each split 
计算作用到每个分区 
def compute(split: Partition, context: TaskContext): Iterator[T]

3. A list of dependencies on other RDDs 
rdd之间存在依赖（RDD的血缘关系）如： 
RDDA=>RDDB=>RDDC=>RDDD 
protected def getDependencies: Seq[Dependency[_]] = deps

4. Optionally, a Partitioner for key-value RDDs (e.g. to say that the RDD is hash-partitioned) 
可选，默认哈希的分区 
@transient val partitioner: Option[Partitioner] = None

5. Optionally, a list of preferred locations to compute each split on (e.g. block locations foran HDFS file) 
计算每个分区的最优执行位置，尽量实现数据本地化，减少IO（这往往是理想状态） 
protected def getPreferredLocations(split: Partition): Seq[String] = Nil

源码来自github。

#### 3.如何创建RDD

创建RDD有两种方式 parallelize() 和textfile()，其中parallelize可接收集合类，主要作为测试用。textfile可读取文件系统，是常用的一种方式
```
parallelize()
    def parallelize[T: ClassTag](    
        seq: Seq[T],   
        numSlices: Int = defaultParallelism): RDD[T] = withScope {
        assertNotStopped()
        new ParallelCollectionRDD[T](this, seq, numSlices, Map[Int, Seq[String]]())
   }

textfile（）
  def textFile(
      path: String,
      minPartitions: Int = defaultMinPartitions): RDD[String] = withScope {
      assertNotStopped()
      hadoopFile(path, classOf[TextInputFormat], 
                       classOf[LongWritable], classOf[Text],
      minPartitions).map(pair => pair._2.toString).setName(path)
    }
```
**源码总结： 
1）.取_2是因为数据为（key（偏移量），value（数据））**



#### 4.常见的transformation和action 

由于比较简单，大概说一下常用的用处，不做代码测试

transformation
- Map：对数据集的每一个元素进行操作
- FlatMap：先对数据集进行扁平化处理，然后再Map
- Filter：对数据进行过滤，为true则通过
- destinct：去重操作

action

- reduce：对数据进行聚集
- reduceBykey：对key值相同的进行操作
- collect：没有效果的action，但是很有用
- saveAstextFile：数据存入文件系统
- foreach：对每个元素进行func的操作