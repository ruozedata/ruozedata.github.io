---
layout: post
title: "06生产预警平台项目之 KafkaOffsetMonitor监控工具的搭建"
date: 2018-09-05
comments: true
tags: 
	- spark
	- 高级
	- 生产预警平台项目
categories: 生产预警平台项目
---
### 1.下载
在window7 手工下载好下面的链接
```
https://github.com/quantifind/KafkaOffsetMonitor/releases/tag/v0.2.1
```
```
[root@sht-sgmhadoopnn-01 app]# mkdir kafkaoffsetmonitor
[root@sht-sgmhadoopnn-01 app]# cd kafkaoffsetmonitor
#使用rz命令上传
[root@sht-sgmhadoopnn-01 kafkaoffsetmonitor]# rz
rz waiting to receive.
Starting zmodem transfer.  Press Ctrl+C to cancel.
Transferring KafkaOffsetMonitor-assembly-0.2.1.jar...
  100%   51696 KB    12924 KB/sec    00:00:04       0 Errors 
You have mail in /var/spool/mail/root
[root@sht-sgmhadoopnn-01 kafkaoffsetmonitor]#
```
<!--more--> 
### 2.新建一个kafkaMonitor.sh文件，文件内容如下：
```
[root@sht-sgmhadoopnn-01 kafkaoffsetmonitor]# vi kafkaoffsetmonitor.sh
! /bin/bash
java -cp KafkaOffsetMonitor-assembly-0.2.1.jar \
com.quantifind.kafka.offsetapp.OffsetGetterWeb \
--zk 172.16.101.58:2181,172.16.101.59:2181,172.16.101.60:2181/kafka \
--port 8089 \
--refresh 5.seconds \
--retain 7.days
[root@sht-sgmhadoopnn-01 kafkaoffsetmonitor]# chmod +x *.sh
[root@sht-sgmhadoopnn-01 kafkaoffsetmonitor]#
```
参数说明：
--zk 这里写的地址和端口，是zookeeper集群的各个地址和端口。应和kafka/bin文件夹中的zookeeper.properties中的host.name和clientPort一致。
--port 这个是本软件KafkaOffsetMonitor的端口。注意不要使用那些著名的端口号，例如80,8080等。我采用了8089.
--refresh 这个是软件刷新间隔时间，不要太短也不要太长。
--retain 这个是数据在数据库中保存的时间。

### 3.后台启动
```
 1[root@sht-sgmhadoopnn-01 kafkaoffsetmonitor]# nohup ./kafkaoffsetmonitor.sh &
 2serving resources from: jar:file:/root/learnproject/app/kafkaoffsetmonitor/KafkaOffsetMonitor-assembly-0.2.1.jar!/offsetapp
 3SLF4J: Failed to load class "org.slf4j.impl.StaticLoggerBinder".
 4SLF4J: Defaulting to no-operation (NOP) logger implementation
 5SLF4J: See http://www.slf4j.org/codes.html#StaticLoggerBinder for further details.
 6log4j:WARN No appenders could be found for logger (org.I0Itec.zkclient.ZkConnection).
 7log4j:WARN Please initialize the log4j system properly.
 8log4j:WARN See http://logging.apache.org/log4j/1.2/faq.html#noconfig for more info.
 9log4j:WARN No appenders could be found for logger (org.I0Itec.zkclient.ZkEventThread).
10log4j:WARN Please initialize the log4j system properly.
11log4j:WARN See http://logging.apache.org/log4j/1.2/faq.html#noconfig for more info.
122016-12-25 22:00:24.252:INFO:oejs.Server:jetty-7.x.y-SNAPSHOT
132016-12-25 22:00:24.319:INFO:oejsh.ContextHandler:started o.e.j.s.ServletContextHandler{/,jar:file:/root/learnproject/app/kafkaoffsetmonitor/KafkaOffsetMonitor-assembly-0.2.1.jar!/offsetapp}
142016-12-25 22:00:24.328:INFO:oejs.AbstractConnector:Started SocketConnector@0.0.0.0:8089
```

### 4.IE浏览器打开
```
http://172.16.101.55:8089
```