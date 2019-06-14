---
layout: post
title: "Spark UI界面实现原理"
date: 2019-02-22
comments: true
tags: 
	- spark
categories: Spark Other
---
当Spark程序在运行时，会提供一个Web页面查看Application运行状态信息。是否开启UI界面由参数spark.ui.enabled(默认为true)来确定。下面列出Spark UI一些相关配置参数，默认值，以及其作用。

![enter description here](/assets/blogImg/2019-02-22-1.png)

本文接下来分成两个部分，第一部分基于Spark-1.6.0的源码，结合第二部分的图片内容来描述UI界面在Spark中的实现方式。第二部分以实例展示Spark UI界面显示的内容。

<!--more--> 
## Spark UI界面实现方式

### UI组件结构

这部分先讲UI界面的实现方式，UI界面的实例在本文最后一部分。如果对这部分中的某些概念不清楚，那么最好先把第二部分了解一下。
 
从下面UI界面的实例可以看出，不同的内容以Tab的形式展现在界面上，对应每一个Tab在下方显示具体内容。基本上Spark UI界面也是按这个层次关系实现的。 

以SparkUI类为容器，各个Tab，如JobsTab, StagesTab, ExecutorsTab等镶嵌在SparkUI上，对应各个Tab，有页面内容实现类JobPage, StagePage, ExecutorsPage等页面。这些类的继承和包含关系如下图所示：

![enter description here](/assets/blogImg/2019-02-22-2.png)

### 初始化过程

从上面可以看出，SparkUI类型的对象是UI界面的根对象，它是在SparkContext类中构造出来的。

```
private var _ui: Option[SparkUI] = None //定义
_ui = //SparkUI对象的生成
  if (conf.getBoolean("spark.ui.enabled", true)) {
    Some(SparkUI.createLiveUI(this, _conf, listenerBus, _jobProgressListener,
      _env.securityManager, appName, startTime = startTime))
  } else {
    // For tests, do not enable the UI
    None
  }
_ui.foreach(_.bind())  //启动jetty。bind方法继承自WebUI，该类负责和真实的Jetty Server API打交道

```

上面这段代码中可以看到SparkUI对象的生成过程，结合上面的类结构图，可以看到bind方法继承自WebUI类，进入WebUI类中

```
protected val handlers = ArrayBuffer[ServletContextHandler]() // 这个对象在下面bind方法中会使用到。
  protected val pageToHandlers = new HashMap[WebUIPage, ArrayBuffer[ServletContextHandler]] // 将page绑定到handlers上
  /** 将Http Server绑定到这个Web页面 */
  def bind() {
    assert(!serverInfo.isDefined, "Attempted to bind %s more than once!".format(className))
    try {
      serverInfo = Some(startJettyServer("0.0.0.0", port, handlers, conf, name))
      logInfo("Started %s at http://%s:%d".format(className, publicHostName, boundPort))
    } catch {
      case e: Exception =>
        logError("Failed to bind %s".format(className), e)
        System.exit(1)
    }
  }
```

上面代码中handlers对象维持了WebUIPage和Jetty之间的关系，org.eclipse.jetty.servlet.ServletContextHandler是标准jetty容器的handler。而对象pageToHandlers维持了WebUIPage到ServletContextHandler的对应关系。

各Tab页以及该页内容的实现，基本上大同小异。接下来以AllJobsPage页面为例仔细梳理页面展示的过程。

### SparkUI中Tab的绑定

从上面的类结构图中看到WebUIPage提供了两个重要的方法，render和renderJson用于相应页面请求，在WebUIPage的实现类中，具体实现了这两个方法。在SparkContext中构造出SparkUI的实例后，会执行SparkUI#initialize方法进行初始化。如下面代码中，调用SparkUI从WebUI继承的attacheTab方法，将各Tab页面绑定到UI上。

