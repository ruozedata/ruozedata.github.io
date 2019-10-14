---
layout: post
title: "Spark之Accumulator陷阱&解决"
date: 2019-08-21
comments: true
tags: 
    - Spark
    - 高级

categories: [Spark Other]

---

<!--more--> 

### Accumulator简介

Accumulator是Spark提供的累加器，顾名思义，该变量只能够增加。只有driver能获取到Accumulator的值（使用value方法），Task只能对其做增加操作（使用 +=）。
你也可以在为Accumulator命名，这样就会在Spark web ui中显示，可以帮助你了解程序运行的情况。

### 举个最简单的accumulator的使用例子

```
val spark = SparkSession
  .builder()
  .appName("RuozedataAccumulator")
  .master("local[2]")
  .getOrCreate()

val sc = spark.sparkContext

//在driver中定义
val accum = sc.accumulator(0, "Example Accumulator")
//在task中进行累加
sc.parallelize(1 to 10).foreach(x=> accum += 1)

//在driver中输出 结果将返回10
```

### 累加器的错误用法

```
val accum= sc.accumulator(0, "Error Accumulator")
val data = sc.parallelize(1 to 10)
//用accumulator统计偶数出现的次数，同时偶数返回0，奇数返回1
val newData = data.map{x => {
    if(x%2 == 0){
    accum += 1
    0
    }else{
     1
    }
}}
//使用action操作触发执行
newData.count
//此时accum的值为5，是我们要的结果
println(accum.value)

//继续操作，查看刚才变动的数据,foreach也是action操作
newData.foreach(println)
//上个步骤没有进行累计器操作，可是累加器此时的结果已经是10了
//这并不是我们想要的结果
println(accum.value)
```

### 原因分析

官方对这个问题的解释如下描述:

For accumulator updates performed inside actions only, Spark guarantees that each task’s update to the accumulator will only be applied once, i.e. restarted tasks will not update the value. In transformations, users should be aware of that each task’s update may be applied more than once if tasks or job stages are re-executed.

我们都知道，spark中的一系列transform操作会构成一串长的任务链，此时需要通过一个action操作来触发，accumulator也是一样。因此在一个action操作之前，你调用value方法查看其数值，肯定是没有任何变化的。

所以在第一次count(action操作)之后，我们发现累加器的数值变成了5，是我们要的答案。

之后又对新产生的的newData进行了一次foreach(action操作)，其实这个时候又执行了一次map(transform)操作，所以累加器又增加了5。最终获得的结果变成了10。

### 解决办法

看了上面的分析，大家都有这种印象了，那就是使用累加器的过程中只能使用一次action的操作才能保证结果的准确性。

事实上，还是有解决方案的，只要将任务之间的依赖关系切断就可以了。什么方法有这种功能呢？你们肯定都想到了，cache，persist。调用这个方法的时候会将之前的依赖切除，后续的累加器就不会再被之前的transfrom操作影响到了。

```
val accum= sc.accumulator(0, "Correct Accumulator")
val data = sc.parallelize(1 to 10)
//用accumulator统计偶数出现的次数，同时偶数返回0，奇数返回1
val newData = data.map{x => {
  if(x%2 == 0){
    accum += 1
    0
  }else{
    1
  }
}
}
//使用cache缓存数据，切断依赖。
newData.cache

//使用action操作触发执行
newData.count
//此时accum的值为5，是我们要的结果
println(accum.value)

//继续操作，查看刚才变动的数据,foreach也是action操作
newData.foreach(println)
//累加器此时的结果依旧是5了
//这是我们想要的结果
println(accum.value)
```

### 总结

使用Accumulator时，为了保证准确性，只使用一次action操作。如果需要使用多次则使用cache或persist操作切断依赖。