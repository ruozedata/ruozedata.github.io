---
layout: post
title: "05生产预警平台项目之Kafka 0.10.1.0 Cluster的搭建和Topic简单操作实验"
date: 2018-09-04
comments: true
tags: 
	- spark
	- 高级
	- 生产预警平台项目
categories: 生产预警平台项目
---
【kafka cluster机器】:
机器名称   用户名称
sht-sgmhadoopdn-01/02/03 root
【安装目录】: /root/learnproject/app
<!--more--> 
#### 1.将scala文件夹同步到集群其他机器(scala 2.11版本，可单独下载解压)
```
[root@sht-sgmhadoopnn-01 app]# scp -r scala root@sht-sgmhadoopdn-01:/root/learnproject/app/
[root@sht-sgmhadoopnn-01 app]# scp -r scala root@sht-sgmhadoopdn-02:/root/learnproject/app/
[root@sht-sgmhadoopnn-01 app]# scp -r scala root@sht-sgmhadoopdn-03:/root/learnproject/app/

#环境变量
[root@sht-sgmhadoopdn-01 app]# vi /etc/profile
export SCALA_HOME=/root/learnproject/app/scala
export PATH=$SCALA_HOME/bin:$HADOOP_HOME/bin:$MAVEN_HOME/bin:$JAVA_HOME/bin:$PATH

[root@sht-sgmhadoopdn-02 app]# vi /etc/profile
export SCALA_HOME=/root/learnproject/app/scala
export PATH=$SCALA_HOME/bin:$HADOOP_HOME/bin:$MAVEN_HOME/bin:$JAVA_HOME/bin:$PATH

[root@sht-sgmhadoopdn-02 app]# vi /etc/profile
export SCALA_HOME=/root/learnproject/app/scala
export PATH=$SCALA_HOME/bin:$HADOOP_HOME/bin:$MAVEN_HOME/bin:$JAVA_HOME/bin:$PATH


[root@sht-sgmhadoopdn-01 app]# source /etc/profile
[root@sht-sgmhadoopdn-02 app]# source /etc/profile
[root@sht-sgmhadoopdn-03 app]# source /etc/profile
```

#### 2.下载基于Scala 2.11的kafka版本为0.10.1.0 
```
[root@sht-sgmhadoopdn-01 app]# pwd
/root/learnproject/app
[root@sht-sgmhadoopdn-01 app]# wget http://www-eu.apache.org/dist/kafka/0.10.1.0/kafka_2.11-0.10.1.0.tgz
[root@sht-sgmhadoopdn-01 app]# tar xzvf kafka_2.11-0.10.1.0.tgz 
[root@sht-sgmhadoopdn-01 app]# mv kafka_2.11-0.10.1.0 kafka
```

#### 3.创建logs目录和修改server.properties(前提zookeeper cluster部署好，见“03【在线日志分析】之hadoop-2.7.3编译和搭建集群环境(HDFS HA,Yarn HA)” )
```
[root@sht-sgmhadoopdn-01 app]# cd kafka
[root@sht-sgmhadoopdn-01 kafka]# mkdir logs
[root@sht-sgmhadoopdn-01 kafka]# cd config/
[root@sht-sgmhadoopdn-01 config]# vi server.properties
broker.id=1
port=9092
host.name=172.16.101.58
log.dirs=/root/learnproject/app/kafka/logs
zookeeper.connect=172.16.101.58:2181,172.16.101.59:2181,172.16.101.60:2181/kafka
```
#### 4.同步到02/03服务器，更改broker.id 及host.name 
```
[root@sht-sgmhadoopdn-01 app]# scp -r kafka sht-sgmhadoopdn-03:/root/learnproject/app/
[root@sht-sgmhadoopdn-01 app]# scp -r kafka sht-sgmhadoopdn-03:/root/learnproject/app/

[root@sht-sgmhadoopdn-02 config]# vi server.properties 
broker.id=2
port=9092
host.name=172.16.101.59

[root@sht-sgmhadoopdn-03 config]# vi server.properties 
broker.id=3
port=9092
host.name=172.16.101.60
```

#### 5.环境变量
```
[root@sht-sgmhadoopdn-01 kafka]# vi /etc/profile
export KAFKA_HOME=/root/learnproject/app/kafka
export PATH=$KAFKA_HOME/bin:$SCALA_HOME/bin:$ZOOKEEPER_HOME/bin:$HADOOP_HOME/bin:$JAVA_HOME/bin:$PATH

[root@sht-sgmhadoopdn-01 kafka]# scp /etc/profile sht-sgmhadoopdn-02:/etc/profile
[root@sht-sgmhadoopdn-01 kafka]# scp /etc/profile sht-sgmhadoopdn-03:/etc/profile
[root@sht-sgmhadoopdn-01 kafka]#

[root@sht-sgmhadoopdn-01 kafka]# source /etc/profile
[root@sht-sgmhadoopdn-02 kafka]# source /etc/profile
[root@sht-sgmhadoopdn-03 kafka]# source /etc/profile
 ```

