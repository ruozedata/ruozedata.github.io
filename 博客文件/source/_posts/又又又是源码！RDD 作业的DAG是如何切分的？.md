---
layout: post
title: "又又又是源码！RDD 作业的DAG是如何切分的？"
date: 2018-04-23
comments: true
tags: 
	- spark
	- 高级
	- 源码阅读
categories: Spark Core
---
 我们都知道，RDD存在着依赖关系，这些依赖关系形成了有向无环图DAG，DAG通过DAGScheduler进行Stage的划分，并基于每个Stage生成了TaskSet，提交给TaskScheduler。那么这整个过程在源码中是如何体现的呢？
<!--more--> 

#### 1.作业的提交
```
// SparkContext.scala
  dagScheduler.runJob(rdd, cleanedFunc, partitions, callSite, resultHandler, localProperties.get)
  progressBar.foreach(_.finishAll())
```
```
// DAGScheduler.scala
   def runJob[T, U](
    val waiter = submitJob(rdd, func, partitions, callSite, resultHandler, properties)
```
可以看到，SparkContext的runjob方法调用了DAGScheduler的runjob方法正式向集群提交任务，最终调用了submitJob方法。
```
 1// DAGScheduler.scala
 2   def submitJob[T, U](
 3      rdd: RDD[T],
 4      func: (TaskContext, Iterator[T]) => U,
 5      partitions: Seq[Int],
 6      callSite: CallSite,
 7      resultHandler: (Int, U) => Unit,
 8      properties: Properties): JobWaiter[U] = {
 9    // Check to make sure we are not launching a task on a partition that does not exist.
10    val maxPartitions = rdd.partitions.length
11    partitions.find(p => p >= maxPartitions || p < 0).foreach { p =>
12      throw new IllegalArgumentException(
13        "Attempting to access a non-existent partition: " + p + ". " +
14          "Total number of partitions: " + maxPartitions)
15    }
16
17    val jobId = nextJobId.getAndIncrement()
18    if (partitions.size == 0) {
19      // Return immediately if the job is running 0 tasks
20      return new JobWaiter[U](this, jobId, 0, resultHandler)
21    }
22
23    assert(partitions.size > 0)
24    val func2 = func.asInstanceOf[(TaskContext, Iterator[_]) => _]
25    val waiter = new JobWaiter(this, jobId, partitions.size, resultHandler)
26    //给eventProcessLoop发送JobSubmitted消息
27    eventProcessLoop.post(JobSubmitted(
28      jobId, rdd, func2, partitions.toArray, callSite, waiter,
29      SerializationUtils.clone(properties)))
30    waiter
31  }
```
这里向eventProcessLoop对象发送了JobSubmitted消息。
```
1// DAGScheduler.scala
2   private[scheduler] val eventProcessLoop = new DAGSchedulerEventProcessLoop(this)
    eventProcessLoop是DAGSchedulerEventProcessLoop类的一个对象。
 1// DAGScheduler.scala
 2  private def doOnReceive(event: DAGSchedulerEvent): Unit = event match {
 3    case JobSubmitted(jobId, rdd, func, partitions, callSite, listener, properties) =>
 4      dagScheduler.handleJobSubmitted(jobId, rdd, func, partitions, callSite, listener, properties)
 5
 6    case MapStageSubmitted(jobId, dependency, callSite, listener, properties) =>
 7      dagScheduler.handleMapStageSubmitted(jobId, dependency, callSite, listener, properties)
 8
 9    case StageCancelled(stageId) =>
10      dagScheduler.handleStageCancellation(stageId)
11
12    case JobCancelled(jobId) =>
13      dagScheduler.handleJobCancellation(jobId)
14
15    case JobGroupCancelled(groupId) =>
16      dagScheduler.handleJobGroupCancelled(groupId)
17
18    case AllJobsCancelled =>
19      dagScheduler.doCancelAllJobs()
20
21    case ExecutorAdded(execId, host) =>
22      dagScheduler.handleExecutorAdded(execId, host)
23
24    case ExecutorLost(execId, reason) =>
25      val filesLost = reason match {
26        case SlaveLost(_, true) => true
27        case _ => false
28      }
29      dagScheduler.handleExecutorLost(execId, filesLost)
30
31    case BeginEvent(task, taskInfo) =>
32      dagScheduler.handleBeginEvent(task, taskInfo)
33
34    case GettingResultEvent(taskInfo) =>
35      dagScheduler.handleGetTaskResult(taskInfo)
36
37    case completion: CompletionEvent =>
38      dagScheduler.handleTaskCompletion(completion)
39
40    case TaskSetFailed(taskSet, reason, exception) =>
41      dagScheduler.handleTaskSetFailed(taskSet, reason, exception)
42
43    case ResubmitFailedStages =>
44      dagScheduler.resubmitFailedStages()
45  }
```
 DAGSchedulerEventProcessLoop对接收到的消息进行处理，在doOnReceive方法中形成一个event loop。
