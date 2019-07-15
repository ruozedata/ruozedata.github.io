---
layout: post
title: "Azkaban3.X 全面解读"
date: 2019-04-18
comments: true
tags: 
    - Azkaban
categories: [Azkaban]

---

<!--more--> 

### 大数据场景中调度的作用：以ETL为例

大数据场景中，较为常见的一个ETL流程：<br>
RDBMS ===Sqoop===> Hadoop ==Sqoop==> RDBMS/NoSQL/…

完成上述场景需要经历3个过程：

1. 数据抽取 01:00 3h ==> 凌晨1点开始数据抽取，需要3个小时
2. 数据处理 04:00 4h ==> 凌晨4点开始数据处理，需要3个小时
3. 数据入库 08:00<br>
	一个完整的ETL过程，通常情况下是有多个作业一起协作来完成的，每个作业之间都是有相互间的依赖关系的<br>
	那么如何将这些依赖关系设置好呢？这就需要使用调度框架来执行。<br>
	假设现在不存在Azkakan/Oozie这样的调度框架，如何实现??? <br>
	通常情况下会使用：crontab + shell
	
<font size=3><b>优点</b></font>

- 简单易用；
- 把该写的东西写到shell脚本里，定时开始执行就行了；
- 1点跑数据抽取作业；
- 4点跑数据处理作业；
- 8点跑数据入库的作业

<font size=3><b>缺点</b></font>

- 如果我们任务多的话，crontab里面的配置会多到疯掉
- 不便维护
- 作业的监控不好做
- 无法通过WebUI的方式来进行配置，所有的东西都得通过shell的方式来进行配置
- HA如何进行保证<br>
　	在一台机器上配了crontab + shell，如果哪一天机器挂了，这种方式是无法保证HA的
- 存在DAG/Dependency这种关系<br>
	如果依赖关系很多的话，数据入库这步肯定是需要等到数据处理完成之后才能入库；<br>
	同理，数据处理也是需要等数据抽取完成之后才可以进行的；举个例子：
	
	场景一：<br>
	假设我们的数据处理作业是在凌晨4点开始跑的，恰巧那天碰到我们生产环境上集群的负载比较高，压力比较大。3个小时数据没有抽取完，这就意味着4点开始跑数据处理的作业等于是白跑了的，跑出来的结果根本是不对的。面对这种场景使用crontab + shell是很难解决的，除非进行重跑，但是一涉及到重跑，对于代码各方面就要进行大量的调整。
	
	场景二：<br>
	凌晨1点开始数据抽取，那天恰巧压力不大，2个小时抽取完了，还要等1个小时到凌晨四点再来数据处理，早跑完，造成资源浪费。

从上述的问题中引出：**调度框架在我们数据平台中的重要性**

### 大数据中常见的调度框架

