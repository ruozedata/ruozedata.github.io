---
layout: post
title: "JVM快速调优手册之五: ParNew收集器+CMS收集器的产品案例分析(响应时间优先)"
date: 2019-06-19
comments: true
tags: 
    - JVM
    - 调优
categories: [JVM]
---

<!--more--> 

### 服务器

<font color="green" size=3><b>双核,4个cores;  16G memory</b></font>

```
[root@alish2-cassandra-01 ~]# cat /proc/cpuinfo | grep "cpu cores"
cpu cores       : 2
cpu cores       : 2
```

### 公式简述

响应时间优先的并发收集器，主要是保证系统的响应时间，减少垃圾收集时的停顿时间。适用于应用服务器、电信领域等。

1. <font size=3 color="red">ParNew收集器</font>

	ParNew收集器是Serial收集器的多线程版本，许多运行在Server模式下的虚拟机中首选的新生代收集器，除Serial外，<font color="blue" >只有它能与CMS收集器配合工作。</font>
	
2. <font size=3 color="red">CMS收集器</font>

	CMS， 全称Concurrent Low Pause Collector，是jdk1.4后期版本开始引入的新gc算法，在jdk5和jdk6中得到了进一步改进，它的主要适合场景是对响应时间的重要性需求 大于对吞吐量的要求，能够承受垃圾回收线程和应用线程共享处理器资源，并且应用中存在比较多的长生命周期的对象的应用。CMS是用于对tenured generation的回收，也就是年老代的回收，目标是尽量减少应用的暂停时间，减少FullGC发生的几率，利用和应用程序线程并发的垃圾回收线程来 标记清除年老代。
	CMS并非没有暂停，而是用两次短暂停来替代串行标记整理算法的长暂停，它的收集周期是这样：
<br>
	<font size=3 color="blue">初始标记(CMS-initial-mark) -> 并发标记(CMS-concurrent-mark) -> 重新标记(CMS-remark) -> 并发清除(CMS-concurrent-sweep) ->并发重设状态等待下次CMS的触发(CMS-concurrent-reset)</font>
<br>
	其中的1，3两个步骤需要暂停所有的应用程序线程的。第一次暂停从root对象开始标记存活的对象，这个阶段称为初始标记；第二次暂停是在并发标记之后，暂停所有应用程序线程，重新标记并发标记阶段遗漏的对象（在并发标记阶段结束后对象状态的更新导致）。第一次暂停会比较短，第二次暂停通常会比较长，并且remark这个阶段可以并行标记。
<br>
	而并发标记、并发清除、并发重设阶段的所谓并发，是指一个或者多个垃圾回收线程和应用程序线程并发地运行，垃圾回收线程不会暂停应用程序的执行，如果你有多于一个处理器，那么并发收集线程将与应用线程在不同的处理器上运行，显然，这样的开销就是会降低应用的吞吐量。Remark阶段的并行，是指暂停了所有应用程序后，启动一定数目的垃圾回收进程进行并行标记，此时的应用线程是暂停的。
	
### 公式

($TOMCAT_HOME/bin/catalina.sh)

```
export JAVA_OPTS="-server -Xmx10240m -Xms10240m -Xmn3840m -XX:PermSize=256m

-XX:MaxPermSize=256m -Denv=denalicnprod

-XX:SurvivorRatio=8  -XX:PretenureSizeThreshold=1048576

-XX:+DisableExplicitGC  

-XX:+UseParNewGC  -XX:ParallelGCThreads=10

-XX:+UseConcMarkSweepGC -XX:+CMSParallelRemarkEnabled

-XX:+CMSScavengeBeforeRemark -XX:ParallelCMSThreads=10

-XX:CMSInitiatingOccupancyFraction=70

-XX:+UseCMSInitiatingOccupancyOnly

-XX:+UseCMSCompactAtFullCollection -XX:CMSFullGCsBeforeCompaction=0

-XX:+CMSPermGenSweepingEnabled -XX:+CMSClassUnloadingEnabled

-XX:+UseFastAccessorMethods

-XX:LargePageSizeInBytes=128M

-XX:SoftRefLRUPolicyMSPerMB=0

-XX:+PrintGCDetails -XX:+PrintGCTimeStamps -XX:+PrintHeapAtGC

-XX:+PrintGCApplicationStoppedTime 

-XX:+PrintGCDateStamps -Xloggc:gc.log -verbose:gc"
```