```
def initialize() {
    attachTab(new JobsTab(this))
    attachTab(stagesTab)
    attachTab(new StorageTab(this))
    attachTab(new EnvironmentTab(this))
    attachTab(new ExecutorsTab(this))
    attachHandler(createStaticHandler(SparkUI.STATIC_RESOURCE_DIR, "/static"))
    attachHandler(createRedirectHandler("/", "/jobs/", basePath = basePath))
    attachHandler(ApiRootResource.getServletHandler(this))
    // This should be POST only, but, the YARN AM proxy won't proxy POSTs
    attachHandler(createRedirectHandler(
      "/stages/stage/kill", "/stages/", stagesTab.handleKillRequest,
      httpMethods = Set("GET", "POST")))
  }
```

### 页面内容绑定到Tab

在上一节中，JobsTab标签绑定到SparkUI上之后，在JobsTab上绑定了AllJobsPage和JobPage类。AllJobsPage页面即访问SparkUI页面时列举出所有Job的那个页面，JobPage页面则是点击单个Job时跳转的页面。通过调用JobsTab从WebUITab继承的attachPage方法与JobsTab进行绑定。

```
private[ui] class JobsTab(parent: SparkUI) extends SparkUITab(parent, "jobs") {
  val sc = parent.sc
  val killEnabled = parent.killEnabled
  val jobProgresslistener = parent.jobProgressListener
  val executorListener = parent.executorsListener
  val operationGraphListener = parent.operationGraphListener
  def isFairScheduler: Boolean =
    jobProgresslistener.schedulingMode.exists(_ == SchedulingMode.FAIR)
  attachPage(new AllJobsPage(this))
  attachPage(new JobPage(this))
}
```

### 页面内容的展示

知道了AllJobsPage页面如何绑定到SparkUI界面后，接下来分析这个页面的内容是如何显示的。进入AllJobsPage类，主要观察render方法。在页面展示上Spark直接利用了Scala对html/xml的语法支持，将页面的Html代码嵌入Scala程序中。具体的页面生成过程可以查看下面源码中的注释。这里可以结合第二部分的实例进行查看。

