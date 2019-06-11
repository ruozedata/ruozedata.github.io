---
layout: post
title: "08生产预警平台项目之Flume Agent(聚合节点) sink to kafka cluster"
date: 2018-09-07
comments: true
tags: 
	- spark
	- 高级
	- 生产预警平台项目
categories: 生产预警平台项目
---

#### 1.创建logtopic
```
[root@sht-sgmhadoopdn-01 kafka]# bin/kafka-topics.sh --create --zookeeper 172.16.101.58:2181,172.16.101.59:2181,172.16.101.60:2181/kafka --replication-factor 3 --partitions 1 --topic logtopic
```

<!--more--> 
#### 2.创建avro_memory_kafka.properties (kafka sink)
```
[root@sht-sgmhadoopcm-01 ~]# cd /tmp/flume-ng/conf
[root@sht-sgmhadoopcm-01 conf]# cp avro_memory_hdfs.properties avro_memory_kafka.properties
[root@sht-sgmhadoopcm-01 conf]# vi avro_memory_kafka.properties 
#Name the components on this agent
a1.sources = r1
a1.sinks = k1
a1.channels = c1

# Describe/configure the source
a1.sources.r1.type = avro
a1.sources.r1.bind = 172.16.101.54
a1.sources.r1.port = 4545


#Describe the sink
a1.sinks.k1.type = org.apache.flume.sink.kafka.KafkaSink
a1.sinks.k1.kafka.topic = logtopic
a1.sinks.k1.kafka.bootstrap.servers = 172.16.101.58:9092,172.16.101.59:9092,172.16.101.60:9092
a1.sinks.k1.kafka.flumeBatchSize = 6000
a1.sinks.k1.kafka.producer.acks = 1
a1.sinks.k1.kafka.producer.linger.ms = 1
a1.sinks.ki.kafka.producer.compression.type = snappy


#Use a channel which buffers events in memory
a1.channels.c1.type = memory
a1.channels.c1.keep-alive = 90
a1.channels.c1.capacity = 2000000
a1.channels.c1.transactionCapacity = 6000


#Bind the source and sink to the channel
a1.sources.r1.channels = c1
a1.sinks.k1.channel = c1
```


#### 3.后台启动 flume-ng agent(聚合节点)和查看nohup.out 
```
[root@sht-sgmhadoopcm-01 ~]# source /etc/profile
[root@sht-sgmhadoopcm-01 ~]# cd /tmp/flume-ng/
[root@sht-sgmhadoopcm-01 flume-ng]# nohup  flume-ng agent -c conf -f /tmp/flume-ng/conf/avro_memory_kafka.properties  -n a1 -Dflume.root.logger=INFO,console &
[1] 4971
[root@sht-sgmhadoopcm-01 flume-ng]# nohup: ignoring input and appending output to `nohup.out'

[root@sht-sgmhadoopcm-01 flume-ng]# 
[root@sht-sgmhadoopcm-01 flume-ng]# 
[root@sht-sgmhadoopcm-01 flume-ng]# cat nohup.out
```


#### 4.检查log收集的三台(收集节点)开启没
```
[hdfs@flume-agent-01 flume-ng]$ . ~/.bash_profile 
[hdfs@flume-agent-02 flume-ng]$ . ~/.bash_profile 
[hdfs@flume-agent-03 flume-ng]$ . ~/.bash_profile


[hdfs@flume-agent-01 flume-ng]$ nohup  flume-ng agent -c /tmp/flume-ng/conf -f /tmp/flume-ng/conf/exec_memory_avro.properties -n a1 -Dflume.root.logger=INFO,console &
[hdfs@flume-agent-01 flume-ng]$ nohup  flume-ng agent -c /tmp/flume-ng/conf -f /tmp/flume-ng/conf/exec_memory_avro.properties -n a1 -Dflume.root.logger=INFO,console &
[hdfs@flume-agent-01 flume-ng]$ nohup  flume-ng agent -c /tmp/flume-ng/conf -f /tmp/flume-ng/conf/exec_memory_avro.properties -n a1 -Dflume.root.logger=INFO,console &
```

#### 5.打开kafka manager监控

http://172.16.101.55:9999 
![enter description here](/assets/blogImg/0609_1.png)