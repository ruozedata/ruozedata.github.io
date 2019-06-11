---
layout: post
title: "Hive存储格式的生产应用"
date: 2018-04-20
comments: true
tags: 
	- hive
	- 压缩格式 
categories:  Hive
---
**相同数据，分别以TextFile、SequenceFile、RcFile、ORC存储的比较。**

原始大小: 19M

![enter description here](/assets/blogImg/420_1.png)
<!--more--> 
##### 1. TextFile(默认) 文件大小为18.1M
![enter description here](/assets/blogImg/420_2.png)

##### 2. SequenceFile
```
    create table page_views_seq( 
	track_time string, 
	url string, 
	session_id string, 
	referer string, 
	ip string, 
	end_user_id string, 
	city_id string 
	)ROW FORMAT DELIMITED FIELDS TERMINATED BY “\t” 
	STORED AS SEQUENCEFILE;
	
	insert into table page_views_seq select * from page_views;
```
**用SequenceFile存储后的文件为19.6M**
![enter description here](/assets/blogImg/420_3.png)

##### 3. RcFile
```
    create table page_views_rcfile(
	track_time string,
	url string,
	session_id string,
	referer string,
	ip string,
	end_user_id string,
	city_id string
	)ROW FORMAT DELIMITED FIELDS TERMINATED BY "\t"
	STORED AS RCFILE;
		
	insert into table page_views_rcfile select * from page_views; 
```
**用RcFile存储后的文件为17.9M**
![enter description here](/assets/blogImg/420_4.png)

##### 4. ORCFile
```
    create table page_views_orc
	ROW FORMAT DELIMITED FIELDS TERMINATED BY "\t"
	STORED AS ORC 
	TBLPROPERTIES("orc.compress"="NONE")
	as select * from page_views;
```
**用ORCFile存储后的文件为7.7M**
![enter description here](/assets/blogImg/420_5.png)


##### 5. Parquet
```
    create table page_views_parquet
	ROW FORMAT DELIMITED FIELDS TERMINATED BY "\t"
	STORED AS PARQUET 
	as select * from page_views;
``` 
**用ORCFile存储后的文件为13.1M**
![enter description here](/assets/blogImg/420_6.png)

**总结：磁盘空间占用大小比较**

<font color=#FF4500 >ORCFile(7.7M)<parquet(13.1M)<RcFile(17.9M)<Textfile(18.1M)<SequenceFile(19.6)</font>