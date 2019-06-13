---
layout: post
title: "19生产预警平台项目之sparkdemo.jar运行在yarn上过程"
date: 2018-09-28
comments: true
tags: 
	- spark
	- 高级
	- 生产预警平台项目
categories: 生产预警平台项目
---

<!--more--> 
#### 1.将之前打包的jar包上传

[root@sht-sgmhadoopnn-01 spark]# pwd
 /root/learnproject/app/spark
[root@sht-sgmhadoopnn-01 spark]# rz
 rz waiting to receive.
 Starting zmodem transfer.  Press Ctrl+C to cancel.
 Transferring sparkdemo.jar...
   100%  164113 KB     421 KB/sec    00:06:29       0 Errors
##### 2.以下是错误

###### 2.1
```
ERROR1: Exception in thread "main" 
java.lang.SecurityException: Invalid signature file digest for Manifest main attributes
```
IDEA打包的jar包,需要使用zip删除指定文件
```
 zip -d sparkdemo.jar META-INF/*.RSA META-INF/*.DSA META-INF/*.SF
 ```
###### 2.2
```
ERROR2: Exception in thread "main" java.lang.UnsupportedClassVersionError: com/learn/java/main/OnLineLogAnalysis2 : Unsupported major.minor version 52.0
```
yarn环境的jdk版本低于编译jar包的jdk版本(需要一致或者高于;每个节点需要安装jdk,同时修改每个节点的hadoop-env.sh文件的JAVA_HOME参数指向)

###### 2.3
```
ERROR3: java.lang.NoSuchMethodError: com.google.common.base.Stopwatch.createStarted()Lcom/google/common/base/Stopwatch;
 17/02/15 17:30:35 ERROR yarn.ApplicationMaster: User class threw exception: java.lang.NoSuchMethodError: com.google.common.base.Stopwatch.createStarted()Lcom/google/common/base/Stopwatch;
 java.lang.NoSuchMethodError: com.google.common.base.Stopwatch.createStarted()Lcom/google/common/base/Stopwatch;
  at org.influxdb.impl.InfluxDBImpl.ping(InfluxDBImpl.java:178)
  at org.influxdb.impl.InfluxDBImpl.version(InfluxDBImpl.java:201)
  at com.learn.java.main.OnLineLogAnalysis2.main(OnLineLogAnalysis2.java:69)
  at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
  at sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)
  at sun.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
  at java.lang.reflect.Method.invoke(Method.java:498)
  at org.apache.spark.deploy.yarn.ApplicationMaster$$anon$2.run(ApplicationMaster.scala:627)
  ```
抛错信息为NoSuchMethodError，表示 guava可能有多版本，则低版本
```
[root@sht-sgmhadoopnn-01 app]# pwd
 /root/learnproject/app
 [root@sht-sgmhadoopnn-01 app]# ll
 total 470876
 -rw-r--r--  1 root root   7509833 Jan 16 22:11 AdminLTE.zip
 drwxr-xr-x 12 root root      4096 Feb 14 11:21 hadoop
 -rw-r--r--  1 root root 197782815 Dec 24 21:16 hadoop-2.7.3.tar.gz
 drwxr-xr-x  7 root root      4096 Feb  7 11:16 kafka-manager-1.3.2.1
 -rw-r--r--  1 root root  59682993 Dec 26 14:44 kafka-manager-1.3.2.1.zip
 drwxr-xr-x  2 root root      4096 Jan  7 16:21 kafkaoffsetmonitor
 drwxr-xr-x  2  777 root      4096 Feb 14 14:48 pid
 drwxrwxr-x  4 1000 1000      4096 Oct 29 01:46 sbt
 -rw-r--r--  1 root root   1049906 Dec 25 21:29 sbt-0.13.13.tgz
 drwxrwxr-x  6 root root      4096 Mar  4  2016 scala
 -rw-r--r--  1 root root  28678231 Mar  4  2016 scala-2.11.8.tgz
 drwxr-xr-x 13 root root      4096 Feb 15 17:01 spark
 -rw-r--r--  1 root root 187426587 Nov 12 06:54 spark-2.0.2-bin-hadoop2.7.tgz
 [root@sht-sgmhadoopnn-01 app]# 
 [root@sht-sgmhadoopnn-01 app]# find ./ -name *guava*
 [root@sht-sgmhadoopnn-01 app]# mv ./hadoop/share/hadoop/yarn/lib/guava-11.0.2.jar ./hadoop/share/hadoop/yarn/lib/guava-11.0.2.jar.bak
 [root@sht-sgmhadoopnn-01 app]# cp ./spark/libs/guava-20.0.jar ./hadoop/share/hadoop/yarn/lib/
[root@sht-sgmhadoopnn-01 app]# mv ./spark/jars/guava-14.0.1.jar ./spark/jars/guava-14.0.1.jar.bak
 [root@sht-sgmhadoopnn-01 app]# cp ./spark/libs/guava-20.0.jar ./spark/jars/
 [root@sht-sgmhadoopnn-01 app]# mv ./hadoop/share/hadoop/common/lib/guava-11.0.2.jar ./hadoop/share/hadoop/common/lib/guava-11.0.2.jar.bak
 [root@sht-sgmhadoopnn-01 app]# cp ./spark/libs/guava-20.0.jar ./hadoop/share/hadoop/common/lib/
 ```
##### 3.后台提交jar包运行
```
[root@sht-sgmhadoopnn-01 spark]# 
[root@sht-sgmhadoopnn-01 spark]# nohup /root/learnproject/app/spark/bin/spark-submit \
> --name onlineLogsAnalysis \
> --master yarn    \
> --deploy-mode cluster     \
> --conf "spark.scheduler.mode=FAIR" \
> --conf "spark.sql.codegen=true" \
> --driver-memory 2G \
> --executor-memory 2G \
> --executor-cores 1 \
> --num-executors 3 \
> --class com.learn.java.main.OnLineLogAnalysis2     \
> /root/learnproject/app/spark/sparkdemo.jar &
[1] 22926
[root@sht-sgmhadoopnn-01 spark]# nohup: ignoring input and appending output to `nohup.out'
[root@sht-sgmhadoopnn-01 spark]# 
[root@sht-sgmhadoopnn-01 spark]# 
[root@sht-sgmhadoopnn-01 spark]# tail -f nohup.out
```
##### 4.yarn web界面查看运行log
![enter description here](/assets/blogImg/928_1.jpg)
ApplicationMaster：打开为spark history server web界面

logs： 查看stderr 和 stdout日志 (system.out.println方法输出到stdout日志中)
![enter description here](/assets/blogImg/928_2.jpg)
![enter description here](/assets/blogImg/928_3.jpg)
![enter description here](/assets/blogImg/928_4.jpg)
##### 5.查看spark history web
![enter description here](/assets/blogImg/928_5.jpg)
##### 6.查看DashBoard ,实时可视化
![enter description here](/assets/blogImg/928_6.jpg)
