---
layout: post
title: "2min快速了解，Hive内部表和外部表"
date: 2018-05-01
comments: true
tags: 
	- hive
categories:  Hive
---

<font color=#FF4500 >
</font>
在了解内部表和外部表区别前，
我们需要先了解一下**Hive架构** ：

![Hive架构](/assets/blogImg/501_1.png)
<!--more--> 
大家可以简单看一下这个架构图，我介绍其中要点：
Hive的数据分为两种，**一种为普通数据，一种为元数据。**
1. 元数据存储着表的基本信息，增删改查记录，类似于Hadoop架构中的namespace。普通数据就是表中的详细数据。
2. Hive的元数据默认存储在derby中，但大多数情况下存储在MySQL中。普通数据如架构图所示存储在hdfs中。

下面我们来介绍表的两种类型：内部表和外部表
1. 内部表（MANAGED）：hive在hdfs中存在默认的存储路径，即default数据库。之后创建的数据库及表，如果没有指定路径应都在/user/hive/warehouse下，所以在该路径下的表为内部表。

2. 外部表（EXTERNAL）：指定了/user/hive/warehouse以外路径所创建的表
而内部表和外部表的主要区别就是 
	-  内部表：当删除内部表时，MySQL的元数据和HDFS上的普通数据都会删除 ；
	-  外部表：当删除外部表时，MySQL的元数据会被删除，HDFS上的数据不会被删除；


###### 1.准备数据:  按tab键制表符作为字段分割符
	cat /tmp/ruozedata.txt
	1   jepson  32  110
	2   ruoze   22  112
	3   www.ruozedata.com   18  120
###### 2.内部表测试：
1. 在Hive里面创建一个表：
```
hive> create table ruozedata(id int,
    > name string,
    > age int,
    > tele string)
    > ROW FORMAT DELIMITED
    > FIELDS TERMINATED BY '\t'
    > STORED AS TEXTFILE;
OK
Time taken: 0.759 seconds
```
2. 这样我们就在Hive里面创建了一张普通的表，现在给这个表导入数据：
```
load data local inpath '/tmp/ruozedata.txt' into table ruozedata;
```
3. 内部表删除
```
hive> drop table ruozedata;
```
###### 3.外部表测试:
1. 创建外部表多了external关键字说明以及hdfs上location ‘/hive/external’
```
hive> create external table exter_ruozedata(
    > id int,
    > name string,
    > age int,
    > tel string)
    > location '/hive/external';
OK
Time taken: 0.098 seconds
```
创建外部表，需要在创建表的时候加上external关键字，同时指定外部表存放数据的路径
（当然，你也可以不指定外部表的存放路径，这样Hive将 在HDFS上的/user/hive/warehouse/文件夹下以外部表的表名创建一个文件夹，并将属于这个表的数据存放在这里）

2. 外部表导入数据和内部表一样：
```
load data local inpath '/tmp/ruozedata.txt' into table exter_ruozedata;
```
3. 删除外部表
```
hive> drop table exter_ruozedata;
```