---
layout: post
title: "如何避免生产Spark Shuffle的某场景"
date: 2019-08-06
comments: true
tags: 
    - Spark
    - 高级
    - SQL
categories: [Spark SQL]

---

<!--more--> 


### 概述

有的时候，我们可能会遇到大数据计算中一个最棘手的问题——**数据倾斜**，此时Spark作业的性能会比期望差很多。数据倾斜调优，就是使用各种技术方案解决不同类型的数据倾斜问题，以保证Spark作业的性能。

### 方案适用场景

在对RDD使用join类操作，或者是在Spark SQL中使用join语句时，而且join操作中的一个RDD或表的数据量比较小（比如几百M或者一两G），比较适用此方案。

### 方案实现思路

不使用join算子进行连接操作，而使用Broadcast变量与map类算子实现join操作，进而完全规避掉shuffle类的操作，彻底避免数据倾斜的发生和出现。

将较小RDD中的数据直接通过collect算子拉取到Driver端的内存中来，然后对其创建一个Broadcast变量；

接着对另外一个RDD执行map类算子，在算子函数内，从Broadcast变量中获取较小RDD的全量数据，与当前RDD的每一条数据按照连接key进行比对，如果连接key相同的话，那么就将两个RDD的数据用你需要的方式连接起来。

### 方案实现原理

普通的join是会走shuffle过程的，而一旦shuffle，就相当于会将相同key的数据拉取到一个shuffle read task中再进行join，此时就是reduce join。但是如果一个RDD是比较小的，则可以采用广播小RDD全量数据+map算子来实现与join同样的效果，也就是map join，此时就不会发生shuffle操作，也就不会发生数据倾斜。具体原理如下图所示:

![实现原理](/assets/pic/2019-08-06-1.png)

### 方案优点

对join操作导致的数据倾斜，效果非常好，因为根本就不会发生shuffle，也就根本不会发生数据倾斜。

### 方案缺点

适用场景少，因为这个方案只适用于一个大表和一个小表的情况。毕竟我们需要将小表进行广播，此时会比较消耗内存资源，driver和每个Executor内存中都会驻留一份小RDD的全量数据。如果我们广播出去的RDD数据比较大，比如10G以上，那么就可能发生内存溢出了。因此并不适合两个都是大表的情况。

如果对于hive中的map join熟悉的同学看这幅图应该很好理解，所以建议大家看看hive中的map join原理，进行对比学习。

### 代码部分

```
import org.apache.spark.{SparkConf, SparkContext}

object RuozedataBroadCast {

  def main(args: Array[String]): Unit = {
    val conf=new SparkConf().setAppName("Ruozedata_BroadCast").setMaster("local[2]")
    val sc=new SparkContext(conf)
    val smallRDD=sc.parallelize(Array(
      ("1","ruoze"),
      ("2","jepson"),
      ("3","xiaoyuzhou")
    )).collectAsMap()

    val smallBroadCast=sc.broadcast(smallRDD)

    val bigRDD=sc.parallelize(Array(
      ("1","school1","male"),
      ("2","school2","female"),
      ("3","school3","male"),
      ("4","school4","male"),
      ("5","school5","female")
    )).map(x=>(x._1,x))

    val broadCastValue=smallBroadCast.value

     bigRDD.mapPartitions(partitions=>{
    
       for ((key,value)<-partitions
         if (broadCastValue.contains(key)))
         yield(key,broadCastValue.getOrElse(key,""),value._2,value._3)
    
     }).collect().foreach(println)

    /** 结果
      * (1,ruoze,school1,male)
      * (2,jepson,school2,female)
      * (3,xiaoyuzhou,school3,male)
      */

  }
}
```