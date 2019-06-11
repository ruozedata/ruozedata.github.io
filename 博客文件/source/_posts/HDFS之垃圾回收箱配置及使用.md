---
layout: post
title: "HDFS之垃圾回收箱配置及使用"
date: 2018-07-18
comments: true
tags: 
	- hadoop
categories: Hadoop
---
HDFS为每个用户创建一个回收站:
目录:/user/用户/.Trash/Current, 系统回收站都有一个周期,周期过后hdfs会彻底删除清空,周期内可以恢复。
<!--more--> 
#### 一、HDFS删除文件,无法恢复
```
[hadoop@hadoop001 opt]$ hdfs dfs -rm /123.log
Deleted /123.log
```
#### 二、 启用回收站功能
```
[hadoop@hadoop001 hadoop]$ vim core-site.xml
<property>
<!--多长时间创建CheckPoint NameNode节点上运行的CheckPointer 
从Current文件夹创建CheckPoint; 默认: 0 由fs.trash.interval项指定 -->
<name>fs.trash.checkpoint.interval</name>
<value>0</value>
</property>
<property>
<!--多少分钟.Trash下的CheckPoint目录会被删除,
该配置服务器设置优先级大于客户端，默认:不启用 -->
    <name>fs.trash.interval</name>
    <value>1440</value>  -- 清除周期分钟(24小时)
</property>
```
##### 1、重启hdfs服务
```
[hadoop@hadoop001 sbin]$ ./stop-dfs.sh
[hadoop@hadoop001 sbin]$ ./start-dfs.sh
```
##### 2、测试回收站功能
```
[hadoop@hadoop001 opt]$ hdfs dfs -put 123.log /
[hadoop@hadoop001 opt]$ hdfs dfs -ls /
-rw-r--r--   1 hadoop supergroup        162 2018-05-23 11:30 /123.log
```
##### 文件删除成功存放回收站路径下
```
[hadoop@hadoop001 opt]$ hdfs dfs -rm /123.log
18/05/23 11:32:50 INFO fs.TrashPolicyDefault: Moved: 'hdfs://192.168.0.129:9000/123.log' to trash at: hdfs://192.168.0.129:9000/user/hadoop/.Trash/Current/123.log
[hadoop@hadoop001 opt]$ hdfs dfs -ls /
Found 1 items
drwx------   - hadoop supergroup          0 2018-05-23 11:32 /user
```
##### 恢复文件
```
[hadoop@hadoop001 ~]$ hdfs dfs -mv /user/hadoop/.Trash/Current/123.log /456.log
[hadoop@hadoop001 ~]$ hdfs dfs -ls /
Found 2 items
-rw-r--r--   1 hadoop supergroup        162 2018-05-23 11:30 /456.log
drwx------   - hadoop supergroup          0 2018-05-23 11:32 /user
```
##### 删除文件跳过回收站
```
[hadoop@hadoop000 hadoop]$ hdfs dfs -rm -skipTrash /rz.log1
[hadoop@hadoop001 ~]$ hdfs dfs -rm -skipTrash /456.log
Deleted /456.log
```
源码参考：
https://blog.csdn.net/tracymkgld/article/details/17557655