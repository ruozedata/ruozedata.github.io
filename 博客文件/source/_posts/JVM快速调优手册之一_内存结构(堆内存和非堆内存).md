---
layout: post
title: "JVM快速调优手册之一: 内存结构(堆内存和非堆内存)"
date: 2019-06-19
comments: true
tags: 
    - JVM
    - 调优
    - 内存结构
categories: [JVM]

---

<!--more--> 

**图为Java虚拟机运行时的数据区:**

![数据区](/assets/pic/2019-06-19-1-1.png)

### 方法区

也称"永久代” 、“非堆”，  它用于存储虚拟机加载的类信息、常量、静态变量、是<font color="red">各个线程共享的内存区域</font>。<font color="blue">默认最小值为16MB，最大值为64MB（未验证）</font>，可以通过-XX:PermSize 和 -XX:MaxPermSize 参数限制方法区的大小。
<br>
运行时常量池：是方法区的一部分，Class文件中除了有类的版本、字段、方法、接口等描述信息外，还有一项信息是常量池，用于存放编译器生成的各种符号引用，这部分内容将在类加载后放到方法区的运行时常量池中。

### 虚拟机栈

描述的是java 方法执行的内存模型：每个方法被执行的时候 都会创建一个“栈帧”用于存储局部变量表(包括参数)、操作栈、方法出口等信息。每个方法被调用到执行完的过程，就对应着一个栈帧在虚拟机栈中从入栈到出栈的过程。声明周期与线程相同，是<font color="red">线程私有</font>的。
<br>
 局部变量表存放了编译器可知的各种基本数据类型(boolean、byte、char、short、int、float、long、 double)、对象引用(引用指针，并非对象本身)，其中64位长度的long和double类型的数据会占用2个局部变量的空间，其余数据类型只占1 个。局部变量表所需的内存空间在编译期间完成分配，当进入一个方法时，这个方法需要在栈帧中分配多大的局部变量是完全确定的，在运行期间栈帧不会改变局部 变量表的大小空间。

### 本地方法栈

与虚拟机栈基本类似，区别在于虚拟机栈为虚拟机执行的java方法服务，而本地方法栈则是为Native方法服务。

### 堆 

也叫做java 堆、GC堆，是java虚拟机所管理的内存中最大的一块内存区域，也是<font color="red">被各个线程共享的内存区域</font>，在JVM启动时创建。该内存区域存放了对象实例及数组(所有new的对象)。其大小通过-Xms(最小值)和-Xmx(最大值)参数设置，-Xms为JVM启动时申请的最小内存，-Xmx为JVM可申请的最大内存。在JVM启动时，最大内存会被保留下来。为对象内存而保留的地址空间可以被分成年轻代和老年代。
<br>
默认当空余堆内存小于40%时，JVM会增大Heap到-Xmx指定的大小，可通过-XX:MinHeapFreeRation=来指定这个比列；当空余堆内存大于70%时，JVM会减小heap的大小到-Xms指定的大小，可通过XX:MaxHeapFreeRation=来指定这个比列，对于运行系统，为避免在运行时频繁调整Heap的大小，通常-Xms与-Xmx的值设成一样。

Parameter | Default Value
:---------:| :-------------:
MinHeapFreeRatio | 40
MaxHeapFreeRatio | 70
-Xms | 3670k
-Xmx | 64m

<font color="red">注：如果是64位系统，这些值一般需要扩张30％，来容纳在64位系统下变大的对象。</font>

从J2SE 1.2开始，JVM使用分代收集算法，在不同年代的区域里使用不同的算法。堆被划分为新生代和老年代。新生代主要存储新创建的对象和尚未进入老年代的对象。老年代存储经过多次新生代GC(MinorGC)任然存活的对象。

![堆](/assets/pic/2019-06-19-1-2.png)

<font color="red"><b>
注1：图中的Perm不是堆内存，是永久代

注2：图中的Virtaul则是各区域还未被分配的内存，即最大内存-当前分配的内存
</b></font>

**新生代：**

新生代包括一块eden（伊甸园）和2块survivor(通常又称S0和S1或From和To)。大多数对象都是在eden中初始化。而对于2块survivor来说，总有一块是空的，它会在下一个复制收集过程中作为eden中的活跃对象和另一块survivor的目的地。在对象衰老之前（也就是被复制到tenured之前），它们会在两块survivor区域之间以这样的方式复制。可通过-Xmn参数来指定新生代的大小，也可以通过-XX:SurvivorRation来调整Eden Space及Survivor Space的大小。

**老年代：**

用于存放经过多次新生代Minor GC依然存活的对象，例如缓存对象，新建的对象也有可能直接进入老年代，主要有两种情况：

1. 大对象，可通过启动参数设置-XX:PretenureSizeThreshold=1024(单位为字节，默认为0)来代表超过多大时就不在新生代分配，而是直接在老年代分配。
2. 大的数组对象，即数组中无引用外部对象。

老年代所占的内存大小为-Xmx对应的值减去-Xmn对应的值。

### 程序计数器 

是最小的一块内存区域，它的作用是当前线程所执行的字节码的行号指示器，在虚拟机的模型里，字节码解释器工作时就是通过改变这个计数器的值来选取下一条需要执行的字节码指令，分支、循环、异常处理、线程恢复等基础功能都需要依赖计数器完成。