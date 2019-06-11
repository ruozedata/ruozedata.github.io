---
layout: post
title: "Hadoop全网最详细的伪分布式部署(MapReduce+Yarn)"
date: 2018-04-10
comments: true
tags: 
	- hadoop
	- 环境搭建 
	- 基础
categories:  Hadoop
---
若泽大数据，Hadoop全网最详细的伪分布式部署(MapReduce+Yarn)
<!--more--> 



 1. 修改mapred-site.xml
```
[hadoop@hadoop000 ~]# cd /opt/software/hadoop/etc/hadoop

[hadoop@hadoop000 hadoop]# cp mapred-site.xml.template  mapred-site.xml

[hadoop@hadoop000 hadoop]# vi mapred-site.xml

<configuration>

	<property>

		<name>mapreduce.framework.name</name>

		<value>yarn</value>

	</property>

</configuration>
```
 2. 修改yarn-site.xml
```
[hadoop@hadoop000 hadoop]# vi yarn-site.xml

<configuration>

	<property>

		<name>yarn.nodemanager.aux-services</name>

      		<value>mapreduce_shuffle</value>

  	</property>

</configuration>
```
 3. 启动
```
[hadoop@hadoop000 hadoop]# cd ../../

[hadoop@hadoop000 hadoop]# sbin/start-yarn.sh
```
 4. 关闭
```
[hadoop@hadoop000 hadoop]# sbin/stop-yarn.sh
```





