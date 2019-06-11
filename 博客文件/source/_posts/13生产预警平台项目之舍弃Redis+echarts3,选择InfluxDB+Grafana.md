---
layout: post
title: "13生产预警平台项目之舍弃Redis+echarts3,选择InfluxDB+Grafana"
date: 2018-09-17
comments: true
tags: 
	- spark
	- 高级
	- 生产预警平台项目
categories: 生产预警平台项目
---
<!--more--> 

#### 1.最初选择Redis作为存储，是主要有4个原因:
a.redis是一个key-value的存储系统，数据是存储在内存中，读写性能很高；
b.支持多种数据类型，如set,zset,list,hash,string；
c.key过期策略；
d.最主要是网上的博客全是sparkstreaming+redis，都互相模仿；
至于缺点，当时还没考虑到。

#### 2.然后开始添加CDHRolelog.class类和将redis模块加入代码中，
使计算结果（本次使用spark streaming+spark sql，之前仅仅是spark streaming，具体看代码）存储到redis中，当然存储到redis中，有两种存储格式。
##### 2.1 key为机器名称,服务名称,日志级别拼接的字符串，
**如hadoopnn-01_namenode_WARN，**
value为数据类型list，其存储为json格式的 [{"timeStamp": "2017-02-09 17:16:14.249","hostName": "hadoopnn-01","serviceName": "namenode","logType":"WARN","count":"12" }]
代码url,下载导入idea,运行即可:  
https://github.com/Hackeruncle/OnlineLogAnalysis/blob/master/online_log_analysis/src/main/java/com/learn/java/main/OnLineLogAnalysis3.java
![enter description here](/assets/blogImg/917_1.png)

#### 2.2 key为timestamp 
**如 2017-02-09 18:09:02.462,** 
value 为 [ {"host_service_logtype": "hadoopnn-01_namenode_INFO","count":"110" }, {"host_service_logtype": "hadoopnn-01_namenode_DEBUG","count":"678" }, {"host_service_logtype": "hadoopnn-01_namenode_WARN","count":"12" }]
 代码url,下载导入idea,运行即可:  
https://github.com/Hackeruncle/OnlineLogAnalysis/blob/master/online_log_analysis/src/main/java/com/learn/java/main/OnLineLogAnalysis5.java
![enter description here](/assets/blogImg/917_2.png)
#### 3.做可视化这块，我们选择adminLTE+flask+echarts3, 计划和编程开发尝试去从redis实时读取数据，动态绘制图表；
后来开发调研大概1周，最终2.1 和2.2方法的存储格式都不能有效适合我们，进行开发可视化Dashboard，
所以我们最终调研采取InfluxDB+Grafana来做存储和可视化展示及预警。 


#### 4.InfluxDB是时序数据库 
https://docs.influxdata.com/influxdb/v1.2/ 

#### 5.Grafana是可视化组件
http://grafana.org/
https://github.com/grafana/grafana