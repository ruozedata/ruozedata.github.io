---
layout: post
title: "JVM快速调优手册之七: Java程序性能分析工具Java VisualVM(Visual GC)"
date: 2019-06-19
comments: true
tags: 
    - JVM
    - 调优
categories: [JVM]

---

VisualVM 是一款免费的\集成了多个JDK 命令行工具的可视化工具，它能为您提供强大的分析能力，对 Java 应用程序做性能分析和调优。这些功能包括生成和分析海量数据、跟踪内存泄漏、监控垃圾回收器、执行内存和 CPU 分析，同时它还支持在 MBeans 上进行浏览和操作。

在内存分析上，Java VisualVM的最大好处是可通过安装Visual GC插件来分析GC（Gabage Collection）趋势、内存消耗详细状况。

<!--more-->

### Visual GC(监控垃圾回收器)

Java VisualVM默认没有安装Visual GC插件，需要手动安装，JDK的安装目录的bin目露下双击jvisualvm.exe，即可打开Java VisualVM，点击菜单栏 工具->插件 安装Visual GC

![Visual GC(监控垃圾回收器)1](/assets/pic/2019-06-19-7-1.png)

安装完成后重启Java VisualVM，Visual GC界面自动打开，即可看到JVM中堆内存的分代情况

![Visual GC(监控垃圾回收器)2](/assets/pic/2019-06-19-7-2.png)

被监控的程序运行一段时间后Visual GC显示如下

![Visual GC(监控垃圾回收器)3](/assets/pic/2019-06-19-7-3.png)

要看懂上面的图必须理解Java虚拟机的一些基本概念：

<font color="blue" size=3><b>堆(Heap)</b></font>：<font size=3>JVM管理的内存叫堆</font>

**分代**：根据对象的生命周期长短，把堆分为3个代：Young，Old和Permanent，根据不同代的特点采用不同的收集算法，扬长避短也。

- <font color="blue">Young（年轻代）</font>年轻代分三个区。一个Eden区，两个Survivor区。大部分对象在Eden区中生成。当Eden区满时，还存活的对象将被复制到Survivor区（两个中的一个），当这个Survivor区满时，此区的存活对象将被复制到另外一个Survivor区，当这个Survivor去也满了的时候，从第一个Survivor区复制过来的并且此时还存活的对象，将被复制“年老区(Tenured)”。需要注意，Survivor的两个区是对称的，没先后关系，所以同一个区中可能同时存在从Eden复制过来对象，和从前一个Survivor复制过来的对象，而复制到年老区的只有从第一个Survivor复制过来的对象。而且，Survivor区总有一个是空的。
- <font color="blue">Tenured（年老代）</font>年老代存放从年轻代存活的对象。一般来说年老代存放的都是生命期较长的对象。
- <font color="blue">Perm（持久代）</font>用于存放静态文件，如今Java类、方法等。持久代对垃圾回收没有显著影响，但是有些应用可能动态生成或者调用一些class，例如Hibernate等，在这种时候需要设置一个比较大的持久代空间来存放这些运行过程中新增的类。持久代大小通过-XX:MaxPermSize=进行设置。

<font color="blue" size=3><b>GC的基本概念</b></font>

gc分为full gc 跟 minor gc，当每一块区满的时候都会引发gc。

- <font color="blue">Scavenge GC</font>

	一般情况下，当新对象生成，并且在Eden申请空间失败时，就触发了Scavenge GC，堆Eden区域进行GC，清除非存活对象，并且把尚且存活的对象移动到Survivor区。然后整理Survivor的两个区。
	
- <font color="blue">Full GC</font>

	对整个堆进行整理，包括Young、Tenured和Perm。Full GC比Scavenge GC要慢，因此应该尽可能减少Full GC。有如下原因可能导致Full GC:
	
	- 上一次GC之后Heap的各域分配策略动态变化
	- System.gc()被显示调用
	- Perm域被写满
	- Tenured被写满

<font color="blue" size=3><b>内存溢出 out of memory</b></font> 

是指程序在申请内存时，没有足够的内存空间供其使用，出现out of memory；比如申请了一个integer,但给它存了long才能存下的数，那就是内存溢出。

<font color="blue" size=3><b>内存泄露  memory leak</b></font> 

是指程序在申请内存后，无法释放已申请的内存空间，一次内存泄露危害可以忽略，但内存泄露堆积后果很严重，无论多少内存,迟早会被占光。**其实说白了就是该内存空间使用完毕之后未回收。**

### Java VisualVM的其他功能

1. 监视界面（cpu，类，堆，线程）

	![监视界面](/assets/pic/2019-06-19-7-4.png)

2. 线程界面

	![线程界面](/assets/pic/2019-06-19-7-5.png)

	
3. Profile界面（性能剖析）

	点击CPU按钮执行cpu分析查看方法
	
	![Profile界面](/assets/pic/2019-06-19-7-6.png)
	
	点击内存按钮执行内存分析查看类
	
	![Profile界面](/assets/pic/2019-06-19-7-7.png)

4. 堆dump和线程dump操作

	Dump文件是进程的内存镜像，可以把程序的执行状态通过调试器保存到dump文件中，堆dump的dump文件内容如下图所示
	
	![Dump](/assets/pic/2019-06-19-7-8.png)

