---
layout: post
title: "Spark RDD、DataFrame和DataSet的区别"
date: 2018-05-19
comments: true
tags: [spark,高级]
categories:  Spark Core
---


<font color=#FF4500 >
在Spark中，RDD、DataFrame、Dataset是最常用的数据类型，今天谈谈他们的区别！</font>

##### 一 、共性 

1、RDD、DataFrame、Dataset全都是spark平台下的分布式弹性数据集，为处理超大型数据提供便利

2、三者都有惰性机制，在进行创建、转换，如map方法时，不会立即执行，只有在遇到Action如foreach时，三者才会开始遍历运算。

3、三者都会根据spark的内存情况自动缓存运算，这样即使数据量很大，也不用担心会内存溢出

4、三者都有partition的概念。
<!--more--> 
##### 二、RDD优缺点 
**优点：** 
- 1、相比于传统的MapReduce框架，Spark在RDD中内置很多函数操作，group，map，filter等，方便处理结构化或非结构化数据。

- 2、面向对象的编程风格

- 3、编译时类型安全，编译时就能检查出类型错误

**缺点：** 

- 1、序列化和反序列化的性能开销

- 2、GC的性能开销，频繁的创建和销毁对象, 势必会增加GC

##### 三、DataFrame 

1、与RDD和Dataset不同，DataFrame每一行的类型固定为Row，只有通过解析才能获取各个字段的值。如
```
df.foreach{
  x =>
    val v1=x.getAs[String]("v1")
    val v2=x.getAs[String]("v2")
}
```
2、DataFrame引入了schema和off-heap

- schema : RDD每一行的数据, 结构都是一样的. 这个结构就存储在schema中. Spark通过schame就能够读懂数据, 因此在通信和IO时就只需要序列化和反序列化数据, 而结构的部分就可以省略了.

- off-heap : 意味着JVM堆以外的内存, 这些内存直接受操作系统管理（而不是JVM）。Spark能够以二进制的形式序列化数据(不包括结构)到off-heap中, 当要操作数据时, 就直接操作off-heap内存. 由于Spark理解schema, 所以知道该如何操作.

- off-heap就像地盘, schema就像地图, Spark有地图又有自己地盘了, 就可以自己说了算了, 不再受JVM的限制, 也就不再收GC的困扰了.

3、结构化数据处理非常方便，支持Avro, CSV, Elasticsearch数据等，也支持Hive, MySQL等传统数据表 

4、兼容Hive，支持Hql、UDF

**有schema和off-heap概念，DataFrame解决了RDD的缺点, 但是却丢了RDD的优点. DataFrame不是类型安全的（只有编译后才能知道类型错误）, API也不是面向对象风格的.**

##### 四、DataSet 
1、DataSet是分布式的数据集合。DataSet是在Spark1.6中添加的新的接口。它集中了RDD的优点（强类型 和可以用强大lambda函数）以及Spark SQL优化的执行引擎。DataSet可以通过JVM的对象进行构建，可以用函数式的转换（map/flatmap/filter）进行多种操作。

2、DataSet结合了RDD和DataFrame的优点, 并带来的一个新的概念Encoder。DataSet 通过Encoder实现了自定义的序列化格式，使得某些操作可以在无需序列化情况下进行。另外Dataset还进行了包括Tungsten优化在内的很多性能方面的优化。

3、Dataset<Row>等同于DataFrame（Spark 2.X）