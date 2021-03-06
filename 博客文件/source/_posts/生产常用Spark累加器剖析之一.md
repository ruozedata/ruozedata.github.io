---
layout: post
title: "生产常用Spark累加器剖析之一"
date: 2019-04-19
comments: true
tags: [spark,累加器]
categories: Spark Other
---
**由于最近在项目中需要用到Spark的累加器，同时需要自己去自定义实现Spark的累加器，从而满足生产上的需求。对此，对Spark的累加器实现机制进行了追踪学习。**

本系列文章，将从以下几个方面入手，对Spark累加器进行剖析：

1. Spark累加器的基本概念
2. 累加器的重点类构成
3. 累加器的源码解析
4. 累加器的执行过程
5. 累加器使用中的坑
6. 自定义累加器的实现
<!--more--> 
## Spark累加器基本概念

Spark提供的Accumulator，主要用于多个节点对一个变量进行共享性的操作。Accumulator只提供了累加的功能，只能累加，不能减少累加器只能在Driver端构建，并只能从Driver端读取结果，在Task端只能进行累加。

至于这里为什么只能在Task累加呢？下面的内容将会进行详细的介绍，先简单介绍下：

```
在Task节点，准确的就是说在executor上；
每个Task都会有一个累加器的变量，被序列化传输到executor端运行之后再返回过来都是独立运行的；
如果在Task端去获取值的话，只能获取到当前Task的，Task与Task之间不会有影响
```
累加器不会改变Spark lazy计算的特点，只会在Job触发的时候进行相关的累加操作

现有累加器类型:

![enter description here](/assets/blogImg/Spark累加器类型_1.png)

## 累加器的重点类介绍

<font size=4><b>class Accumulator extends Accumulable</b></font>

源码（源码中已经对这个类的作用做了十分详细的解释）：

```
/**
 * A simpler value of [[Accumulable]] where the result type being accumulated is the same
 * as the types of elements being merged, i.e. variables that are only "added" to through an
 * associative operation and can therefore be efficiently supported in parallel. They can be used
 * to implement counters (as in MapReduce) or sums. Spark natively supports accumulators of numeric
 * value types, and programmers can add support for new types.
 *
 * An accumulator is created from an initial value `v` by calling [[SparkContext#accumulator]].
 * Tasks running on the cluster can then add to it using the [[Accumulable#+=]] operator.
 * However, they cannot read its value. Only the driver program can read the accumulator's value,
 * using its value method.
 *
 * @param initialValue initial value of accumulator
 * @param param helper object defining how to add elements of type `T`
 * @tparam T result type
 */
class Accumulator[T] private[spark] (
    @transient private[spark] val initialValue: T,
    param: AccumulatorParam[T],
    name: Option[String],
    internal: Boolean)
  extends Accumulable[T, T](initialValue, param, name, internal) {
  def this(initialValue: T, param: AccumulatorParam[T], name: Option[String]) = {
    this(initialValue, param, name, false)
  }
  def this(initialValue: T, param: AccumulatorParam[T]) = {
    this(initialValue, param, None, false)
  }
}
```

	主要实现了累加器的初始化及封装了相关的累加器操作方法
	同时在类对象构建的时候向Accumulators注册累加器
	累加器的add操作的返回值类型和传入进去的值类型可以不一样
	所以一定要定义好两步操作（即add方法）：累加操作/合并操作


<font size=4><b>object Accumulators</b></font>

	该方法在Driver端管理着累加器，也包含了累加器的聚合操作

<font size=4><b>trait AccumulatorParam[T] extends AccumulableParam[T, T]</b></font>

源码：

```
/**
 * A simpler version of [[org.apache.spark.AccumulableParam]] where the only data type you can add
 * in is the same type as the accumulated value. An implicit AccumulatorParam object needs to be
 * available when you create Accumulators of a specific type.
 *
 * @tparam T type of value to accumulate
 */
trait AccumulatorParam[T] extends AccumulableParam[T, T] {
  def addAccumulator(t1: T, t2: T): T = {
    addInPlace(t1, t2)
  }
}
```

	AccumulatorParam的addAccumulator操作的泛型封装
	具体的实现还是需要在具体实现类里面实现addInPlace方法
	自定义实现累加器的关键

<font size=4><b>object AccumulatorParam</b></font>

源码：

