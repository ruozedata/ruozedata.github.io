---
layout: post
title: "Spark动态内存管理源码解析！"
date: 2018-06-03
comments: true
tags: [高级,spark,源码阅读]
categories: Spark Core
---

#### 一、Spark内存管理模式
　Spark有两种内存管理模式，静态内存管理(Static MemoryManager)和动态（统一）内存管理（Unified MemoryManager）。动态内存管理从Spark1.6开始引入，在SparkEnv.scala中的源码可以看到，Spark目前默认采用动态内存管理模式，若将spark.memory.useLegacyMode设置为true，则会改为采用静态内存管理。
```
// SparkEnv.scala
    val useLegacyMemoryManager = conf.getBoolean("spark.memory.useLegacyMode", false)
    val memoryManager: MemoryManager =
      if (useLegacyMemoryManager) {
        new StaticMemoryManager(conf, numUsableCores)
      } else {
        UnifiedMemoryManager(conf, numUsableCores)
      }
```
<!--more--> 
#### 二、Spark动态内存管理空间分配
![enter description here](/assets/blogImg/603_1.png)
　相比于Static MemoryManager模式，Unified MemoryManager模型打破了存储内存和运行内存的界限，使每一个内存区能够动态伸缩，降低OOM的概率。由上图可知，executor JVM内存主要由以下几个区域组成：

- （1）Reserved Memory（预留内存）：这部分内存预留给系统使用，默认为300MB，可通过spark.testing.reservedMemory进行设置。
```
// UnifiedMemoryManager.scala
private val RESERVED_SYSTEM_MEMORY_BYTES = 300 * 1024 * 1024
```
　另外，JVM内存的最小值也与reserved Memory有关，即minSystemMemory = reserved Memory*1.5，即默认情况下JVM内存最小值为300MB*1.5=450MB。
 ```
// UnifiedMemoryManager.scala
    val minSystemMemory = (reservedMemory * 1.5).ceil.toLong
```
- （2）Spark Memeoy:分为execution Memory和storage Memory。去除掉reserved Memory，剩下usableMemory的一部分用于execution和storage这两类堆内存，默认是0.6，可通过spark.memory.fraction进行设置。例如：JVM内存是1G，那么用于execution和storage的默认内存为（1024-300）*0.6=434MB。
```
// UnifiedMemoryManager.scala
    val usableMemory = systemMemory - reservedMemory
    val memoryFraction = conf.getDouble("spark.memory.fraction", 0.6)
    (usableMemory * memoryFraction).toLong
```
　他们的边界由spark.memory.storageFraction设定，默认为0.5。即默认状态下storage Memory和execution Memory为1：1.
 ```
// UnifiedMemoryManager.scala
     onHeapStorageRegionSize =
        (maxMemory * conf.getDouble("spark.memory.storageFraction", 0.5)).toLong,
      numCores = numCores)
```
- （3）user Memory:剩余内存，用户根据需要使用，默认占usableMemory的（1-0.6）=0.4.

##### 三、内存控制详解
首先我们先来了解一下Spark内存管理实现类之前的关系。
![enter description here](/assets/blogImg/603_2.png)
##### 1.MemoryManager主要功能是：
- （1）记录用了多少StorageMemory和ExecutionMemory；
- （2）申请Storage、Execution和Unroll Memory；
- （3）释放Stroage和Execution Memory。

　Execution内存用来执行shuffle、joins、sorts和aggegations操作，Storage内存用于缓存和广播数据，每一个JVM中都存在着一个MemoryManager。构造MemoryManager需要指定onHeapStorageMemory和onHeapExecutionMemory参数。
 ```
 // MemoryManager.scala
private[spark] abstract class MemoryManager(
    conf: SparkConf,
    numCores: Int,
    onHeapStorageMemory: Long,
    onHeapExecutionMemory: Long) extends Logging {
```
　创建StorageMemoryPool和ExecutionMemoryPool对象，用来创建堆内或堆外的Storage和Execution内存池，管理Storage和Execution的内存分配。
```
// MemoryManager.scala
  @GuardedBy("this")
  protected val onHeapStorageMemoryPool = new StorageMemoryPool(this, MemoryMode.ON_HEAP)
  @GuardedBy("this")
  protected val offHeapStorageMemoryPool = new StorageMemoryPool(this, MemoryMode.OFF_HEAP)
  @GuardedBy("this")
  protected val onHeapExecutionMemoryPool = new ExecutionMemoryPool(this, MemoryMode.ON_HEAP)
  @GuardedBy("this")
  protected val offHeapExecutionMemoryPool = new ExecutionMemoryPool(this, MemoryMode.OFF_HEAP)
 ```
