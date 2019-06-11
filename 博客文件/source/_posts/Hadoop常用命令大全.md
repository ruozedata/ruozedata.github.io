---
layout: post
title: "Hadoop常用命令大全"
date: 2018-04-14
comments: true
tags: 
	- hadoop
categories: Hadoop
---
若泽大数据，Hadoop常用命令大全
<!--more--> 
###### **1. 单独启动和关闭hadoop服务**
功能|命令
--|:--:
**启动名称节点**|hadoop-daemon.sh start namenode
**启动数据节点**|hadoop-daemons.sh start datanode slave
**启动secondarynamenode**|hadoop-daemon.sh start secondarynamenode
**启动resourcemanager**|yarn-daemon.sh start resourcemanager
**启动nodemanager**|bin/yarn-daemons.sh start nodemanager
**停止数据节点**|hadoop-daemons.sh stop datanode

###### **2. 常用的命令** 
功能|命令
--|:--:
**创建目录**|hdfs dfs -mkdir /input
**查看**|hdfs dfs  -ls
**递归查看**|hdfs dfs ls -R
**上传**|hdfs dfs -put 
**下载**|hdfs dfs -get 
**删除**|hdfs dfs -rm
**从本地剪切粘贴到hdfs**|hdfs fs -moveFromLocal /input/xx.txt /input/xx.txt
**从hdfs剪切粘贴到本地**|hdfs fs -moveToLocal /input/xx.txt /input/xx.txt
**追加一个文件到另一个文件到末尾**|hdfs fs -appedToFile ./hello.txt /input/hello.txt
**查看文件内容**|hdfs fs -cat /input/hello.txt
**显示一个文件到末尾**|hdfs fs -tail /input/hello.txt
**以字符串的形式打印文件的内容**|hdfs fs -text /input/hello.txt
**修改文件权限**|hdfs fs -chmod 666 /input/hello.txt
**修改文件所属**|hdfs fs -chown ruoze.ruoze  /input/hello.txt
**从本地文件系统拷贝到hdfs里**|hdfs fs -copyFromLocal /input/hello.txt /input/
**从hdfs拷贝到本地**|hdfs fs -copyToLocal /input/hello.txt /input/
**从hdfs到一个路径拷贝到另一个路径**|hdfs fs -cp /input/xx.txt /output/xx.txt
**从hdfs到一个路径移动到另一个路径**|hdfs fs -mv /input/xx.txt /output/xx.txt
**统计文件系统的可用空间信息**|hdfs fs -df -h /
**统计文件夹的大小信息**|hdfs fs -du -s -h /
**统计一个指定目录下的文件节点数量**|hadoop  fs -count /aaa
**设置hdfs的文件副本数量**|hadoop fs -setrep 3 /input/xx.txt

##### 总结：一定要学会查看命令帮助
**1.hadoop命令直接回车查看命令帮助
2.hdfs命令、hdfs dfs命令直接回车查看命令帮助
3.hadoop fs 等价 hdfs dfs命令，和Linux的命令差不多。**