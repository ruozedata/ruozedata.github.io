---
layout: post
title: "再谈，某头条公司Spark结构化流的SQL实现"
date: 2019-01-10
comments: true
tags: 
	- spark
	- 结构化流
	- SQL
categories: Spark SQL
---



前面介绍了大概的使用语句，接下来讲解基本的功能点的实现。

## SQL语句的解析(解析部分为开源项目flinkStreamSQL内容，直接拿过来用)

```
CREATE TABLE SocketTable(
    word String,
    valuecount int
)WITH(
    type='socket',
    host='hadoop-sh1-core1',
    port='9998',
    delimiter=' '
);
create SINK console(
)WITH(
    type='console',
    outputmode='complete'
);
insert into console select word,count(*) from SocketTable group by word;
```
<!--more--> 
将create的内容根据正则解析出来，将field和配置相关的内容解析出来。

insert into部分的内容则使用calsite解析出insert部分的target表和已经create的source表内容。

因为spark没有定义好表之后直接可以insert的内容，所以要将需要sink的target解析出来另外处理。

## 创建source输入

```
CREATE TABLE SocketTable(
    word String,
    valuecount int
)WITH(
    type='socket',
    host='hadoop-sh1-core1',
    port='9998',
    delimiter=' '
);
```

解析出type中的内容，使用反射寻找到对应的处理类，解析各个参数是否合法，获得默认参数等。

这里就会使用format('socket')的方式，option中分别是host和port，分隔符是' '空格。

## schema的定义

schema的定义
spark.readStream创建的是dataframe，比如socket，它创建的df只有一个列，schema是value，如果是kafka的话就更多了。

接下来就是将定义的表中的field赋给df。

本项目中采用的是json的方式传schema，具体原因也很简单，tuple不行，case class的话需要动态变化，难度大，rdd方式在里面行不通，就通过json来做了。

## 窗口的定义

flink中其实也有在sql中添加窗口相关的字段，比如group by proctime 之类的。

在StructuredStreamingInSQL中添加，eventtime或者processtime的window sql，看源码中，其实定义一个窗口，就是为这个df添加了一个window的字段，window中有start、end等字段，知道了这个，我们在df中只要定义窗口的字段覆盖掉默认的window字段，就能使用processtime和eventtime的sql语句啦！

## sink的处理

将create的source加上定义field，加上window字段之后，就是将insert into的sql解析，把target的表拿出来，select后的内容是逻辑的主体，sql执行的内容结束之后，就和前面一样，根据type中的内容，找到对应的sink内容，执行writeStream。

## 动态添加

在处理中可能有这样的情况，想要更新执行的sql，但又不希望spark程序停止，这个时候就可以通过在zk上创建监听器的方式来实现sql的动态添加。

动态的替换的实现方式是，结构化流把所有的查询存在一个map中，key是jobid，value是query，通过获取旧的query的id，将其stop，新的query就会无缝对接，由于是新的query，bachid等内容都会从头开始计算。

## 后续监控、自定义函数、压测、调优等功能(待分享)