---
layout: post
title: "Spark 基本概念"
date: 2018-05-21
comments: true
tags: [spark,高级]
categories:  Spark Other
---



<font color=#FF4500 >
</font>


**基于 Spark 构建的用户程序，包含了 一个driver 程序和集群上的 executors；（起了一个作业，就是一个Application）**
<!--more--> 
##### spark名词解释
- Application jar：应用程序jar包
包含了用户的 Spark 程序的一个 jar 包. 在某些情况下用户可能想要创建一个囊括了应用及其依赖的 “胖” jar 包. 但实际上, 用户的 jar 不应该包括 Hadoop 或是 Spark 的库, 这些库会在运行时被进行加载；

- Driver Program：
这个进程运行应用程序的 main 方法并且新建 SparkContext ；

- Cluster Manager：集群管理者
在集群上获取资源的外部服务 (例如:standalone,Mesos,Yarn)；（--master）

- Deploy mode：部署模式
告诉你在哪里启动driver program. 在 “cluster” 模式下, 框架在集群内部运行 driver. 在 “client” 模式下, 提交者在集群外部运行 driver.；

- Worker Node：工作节点
集群中任何可以运行应用代码的节点；（yarn上就是node manager）

- Executor：
在一个工作节点上为某应用启动的一个进程，该进程负责运行任务，并且负责将数据存在内存或者磁盘上。每个应用都有各自独立的 executors；

- Task：任务
被送到某个 executor 上执行的工作单元；

- Job：
包含很多并行计算的task。一个 action 就会产生一个job；

- Stage：
一个 Job 会被拆分成多个task的集合，每个task集合被称为 stage，stage之间是相互依赖的(就像 Mapreduce 分 map和 reduce stages一样)，可以在Driver 的日志上看到。

##### spark工作流程
1个action会触发1个job，1个job包含n个stage，每个stage包含n个task，n个task会送到n个executor上执行，一个Application是由一个driver 程序和n个 executor组成。提交的时候，通过Cluster Manager和Deploy mode控制。


spark应用程序在集群上运行一组独立的进程，通过SparkContext协调的在main方法里面。
如果运行在一个集群之上，SparkContext能够连接各种的集群管理者，去获取到作业所需要的资源。一旦连接成功，spark在集群节点之上运行executor进程，来给你的应用程序运行计算和存储数据。它会发送你的应用程序代码到executors上。最后，SparkContext发送tasks到executors上去运行
- 1、每个Application都有自己独立的executor进程，这些进程在运行周期内都是常驻的以多线程的方式运行tasks。好处是每个进程无论是在调度还是执行都是相互独立的。所以，这就意味着数据不能跨应用程序进行共享，除非写到外部存储系统（Alluxio）。
- 2、spark并不关心底层的集群管理。
- 3、driver 程序会监听并且接收外面的一些executor请求，在整个生命周期里面。所以，driver 程序应该能被Worker Node通过网络访问。
- 4、因为driver 在集群上调度Tasks，driver 就应该靠近Worker Node。
