---
layout: post
title: "大数据之实时数据源同步中间件--生产上Canal与Maxwell颠峰对决"
date: 2018-05-14
comments: true
tags: 
	- maxwell
	- 高级
categories:  其他组件

---
##### 一.数据源同步中间件：
Canal  
https://github.com/alibaba/canal
https://github.com/Hackeruncle/syncClient

Maxwell  
https://github.com/zendesk/maxwell
![maxwell](/assets/blogImg/514_1.png)
<!--more--> 
##### 二.架构使用
MySQL ----  中间件 mcp --->KAFKA--->?--->存储HBASE/KUDU/Cassandra  增量的
a.全量  bootstrap
b.增量  
###### 1.对比
 | |	Canal(服务端)	  | Maxwell(服务端+客户端) 
 -|-|-
语言	 |	Java |   Java	 |
活跃度	 |活跃	 |       活跃	 |
HA	 |	支持		 |           定制  但是支持断点还原功能	
数据落地 |	定制		 |           落地到kafka	
分区	 |	支持		   |         支持	
bootstrap(引导)	 |不支持	 |	支持	
数据格式	 |格式自由	   |         json(格式固定)	spark json-->DF
文档	 |	较详细		 |较详细	 |
随机读	 |支持	 |	         支持 |


**个人选择Maxwell**

a.服务端+客户端一体，轻量级的
b.支持断点还原功能+bootstrap+json
Can do SELECT * from table (bootstrapping) initial loads of a table.
supports automatic position recover on master promotion
flexible partitioning schemes for Kakfa - by database, table, primary key, or column
Maxwell pulls all this off by acting as a full mysql replica, including a SQL parser for create/alter/drop statements (nope, there was no other way).

###### 2.官网解读 
[B站视频](https://www.bilibili.com/video/av34778187?from=search&seid=18393822973469412185)

###### 3.部署
**3.1 MySQL Install**
https://github.com/Hackeruncle/MySQL/blob/master/MySQL%205.6.23%20Install.txt
https://ke.qq.com/course/262452?tuin=11cffd50

**3.2 修改**
```
$ vi /etc/my.cnf

[mysqld]

binlog_format=row

$ service mysql start

3.3 创建Maxwell的db和用户
mysql> create database maxwell;
Query OK, 1 row affected (0.03 sec)

mysql> GRANT ALL on maxwell.* to 'maxwell'@'%' identified by 'ruozedata';
Query OK, 0 rows affected (0.00 sec)

mysql> GRANT SELECT, REPLICATION CLIENT, REPLICATION SLAVE on *.* to 'maxwell'@'%';
Query OK, 0 rows affected (0.00 sec)

mysql> flush privileges;
Query OK, 0 rows affected (0.00 sec)

mysql> 
```
**3.4解压**
```
[root@hadoop000 software]# tar -xzvf maxwell-1.14.4.tar.gz
```
**3.5测试STDOUT:**
```
bin/maxwell --user='maxwell' \
--password='ruozedata' --host='127.0.0.1' \
--producer=stdout
```
测试1：insert sql：
```
mysql> insert into ruozedata(id,name,age,address) values(999,'jepson',18,'www.ruozedata.com');
Query OK, 1 row affected (0.03 sec)
```
maxwell输出：
```
{
    "database": "ruozedb",
    "table": "ruozedata",
    "type": "insert",
    "ts": 1525959044,
    "xid": 201,
    "commit": true,
    "data": {
        "id": 999,
        "name": "jepson",
        "age": 18,
        "address": "www.ruozedata.com",
        "createtime": "2018-05-10 13:30:44",
        "creuser": null,
        "updatetime": "2018-05-10 13:30:44",
        "updateuser": null
    }
}
```
测试1：update sql:
```
mysql> update ruozedata set age=29 where id=999;
```
**问题:  ROW，你觉得binlog更新几个字段？**

maxwell输出：
```
{
    "database": "ruozedb",
    "table": "ruozedata",
    "type": "update",
    "ts": 1525959208,
    "xid": 255,
    "commit": true,
    "data": {
        "id": 999,
        "name": "jepson",
        "age": 29,
        "address": "www.ruozedata.com",
        "createtime": "2018-05-10 13:30:44",
        "creuser": null,
        "updatetime": "2018-05-10 13:33:28",
        "updateuser": null
    },
    "old": {
        "age": 18,
        "updatetime": "2018-05-10 13:30:44"
    }
}
 ```
###### 4.其他注意点和新特性
**4.1 kafka_version 版本**
Using kafka version: 0.11.0.1  0.10
jar:
```
[root@hadoop000 kafka-clients]# ll
total 4000
-rw-r--r--. 1 ruoze games  746207 May  8 06:34 kafka-clients-0.10.0.1.jar
-rw-r--r--. 1 ruoze games  951041 May  8 06:35 kafka-clients-0.10.2.1.jar
-rw-r--r--. 1 ruoze games 1419544 May  8 06:35 kafka-clients-0.11.0.1.jar
-rw-r--r--. 1 ruoze games  324016 May  8 06:34 kafka-clients-0.8.2.2.jar
-rw-r--r--. 1 ruoze games  641408 May  8 06:34 kafka-clients-0.9.0.1.jar
[root@hadoop000 kafka-clients]# 
```