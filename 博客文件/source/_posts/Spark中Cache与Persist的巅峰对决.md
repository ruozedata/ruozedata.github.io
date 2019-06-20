---
layout: post
title: "Spark中Cache与Persist的巅峰对决"
date: 2019-06-14
comments: true
tags: 
    - Spark
    - 高级
    - Cache
    - Persist
categories: [Spark Other]

---

<!--more--> 

## Cache的产生背景

我们先做一个简单的测试读取一个本地文件做一次collect操作：

```
val rdd=sc.textFile("file:///home/hadoop/data/input.txt")
val rdd=sc.textFile("file:///home/hadoop/data/input.txt")
```

上面我们进行了两次相同的操作，观察日志我们发现这样一句话`Submitting ResultStage 0 (file:///home/hadoop/data/input.txt MapPartitionsRDD[1] at textFile at <console>:25), which has no missing parents`，每次都要去本地读取input.txt文件，这里大家能想到存在什么问题吗? 如果我的文件很大，每次都对相同的RDD进行同一个action操作，那么每次都要到本地读取文件，得到相同的结果。不断进行这样的重复操作，耗费资源浪费时间啊。这时候我们可能想到能不能把RDD保存在内存中呢？答案是可以的，这就是我们所要学习的cache。

## Cache的作用

通过上面的讲解我们知道, 有时候很多地方都会用到同一个RDD, 那么每个地方遇到Action操作的时候都会对同一个算子计算多次, 这样会造成效率低下的问题。通过cache操作可以把RDD持久化到内存或者磁盘。

现在我们利用上面说的例子，把rdd进行cache操作

rdd.cache这时候我们打开192.168.137.130:4040界面查看storage界面中是否有我们的刚才cache的文件，发现并没有。这时候我们进行一个action操作rdd.count。继续查看storage是不是有东西了哈

![Cache](/assets/pic/2019-06-14-1.png)

并且给我们列出了很多信息，存储级别（后面详解），大小（会发现要比源文件大，这也是一个调优点）等等。

说到这里小伙伴能能想到什么呢？ cacha是一个Tranformation还是一个Action呢？相信大伙应该知道了。

cache这个方法也是个Tranformation,当第一次遇到Action算子的时才会进行持久化，所以说我们第一次进行了cache操作在ui中并没有看到结果，进行了count操作才有。

## 源码详细解析

**Spark版本：2.2.0**

源码分析

```
 /**
   * Persist this RDD with the default storage level (`MEMORY_ONLY`).
   */
  def cache(): this.type = persist()
```

从源码中可以明显看出cache()调用了persist(), 想要知道二者的不同还需要看一下persist函数：（这里注释cache的storage level）

```
/**
   * Persist this RDD with the default storage level (`MEMORY_ONLY`).
   */
  def persist(): this.type = persist(StorageLevel.MEMORY_ONLY)
```

可以看到persist()内部调用了persist(StorageLevel.MEMORY_ONLY)，是不是和上面对上了哈，这里我们能够得出cache和persist的区别了：cache只有一个默认的缓存级别MEMORY_ONLY ，而persist可以根据情况设置其它的缓存级别。

我相信小伙伴们肯定很好奇这个缓存级别到底有多少种呢？我们继续怼源码看看：

```
/**
 * :: DeveloperApi ::
 * Flags for controlling the storage of an RDD. Each StorageLevel records whether to use memory,
 * or ExternalBlockStore, whether to drop the RDD to disk if it falls out of memory or
 * ExternalBlockStore, whether to keep the data in memory in a serialized format, and whether
 * to replicate the RDD partitions on multiple nodes.
 *
 * The [[org.apache.spark.storage.StorageLevel]] singleton object contains some static constants
 * for commonly useful storage levels. To create your own storage level object, use the
 * factory method of the singleton object (`StorageLevel(...)`).
 */
@DeveloperApi
class StorageLevel private(
    private var _useDisk: Boolean,
    private var _useMemory: Boolean,
    private var _useOffHeap: Boolean,
    private var _deserialized: Boolean,
    private var _replication: Int = 1)
  extends Externalizable 
```

我们先来看看存储类型，源码中我们可以看出有五个参数，分别代表：

`useDisk`:使用硬盘（外存）;

`useMemory`:使用内存;

`useOffHeap`:使用堆外内存，这是Java虚拟机里面的概念，堆外内存意味着把内存对象分配在Java虚拟机的堆以外的内存，这些内存直接受操作系统管理（而不是虚拟机）。这样做的结果就是能保持一个较小的堆，以减少垃圾收集对应用的影响。这部分内存也会被频繁的使用而且也可能导致OOM，它是通过存储在堆中的DirectByteBuffer对象进行引用，可以避免堆和堆外数据进行来回复制；

`deserialized`:反序列化，其逆过程序列化（Serialization）是java提供的一种机制，将对象表示成一连串的字节；而反序列化就表示将字节恢复为对象的过程。序列化是对象永久化的一种机制，可以将对象及其属性保存起来，并能在反序列化后直接恢复这个对象;

`replication`:备份数（在多个节点上备份，默认为1）。

我们接着看看缓存级别：

