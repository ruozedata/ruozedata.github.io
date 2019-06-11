---
layout: post
title: "16生产预警平台项目之grafana-4.1.1 Install和新建日志分析的DashBoard"
date: 2018-09-19
comments: true
tags: 
	- spark
	- 高级
	- 生产预警平台项目
categories: 生产预警平台项目
---

<!--more--> 

#### 1.下载
wget https://grafanarel.s3.amazonaws.com/builds/grafana-4.1.1-1484211277.linux-x64.tar.gz

#### 2.解压
tar -zxvf grafana-4.1.1-1484211277.linux-x64.tar.gz

#### 3.配置文件
cd grafana-4.1.1-1484211277
cp conf/sample.ini conf/custom.ini
#make changes to conf/custom.ini then start grafana-server

#### 4.后台启动
./bin/grafana-server &

#### 5.打开web 
http://172.16.101.66:3000/   admin/admin

#### 6.配置数据源influxdb
![enter description here](/assets/blogImg/919_1.png)
还要填写Database 为 online_log_analysis

#### 7.IDEA本机运行OnLineLogAanlysis2.class，实时计算存储到influxdb
 
#### 8.新建dashboard和 cdh_hdfs_warn曲线图
![enter description here](/assets/blogImg/919_2.png)
参考:
http://grafana.org/download/
http://docs.grafana.org/