```
def render(request: HttpServletRequest): Seq[Node] = {
    val listener = parent.jobProgresslistener //获取jobProgresslistener对象，页面展示的数据都是从这里读取
    listener.synchronized {
      val startTime = listener.startTime // 获取application的开始时间，默认值为-1L
      val endTime = listener.endTime // 获取application的结束时间，默认值为-1L
      val activeJobs = listener.activeJobs.values.toSeq // 获取当前application中处于active状态的job
      val completedJobs = listener.completedJobs.reverse.toSeq // 获取当前application中完成状态的job
      val failedJobs = listener.failedJobs.reverse.toSeq  // 获取当前application中失败状态的job
      val activeJobsTable =
        jobsTable(activeJobs.sortBy(_.submissionTime.getOrElse(-1L)).reverse)
      val completedJobsTable =
        jobsTable(completedJobs.sortBy(_.completionTime.getOrElse(-1L)).reverse)
      val failedJobsTable =
        jobsTable(failedJobs.sortBy(_.completionTime.getOrElse(-1L)).reverse)
      val shouldShowActiveJobs = activeJobs.nonEmpty
      val shouldShowCompletedJobs = completedJobs.nonEmpty
      val shouldShowFailedJobs = failedJobs.nonEmpty
      val completedJobNumStr = if (completedJobs.size == listener.numCompletedJobs) {
        s"${completedJobs.size}"
      } else {
        s"${listener.numCompletedJobs}, only showing ${completedJobs.size}"
      }
      val summary: NodeSeq =
        <div>
          <ul class="unstyled">
            <li>
              <strong>Total Uptime:</strong> // 显示当前Spark应用运行时间
              {// 如果还没有结束，就用系统当前时间减开始时间。如果已经结束，就用结束时间减开始时间
                if (endTime < 0 && parent.sc.isDefined) {
                  UIUtils.formatDuration(System.currentTimeMillis() - startTime)
                } else if (endTime > 0) {
                  UIUtils.formatDuration(endTime - startTime)
                }
              }
            </li>
            <li>
              <strong>Scheduling Mode: </strong> // 显示调度模式，FIFO或FAIR
              {listener.schedulingMode.map(_.toString).getOrElse("Unknown")}
            </li>
            {
              if (shouldShowActiveJobs) { // 如果有active状态的job，则显示Active Jobs有多少个
                <li>
                  <a href="#active"><strong>Active Jobs:</strong></a>
                  {activeJobs.size}
                </li>
              }
            }
            {
              if (shouldShowCompletedJobs) { // 如果有完成状态的job，则显示Completed Jobs的个数
                <li id="completed-summary">
                  <a href="#completed"><strong>Completed Jobs:</strong></a>
                  {completedJobNumStr}
                </li>
              }
            }
            {
              if (shouldShowFailedJobs) { // 如果有失败状态的job，则显示Failed Jobs的个数
                <li>
                  <a href="#failed"><strong>Failed Jobs:</strong></a>
                  {listener.numFailedJobs}
                </li>
              }
            }
          </ul>
        </div>
      var content = summary // 将上面的html代码写入content变量，在最后统一显示content中的内容
      val executorListener = parent.executorListener // 这里获取EventTimeline中的信息
      content ++= makeTimeline(activeJobs ++ completedJobs ++ failedJobs,
          executorListener.executorIdToData, startTime)
// 然后根据当前application中是否存在active， failed， completed状态的job，将这些信息显示在页面上。
      if (shouldShowActiveJobs) {
        content ++= <h4 id="active">Active Jobs ({activeJobs.size})</h4> ++
          activeJobsTable // 生成active状态job的展示表格，具体形式可参看第二部分。按提交时间倒序排列
      }
      if (shouldShowCompletedJobs) {
        content ++= <h4 id="completed">Completed Jobs ({completedJobNumStr})</h4> ++
          completedJobsTable
      }
      if (shouldShowFailedJobs) {
        content ++= <h4 id ="failed">Failed Jobs ({failedJobs.size})</h4> ++
          failedJobsTable
      }
      val helpText = """A job is triggered by an action, like count() or saveAsTextFile().""" +
        " Click on a job to see information about the stages of tasks inside it."
      UIUtils.headerSparkPage("Spark Jobs", content, parent, helpText = Some(helpText)) // 最后将content中的所有内容全部展示在页面上
    }
  }
```

接下来以activeJobsTable代码为例分析Jobs信息展示表格的生成。这里主要的方法是makeRow，接收的是上面代码中的activeJobs, completedJobs, failedJobs。这三个对象都是包含在JobProgressListener对象中的，在JobProgressListener中的定义如下：

```
// 这三个对象用于存储数据的主要是JobUIData类型，
  val activeJobs = new HashMap[JobId, JobUIData]
  val completedJobs = ListBuffer[JobUIData]()
  val failedJobs = ListBuffer[JobUIData]()
```

将上面三个对象传入到下面这段代码中，继续执行。