```
object AccumulatorParam {
  // The following implicit objects were in SparkContext before 1.2 and users had to
  // `import SparkContext._` to enable them. Now we move them here to make the compiler find
  // them automatically. However, as there are duplicate codes in SparkContext for backward
  // compatibility, please update them accordingly if you modify the following implicit objects.
  implicit object DoubleAccumulatorParam extends AccumulatorParam[Double] {
    def addInPlace(t1: Double, t2: Double): Double = t1 + t2
    def zero(initialValue: Double): Double = 0.0
  }
  implicit object IntAccumulatorParam extends AccumulatorParam[Int] {
    def addInPlace(t1: Int, t2: Int): Int = t1 + t2
    def zero(initialValue: Int): Int = 0
  }
  implicit object LongAccumulatorParam extends AccumulatorParam[Long] {
    def addInPlace(t1: Long, t2: Long): Long = t1 + t2
    def zero(initialValue: Long): Long = 0L
  }
  implicit object FloatAccumulatorParam extends AccumulatorParam[Float] {
    def addInPlace(t1: Float, t2: Float): Float = t1 + t2
    def zero(initialValue: Float): Float = 0f
  }
  // TODO: Add AccumulatorParams for other types, e.g. lists and strings
}
```

	从源码中大量的implicit关键词，可以发现该类主要进行隐式类型转换的操作


<font size=4><b>TaskContextImpl</b></font>

	在Executor端管理着我们的累加器，累加器是通过该类进行返回的

## 累加器的源码解析

<font size=4><b>Driver端</b></font>

&ensp;&ensp;<font size=3><b>accumulator方法</b></font>

以下列这段代码中的accumulator方法为入口点，进入到相应的源码中去

`val acc = new Accumulator(initialValue, param, Some(name))`

源码：

```
class Accumulator[T] private[spark] (
    @transient private[spark] val initialValue: T,
    param: AccumulatorParam[T],
    name: Option[String],
    internal: Boolean)
  extends Accumulable[T, T](initialValue, param, name, internal) {
  def this(initialValue: T, param: AccumulatorParam[T], name: Option[String]) = {
    this(initialValue, param, name, false)
  }
  def this(initialValue: T, param: AccumulatorParam[T]) = {
    this(initialValue, param, None, false)
  }
}
```

&ensp;&ensp;<font size=3><b>继承的Accumulable[T, T]</b></font>

源码：

```
class Accumulable[R, T] private[spark] (
    initialValue: R,
    param: AccumulableParam[R, T],
    val name: Option[String],
    internal: Boolean)
  extends Serializable {
…
// 这里的_value并不支持序列化
// 注：有@transient的都不会被序列化
@volatile @transient private var value_ : R = initialValue // Current value on master
  …
  // 注册了当前的累加器
  Accumulators.register(this)
  …,
  }
```

&ensp;&ensp;<font size=3><b>Accumulators.register()</b></font>

源码：

```
// 传入参数，注册累加器
def register(a: Accumulable[_, _]): Unit = synchronized {
// 构造成WeakReference
originals(a.id) = new WeakReference[Accumulable[_, _]](a)
}
```

<font size=3><b>至此，Driver端的初始化已经完成</b></font>

<font size=4><b>Executor端</b></font>

	Executor端的反序列化是一个得到我们的对象的过程
	初始化是在反序列化的时候就完成的，同时反序列化的时候还完成了Accumulator向TaskContextImpl的注册

&ensp;&ensp;<font size=3><b>TaskRunner中的run方法</b></font>

```
// 在计算的过程中，会将RDD和function经过序列化之后传给Executor端
private[spark] class Executor(
    executorId: String,
    executorHostname: String,
    env: SparkEnv,
    userClassPath: Seq[URL] = Nil,
    isLocal: Boolean = false)
  extends Logging {
...
  class TaskRunner(
      execBackend: ExecutorBackend,
      val taskId: Long,
      val attemptNumber: Int,
      taskName: String,
      serializedTask: ByteBuffer)
    extends Runnable {
…
override def run(): Unit = {
    …
val (value, accumUpdates) = try {
         // 调用TaskRunner中的task.run方法，触发task的运行
         val res = task.run(
           taskAttemptId = taskId,
           attemptNumber = attemptNumber,
           metricsSystem = env.metricsSystem)
         threwException = false
         res
       } finally {
        …
       }
…
}
```

&ensp;&ensp;<font size=3><b>Task中的collectAccumulators()方法</b></font>

