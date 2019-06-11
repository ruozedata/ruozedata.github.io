---
layout: post
title: "生产中Hive静态和动态分区表，该怎样抉择呢？"
date: 2018-05-06
comments: true
tags: 
	- hive
categories:  Hive
---



###### 一.需求

按照不同部门作为分区，导数据到目标表

###### 二.使用静态分区表来完成
71.创建静态分区表：
```
create table emp_static_partition(
empno int, 
ename string, 
job string, 
mgr int, 
hiredate string, 
sal double, 
comm double)
PARTITIONED BY(deptno int)
row format delimited fields terminated by '\t';
```
2.插入数据：
```
hive>insert into table emp_static_partition partition(deptno=10)
     select empno , ename , job , mgr , hiredate , sal , comm from emp where deptno=10;
```
<!--more--> 
3.查询数据：
```
hive>select * from emp_static_partition;
```
![](/assets/blogImg/0506_1.png)
###### 三.使用动态分区表来完成
1.创建动态分区表：
```
create table emp_dynamic_partition(
empno int, 
ename string, 
job string, 
mgr int, 
hiredate string, 
sal double, 
comm double)
PARTITIONED BY(deptno int)row format delimited fields terminated by '\t';
```
<font color=#FF4500 >【注意】动态分区表与静态分区表的创建，在语法上是没有任何区别的</font>



2.插入数据：
```
hive>insert into table emp_dynamic_partition partition(deptno)     
select empno , ename , job , mgr , hiredate , sal , comm, deptno from emp;
```
<font color=#FF4500 >【注意】分区的字段名称，写在最后，有几个就写几个 与静态分区相比，不需要where</font>

需要设置属性的值：
```
hive>set hive.exec.dynamic.partition.mode=nonstrict；
```
假如不设置，报错如下:
![](/assets/blogImg/0506_2.png)
3.查询数据：
```
hive>select * from emp_dynamic_partition;
```
![](/assets/blogImg/0506_3.png)

<font color=#FF4500 >分区列为deptno，实现了动态分区</font>
###### 四.总结

在生产上我们更倾向是选择**动态分区**，
无需手工指定数据导入的具体分区， 
而是由select的字段(字段写在最后，有几个写几个)自行决定导出到哪一个分区中， 并自动创建相应的分区，使用上更加方便快捷 ，在生产工作中用的非常多多。
