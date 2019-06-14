---
layout: post
title: "Spark监控报错javax.servlet.http.HttpServletRequest.isAsyncStarted"
date: 2019-02-16
comments: true
tags: [spark,高级]
categories: Spark Other
---
#### 环境
- Spark2.2.1
- Hadoop2.6
- Intellj
- Scala2.11

#### pom文件
<!--more--> 
```
 <dependency>
     <groupId>org.apache.spark</groupId>
     <artifactId>spark-core_2.11</artifactId>
     <version>2.0.0</version>
 </dependency>
 <dependency>
     <groupId>org.apache.hadoop</groupId>
     <artifactId>hadoop-common</artifactId>
     <version>${hadoop.common.version}</version>
 </dependency>
 <dependency>
     <groupId>org.apache.hadoop</groupId>
     <artifactId>hadoop-hdfs</artifactId>
     <version>${hadoop.hdfs.version}</version>
 </dependency>
 <dependency>
     <groupId>org.apache.hadoop</groupId>
     <artifactId>hadoop-client</artifactId>
     <version>${hadoop.client.version}</version>
 </dependency>
```
#### 报错信息如下所示：

```
java.lang.NoSuchMethodError: javax.servlet.http.HttpServletRequest.isAsyncStarted()Z
at org.spark_project.jetty.servlets.gzip.GzipHandler.handle(GzipHandler.java:484)
at org.spark_project.jetty.server.handler.ContextHandlerCollection.handle(ContextHandlerCollection.java:215)
at org.spark_project.jetty.server.handler.HandlerWrapper.handle(HandlerWrapper.java:97)
at org.spark_project.jetty.server.Server.handle(Server.java:499)
at org.spark_project.jetty.server.HttpChannel.handle(HttpChannel.java:311)
at org.spark_project.jetty.server.HttpConnection.onFillable(HttpConnection.java:257)
at org.spark_project.jetty.io.AbstractConnection$2.run(AbstractConnection.java:544)
at org.spark_project.jetty.util.thread.QueuedThreadPool.runJob(QueuedThreadPool.java:635)
at org.spark_project.jetty.util.thread.QueuedThreadPool$3.run(QueuedThreadPool.java:555)
at java.lang.Thread.run(Thread.java:745)
16/11/08 21:37:43 WARN HttpChannel: Could not send response error 500: java.lang.NoSuchMethodError: javax.servlet.http.HttpServletRequest.isAsyncStarted()Z
16/11/08 21:37:43 WARN HttpChannel: /jobs/
java.lang.NoSuchMethodError: javax.servlet.http.HttpServletRequest.isAsyncStarted()Z
at org.spark_project.jetty.servlets.gzip.GzipHandler.handle(GzipHandler.java:484)
at org.spark_project.jetty.server.handler.ContextHandlerCollection.handle(ContextHandlerCollection.java:215)
at org.spark_project.jetty.server.handler.HandlerWrapper.handle(HandlerWrapper.java:97)
at org.spark_project.jetty.server.Server.handle(Server.java:499)
at org.spark_project.jetty.server.HttpChannel.handle(HttpChannel.java:311)
at org.spark_project.jetty.server.HttpConnection.onFillable(HttpConnection.java:257)
at org.spark_project.jetty.io.AbstractConnection$2.run(AbstractConnection.java:544)
at org.spark_project.jetty.util.thread.QueuedThreadPool.runJob(QueuedThreadPool.java:635)
at org.spark_project.jetty.util.thread.QueuedThreadPool$3.run(QueuedThreadPool.java:555)
at java.lang.Thread.run(Thread.java:745)
16/11/08 21:37:43 WARN QueuedThreadPool: 
java.lang.NoSuchMethodError: javax.servlet.http.HttpServletResponse.getStatus()I
at org.spark_project.jetty.server.handler.ErrorHandler.handle(ErrorHandler.java:112)
at org.spark_project.jetty.server.Response.sendError(Response.java:597)
at org.spark_project.jetty.server.HttpChannel.handleException(HttpChannel.java:487)
at org.spark_project.jetty.server.HttpConnection$HttpChannelOverHttp.handleException(HttpConnection.java:594)
at org.spark_project.jetty.server.HttpChannel.handle(HttpChannel.java:387)
at org.spark_project.jetty.server.HttpConnection.onFillable(HttpConnection.java:257)
at org.spark_project.jetty.io.AbstractConnection$2.run(AbstractConnection.java:544)
at org.spark_project.jetty.util.thread.QueuedThreadPool.runJob(QueuedThreadPool.java:635)
at org.spark_project.jetty.util.thread.QueuedThreadPool$3.run(QueuedThreadPool.java:555)
at java.lang.Thread.run(Thread.java:745)
16/11/08 21:37:43 WARN QueuedThreadPool: Unexpected thread death: org.spark_project.jetty.util.thread.QueuedThreadPool$3@3ec5063f in SparkUI{STARTED,8<=8<=200,i=4,q=0}
```

#### 问题解决
##### 查看报错信息

```
java.lang.NoSuchMethodError: javax.servlet.http.HttpServletRequest.isAsyncStarted()Z
```

未找到HttpServletRequest类中的isAsyncStarted方法。

##### 问题定位

使用搜索功能，查看该类存在于哪些包下。

![Spark监控报错](/source/assets/blogImg/2019-02-16-Spark监控报错.png)

##### 问题解决

![Spark监控问题解决1](/source/assets/blogImg/2019-02-16-Spark监控问题解决1.png)

![Spark监控问题解决2](/source/assets/blogImg/2019-02-16-Spark监控问题解决2.png)

所有涉及到该类jar文件且版本低于3.0的均需要进行删除。