- Linux中的crontab
- Quartz(Java中的)
- 开源的框架: <br>
	Azkaban/Oozie(结合HUE进行使用)/Zeus(阿里的，停止维护很久了，不建议使用)<br>
	大数据调度框架对比的网站：[http://www.thebigdata.cn/Hadoop/15755.html](http://www.thebigdata.cn/Hadoop/15755.html)<br>
	内部研发的调度框架(上规模的公司中，调度框架都是自己研发的)
	
### Azkaban概述

LinkedIn开源的<br>
官网：[https://azkaban.github.io/](https://azkaban.github.io/)<br>
官网的介绍：<br>
Azkaban is a batch workflow job scheduler created at LinkedIn to run Hadoop jobs.<br>
Azkaban resolves the ordering through job dependencies and provides an easy to use web user interface to maintain and track your workflows.

重点的一句话：<br>
`Azkaban resolves the ordering through job dependencies`

Azkaban解决了job依赖关系顺序的问题

<font size=3><b>特性</b></font>

1. Compatible with any version of Hadoop<br>
	能够和任意版本的Hadoop做兼容(在编译的时候，只需要指定Hadoop的版本就可以)
2. Easy to use web UI<br>
	非常易用的web ui	
3. Simple web and http workflow uploads<br>
	非常简单的web和http workflow的上传<br>
	只需要预先将workflow定义好以后，就可以通过浏览器把我们需要的job的配置文件传到Azkaban的web server上面去就ok了<br>
	Azkaban中的配置都是使用key-value的形式的
4. Project workspaces<br>
	工作空间的管理
	不同的项目可以归属于不同的空间，而且不同的空间又可以设置不同的权限
	多个项目之间是不会产生任何的影响与干扰
5. Scheduling of workflows<br>
	调度workflows(可以手工运行，也可以让它定时去处理)
6. Modular and pluginable<br>
	模块化和可插拔<br>
	举例：<br>
　		在实际生产上，spark的作业有很多，有ETL的作业、有流处理的作业<br>
　		它们都是以插件的方式进行定义的<br>
　		这样做的好处是：可以很好的与Azkaban做整合
7. Authentication and Authorization<br>
	认证和授权		
8. Tracking of user actions<br>
	能够跟踪用户的行为(比如：谁在什么时候提交了什么作业，这个作业什么时候开始的，作业运行完的时间是什么时候，作业的结果又是什么，作业的运行是成功还是失败)
9. Email alerts on failure and successes<br>
	支持Email的告警(你的作业成功还是失败)<br>
	官方目前支持Email(短信告警可以对接进来)
10. SLA alerting and auto killing<br>
	SLA的告警<br>
	假设凌晨1点开始数据抽取，计划是3小时抽取完，如果抽取耗时3小时1分钟，那么你的SLA就已经超了，这个地方也是需要告警的
11. Retrying of failed jobs<br>
	对于失败作业的重试机制<br>
	注意：少了HA

### Azkaban架构

文档地址：[http://azkaban.github.io/azkaban/docs/latest/](http://azkaban.github.io/azkaban/docs/latest/)

有3个重要的组件构成：

- Relational Database (MySQL)<br>
	关系型数据库，用于存储元数据(可以配成MySQL，默认是h2)
- AzkabanWebServer<br>
	既然提供了web ui，那么必然有WebServer
- AzkabanExecutorServer

如何解决该架构中的HA问题？如何入手？<br>
这3个组件都要做HA(AzkabanWebServer这个的HA，其实不是那么的重要)<br>
如果AzkabanWebServer挂掉之后，实质上是不影响我们的使用的，只是我们不能通过web界面去查看或者是监控而已<br>
**3.X的版本中AzkabanExecutorServer的HA已经是支持了**

### Relational Database (MySQL)

Azkaban使用MySQL存储state的信息；<br>
AzkabanWebServer和AzkabanExecutorServer 都是能够访问MySQL的

How does AzkabanWebServer use the DB? <br>
web server使用DB的原因如下：

1. Project Management(项目，项目的权限以及上传的文件)
2. Executing Flow State(跟踪执行流，执行程序运行它们)
3. Previous Flow/Jobs(搜索之前的作业和流程执行，以及访问他们的日志文件)
4. Scheduler(保持预定的工作状态)
5. SLA(保持所有sla规则)

How does the AzkabanExecutorServer use the DB? <br>
executor server使用DB的原因如下：

1. Access the project(从数据库中检索项目文件)
2. Executing Flows/Jobs(检索和更新 流和正在执行的数据)
3. Logs(将输出日志存储到作业中并流入到db中)
4. Interflow dependency(如果流在不同的执行器上运行，则它将从DB中获取状态)

### AzkabanWebServer

AzkabanWebServer是所有Azkaban的主要管理者。<br>
它处理项目管理、身份验证、调度器和执行监视。它还作为web用户界面。

### AzkabanExecutorServer

以前版本的Azkaban在同一个服务器上拥有AzkabanWebServer和AzkabanExecutorServer功能。<br>
此后，Executor有了自己的服务器(言下之意即AzkabanWebServer和AzkabanExecutorServer不在同一server上了，分开了)

### Azkaban的运行模式

在3.x版本里，提供了3种运行模式

- the stand alone “solo-server” mode standalone模式
- the heavier weight two server mode 两个server的模式
- distributed multiple-executor mode 分布式(多个executor的模式)
	- solo server mode<br>
		采用的DB是H2，而web server和executor server都在同一个进程中运行。
应用于小规模的用例。
	- two server mode <br>
		应用于生产环境，采用的DB是MySQL，master-slave模式。<br>
		web server和executor server在不同的进程中运行，因此升级和维护不会影响用户。
	- multiple executor mode <br>
		应用于生产环境(分布式)，采用的DB是MySQL，master-slave模式。<br>
		web server和executor server在不同的主机上运行，因此升级和维护不应该影响用户。<br>
		该模式为Azkaban带来了健壮和可伸缩的性能。