```
/**
 * Various [[org.apache.spark.storage.StorageLevel]] defined and utility functions for creating
 * new storage levels.
 */
object StorageLevel {
  val NONE = new StorageLevel(false, false, false, false)
  val DISK_ONLY = new StorageLevel(true, false, false, false)
  val DISK_ONLY_2 = new StorageLevel(true, false, false, false, 2)
  val MEMORY_ONLY = new StorageLevel(false, true, false, true)
  val MEMORY_ONLY_2 = new StorageLevel(false, true, false, true, 2)
  val MEMORY_ONLY_SER = new StorageLevel(false, true, false, false)
  val MEMORY_ONLY_SER_2 = new StorageLevel(false, true, false, false, 2)
  val MEMORY_AND_DISK = new StorageLevel(true, true, false, true)
  val MEMORY_AND_DISK_2 = new StorageLevel(true, true, false, true, 2)
  val MEMORY_AND_DISK_SER = new StorageLevel(true, true, false, false)
  val MEMORY_AND_DISK_SER_2 = new StorageLevel(true, true, false, false, 2)
  val OFF_HEAP = new StorageLevel(true, true, true, false, 1)
```

可以看到这里列出了12种缓存级别，**但这些有什么区别呢？**可以看到每个缓存级别后面都跟了一个StorageLevel的构造函数，里面包含了4个或5个参数，和上面说的存储类型是相对应的，四个参数是因为有一个是有默认值的。

好吧这里我又想问小伙伴们一个问题了，这几种存储方式什么意思呢？该如何选择呢？

官网上进行了详细的解释。我这里介绍一个有兴趣的同学可以去官网看看哈。


**MEMORY_ONLY**
>使用反序列化的Java对象格式，将数据保存在内存中。如果内存不够存放所有的数据，某些分区将不会被缓存，并且将在需要时重新计算。这是默认级别。

**MEMORY_AND_DISK**
>使用反序列化的Java对象格式，优先尝试将数据保存在内存中。如果内存不够存放所有的数据，会将数据写入磁盘文件中，下次对这个RDD执行算子时，持久化在磁盘文件中的数据会被读取出来使用。

**MEMORY_ONLY_SER（(Java and Scala)）**
>基本含义同MEMORY_ONLY。唯一的区别是，会将RDD中的数据进行序列化，RDD的每个partition会被序列化成一个字节数组。这种方式更加节省内存，但是会加大cpu负担。

一个简单的案例感官行的认识存储级别的差别：

```
19M     page_views.dat

val rdd1=sc.textFile("file:///home/hadoop/data/page_views.dat")
rdd1.persist().count
```

ui查看缓存大小：

![ui查看缓存大小](/assets/pic/2019-06-14-2.png)

是不是明显变大了，我们先删除缓存<font color="red">rdd1.unpersist()</font>

使用MEMORY_ONLY_SER级别

```
import org.apache.spark.storage.StorageLevel
rdd1.persist(StorageLevel.MEMORY_ONLY_SER)
rdd1.count
```

![MEMORY_ONLY_SER](/assets/pic/2019-06-14-3.png)

这里我就用这两种方式进行对比，大家可以试试其他方式。

那如何选择呢？哈哈官网也说了。

你可以在内存使用和CPU效率之间来做出不同的选择不同的权衡。

默认情况下，性能最高的当然是MEMORY_ONLY，但前提是你的内存必须足够足够大，可以绰绰有余地存放下整个RDD的所有数据。因为不进行序列化与反序列化操作，就避免了这部分的性能开销；对这个RDD的后续算子操作，都是基于纯内存中的数据的操作，不需要从磁盘文件中读取数据，性能也很高；而且不需要复制一份数据副本，并远程传送到其他节点上。但是这里必须要注意的是，在实际的生产环境中，恐怕能够直接用这种策略的场景还是有限的，如果RDD中数据比较多时（比如几十亿），直接用这种持久化级别，会导致JVM的OOM内存溢出异常。

如果使用MEMORY_ONLY级别时发生了内存溢出，那么建议尝试使用MEMORY_ONLY_SER级别。该级别会将RDD数据序列化后再保存在内存中，此时每个partition仅仅是一个字节数组而已，大大减少了对象数量，并降低了内存占用。这种级别比MEMORY_ONLY多出来的性能开销，主要就是序列化与反序列化的开销。但是后续算子可以基于纯内存进行操作，因此性能总体还是比较高的。此外，可能发生的问题同上，如果RDD中的数据量过多的话，还是可能会导致OOM内存溢出的异常。

不要泄漏到磁盘，除非你在内存中计算需要很大的花费，或者可以过滤大量数据，保存部分相对重要的在内存中。否则存储在磁盘中计算速度会很慢，性能急剧降低。

后缀为_2的级别，必须将所有数据都复制一份副本，并发送到其他节点上，数据复制以及网络传输会导致较大的性能开销，除非是要求作业的高可用性，否则不建议使用。

## 删除缓存中的数据

spark自动监视每个节点上的缓存使用，并以最近最少使用的（LRU）方式丢弃旧数据分区。如果您想手动删除RDD，而不是等待它从缓存中掉出来，请使用 RDD.unpersist()方法。