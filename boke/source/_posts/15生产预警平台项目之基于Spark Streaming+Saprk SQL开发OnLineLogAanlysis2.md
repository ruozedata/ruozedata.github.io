---
layout: post
title: "15生产预警平台项目之基于Spark Streaming+Saprk SQL开发OnLineLogAanlysis2"
date: 2018-09-18
comments: true
tags: 
	- spark
	- 高级
	- 生产预警平台项目
categories: 生产预警平台项目
---

<!--more--> 

##### 1.influxdb创建database
[root@sht-sgmhadoopdn-04 app]# influx -precision rfc3339
Connected to http://localhost:8086 version 1.2.0
InfluxDB shell version: 1.2.0
>create database online_log_analysis
 
##### 2.导入源代码
项目中原本想将 influxdb-java https://github.com/influxdata/influxdb-java的InfluxDBTest.java 文件的加到项目中，所以必须要引入 influxdb-java 的包；
但是由于GitHub的上的class文件的某些方法，是版本是2.6，而maven中的最高也就2.5版本，所以将Github的源代码下载导入到idea中，编译导出2.6.jar包；
可是 引入2.6jar包，其在InfluxDBTest.class文件的 无法import org.influxdb（百度谷歌很长时间，尝试很多方法不行）。
最后索性将 influx-java的源代码全部添加到项目中即可，如下图所示。
 
##### 3.运行OnLineLogAanlysis2.java 
https://github.com/Hackeruncle/OnlineLogAnalysis/blob/master/online_log_analysis/src/main/java/com/learn/java/main/OnLineLogAnalysis2.java
![enter description here](/assets/blogImg/0918_1.png)
**比如 logtype_count,host_service_logtype=hadoopnn-01_namenode_WARN** count=12
logtype_count 是表
host_service_logtype=hadoopnn-01_namenode_WARN 是 tag--标签，在InfluxDB中，tag是一个非常重要的部分，表名+tag一起作为数据库的索引，是“key-value”的形式。 
count=12 是  field--数据，field主要是用来存放数据的部分，也是“key-value”的形式。
tag、field 中间是要有空格的


##### 4.influxdb查询数据 
![enter description here](/assets/blogImg/0918_2.png)
