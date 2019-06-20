---
layout: post
title: "JVM快速调优手册之四: 堆内存分配的CMS公式解析"
date: 2019-06-19
comments: true
tags: 
    - JVM
    - 调优
    - 堆内存分配的CMS公式解析
categories: [JVM]

---

<!--more--> 

### JVM 堆内存组成

Java堆由Perm区和Heap区组成，Heap区由Old区和New区（也叫Young区）组成，New区由Eden区、From区和To区（Survivor）组成。

![JVM 堆内存组成](/assets/pic/2019-06-19-4-1.png)

Eden区用于存放新生成的对象。Eden中的对象生命不会超过一次Minor GC。Survivor Space  有两个，存放每次垃圾回收后存活的对象，即图的S0和S1。Old Generation  Old区，也称老生代，主要存放应用程序中生命周期长的存活对象

### 公式

将EDEN与From survivor中的存活对象存入To survivor区时,To survivor区的空间不足，再次晋升到old gen区，而old gen区内存也不够的情况下产生了promontion faild从而导致full gc.那可以推断出：

eden+from survivor < old gen区剩余内存时，不会出现promontion faild的情况。

即：

<font color="blue">(Xmx-Xmn)*(1-CMSInitiatingOccupancyFraction/100)>=(Xmn-Xmn/(SurvivorRatior+2))</font>

进而推断出：

<font color="blue">CMSInitiatingOccupancyFraction <= ((Xmx-Xmn)-(Xmn-Xmn/(SurvivorRatior+2)))/(Xmx-Xmn)*100</font>

参数|含义
:---|-----
Xmx-Xmn|Old区大小
CMSInitiatingOccupancyFraction/100|Old区百分之多少时,cms开始gc
1-CMSInitiatingOccupancyFraction/100|Old区开始gc回收时剩余空间百分比
(Xmx-Xmn)*(1-CMSInitiatingOccupancyFraction/100)|Old区开始gc回收时剩余空间大小
(Xmn-Xmn/(SurvivorRatior+2))|eden+from survivor区的大小

### 参数

参数| 含义
---|---
-Xmx |java heap最大值。建议均设为物理内存的80%。不可超过物理内存
-Xmn|java heap最小值，一般设置为Xmx的3、4分之一,等同于-XX:NewSize 和 -XX:MaxNewSize  ,其实为<font color="blue">young区大小</font>
-XX|CMSInitiatingOccupancyFraction=70 :使用cms作为垃圾回收使用70％后开始CMS收集
-XX|SurvivorRatio=2: 生还者池的大小，默认是2