---
layout: post
title: "Kafka之数据迁移"
date: 2019-07-18
comments: true
tags: 
    - Kafka
    - 数据迁移
categories: 
    - Kafka
   
---

<!--more--> 

### 背景

当Kafka 减少Broker节点后，需要把数据分区迁移到其他节点上，以下将介绍我的一次迁移验证过程。

前3步为环境准备，实际数据操作看第4步即可

增加Broker节点，也可以采用步骤4相同的方法进行重新分区

方案思想：`使用kafka-reassign-partitions命令，把partition重新分配到指定的Broker上`

### 创建测试topic，具体为3个分区，2个副本

```
kafka-topics --create --topic test-topic \
--zookeeper cdh-002/kafka \
--replication-factor 2 --partitions 3
```

### 查看创建的topic

```
kafka-topics --describe --zookeeper cdh-002/kafka --topic test-topic
```

![mark](http://pucwi7op1.bkt.clouddn.com/blog/20190724/TJHSXayn2rpq.png?imageslim)

### 产生若干条测试数据

```
kafka-console-producer --topic test-topic \
--broker-list cdh-004:9092
```

![mark](http://pucwi7op1.bkt.clouddn.com/blog/20190724/XaBgiGo83Dhh.png?imageslim)

### 使用命令进行重分区

![mark](http://pucwi7op1.bkt.clouddn.com/blog/20190724/UAX7PCNdJsRp.png?imageslim)

1. 新建文件topic-to-move.json ，比如加入如下内容

	```
	{"topics": [{"topic":"test-topic"}], "version": 1}
	```

2. 使用--generate生成迁移计划，broker-list根据自己环境设置，我的环境由于broker 75挂掉了，只剩下76和77

	```
	kafka-reassign-partitions --zookeeper cdh-002/kafka \
	--topics-to-move-json-file /opt/lb/topic-to-move.json \
	--broker-list "76,77" --generate
	```

	输出日志：

	（<font color="red">从日志可知各个分区副本所在的Broker节点，以及建议的副本分布</font>）

	Current partition replica assignment (<font color="red">当前分区副本分布</font>)

	```
	{
		"version":1,
		"partitions":[
			{
				"topic":"test-topic",
				"partition":0,
				"replicas":[76,77]
			},
			{
				"topic":"test-topic",
				"partition":2,
				"replicas":[75,76]
			},
			{
				"topic":"test-topic",
				"partition":1,
				"replicas":[77,75]
			}
		]
	}
	```

	Proposed partition reassignment configuration (<font color="red">建议分区副本分布</font>)

	```
	{
		"version":1,
		"partitions":[
			{
				"topic":"test-topic",
				"partition":0,
				"replicas":[76,77]
			},
			{
				"topic":"test-topic",
				"partition":2,
				"replicas":[76,77]
			},
			{
				"topic":"test-topic",
				"partition":1,
				"replicas":[77,76]
			}
		]
	}
	```

3. 新建文件kafka-reassign-execute.json，并把建议的分区副本分布配置拷贝到新建文件中。(生产上一般会保留当前分区副本分布，仅更改下线的分区，这样数据移动更少)

![mark](http://pucwi7op1.bkt.clouddn.com/blog/20190724/5b90JllUjzyl.png?imageslim)

4. 使用--execute执行迁移计划  (有数据移动，broker 75上的数据会移到broker 76和77上，如果数据量大，执行的时间会比较久，耐心等待即可)

	```
	kafka-reassign-partitions --zookeeper cdh-002/kafka \
	--reassignment-json-file /opt/lb/kafka-reassign-execute.json \
	--execute
	```

5. 使用-verify查看迁移进度

	```
	kafka-reassign-partitions --zookeeper cdh-002/kafka \
	--reassignment-json-file /opt/lb/kafka-reassign-execute.json \
	--verify
	```
	
![mark](http://pucwi7op1.bkt.clouddn.com/blog/20190724/NRvEyHQV56rh.png?imageslim)

6. 通过消费者验证，可知，并未丢失数据。注意需要加--from-beginning。(此时broker 75和77同时宕机，也不会丢失数据，因为76上有了所有分区的副本)

	```
	kafka-console-consumer --topic test-topic --from-beginning --zookeeper cdh-002/kafka
	```
	
![mark](http://pucwi7op1.bkt.clouddn.com/blog/20190724/0B6vo0NKWXaj.png?imageslim)
	
	<font color="red" size=4>另外一种验证方法是:（生产最佳实践）</font>
	
	另外一种验证方法就是通过查看Kafka存储路径来确认，是否有迁移数据

![mark](http://pucwi7op1.bkt.clouddn.com/blog/20190724/Bs9N0qEqie1Y.png?imageslim)

	```
	[root@cdh-003 ~]# cd /var/local/kafka/data/
	[root@cdh-003 data]# ll
	rwxr-xr-x 2 kafka kafka  110 Oct 23 14:21 test-topic-0
	drwxr-xr-x 2 kafka kafka  110 Oct 23 14:52 test-topic-1
	drwxr-xr-x 2 kafka kafka  110 Oct 23 14:21 test-topic-2
	```