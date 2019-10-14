---
layout: post
title: "Livy部署及提交Spark作业案例"
date: 2019-09-06
comments: true
tags: 
    - Livy

categories: [其他组件]

---

<!--more--> 


## Livy安装部署

官网:[http://livy.incubator.apache.org/get-started/](http://livy.incubator.apache.org/get-started/)

### Download

```
[hadoop@hadoop001 software]$ wget http://mirrors.hust.edu.cn/apache/incubator/livy/0.5.0-incubating/livy-0.5.0-incubating-bin.zip
[hadoop@hadoop001 software]$ unzip livy-0.5.0-incubating-bin.zip
[hadoop@hadoop001 software]$ mv livy-0.5.0-incubating-bin/ ../app/
[hadoop@hadoop001 software]$ cd ../app/livy-0.5.0-incubating-bin/
[hadoop@hadoop001 livy-0.5.0-incubating-bin]$ cd conf/
[hadoop@hadoop001 conf]$ cp livy-env.sh.template livy-env.sh
[hadoop@hadoop001 conf]$ vi livy-env.sh
JAVA_HOME=/opt/app/jdk1.8.0_45
HADOOP_CONF_DIR=/opt/app/hadoop-2.6.0-cdh5.7.0/conf
SPARK_HOME=/opt/app/spark-2.2.0-bin-2.6.0-cdh5.7.0
```

### 修改日志，使其信息能打印在控制台上

```
[hadoop@hadoop001 conf]$vim log4j.properties
log4j.rootCategory=INFO, console
log4j.appender.console=org.apache.log4j.ConsoleAppender
log4j.appender.console.target=System.err
log4j.appender.console.layout=org.apache.log4j.PatternLayout
log4j.appender.console.layout.ConversionPattern=%d{yy/MM/dd HH:mm:ss} %p %c{1}: %m%n
log4j.logger.org.eclipse.jetty=WARN
```

### 启动Livy

```
[hadoop@hadoop001 livy-0.5.0-incubating-bin]$ ./bin/livy-server
```

会报错，信息如下

```
Exception in thread "main" java.io.IOException: Cannot write log directory /opt/app/livy-0.5.0-incubating-bin/logs
                at org.eclipse.jetty.util.RolloverFileOutputStream.setFile(RolloverFileOutputStream.java:219)
                at org.eclipse.jetty.util.RolloverFileOutputStream.<init>(RolloverFileOutputStream.java:166)
                at org.eclipse.jetty.server.NCSARequestLog.doStart(NCSARequestLog.java:228)
                at org.eclipse.jetty.util.component.AbstractLifeCycle.start(AbstractLifeCycle.java:68)
                at org.eclipse.jetty.util.component.ContainerLifeCycle.start(ContainerLifeCycle.java:132)
                at org.eclipse.jetty.util.component.ContainerLifeCycle.doStart(ContainerLifeCycle.java:114)
                at org.eclipse.jetty.server.handler.AbstractHandler.doStart(AbstractHandler.java:61)
                at org.eclipse.jetty.server.handler.RequestLogHandler.doStart(RequestLogHandler.java:140)
                at org.eclipse.jetty.util.component.AbstractLifeCycle.start(AbstractLifeCycle.java:68)
                at org.eclipse.jetty.util.component.ContainerLifeCycle.start(ContainerLifeCycle.java:132)
                at org.eclipse.jetty.util.component.ContainerLifeCycle.doStart(ContainerLifeCycle.java:114)
                at org.eclipse.jetty.server.handler.AbstractHandler.doStart(AbstractHandler.java:61)
                at org.eclipse.jetty.util.component.AbstractLifeCycle.start(AbstractLifeCycle.java:68)
                at org.eclipse.jetty.util.component.ContainerLifeCycle.start(ContainerLifeCycle.java:132)
                at org.eclipse.jetty.server.Server.start(Server.java:387)
                at org.eclipse.jetty.util.component.ContainerLifeCycle.doStart(ContainerLifeCycle.java:114)
                at org.eclipse.jetty.server.handler.AbstractHandler.doStart(AbstractHandler.java:61)
                at org.eclipse.jetty.server.Server.doStart(Server.java:354)
                at org.eclipse.jetty.util.component.AbstractLifeCycle.start(AbstractLifeCycle.java:68)
                at org.apache.livy.server.WebServer.start(WebServer.scala:92)
                at org.apache.livy.server.LivyServer.start(LivyServer.scala:259)
                at org.apache.livy.server.LivyServer$.main(LivyServer.scala:339)
                at org.apache.livy.server.LivyServer.main(LivyServer.scala)
```

### 解决办法

权限问题，需要手动创建logs目录

```
[hadoop@hadoop001 livy-0.5.0-incubating-bin]$ mkdir logs
```

### 启动成功后进行Web访问：

```
19/08/29 22:26:20 INFO LineBufferedStream: stdout: Welcome to
19/08/29 22:26:20 INFO LineBufferedStream: stdout:       ____              __
19/08/29 22:26:20 INFO LineBufferedStream: stdout:      / __/__  ___ _____/ /__
19/08/29 22:26:20 INFO LineBufferedStream: stdout:     _\ \/ _ \/ _ `/ __/  '_/
19/08/29 22:26:20 INFO LineBufferedStream: stdout:    /___/ .__/\_,_/_/ /_/\_\   version 2.4.2
19/08/29 22:26:20 INFO LineBufferedStream: stdout:       /_/
19/08/29 22:26:20 INFO LineBufferedStream: stdout:
19/08/29 22:26:20 INFO LineBufferedStream: stdout: Using Scala version 2.11.12, Java HotSpot(TM) 64-Bit Server VM, 1.8.0_201
19/08/29 22:26:20 INFO LineBufferedStream: stdout: Branch
19/08/29 22:26:20 INFO LineBufferedStream: stdout: Compiled by user hadoop on 2019-05-01T03:17:40Z
19/08/29 22:26:20 INFO LineBufferedStream: stdout: Revision
19/08/29 22:26:20 INFO LineBufferedStream: stdout: Url
19/08/29 22:26:20 INFO LineBufferedStream: stdout: Type --help for more information.
19/08/29 22:26:20 WARN LivySparkUtils$: Current Spark (2,4) is not verified in Livy, please use it carefully
19/08/29 22:26:20 WARN NativeCodeLoader: Unable to load native-hadoop library for your platform... using builtin-java classes where applicable
19/08/29 22:26:21 INFO StateStore$: Using BlackholeStateStore for recovery.
19/08/29 22:26:21 INFO BatchSessionManager: Recovered 0 batch sessions. Next session id: 0
19/08/29 22:26:21 INFO InteractiveSessionManager: Recovered 0 interactive sessions. Next session id: 0
19/08/29 22:26:21 INFO InteractiveSessionManager: Heartbeat watchdog thread started.
19/08/29 22:26:21 INFO WebServer: Starting server on http://hadoop000:8998
---------------------------------------------------------------------------------------------
#换成自己的IP地址
http://hadoop000:8998
```

### Livy配置文件解读

- livy.conf：配置了一些server的信息
- spark-blacklist.conf

        会列出来一些spark配置中的一些东西，这些东西用户是不允许被修改掉的
        给用户的一些东西，有些是不能改的，比如：内存大小的设置、executor的设置
        这些给用户改，是不放心的；因此有些东西必然是不能够暴露的

- log4j.properties：日志信息

livy.conf的配置如下：

```
[hadoop@hadoop001 conf]$ cp livy.conf.template livy.conf
[hadoop@hadoop001 conf]$ vi livy.conf
livy.server.host = 0.0.0.0
livy.server.port = 8998
livy.spark.master = local[2]
```

## 架构篇

![架构](/assets/pic/2019-09-06-1.png)

1、有个客户端client，中间有个livy server，后面有spark interactive session和spark batch session（在这2个里面的底层都是有一个SparkContext的）

2、client发请求过来(http或rest)到livy server，然后会去spark interactive session和spark batch session分别去创建2个session；与spark集群交互打交道，去创建session的方式有2种：http或rpc，现在用的比较多的方式是：rpc

3、livy server就是一个rest的服务，收到客户端的请求之后，与spark集群进行连接；客户端只需要把请求发到server上就可以了这样的话，就分为了3层：

- 最左边：其实就是一个客户单，只需要向livy server发送请求
- 到livy server之后就会去spark集群创建我们的session
- session创建好之后，客户端就可以把作业以代码片段的方式提交上来就OK了，其实就是以请求的方式发到server上就行

这样能带来一个优点，对于原来提交作业机器的压力可以减少很多，我们只要保障Livy Server的HA就OK了
对于这个是可以保证的

此架构与spark-submit的对比：使用spark-submit(yarn-client模式)必须在客户端进行提交，如果客户端那台机器挂掉了(driver跑在客户端上，因此driver也就挂了)，那么作业全部都完成不了，这就存在一个单点问题

### 架构概况：

```
1、客户端发一个请求到livy server
2、Livy Server发一个请求到Spark集群，去创建session
3、session创建完之后，会返回一个请求到Livy Server，这样Livy Server就知道session创建过程中的一个状态
4、客户端的操作，如：如果客户端再发一个请求过来看一下，比如说看session信息啥的(可以通过GET API搞定)
```

### 多用户的特性：

上述是一个用户的操作，如果第二个、第三个用户来，可以这样操作：

- 提交过去的时候，可以共享一个session
- 其实一个session就是一个SparkContext

比如：蓝色的client共享一个session，黑色的client共享一个session，可以通过一定的标识，它们自己能够识别出来

## 提交Spark作业案例

### 创建交互式的session

使用交互式会话的前提是需要先创建会话。当前的Livy可在同一会话中支持spark，pyspark或是sparkr三种不同的解释器类型以满足不同语言的需求。

```
[hadoop@hadoop000 livy-0.5.0-incubating-bin]$ curl -X POST --data '{"kind":"spark"}' -H "Content-Type:application/json" hadoop000:8998/sessions
------------------下面是创建Session返回的信息--------------------
{
    "id": 1,
    "appId": null,
    "owner": null,
    "proxyUser": null,
    "state": "starting",
    "kind": "spark",
    "appInfo": {
        "driverLogUrl": null,
        "sparkUiUrl": null
    },
    "log": ["stdout: ", "\nstderr: "]
}
```
其中需要我们关注的是会话id，id代表了此会话，所有基于该会话的操作都需要指明其id

![2](/assets/pic/2019-09-06-2.png)

### 提交一个Spark的代码片段

`sc.parallelize(1 to 10).count()`

Livy的REST提交方式

```
curl hadoop000:8998/sessions/1/statements -X POST -H 'Content-Type: application/json' -d '{"code":"sc.parallelize(1 to 2).count()", "kind": "spark"}'
---------返回信息如下--------
{
    "id": 1,
    "code": "sc.parallelize(1 to 10).count()",
    "state": "waiting",
    "output": null,
    "progress": 0.0
}
```

注意此代码片段提交到session_id为1的session里面去了，所以Web点击1

![3](/assets/pic/2019-09-06-3.png)

### 以批处理会话(Batch Session)提交打包的JAR

```
package com.soul.bigdata.spark.core01
import org.apache.spark.{SparkConf, SparkContext}
object SparkWCApp {
  def main(args: Array[String]): Unit = {
    val conf = new SparkConf()
    .setAppName("SparkWCApp").setMaster("local[2]")
    val sc = new SparkContext(conf)
    val lineRDD = sc.parallelize(Seq("hadoop","hadoop","Spark","Flink"))
    val rsRDD = lineRDD.flatMap(x => x.split("\t")).map(x => (x, 1)).reduceByKey(_ + _)
    rsRDD.collect().foreach(println)
    sc.stop()
  }
}
```

以上代码打包上传至

```
[hadoop@hadoop000 lib]$ pwd
/home/hadoop/soul/lib
[hadoop@hadoop000 lib]$ ll
total 228
-rw-r--r-- 1 hadoop hadoop 231035 Aug 29 23:09 spark-train-1.0.jar
```

使用Livy提交

curl  -H "Content-Type: application/json" -X POST -d '{ "file":"/home/hadoop/soul/libspark-train-1.0.jar", "className":"com.soul.bigdata.spark.core01.SparkWCApp" }'  hadoop000:8998/batches
查看Livy的Web界面报错

![4](/assets/pic/2019-09-06-4.png)

```
19/08/29 23:19:01 WARN util.NativeCodeLoader: Unable to load native-hadoop library for your platform... using builtin-java classes where applicable
Exception in thread "main" java.io.FileNotFoundException: File hdfs://hadoop000:8020/home/hadoop/soul/lib/spark-train-1.0.jar does not exist.
    at org.apache.hadoop.hdfs.DistributedFileSystem.listStatusInternal(DistributedFileSystem.java:705)
    at org.apache.hadoop.hdfs.DistributedFileSystem.access$600(DistributedFileSystem.java:106)
    at org.apache.hadoop.hdfs.DistributedFileSystem$15.doCall(DistributedFileSystem.java:763)
    at org.apache.hadoop.hdfs.DistributedFileSystem$15.doCall(DistributedFileSystem.java:759)
    at org.apache.hadoop.fs.FileSystemLinkResolver.resolve(FileSystemLinkResolver.java:81)
    at org.apache.hadoop.hdfs.DistributedFileSystem.listStatus(DistributedFileSystem.java:759)
    at org.apache.spark.util.Utils$.fetchHcfsFile(Utils.scala:755)
    at org.apache.spark.util.Utils$.doFetchFile(Utils.scala:723)
    at org.apache.spark.deploy.DependencyUtils$.downloadFile(DependencyUtils.scala:137)
    at org.apache.spark.deploy.SparkSubmit$$anonfun$prepareSubmitEnvironment$7.apply(SparkSubmit.scala:367)
    at org.apache.spark.deploy.SparkSubmit$$anonfun$prepareSubmitEnvironment$7.apply(SparkSubmit.scala:367)
    at scala.Option.map(Option.scala:146)
    at org.apache.spark.deploy.SparkSubmit.prepareSubmitEnvironment(SparkSubmit.scala:366)
    at org.apache.spark.deploy.SparkSubmit.submit(SparkSubmit.scala:143)
    at org.apache.spark.deploy.SparkSubmit.doSubmit(SparkSubmit.scala:86)
    at org.apache.spark.deploy.SparkSubmit$$anon$2.doSubmit(SparkSubmit.scala:924)
    at org.apache.spark.deploy.SparkSubmit$.main(SparkSubmit.scala:933)
    at org.apache.spark.deploy.SparkSubmit.main(SparkSubmit.scala)
```

所以File后面跟的Path需要是HDFS路径，而不是本地路径，将打包的JAR上传至HDFS

```
[hadoop@hadoop000 lib]$ hadoop fs -ls /lib
Found 1 items
-rw-r--r--   1 hadoop supergroup     231035 2019-08-29 23:20 /lib/spark-train-1.0.jar
```

再次提交

```
curl -H "Content-Type: application/json" -X POST -d '{ "file":"/lib/spark-train-1.0.jar", "className":"com.soul.bigdata.spark.core01.SparkWCApp" }' hadoop000:8998/batches
```

查看Web成功返回了我们需要的结果

![5](/assets/pic/2019-09-06-5.png)

![6](/assets/pic/2019-09-06-6.png)
