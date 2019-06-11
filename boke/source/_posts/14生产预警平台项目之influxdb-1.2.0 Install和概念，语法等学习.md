---
layout: post
title: "14生产预警平台项目之influxdb-1.2.0 Install和概念，语法等学习"
date: 2018-09-17
comments: true
tags: 
	- spark
	- 高级
	- 生产预警平台项目
categories: 生产预警平台项目
---
<!--more--> 
#### 1.下载rpm
https://dl.influxdata.com/influxdb/releases/influxdb-1.2.0.x86_64.rpm
我选择用window7 浏览器下载，然后rz上传到linux机器上
#### 2.安装
yum install influxdb-1.2.0.x86_64.rpm

#### 3.启动
service influxdb start

参考: 
https://docs.influxdata.com/influxdb/v1.2/introduction/installation/
编译安装: 
https://anomaly.io/compile-influxdb/

#### 4.进入
```
[root@sht-sgmhadoopdn-04 app]# influx -precision rfc3339
Connected to http://localhost:8086 version 1.2.0
InfluxDB shell version: 1.2.0

```
语法参考:
https://docs.influxdata.com/influxdb/v1.2/introduction/getting_started/

学习url:
http://www.linuxdaxue.com/influxdb-study-series-manual.html
