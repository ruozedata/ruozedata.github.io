---
layout: post
title: "每天起床第一句，看看Spark调度器"
date: 2019-01-18
comments: true
tags: [Spark,高级]
categories: [Spark Other]

---

之前呢，我们详细地分析了DAGScheduler的执行过程，我们知道，RDD形成的DAG经过DAGScheduler，依据shuffle将DAG划分为若干个stage，再由taskScheduler提交task到executor中执行，那么执行task的过程，就需要调度器来参与了。

Spark调度器主要有两种模式，也是大家耳熟能详的FIFO和FAIR模式。默认情况下，Spark是FIFO（先入先出）模式，即谁先提交谁先执行。而FAIR（公平调度）模式会在调度池中为任务进行分组，可以有不同的权重，根据权重来决定执行顺序。

那么源码中是怎么实现的呢？
<!--more--> 
首先，当Stage划分好，会调用TaskSchedulerImpl.submitTasks()方法，以TaskSet的形式提交给TaskScheduler，并创建一个TaskSetManger对象添加进调度池。

```
override def submitTasks(taskSet: TaskSet) {
    val tasks = taskSet.tasks
    //....
    this.synchronized {
      val manager = createTaskSetManager(taskSet, maxTaskFailures)
      val stage = taskSet.stageId
      val stageTaskSets =
        taskSetsByStageIdAndAttempt.getOrElseUpdate(stage, new HashMap[Int, TaskSetManager])
      stageTaskSets(taskSet.stageAttemptId) = manager
    //.....
      schedulableBuilder.addTaskSetManager(manager, manager.taskSet.properties)
```

SchedulerBulider通过TaskSchedulerImpl.initialize()进行了实例化，并调用了SchedulerBulider.buildPools()方法。具体怎么个build，就要看用户选择的schedulingMode了。

```
def initialize(backend: SchedulerBackend) {
    this.backend = backend
    schedulableBuilder = {
      schedulingMode match {
        case SchedulingMode.FIFO =>
          new FIFOSchedulableBuilder(rootPool)
        case SchedulingMode.FAIR =>
          new FairSchedulableBuilder(rootPool, conf)
        case _ =>
          throw new IllegalArgumentException(s"Unsupported $SCHEDULER_MODE_PROPERTY: " +
          s"$schedulingMode")
      }
    }
    schedulableBuilder.buildPools()
  }
```

然后我们来看一下两个调度器的buildPools()方法。  

```
override def buildPools() {
    // nothing
  }
```

FIFO什么也没干~~

```
override def buildPools() {
    var fileData: Option[(InputStream, String)] = None
    try {
      fileData = schedulerAllocFile.map { f =>
        val fis = new FileInputStream(f)
        logInfo(s"Creating Fair Scheduler pools from $f")
        Some((fis, f))
      }.getOrElse {
        val is = Utils.getSparkClassLoader.getResourceAsStream(DEFAULT_SCHEDULER_FILE)
        if (is != null) {
          logInfo(s"Creating Fair Scheduler pools from default file: $DEFAULT_SCHEDULER_FILE")
          Some((is, DEFAULT_SCHEDULER_FILE))
        } else {
          logWarning("Fair Scheduler configuration file not found so jobs will be scheduled in " +
            s"FIFO order. To use fair scheduling, configure pools in $DEFAULT_SCHEDULER_FILE or " +
            s"set $SCHEDULER_ALLOCATION_FILE_PROPERTY to a file that contains the configuration.")
          None
        }
      }

      fileData.foreach { case (is, fileName) => buildFairSchedulerPool(is, fileName) }
    } catch {
      case NonFatal(t) =>
        val defaultMessage = "Error while building the fair scheduler pools"
        val message = fileData.map { case (is, fileName) => s"$defaultMessage from $fileName" }
          .getOrElse(defaultMessage)
        logError(message, t)
        throw t
    } finally {
      fileData.foreach { case (is, fileName) => is.close() }
    }

    // finally create "default" pool
    buildDefaultPool()
  }
```