接下来将调用submitStage()方法进行stage的划分。

#### 2.stage的划分
```
 1// DAGScheduler.scala
 2 private def submitStage(stage: Stage) {
 3    val jobId = activeJobForStage(stage)//查找该Stage的所有激活的job
 4    if (jobId.isDefined) {
 5      logDebug("submitStage(" + stage + ")")
 6      if (!waitingStages(stage) && !runningStages(stage) && !failedStages(stage)) {
 7        val missing = getMissingParentStages(stage).sortBy(_.id)//得到Stage的父Stage，并排序
 8        logDebug("missing: " + missing)
 9        if (missing.isEmpty) {
10          logInfo("Submitting " + stage + " (" + stage.rdd + "), which has no missing parents")
11          submitMissingTasks(stage, jobId.get)//如果Stage没有父Stage，则提交任务集
12        } else {
13          for (parent <- missing) {//如果有父Stage，递归调用submiStage
14            submitStage(parent)
15          }
16          waitingStages += stage//将其标记为等待状态，等待下次提交
17        }
18      }
19    } else {
20      abortStage(stage, "No active job for stage " + stage.id, None)//如果该Stage没有激活的job，则丢弃该Stage
21    }
22  }
```
　在submitStage方法中判断Stage的父Stage有没有被提交，直到所有父Stage都被提交，只有等父Stage完成后才能调度子Stage。
```
 1// DAGScheduler.scala
 2private def getMissingParentStages(stage: Stage): List[Stage] = {
 3    val missing = new HashSet[Stage] //用于存放父Stage
 4    val visited = new HashSet[RDD[_]] //用于存放已访问过的RDD
 5
 6    val waitingForVisit = new Stack[RDD[_]]
 7    def visit(rdd: RDD[_]) {
 8      if (!visited(rdd)) { //如果RDD没有被访问过，则进行访问
 9        visited += rdd //添加到已访问RDD的HashSet中
10        val rddHasUncachedPartitions = getCacheLocs(rdd).contains(Nil)
11        if (rddHasUncachedPartitions) {
12          for (dep <- rdd.dependencies) { //获取该RDD的依赖
13            dep match {
14              case shufDep: ShuffleDependency[_, _, _] =>//若为宽依赖，则该RDD依赖的RDD所在的stage为父stage
15                val mapStage = getOrCreateShuffleMapStage(shufDep, stage.firstJobId)//生成父Stage
16                if (!mapStage.isAvailable) {//若父Stage不存在，则添加到父Stage的HashSET中
17                  missing += mapStage
18                }
19              case narrowDep: NarrowDependency[_] =>//若为窄依赖，则继续访问父RDD
20                waitingForVisit.push(narrowDep.rdd)
21            }
22          }
23        }
24      }
25    }
26    waitingForVisit.push(stage.rdd)
27    while (waitingForVisit.nonEmpty) {//循环遍历所有RDD
28      visit(waitingForVisit.pop())
29    }
30    missing.toList
31  }
```
#### getmissingParentStages()方法为核心方法。
<font color=#FF4500 >

 这里我们要懂得这样一个逻辑：我们都知道，Stage是通过shuffle划分的，所以，每一Stage都是以shuffle开始的，若一个RDD是宽依赖，则必然说明该RDD的父RDD在另一个Stage中，若一个RDD是窄依赖，则该RDD所依赖的父RDD还在同一个Stage中，我们可以根据这个逻辑，找到该Stage的父Stage。
</font>