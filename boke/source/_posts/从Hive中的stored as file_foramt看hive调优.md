---
layout: post
title: "从Hive中的stored as file_foramt看hive调优"
date: 2018-05-30
comments: true
tags: 
	- hive
categories: Hive
---

#### 一、行式数据库和列式数据库的对比

##### 1、存储比较

行式数据库存储在hdfs上式按行进行存储的，一个block存储一或多行数据。而列式数据库在hdfs上则是按照列进行存储，一个block可能有一列或多列数据。

##### 2、压缩比较
<!--more--> 
对于行式数据库，必然按行压缩，当一行中有多个字段，各个字段对应的数据类型可能不一致，压缩性能压缩比就比较差。

对于列式数据库，必然按列压缩，每一列对应的是相同数据类型的数据，故列式数据库的压缩性能要强于行式数据库。

##### 3、查询比较

假设执行的查询操作是：select id,name from table_emp;

对于行式数据库，它要遍历一整张表将每一行中的id,name字段拼接再展现出来，这样需要查询的数据量就比较大，效率低。

对于列式数据库，它只需找到对应的id,name字段的列展现出来即可，需要查询的数据量小，效率高。

假设执行的查询操作是：select *  from table_emp;

对于这种查询整个表全部信息的操作，由于列式数据库需要将分散的行进行重新组合，行式数据库效率就高于列式数据库。

**<font color=#FF4500 >但是，在大数据领域，进行全表查询的场景少之又少，进而我们使用较多的还是列式数据库及列式储存。</font>**
#### 二、stored as file_format 详解

##### 1、建一张表时，可以使用“stored as file_format”来指定该表数据的存储格式，hive中，表的默认存储格式为TextFile。
```
CREATE TABLE tt (
id int,
name string
) ROW FORMAT DELIMITED FIELDS TERMINATED BY "\t";



CREATE TABLE tt2 (
id int,
name string
) ROW FORMAT DELIMITED FIELDS TERMINATED BY "\t" STORED AS TEXTFILE;

CREATE TABLE tt3 (
id int,
name string
) ROW FORMAT DELIMITED FIELDS TERMINATED BY "\t"
STORED AS 
INPUTFORMAT 'org.apache.hadoop.mapred.TextInputFormat'
OUTPUTFORMAT 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat';

#以上三种方式存储的格式都是TEXTFILE。
```
##### 2、TEXTFILE、SEQUENCEFILE、RCFILE、ORC等四种储存格式及它们对于hive在存储数据和查询数据时性能的优劣比较

```
file_format:
  | SEQUENCEFILE
  | TEXTFILE    -- (Default, depending on hive.default.fileformat configuration)
  | RCFILE      -- (Note: Available in Hive 0.6.0 and later)
  | ORC         -- (Note: Available in Hive 0.11.0 and later)
  | PARQUET     -- (Note: Available in Hive 0.13.0 and later)
  | AVRO        -- (Note: Available in Hive 0.14.0 and later)
  | INPUTFORMAT input_format_classname OUTPUTFORMAT output_format_classname

```
**TEXTFILE:** 只是hive中表数据默认的存储格式，它将所有类型的数据都存储为String类型，不便于数据的解析，但它却比较通用。不具备随机读写的能力。支持压缩。

**SEQUENCEFILE:** 这种储存格式比TEXTFILE格式多了头部、标识、信息长度等信息，这些信息使得其具备随机读写的能力。支持压缩，但压缩的是value。（存储相同的数据，SEQUENCEFILE比TEXTFILE略大）

**RCFILE（Record Columnar File）:** 现在水平上划分为很多个Row Group,每个Row Group默认大小4MB，Row Group内部再按列存储信息。由facebook开源，比标准行式存储节约10%的空间。

**ORC:** 优化过后的RCFile,现在水平上划分为多个Stripes,再在Stripe中按列存储。每个Stripe由一个Index Data、一个Row Data、一个Stripe Footer组成。每个Stripes的大小为250MB，每个Index Data记录的是整型数据最大值最小值、字符串数据前后缀信息，每个列的位置等等诸如此类的信息。这就使得查询十分得高效，默认每一万行数据建立一个Index Data。ORC存储大小为TEXTFILE的40%左右，使用压缩则可以进一步将这个数字降到10%~20%。

**ORC这种文件格式可以作用于表或者表的分区，可以通过以下几种方式进行指定：**
```
CREATE TABLE ... STORED AS ORC
ALTER TABLE ... [PARTITION partition_spec] SET FILEFORMAT ORC
SET hive.default.fileformat=Orc
```
The parameters are all placed in the TBLPROPERTIES (see Create Table). They are:



Key|Default|Notes
|-|-|-|
orc.compress|ZLIB|high level compression (one of NONE, ZLIB, SNAPPY)
|orc.compress.size|262,144|number of bytes in each compression chunk
|orc.stripe.size|67,108,864|number of bytes in each stripe
|orc.row.index.stride|10,000|number of rows between index entries (must be >= 1000)
|orc.create.index|true|whether to create row indexes
|orc.bloom.filter.columns	|""|	comma separated list of column names for which bloom filter should be created
|orc.bloom.filter.fpp|	0.05|	false positive probability for bloom filter (must >0.0 and <1.0)

示例：创建带压缩的ORC存储表
```
create table Addresses (
  name string,
  street string,
  city string,
  state string,
  zip int
) stored as orc tblproperties ("orc.compress"="NONE");
```

PARQUET: 存储大小为TEXTFILE的60%~70%，压缩后在20%~30%之间。

----------------------

注意：

1. 不同的存储格式不仅表现在存储空间上的不同，对于数据的查询，效率也不一样。因为对于不同的存储格式，执行相同的查询操作，他们访问的数据量大小是不一样的。    
   
2. 如果要使用TEXTFILE作为hive表数据的存储格式，则必须先存在一张相同数据的存储格式为TEXTFILE的表table_t0,然后在建表时使用“insert into table table_stored_file_ORC select * from table_t0;”创建。或者使用"create table as select *from table_t0;"创建。
---------------