#### 6.启动/停止
```
[root@sht-sgmhadoopdn-01 kafka]# nohup kafka-server-start.sh config/server.properties &
[root@sht-sgmhadoopdn-02 kafka]# nohup kafka-server-start.sh config/server.properties &
[root@sht-sgmhadoopdn-03 kafka]# nohup kafka-server-start.sh config/server.properties &

###停止
bin/kafka-server-stop.sh
```
#### 7.topic相关的操作
```
a.创建topic，如能成功创建topic则表示集群安装完成，也可以用jps命令查看kafka进程是否存在。
[root@sht-sgmhadoopdn-01 kafka]# bin/kafka-topics.sh --create --zookeeper 172.16.101.58:2181,172.16.101.59:2181,172.16.101.60:2181/kafka --replication-factor 3 --partitions 1 --topic test

b.通过list命令查看创建的topic:
[root@sht-sgmhadoopdn-01 kafka]# bin/kafka-topics.sh --list --zookeeper 172.16.101.58:2181,172.16.101.59:2181,172.16.101.60:2181/kafka

c.查看创建的Topic
[root@sht-sgmhadoopdn-01 kafka]# bin/kafka-topics.sh --describe --zookeeper 172.16.101.58:2181,172.16.101.59:2181,172.16.101.60:2181/kafka --topic test
Topic:test      PartitionCount:1        ReplicationFactor:3     Configs:
        Topic: test     Partition: 0    Leader: 3       Replicas: 3,1,2 Isr: 3,1,2
[root@sht-sgmhadoopdn-01 kafka]# 
第一行列出了这个topic的总体情况，如topic名称，分区数量，副本数量等。
第二行开始，每一行列出了一个分区的信息，如它是第几个分区，这个分区的leader是哪个broker，副本位于哪些broker，有哪些副本处理同步状态。

Partition： 分区
Leader ：   负责读写指定分区的节点
Replicas ： 复制该分区log的节点列表
Isr ：      “in-sync” replicas，当前活跃的副本列表（是一个子集），并且可能成为Leader
我们可以通过Kafka自带的bin/kafka-console-producer.sh和bin/kafka-console-consumer.sh脚本，来验证演示如果发布消息、消费消息。

d.删除topic
[root@sht-sgmhadoopdn-01 kafka]# bin/kafka-topics.sh  --delete --zookeeper  172.16.101.58:2181,172.16.101.59:2181,172.16.101.60:2181/kafka  --topic test

e.修改topic
使用—-alert原则上可以修改任何配置，以下列出了一些常用的修改选项：
（1）改变分区数量
[root@sht-sgmhadoopdn-02 kafka]#bin/kafka-topics.sh --alter  --zookeeper 172.16.101.58:2181,172.16.101.59:2181,172.16.101.60:2181/kafka --topic test --partitions 3
[root@sht-sgmhadoopdn-02 kafka]# bin/kafka-topics.sh --describe --zookeeper 172.16.101.58:2181,172.16.101.59:2181,172.16.101.60:2181/kafka --topic test
Topic:test      PartitionCount:3        ReplicationFactor:3     Configs:
        Topic: test     Partition: 0    Leader: 3       Replicas: 3,1,2 Isr: 3,1,2
        Topic: test     Partition: 1    Leader: 1       Replicas: 1,2,3 Isr: 1,2,3
        Topic: test     Partition: 2    Leader: 2       Replicas: 2,3,1 Isr: 2,3,1
[root@sht-sgmhadoopdn-02 kafka]#

（2）增加、修改或者删除一个配置参数
 bin/kafka-topics.sh —alter --zookeeper 192.168.172.98:2181/kafka  --topic my_topic_name --config key=value
 bin/kafka-topics.sh —alter --zookeeper 192.168.172.98:2181/kafka  --topic my_topic_name --deleteConfig key
 ```

#### 8.模拟实验1
```
在一个终端，启动Producer，并向我们上面创建的名称为my-replicated-topic5的Topic中生产消息，执行如下脚本：
[root@sht-sgmhadoopdn-01 kafka]# bin/kafka-console-producer.sh --broker-list 172.16.101.58:9092,172.16.101.59:9092,172.16.101.60:9092 --topic test

在另一个终端，启动Consumer，并订阅我们上面创建的名称为my-replicated-topic5的Topic中生产的消息，执行如下脚本：
[root@sht-sgmhadoopdn-02 kafka]# bin/kafka-console-consumer.sh --zookeeper 172.16.101.58:2181,172.16.101.59:2181,172.16.101.60:2181/kafka --from-beginning --topic test

可以在Producer终端上输入字符串消息行，就可以在Consumer终端上看到消费者消费的消息内容。
```