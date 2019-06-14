---
layout: post
title: "生产常用Spark累加器剖析之三(自定义累加器)"
date: 2019-05-10
comments: true
tags: [spark,累加器]
categories: Spark Other
---
## 思路 & 需求

参考IntAccumulatorParam的实现思路（上述文章中有讲）：

```
trait AccumulatorParam[T] extends AccumulableParam[T, T] {
  def addAccumulator(t1: T, t2: T): T = {
    // addInPlace有很多具体的实现类
    // 如果想要实现自定义的话，就得实现这个方法
    addInPlace(t1, t2)
  }
}
```
<!--more--> 
自定义也可以通过这个方法去实现，从而兼容我们自定义的累加器

## 需求：这里实现一个简单的案例，用分布式的方法去实现随机数

```
**
  * 自定义的AccumulatorParam
  *
  * Created by lemon on 2018/7/28.
  */
object UniqueKeyAccumulator extends AccumulatorParam[Map[Int, Int]] {
  override def addInPlace(r1: Map[Int, Int], r2: Map[Int, Int]): Map[Int, Int] = {
      // ++用于两个集合相加
      r1++r2
    }
    override def zero(initialValue: Map[Int, Int]): Map[Int, Int] = {
      var data: Map[Int, Int] = Map()
      data
    }
}
/**
  * 使用自定义的累加器，实现随机数
  *
  * Created by lemon on 2018/7/28.
  */
object CustomAccumulator {
  def main(args: Array[String]): Unit = {
    val sparkConf = new SparkConf().setAppName("CustomAccumulator").setMaster("local[2]")
    val sc = new SparkContext(sparkConf)
    val uniqueKeyAccumulator = sc.accumulable(Map[Int, Int]())(UniqueKeyAccumulator)
    val distData = sc.parallelize(1 to 10)
    val mapCount = distData.map(x => {
      val randomNum = new Random().nextInt(20)
      // 构造一个k-v对
      val map: Map[Int, Int] = Map[Int, Int](randomNum -> randomNum)
      uniqueKeyAccumulator += map
    })
    println(mapCount.count())
    // 获取到累加器的值 中的key值，并进行打印
    uniqueKeyAccumulator.value.keys.foreach(println)
    sc.stop()
  }
}
```

运行结果如下图： 
![enter description here](/assets/blogImg/Spark累加器简单案例.png)