```
private def jobsTable(jobs: Seq[JobUIData]): Seq[Node] = {
    val someJobHasJobGroup = jobs.exists(_.jobGroup.isDefined)
    val columns: Seq[Node] = { // 显示的信息包括，Job Id(Job Group)以及Job描述，Job提交时间，Job运行时间，总的Stage/Task数，成功的Stage/Task数，以及一个进度条
      <th>{if (someJobHasJobGroup) "Job Id (Job Group)" else "Job Id"}</th>
      <th>Description</th>
      <th>Submitted</th>
      <th>Duration</th>
      <th class="sorttable_nosort">Stages: Succeeded/Total</th>
      <th class="sorttable_nosort">Tasks (for all stages): Succeeded/Total</th>
    }
    def makeRow(job: JobUIData): Seq[Node] = {
      val (lastStageName, lastStageDescription) = getLastStageNameAndDescription(job)
      val duration: Option[Long] = {
        job.submissionTime.map { start => // Job运行时长为系统时间，或者结束时间减去开始时间
          val end = job.completionTime.getOrElse(System.currentTimeMillis())
          end - start
        }
      }
      val formattedDuration = duration.map(d =>  // 格式化任务运行时间，显示为a h:b m:c s格式UIUtils.formatDuration(d)).getOrElse("Unknown")
      val formattedSubmissionTime = // 获取Job提交时间job.submissionTime.map(UIUtils.formatDate).getOrElse("Unknown")
      val jobDescription = UIUtils.makeDescription(lastStageDescription, parent.basePath) // 获取任务描述
      val detailUrl = // 点击单个Job下面链接跳转到JobPage页面，传入参数为jobId
        "%s/jobs/job?id=%s".format(UIUtils.prependBaseUri(parent.basePath), job.jobId)
      <tr id={"job-" + job.jobId}>
        <td sorttable_customkey={job.jobId.toString}>
          {job.jobId} {job.jobGroup.map(id => s"($id)").getOrElse("")}
        </td>
        <td>
          {jobDescription}
          <a href={detailUrl} class="name-link">{lastStageName}</a>
        </td>
        <td sorttable_customkey={job.submissionTime.getOrElse(-1).toString}>
          {formattedSubmissionTime}
        </td>
        <td sorttable_customkey={duration.getOrElse(-1).toString}>{formattedDuration}</td>
        <td class="stage-progress-cell">
          {job.completedStageIndices.size}/{job.stageIds.size - job.numSkippedStages}
          {if (job.numFailedStages > 0) s"(${job.numFailedStages} failed)"}
          {if (job.numSkippedStages > 0) s"(${job.numSkippedStages} skipped)"}
        </td>
        <td class="progress-cell"> // 进度条
          {UIUtils.makeProgressBar(started = job.numActiveTasks, completed = job.numCompletedTasks,
           failed = job.numFailedTasks, skipped = job.numSkippedTasks,
           total = job.numTasks - job.numSkippedTasks)}
        </td>
      </tr>
    }
    <table class="table table-bordered table-striped table-condensed sortable">
      <thead>{columns}</thead> // 显示列名
      <tbody>
        {jobs.map(makeRow)} // 调用上面的row生成方法，具体显示Job信息
      </tbody>
    </table>
  }
```

从上面这些代码中可以看到，Job页面显示的所有数据，都是从JobProgressListener对象中获得的。SparkUI可以理解成一个JobProgressListener对象的消费者，页面上显示的内容都是JobProgressListener内在的展现。 

## Spark UI界面实例

默认情况下，当一个Spark Application运行起来后，可以通过访问hostname:4040端口来访问UI界面。hostname是提交任务的Spark客户端ip地址，端口号由参数spark.ui.port(默认值4040，如果被占用则顺序往后探查)来确定。由于启动一个Application就会生成一个对应的UI界面，所以如果启动时默认的4040端口号被占用，则尝试4041端口，如果还是被占用则尝试4042，一直找到一个可用端口号为止。

下面启动一个Spark ThriftServer服务，并用beeline命令连接该服务，提交sql语句运行。则ThriftServer对应一个Application，每个sql语句对应一个Job，按照Job的逻辑划分Stage和Task。

### Jobs页面

![enter description here](/assets/blogImg/2019-02-22-3.png)


连接上该端口后，显示的就是上面的页面，也是Job的主页面。这里会显示所有Active，Completed, Cancled以及Failed状态的Job。默认情况下总共显示1000条Job信息，这个数值由参数spark.ui.retainedJobs(默认值1000)来确定。 

从上面还看到，除了Jobs选项卡之外，还可显示Stages, Storage, Enviroment, Executors, SQL以及JDBC/ODBC Server选项卡。分别如下图所示。

### Stages页面

![enter description here](/assets/blogImg/2019-02-22-4.png)

### Storage页面

![enter description here](/assets/blogImg/2019-02-22-5.png)

### Enviroment页面

![enter description here](/assets/blogImg/2019-02-22-6.png)

### Executors页面

![enter description here](/assets/blogImg/2019-02-22-7.png)
### 单个Job包含的Stages页面

![enter description here](/assets/blogImg/2019-02-22-8.png)

### Task页面

![enter description here](/assets/blogImg/2019-02-22-9.png)
