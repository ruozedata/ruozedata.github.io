---
layout: post
title: "神器Apache Livy之初识篇"
date: 2019-08-16
comments: true
tags: 
    - Livy
    
categories: [其他组件]

---

<!--more--> 


### 背景介绍

对于Spark有这样一个应用场景：Spark应用程序都是通过spark-submit进行提交的；而在工作当中，肯定是要将我们的spark-submit封装到shell里面去的，比如：今天凌晨去处理昨天的数据，肯定是需要获取到date，然后做 date - 1 操作(当前天数减1就是昨天了)，之后配置crontab，把shell脚本配置上去，每天凌晨定时执行就行了，或者采用azkaban、oozie，都是这么做的、这么进行调度的

那么，现在有一个问题：spark-submit提交的时候，把相关的参数给指定上去就行，每次提交Spark作业的时候，都需要去申请资源(不管哪种模式，都是需要去申请资源)。特别是on Yarn的时候，申请资源是需要耗费一些时间的：如果是天级别的话，这样提交是没有问题的，我们每提交1次，就去申请资源，申请到资源之后再开始运行；但如果粒度更细一些，例如：1小时级别的，这样操作必然是有些问题存在的、会存在一些风险。比如说：我前面一个作业没有跑完，但后面的作业提交上来了，这样是很可能拿不到资源的，拿不到资源，那么在跑的时候就很可能导致作业的延迟，这样就会影响到SLA的要求；这就是目前对于大多数离线架构来说所存在的一个弊端

针对这个问题，如何解决呢？

社区上有一个框架Apache Livy。

官网：[http://livy.incubator.apache.org/](http://livy.incubator.apache.org/)

该项目还在孵化阶段，还没有毕业
Livy专门为Spark所提供的REST服务

### Livy简介

- **Submit Jobs from Anywhere**

	Livy能够以编程的、容错的、多租户的方式提交Spark，从web/mobile app处进行提交。也就是说一个服务跑起来之后，在页面上点一下就可以提交作业了，不需要Spark客户端了，也就意味着不需要再去客户端部署Spark了。比如在mobile端(手机端)去部署安装spark，也不需要使用 spark-submit 这种方式了，因此多个用户能够在Spark集群中以并发、可靠的方式进行交互。

	这种方式，才是当今Spark使用的主流方式，可惜的是还是一个孵化版本，孵化版本在生产中使用还是需要慎重。
	
- **Use Interactive Scala or Python**

	能够交互的使用Scala和Python
	
	怎么理解呢？
	
	原来在Spark里面，我们可以使用spark-shell和pyspark来写scala代码片段和python的代码片段；相当于启动spark-shell或者pyspark之后，我们能在控制台里写代码。这就是我们所说的交互式：用户把代码片段(可以是scala、python)写进去，提交之后 后台去运行。livy也可以使用scala或是python，所以客户端可以使用这些语言远程地与spark集群进行通信。另外，批处理作业的提交也能使用scala、java、python去完成。既然是个REST Service，那么后台必然是有个服务的。
	
- **What is Apache Livy?**

	Livy是个service，能更加容易地去和Spark集群进行交互。通过REST接口进行交互，只需要将REST接口给暴露出来，这边通过REST API直接干过去就OK了，这样，就能使得我们非常容易的去提交Spark Job或者Spark代码片段，我们可以使用Spark代码片段来搞定。这一点在工作当中是非常非常重要的一个点，试想一个问题：如果非常简单的一个功能都需要写一堆代码，然后打个包再使用spark-submit的方式提交上去去运行，那么肯定是很麻烦的，在工作中肯定是不建议这么做的。
	
	我们所做的数据平台必然是要提供一个功能，是需要能够支持代码片段的。一般来说，写Spark程序需要：
	
	- 写代码的时候要写个main方法
	- 第一步需要创建SparkConf、SparkContext、SQLContext
	- 然后再来写业务逻辑

**代码片段**： 即公用的东西我们不用去写了，我们只需要将核心的代码给写到里面，然后提交上去跑就是了，这种方式才是主流的方式。

对于结果的获取支持同步或是异步的方式。

对于一个大数据作业来说，提交一个作业上去，可能会遇到运行的时间很长的情况，我们需要等嘛？

如果等的话，就等死了，因此对于结果的获取，支持同步或是异步的方式。

同时也有对SparkContext的管理

言下之意就是多个用户共享一个SparkContext，就不需要申请资源了，只要申请一次之后，大家就都能用了，之后通过一个REST接口或是RPC client library直接发过去就行了

Livy能够简化Spark和application servers之间的交互，使得Spark与web/mobile application之间的交互更加容易

有如下特点：

- 运行Spark Context作为一个长服务
	
	多个Spark jobs、多个client共用，达成Spark Context共享的目的

- 能够共享cache的RDD或者DataFrams在多个job之间、在多个client之间

- 多个Spark Context能够被管理
	
	多个Spark Context在集群上 能够使用Livy Server来替代它，这拥有非常好的容错、并发

- Jobs能够被提交通过以下方式：
	
	预编译的jar包、代码片段 或 java/scala的客户端API

- 能做到安全性的验证，能够做到授权和验证
	
	即：在作业运行的时候能有非常好的安全保障作用

**关于安全性：**

如果使用spark-submit在提交的时候，我们的code中有以下一段代码：

```
FileSystem.delete("/")
```

这段删除的代码写法不一定对，大致意思就是调用了FileSystem中的delete方法这样操作的后果是：咣当一下，整个集群就全挂了。不要以为这种代码不会写出来，在某些场景下，比如：移动数据的时候，是非常容易写错的。只要团队内的一个人写错了一层目录，就有可能误删除数据。
对此，有人会提出一个方案就是禁止delete，但是在我们的code中还可能有这种情况：

写了一段sql里有`overwrite`或`df.write.format().mode("overwrite").save()`

overwrite也是会出现上述的这种情况的，如果我们的目录写错层级的话对于这种情况，我们的overwrite是不可能禁止的，因为有些时候是需要用到的

因此security务必是要在整个数据平台中做的很好的，而且在数据平台中肯定是要考虑的，十分重要。但是livy的权限是做的比较初级的，很多时候是控制不了的。

数据平台中安全性的要求

需要做到，什么人去访问什么表、甚至做到什么人能访问到哪些列：即对于一个表中不同的列，不同的人拥有不同的权限

权限如何设置？

肯定是要自己开发，HDP中有ranger，但是功能不是很完善，还是需要自己去开发