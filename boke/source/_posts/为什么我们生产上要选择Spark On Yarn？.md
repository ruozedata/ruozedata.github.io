---
layout: post
title: "为什么我们生产上要选择Spark On Yarn模式？"
date: 2018-04-13
comments: true
tags: 
	- spark
	- 高级
	- 架构
categories:  Spark Other
---
若泽大数据，为什么我们生产上要选择Spark On Yarn？
<!--more--> 
开发上我们选择local[2]模式
生产上跑任务Job，我们选择Spark On Yarn模式 ，

将Spark Application部署到yarn中，有如下优点：

1.部署Application和服务更加方便
- 只需要yarn服务，包括Spark，Storm在内的多种应用程序不要要自带服务，它们经由客户端提交后，由yarn提供的分布式缓存机制分发到各个计算节点上。

2.资源隔离机制
- yarn只负责资源的管理和调度，完全由用户和自己决定在yarn集群上运行哪种服务和Applicatioin，所以在yarn上有可能同时运行多个同类的服务和Application。Yarn利用Cgroups实现资源的隔离，用户在开发新的服务或者Application时，不用担心资源隔离方面的问题。

3.资源弹性管理
- Yarn可以通过队列的方式，管理同时运行在yarn集群种的多个服务，可根据不同类型的应用程序压力情况，调整对应的资源使用量，实现资源弹性管理。


Spark On Yarn有两种模式，一种是cluster模式，一种是client模式。

**运行client模式：**

- “./spark-shell --master yarn”

- "./spark-shell --master yarn-client"

- "./spark-shell --master yarn --deploy-mode client"

**运行的是cluster模式**

- "./spark-shell --master yarn-cluster"

- "./spark-shell --master yarn --deploy-mode cluster"



**client和cluster模式的主要区别：
a. client的driver是运行在客户端进程中
b. cluster的driver是运行在Application Master之中**