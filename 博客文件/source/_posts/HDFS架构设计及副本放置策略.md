---
layout: post
title: "HDFS架构设计及副本放置策略"
date: 2018-03-30 
comments: true
tags: 
	- hadoop
	- hdfs
	- 架构
categories:  Hadoop
---
HDFS架构设计及副本放置策略
<!--more--> 
HDFS主要由3个组件构成，分别是**NameNode、SecondaryNameNode和DataNode**，HSFS是以master/slave模式运行的，其中NameNode、SecondaryNameNode 运行在master节点，DataNode运行slave节点。
###### NameNode和DataNode架构图
![1](/assets/blogImg/1.png)
NameNode(名称节点)
存储：元信息的种类，包含:
- 文件名称
- 文件目录结构
- 文件的属性[权限,创建时间,副本数]
- 文件对应哪些数据块-->数据块对应哪些datanode节点
- 
作用： 
- 管理着文件系统命名空间
- 维护这文件系统树及树中的所有文件和目录
- 维护所有这些文件或目录的打开、关闭、移动、重命名等操作

DataNode(数据节点)
    存储：数据块、数据块校验、与NameNode通信
    作用：     
- 读写文件的数据块
- NameNode的指示来进行创建、删除、和复制等操作
- 通过心跳定期向NameNode发送所存储文件块列表信息
- 
Scondary NameNode(第二名称节点)
    存储:    命名空间镜像文件fsimage+编辑日志editlog 
    作用:    定期合并fsimage+editlog文件为新的fsimage推送给NamenNode
###### 副本放置策略
![2](/assets/blogImg/2.png)
**第一副本**：放置在上传文件的DataNode上；如果是集群外提交，则随机挑选一台磁盘不太慢、CPU不太忙的节点上 
**第二副本**：放置在与第一个副本不同的机架的节点上 
**第三副本**：与第二个副本相同机架的不同节点上 
如果还有更多的副本：随机放在节点中