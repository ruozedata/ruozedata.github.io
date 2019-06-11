---
layout: post
title: "Spark之序列化在生产中的应用"
date: 2018-05-29
comments: true
tags: [高级,spark]
categories: Spark Core
---


　序列化在分布式应用的性能中扮演着重要的角色。格式化对象缓慢，或者消耗大量的字节格式化，会大大降低计算性能。在生产中，我们通常会创建大量的自定义实体对象，这些对象在网络传输时需要序列化，而一种好的序列化方式可以让数据有更好的压缩比，从而提升网络传输速率，提高spark作业的运行速度。通常这是在spark应用中第一件需要优化的事情。Spark的目标是在便利与性能中取得平衡，所以提供2种序列化的选择。
<!--more--> 
#### Java serialization

　在默认情况下，Spark会使用Java的ObjectOutputStream框架对对象进行序列化，并且可以与任何实现java.io.Serializable的类一起工作。您还可以通过扩展java.io.Externalizable来更紧密地控制序列化的性能。Java序列化是灵活的，但通常相当慢，并且会导致许多类的大型序列化格式。
**测试代码：**
![enter description here](/assets/blogImg/529_1.png)
**测试结果：**
![enter description here](/assets/blogImg/529_2.png)
#### Kryo serialization
　Spark还可以使用Kryo库（版本2）来更快地序列化对象。Kryo比Java串行化（通常多达10倍）要快得多，也更紧凑，但是不支持所有可串行化类型，并且要求您提前注册您将在程序中使用的类，以获得最佳性能。
**测试代码：**
![enter description here](/assets/blogImg/529_3.png)
**测试结果：**
![enter description here](/assets/blogImg/529_4.png)
　测试结果中发现，使用 Kryo serialization 的序列化对象 比使用 Java serialization的序列化对象要大，与描述的不一样，这是为什么呢？
　查找官网，发现这么一句话 Finally, if you don’t register your custom classes, Kryo will still work, but it will have to store the full class name with each object, which is wasteful.。
　修改代码后在测试一次。
 ![enter description here](/assets/blogImg/529_5.png)
 **测试结果：**
 ![enter description here](/assets/blogImg/529_6.png)
 #### 总结：
　Kryo serialization 性能和序列化大小都比默认提供的 Java serialization 要好，但是使用Kryo需要将自定义的类先注册进去，使用起来比Java serialization麻烦。自从Spark 2.0.0以来，我们在使用简单类型、简单类型数组或字符串类型的简单类型来调整RDDs时，在内部使用Kryo序列化器。
　通过查找sparkcontext初始化的源码，可以发现某些类型已经在sparkcontext初始化的时候被注册进去。
  ![enter description here](/assets/blogImg/529_7.png)