### 公式解析

参 数|含 义
-----|---
-server|一定要作为第一个参数，启用JDK的server版本，在多个CPU时性能佳
-Xms|java Heap初始大小。 默认是物理内存的1/64。此值可以设置与-Xmx相同，以避免每次垃圾回收完成后JVM重新分配内存。
-Xmx|java heap最大值。建议均设为物理内存的80%。不可超过物理内存。
-Xmn|设置年轻代大小，一般设置为Xmx的2/8~3/8,等同于-XX:NewSize 和 -XX:MaxNewSize  。
-XX:PermSize|设定内存的永久保存区初始大小，缺省值为64M
-XX:MaxPermSize|设定内存的永久保存区最大大小，缺省值为64M
-Denv|指定tomcat运行哪个project
-XX:SurvivorRatio|Eden区与Survivor区的大小比值, 设置为8,则两个Survivor区与一个Eden区的比值为2:8,一个Survivor区占整个年轻代的1/10
-XX:PretenureSizeThreshold|晋升年老代的对象大小。默认为0，比如设为1048576(1M)，则超过1M的对象将不在eden区分配，而直接进入年老代。
-XX:+DisableExplicitGC|关闭System.gc()
<font color=#1E90FF>-XX:+UseParNewGC</font>|<font color=#1E90FF>设置年轻代为并发收集。可与CMS收集同时使用。</font>
-XX:ParallelGCThreads|
<font color=#1E90FF>-XX:+UseConcMarkSweepGC</font>|<font color=#1E90FF>设置年老代为并发收集。测试中配置这个以后，-XX:NewRatio=4的配置失效了。所以，此时年轻代大小最好用-Xmn设置。</font>
-XX:+CMSParallelRemarkEnabled|开启并行remark
-XX:+CMSScavengeBeforeRemark|这个参数还蛮重要的，它的意思是在执行CMS remark之前进行一次youngGC，这样能有效降低remark的时间
-XX:ParallelCMSThreads|CMS默认启动的回收线程数目是  (ParallelGCThreads + 3)/4) ，如果你需要明确设定，可以通过-XX:ParallelCMSThreads=20来设定,其中ParallelGCThreads是年轻代的并行收集线程数
-XX:CMSInitiatingOccupancyFraction|<font color=#3CB371>使用cms作为垃圾回收使用70％后开始CMS收集</font>
-XX:+UseCMSInitiatingOccupancyOnly|使用手动定义初始化定义开始CMS收集
-XX:+UseCMSCompactAtFullCollection|打开对年老代的压缩。可能会影响性能，但是可以消除内存碎片。
-XX:CMSFullGCsBeforeCompaction|由于并发收集器不对内存空间进行压缩、整理，所以运行一段时间以后会产生“碎片”，使得运行效率降低。此参数设置运行次FullGC以后对内存空间进行压缩、整理。
-XX:+CMSPermGenSweepingEnabled|为了避免Perm区满引起的full gc，<font color=#3CB371>建议开启CMS回收Perm区选项</font>
-XX:+CMSClassUnloadingEnabled|
-XX:+UseFastAccessorMethods|原始类型的快速优化
-XX:LargePageSizeInBytes|内存页的大小，不可设置过大， 会影响Perm的大小
-XX:SoftRefLRUPolicyMSPerMB|“软引用”的对象在最后一次被访问后能存活0毫秒（默认为1秒）。
-XX:+PrintGCDetails|记录 GC 运行时的详细数据信息，包括新生成对象的占用内存大小以及耗费时间等
-XX:+PrintGCTimeStamps|打印垃圾收集的时间戳
-XX:+PrintHeapAtGC|打印GC前后的详细堆栈信息
-XX:+PrintGCApplicationStoppedTime|打印垃圾回收期间程序暂停的时间.可与上面混合使用
-XX:+PrintGCDateStamps|之前打印gc日志的时候使用是：-XX:+PrintGCTimeStamps，这个选项记录的是jvm启动时间为起点的相对时间，可读性较差，不利于定位问题，使用PrintGCDateStamps记录的是系统时间，更humanreadable
-Xloggc|与上面几个配合使用，把相关日志信息记录到文件以便分析
-verbose:gc|记录 GC 运行以及运行时间，一般用来查看 GC 是否是应用的瓶颈