---
layout: post
title: "生产常用Spark累加器剖析之四"
date: 2019-05-31
comments: true
tags: [spark,累加器]
categories: Spark Other
---
## 现象描述

```
val acc = sc.accumulator(0, “Error Accumulator”)
val data = sc.parallelize(1 to 10)
val newData = data.map(x => {
  if (x % 2 == 0) {
 accum += 1
}
})
newData.count
acc.value
newData.foreach(println)
acc.value
```

上述现象，会造成acc.value的最终值变为10

<!--more--> 

## 原因分析

Spark中的一系列transform操作都会构造成一长串的任务链，此时就需要通过一个action操作来触发（lazy的特性），accumulator也是如此。

- 因此在一个action操作之后，调用value方法查看，是没有任何变化
- 第一次action操作之后，调用value方法查看，变成了5
- 第二次action操作之后，调用value方法查看，变成了10

原因就在于第二次action操作的时候，又执行了一次累加器的操作，同个累加器，在原有的基础上又加了5，从而变成了10

## 解决方案

通过上述的现象描述，我们可以很快知道解决的方法：只进行一次action操作。基于此，我们只要切断任务之间的依赖关系就可以了，即使用cache、persist。这样操作之后，那么后续的累加器操作就不会受前面的transform操作影响了

## 案例地址

相关的工程案例地址在Github上：[https://github.com/lemonahit/spark-train/tree/master/01-Accumulator](https://github.com/lemonahit/spark-train/tree/master/01-Accumulator)

```
import org.apache.spark.{SparkConf, SparkContext}
/**
  * 使用Spark Accumulators完成Job的数据量处理
  * 统计emp表中NULL出现的次数以及正常数据的条数 & 打印正常数据的信息
  *
  * 若泽数据学员-呼呼呼 on 2017/11/9.
  */
object AccumulatorsApp {
  def main(args: Array[String]): Unit = {
    val conf = new SparkConf().setMaster("local[2]").setAppName("AccumulatorsApp")
    val sc = new SparkContext(conf)
    val lines = sc.textFile("E:/emp.txt")
    // long类型的累加器值
    val nullNum = sc.longAccumulator("NullNumber")
    val normalData = lines.filter(line => {
      var flag = true
      val splitLines = line.split("\t")
      for (splitLine <- splitLines){
        if ("".equals(splitLine)){
          flag = false
          nullNum.add(1)
        }
      }
      flag
    })
    // 使用cache方法，将RDD的第一次计算结果进行缓存；防止后面RDD进行重复计算，导致累加器的值不准确
    normalData.cache()
    // 打印每一条正常数据
    normalData.foreach(println)
    // 打印正常数据的条数
    println("NORMAL DATA NUMBER: " + normalData.count())
    // 打印emp表中NULL出现的次数
    println("NULL: " + nullNum.value)
    sc.stop()
  }
}
```