```
private[spark] abstract class Task[T](
final def run(
    taskAttemptId: Long,
    attemptNumber: Int,
    metricsSystem: MetricsSystem)
  : (T, AccumulatorUpdates) = {
  …
    try {
      // 返回累加器，并运行task
      // 调用TaskContextImpl的collectAccumulators，返回值的类型为一个Map
      (runTask(context), context.collectAccumulators())
    } finally {
  …
 }
 …
 }
)
```

&ensp;&ensp;<font size=3><b>ResultTask中的runTask方法</b></font>

```
  override def runTask(context: TaskContext): U = {
    // Deserialize the RDD and the func using the broadcast variables.
    val deserializeStartTime = System.currentTimeMillis()
    val ser = SparkEnv.get.closureSerializer.newInstance()
    // 反序列化是在调用ResultTask的runTask方法的时候做的
    // 会反序列化出来RDD和自己定义的function
    val (rdd, func) = ser.deserialize[(RDD[T], (TaskContext, Iterator[T]) => U)](
      ByteBuffer.wrap(taskBinary.value), Thread.currentThread.getContextClassLoader)
    _executorDeserializeTime = System.currentTimeMillis() - deserializeStartTime
    metrics = Some(context.taskMetrics)
    func(context, rdd.iterator(partition, context))
  }
```

&ensp;&ensp;<font size=3><b>Accumulable中的readObject方法</b></font>

```
// 在反序列化的过程中会调用Accumulable.readObject方法
  // Called by Java when deserializing an object
  private def readObject(in: ObjectInputStream): Unit = Utils.tryOrIOException {
    in.defaultReadObject()
    // value的初始值为zero；该值是会被序列化的
    value_ = zero
    deserialized = true
    // Automatically register the accumulator when it is deserialized with the task closure.
    //
    // Note internal accumulators sent with task are deserialized before the TaskContext is created
    // and are registered in the TaskContext constructor. Other internal accumulators, such SQL
    // metrics, still need to register here.
    val taskContext = TaskContext.get()
    if (taskContext != null) {
      // 当前反序列化所得到的对象会被注册到TaskContext中
      // 这样TaskContext就可以获取到累加器
      // 任务运行结束之后，就可以通过context.collectAccumulators()返回给executor
      taskContext.registerAccumulator(this)
    }
  }
```

&ensp;&ensp;<font size=3><b>Executor.scala</b></font>

```
// 在executor端拿到accumuUpdates值之后，会去构造一个DirectTaskResult
val directResult = new DirectTaskResult(valueBytes, accumUpdates, task.metrics.orNull)
val serializedDirectResult = ser.serialize(directResult)
val resultSize = serializedDirectResult.limit
…
// 最终由ExecutorBackend的statusUpdate方法发送至Driver端
// ExecutorBackend为一个Trait，有多种实现
execBackend.statusUpdate(taskId, TaskState.FINISHED, serializedResult)
```

&ensp;&ensp;<font size=3><b>CoarseGrainedExecutorBackend中的statusUpdate方法</b></font>

```
// 通过ExecutorBackend的一个实现类：CoarseGrainedExecutorBackend 中的statusUpdate方法
// 将数据发送至Driver端
override def statusUpdate(taskId: Long, state: TaskState, data: ByteBuffer) {
    val msg = StatusUpdate(executorId, taskId, state, data)
    driver match {
      case Some(driverRef) => driverRef.send(msg)
      case None => logWarning(s"Drop $msg because has not yet connected to driver")
    }
  }
```

&ensp;&ensp;<font size=3><b>CoarseGrainedSchedulerBackend中的receive方法</b></font>

```
// Driver端在接收到消息之后，会调用CoarseGrainedSchedulerBackend中的receive方法
override def receive: PartialFunction[Any, Unit] = {
      case StatusUpdate(executorId, taskId, state, data) =>
        // 会在DAGScheduler的handleTaskCompletion方法中将结果返回
        scheduler.statusUpdate(taskId, state, data.value)
    …
}
```


&ensp;&ensp;<font size=3><b>TaskSchedulerImpl的statusUpdate方法</b></font>

```
def statusUpdate(tid: Long, state: TaskState, serializedData: ByteBuffer) {
  …
            if (state == TaskState.FINISHED) {
              taskSet.removeRunningTask(tid)
              // 将成功的Task入队
              taskResultGetter.enqueueSuccessfulTask(taskSet, tid, serializedData)
            } else if (Set(TaskState.FAILED, TaskState.KILLED, TaskState.LOST).contains(state)) {
              taskSet.removeRunningTask(tid)
              taskResultGetter.enqueueFailedTask(taskSet, tid, state, serializedData)
            }
  …
}
```