　默认情况下，不使用堆外内存，可通过saprk.memory.offHeap.enabled设置，默认堆外内存为0，可使用spark.memory.offHeap.size参数设置。
```
// All the code you will ever need
 final val tungstenMemoryMode: MemoryMode = {
    if (conf.getBoolean("spark.memory.offHeap.enabled", false)) {
      require(conf.getSizeAsBytes("spark.memory.offHeap.size", 0) > 0,
        "spark.memory.offHeap.size must be > 0 when spark.memory.offHeap.enabled == true")
      require(Platform.unaligned(),
        "No support for unaligned Unsafe. Set spark.memory.offHeap.enabled to false.")
      MemoryMode.OFF_HEAP
    } else {
      MemoryMode.ON_HEAP
    }
  }
```
```
// MemoryManager.scala
 protected[this] val maxOffHeapMemory = conf.getSizeAsBytes("spark.memory.offHeap.size", 0)
```
释放numBytes字节的Execution内存方法
```
// MemoryManager.scala
def releaseExecutionMemory(
      numBytes: Long,
      taskAttemptId: Long,
      memoryMode: MemoryMode): Unit = synchronized {
    memoryMode match {
      case MemoryMode.ON_HEAP => onHeapExecutionMemoryPool.releaseMemory(numBytes, taskAttemptId)
      case MemoryMode.OFF_HEAP => offHeapExecutionMemoryPool.releaseMemory(numBytes, taskAttemptId)
    }
  }
```
释放指定task的所有Execution内存并将该task标记为inactive。
```
// MemoryManager.scala
 private[memory] def releaseAllExecutionMemoryForTask(taskAttemptId: Long): Long = synchronized {
    onHeapExecutionMemoryPool.releaseAllMemoryForTask(taskAttemptId) +
      offHeapExecutionMemoryPool.releaseAllMemoryForTask(taskAttemptId)
  }
```
释放numBytes字节的Stoarge内存方法
```
// MemoryManager.scala
def releaseStorageMemory(numBytes: Long, memoryMode: MemoryMode): Unit = synchronized {
    memoryMode match {
      case MemoryMode.ON_HEAP => onHeapStorageMemoryPool.releaseMemory(numBytes)
      case MemoryMode.OFF_HEAP => offHeapStorageMemoryPool.releaseMemory(numBytes)
    }
  }
```
释放所有Storage内存方法
```
// MemoryManager.scala
final def releaseAllStorageMemory(): Unit = synchronized {
    onHeapStorageMemoryPool.releaseAllMemory()
    offHeapStorageMemoryPool.releaseAllMemory()
  }
```
#####  2.接下来我们了解一下，UnifiedMemoryManager是如何对内存进行控制的？动态内存是如何实现的呢？
　UnifiedMemoryManage继承了MemoryManager
```
// UnifiedMemoryManage.scala
private[spark] class UnifiedMemoryManager private[memory] (
    conf: SparkConf,
    val maxHeapMemory: Long,
    onHeapStorageRegionSize: Long,
    numCores: Int)
  extends MemoryManager(
    conf,
    numCores,
    onHeapStorageRegionSize,
    maxHeapMemory - onHeapStorageRegionSize) {
```
重写了maxOnHeapStorageMemory方法，最大Storage内存=最大内存-最大Execution内存。
```
// UnifiedMemoryManage.scala
 override def maxOnHeapStorageMemory: Long = synchronized {
    maxHeapMemory - onHeapExecutionMemoryPool.memoryUsed
  }
```
　核心方法acquireStorageMemory：申请Storage内存。
```
// UnifiedMemoryManage.scala
override def acquireStorageMemory(
      blockId: BlockId,
      numBytes: Long,
      memoryMode: MemoryMode): Boolean = synchronized {
    assertInvariants()
    assert(numBytes >= 0)
    val (executionPool, storagePool, maxMemory) = memoryMode match {
      //根据不同的内存模式去创建StorageMemoryPool和ExecutionMemoryPool
      case MemoryMode.ON_HEAP => (
        onHeapExecutionMemoryPool,
        onHeapStorageMemoryPool,
        maxOnHeapStorageMemory)
      case MemoryMode.OFF_HEAP => (
        offHeapExecutionMemoryPool,
        offHeapStorageMemoryPool,
        maxOffHeapMemory)
    }
    if (numBytes > maxMemory) {
      // 若申请内存大于最大内存，则申请失败
      logInfo(s"Will not store $blockId as the required space ($numBytes bytes) exceeds our " +
        s"memory limit ($maxMemory bytes)")
      return false
    }
    if (numBytes > storagePool.memoryFree) {
      // 如果Storage内存池没有足够的内存，则向Execution内存池借用
      val memoryBorrowedFromExecution = Math.min(executionPool.memoryFree, numBytes)//当Execution内存有空闲时，Storage才能借到内存
      executionPool.decrementPoolSize(memoryBorrowedFromExecution)//缩小Execution内存
      storagePool.incrementPoolSize(memoryBorrowedFromExecution)//增加Storage内存
    }
    storagePool.acquireMemory(blockId, numBytes)
```
　核心方法acquireExecutionMemory：申请Execution内存。
```
// UnifiedMemoryManage.scala
override private[memory] def acquireExecutionMemory(
      numBytes: Long,
      taskAttemptId: Long,
      memoryMode: MemoryMode): Long = synchronized {//使用了synchronized关键字，调用acquireExecutionMemory方法可能会阻塞，直到Execution内存池有足够的内存。
   ...
    executionPool.acquireMemory(
      numBytes, taskAttemptId, maybeGrowExecutionPool, computeMaxExecutionPoolSize)
  }
```
　方法最后调用了ExecutionMemoryPool的acquireMemory方法，该方法的参数需要两个函数：maybeGrowExecutionPool()和computeMaxExecutionPoolSize()。
　每个Task能够使用的内存被限制在pooSize / (2 * numActiveTask) ~ maxPoolSize / numActiveTasks。其中maxPoolSize代表了execution pool的最大内存，poolSize表示当前这个pool的大小。
```
// ExecutionMemoryPool.scala
      val maxPoolSize = computeMaxPoolSize()
      val maxMemoryPerTask = maxPoolSize / numActiveTasks
      val minMemoryPerTask = poolSize / (2 * numActiveTasks)
```
　maybeGrowExecutionPool()方法实现了如何动态增加Execution内存区的大小。
在每次申请execution内存的同时，execution内存池会进行多次尝试，每次尝试都可能会回收一些存储内存。
```
// UnifiedMemoryManage.scala
     def maybeGrowExecutionPool(extraMemoryNeeded: Long): Unit = {
      if (extraMemoryNeeded > 0) {//如果申请的内存大于0
        //计算execution可借到的storage内存，是storage剩余内存和可借出内存的最大值
        val memoryReclaimableFromStorage = math.max(
          storagePool.memoryFree,
          storagePool.poolSize - storageRegionSize)
        if (memoryReclaimableFromStorage > 0) {//如果可以申请到内存
          val spaceToReclaim = storagePool.freeSpaceToShrinkPool(
            math.min(extraMemoryNeeded, memoryReclaimableFromStorage))//实际需要的内存，取实际需要的内存和storage内存区域全部可用内存大小的最小值
          storagePool.decrementPoolSize(spaceToReclaim)//storage内存区域减少
          executionPool.incrementPoolSize(spaceToReclaim)//execution内存区域增加
        }
      }
    }
```