&ensp;&ensp;<font size=3><b>TaskResultGetter的enqueueSuccessfulTask方法</b></font>

```
def enqueueSuccessfulTask(taskSetManager: TaskSetManager, tid: Long, serializedData: ByteBuffer) {
…
          result.metrics.setResultSize(size)
          scheduler.handleSuccessfulTask(taskSetManager, tid, result)
…
```

&ensp;&ensp;<font size=3><b>TaskSchedulerImpl的handleSuccessfulTask方法</b></font>

```
def handleSuccessfulTask(
      taskSetManager: TaskSetManager,
      tid: Long,
      taskResult: DirectTaskResult[_]): Unit = synchronized {
    taskSetManager.handleSuccessfulTask(tid, taskResult)
  }
```

&ensp;&ensp;<font size=3><b>DAGScheduler的taskEnded方法</b></font>

```
 def taskEnded(
      task: Task[_],
      reason: TaskEndReason,
      result: Any,
      accumUpdates: Map[Long, Any],
      taskInfo: TaskInfo,
      taskMetrics: TaskMetrics): Unit = {
  eventProcessLoop.post(
      // 给自身的消息循环体发了个CompletionEvent
      // 这个CompletionEvent会被handleTaskCompletion方法所接收到
      CompletionEvent(task, reason, result, accumUpdates, taskInfo, taskMetrics))
  }
```

&ensp;&ensp;<font size=3><b>DAGScheduler的handleTaskCompletion方法</b></font>

```
// 与上述CoarseGrainedSchedulerBackend中的receive方法章节对应
// 在handleTaskCompletion方法中，接收CompletionEvent
// 不论是ResultTask还是ShuffleMapTask都会去调用updateAccumulators方法，更新累加器的值
private[scheduler] def handleTaskCompletion(event: CompletionEvent) {
    …
    event.reason match {
      case Success =>
        listenerBus.post(SparkListenerTaskEnd(stageId, stage.latestInfo.attemptId, taskType,
          event.reason, event.taskInfo, event.taskMetrics))
        stage.pendingPartitions -= task.partitionId
        task match {
          case rt: ResultTask[_, _] =>
            // Cast to ResultStage here because it's part of the ResultTask
            // TODO Refactor this out to a function that accepts a ResultStage
            val resultStage = stage.asInstanceOf[ResultStage]
            resultStage.activeJob match {
              case Some(job) =>
                if (!job.finished(rt.outputId)) {
                  updateAccumulators(event)
          case smt: ShuffleMapTask =>
            val shuffleStage = stage.asInstanceOf[ShuffleMapStage]
            updateAccumulators(event)
}
…
}
```

&ensp;&ensp;<font size=3><b>DAGScheduler的updateAccumulators方法</b></font>

```
 private def updateAccumulators(event: CompletionEvent): Unit = {
    val task = event.task
    val stage = stageIdToStage(task.stageId)
    if (event.accumUpdates != null) {
      try {
        // 调用了累加器的add方法
        Accumulators.add(event.accumUpdates)
```

&ensp;&ensp;<font size=3><b>Accumulators的add方法</b></font>

```
def add(values: Map[Long, Any]): Unit = synchronized {
    // 遍历传进来的值
    for ((id, value) <- values) {
      if (originals.contains(id)) {
        // Since we are now storing weak references, we must check whether the underlying data
        // is valid.
        // 根据id从注册的Map中取出对应的累加器
        originals(id).get match {
          // 将值给累加起来，最终将结果加到value里面
          // ++=是被重载了
          case Some(accum) => accum.asInstanceOf[Accumulable[Any, Any]] ++= value
          case None =>
            throw new IllegalAccessError("Attempted to access garbage collected Accumulator.")
        }
      } else {
        logWarning(s"Ignoring accumulator update for unknown accumulator id $id")
      }
    }
  }
```

&ensp;&ensp;<font size=3><b>Accumulators的++=方法</b></font>

```
def ++= (term: R) { value_ = param.addInPlace(value_, term)}
```

&ensp;&ensp;<font size=3><b>Accumulators的value方法</b></font>

```
 def value: R = {
    if (!deserialized) {
      value_
    } else {
      throw new UnsupportedOperationException("Can't read accumulator value in task")
    }
  }
```

<font size=4><b>此时我们的应用程序就可以通过 .value 的方式去获取计数器的值了</b></font>
