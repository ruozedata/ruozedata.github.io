---
layout: post
title: "Hive DDL，你真的了解吗？"
date: 2018-04-24
comments: true
tags: 
	- hive
categories:  Hive
---
若泽大数据，带你全面剖析Hive DDL！

<font color=#FF4500 >
</font>

![Hive架构图](/assets/blogImg/hive424.png)
<!--more--> 
##### 概念
**Database**
Hive中包含了多个数据库，默认的数据库为default，对应于HDFS目录是/user/hadoop/hive/warehouse，可以通过hive.metastore.warehouse.dir参数进行配置（hive-site.xml中配置）

**Table**
Hive中的表又分为内部表和外部表 ,Hive 中的每张表对应于HDFS上的一个目录，HDFS目录为：/user/hadoop/hive/warehouse/[databasename.db]/table

**Partition**
分区，每张表中可以加入一个分区或者多个，方便查询，提高效率；并且HDFS上会有对应的分区目录：
/user/hadoop/hive/warehouse/[databasename.db]/table

##### DDL(Data Definition Language)
**Create Database**
```
CREATE (DATABASE|SCHEMA) [IF NOT EXISTS] database_name
  [COMMENT database_comment]
  [LOCATION hdfs_path]
  [WITH DBPROPERTIES (property_name=property_value, ...)];
```
IF NOT EXISTS：加上这句话代表判断数据库是否存在，不存在就会创建，存在就不会创建。
COMMENT：数据库的描述
LOCATION：创建数据库的地址，不加默认在/user/hive/warehouse/路径下
WITH DBPROPERTIES：数据库的属性

**Drop Database**
```
DROP (DATABASE|SCHEMA) [IF EXISTS] database_name 
[RESTRICT|CASCADE];
```
RESTRICT：默认是restrict，如果该数据库还有表存在则报错；
CASCADE：级联删除数据库(当数据库还有表时，级联删除表后在删除数据库)。

**Alter Database**
```
ALTER (DATABASE|SCHEMA) database_name SET DBPROPERTIES (property_name=property_value, ...);   -- (Note: SCHEMA added in Hive 0.14.0)

ALTER (DATABASE|SCHEMA) database_name SET OWNER [USER|ROLE] user_or_role;   -- (Note: Hive 0.13.0 and later; SCHEMA added in Hive 0.14.0)

ALTER (DATABASE|SCHEMA) database_name SET LOCATION hdfs_path; -- (Note: Hive 2.2.1, 2.4.0 and later)
```

**Use Database**
```
USE database_name;
USE DEFAULT;
```
**Show Databases**
```
SHOW (DATABASES|SCHEMAS) [LIKE 'identifier_with_wildcards'
“ | ”：可以选择其中一种

“[ ]”：可选项

LIKE ‘identifier_with_wildcards’：模糊查询数据库
```
**Describe Database**
```
DESCRIBE DATABASE [EXTENDED] db_name;
DESCRIBE DATABASE db_name：查看数据库的描述信息和文件目录位置路径信息；
EXTENDED：加上数据库键值对的属性信息。
hive> describe database default;
OK
default    Default Hive database    hdfs://hadoop1:9000/user/hive/warehouse    public    ROLE    
Time taken: 0.065 seconds, Fetched: 1 row(s)
hive> 

hive> describe database extended hive2;
OK
hive2   it is my database       hdfs://hadoop1:9000/user/hive/warehouse/hive2.db        hadoop      USER    {date=2018-08-08, creator=zhangsan}
Time taken: 0.135 seconds, Fetched: 1 row(s)
```
**Create Table**
```
CREATE [TEMPORARY] [EXTERNAL] TABLE [IF NOT EXISTS] [db_name.]table_name    -- (Note: TEMPORARY available in Hive 0.14.0 and later)
  [(col_name data_type [COMMENT col_comment], ... [constraint_specification])]
  [COMMENT table_comment]
  [PARTITIONED BY (col_name data_type [COMMENT col_comment], ...)]
  [CLUSTERED BY (col_name, col_name, ...) [SORTED BY (col_name [ASC|DESC], ...)] INTO num_buckets BUCKETS]
  [SKEWED BY (col_name, col_name, ...)                  -- (Note: Available in Hive 0.10.0 and later)]
 ON ((col_value, col_value, ...), (col_value, col_value, ...), ...)
 [STORED AS DIRECTORIES]
  [
   [ROW FORMAT row_format] 
   [STORED AS file_format]
 | STORED BY 'storage.handler.class.name' [WITH SERDEPROPERTIES (...)]  -- (Note: Available in Hive 0.6.0 and later)
  ]
  [LOCATION hdfs_path]
  [TBLPROPERTIES (property_name=property_value, ...)]   -- (Note: Available in Hive 0.6.0 and later)
  [AS select_statement];   -- (Note: Available in Hive 0.5.0 and later; not supported for external tables)

CREATE [TEMPORARY] [EXTERNAL] TABLE [IF NOT EXISTS] [db_name.]table_name
  LIKE existing_table_or_view_name
  [LOCATION hdfs_path];
```
**data_type**
```
      : primitive_type
      | array_type
      | map_type
      | struct_type
      | union_type  -- (Note: Available in Hive 0.7.0 and later)
```
**primitive_type**
```
      : TINYINT
      | SMALLINT
      | INT
      | BIGINT
      | BOOLEAN
     | FLOAT
      | DOUBLE
      | DOUBLE PRECISION -- (Note: Available in Hive 2.2.0 and later)
      | STRING
      | BINARY      -- (Note: Available in Hive 0.8.0 and later)
      | TIMESTAMP   -- (Note: Available in Hive 0.8.0 and later)
      | DECIMAL     -- (Note: Available in Hive 0.11.0 and later)
      | DECIMAL(precision, scale)  -- (Note: Available in Hive 0.13.0 and later)
      | DATE        -- (Note: Available in Hive 0.12.0 and later)
      | VARCHAR     -- (Note: Available in Hive 0.12.0 and later)
      | CHAR        -- (Note: Available in Hive 0.13.0 and later)
```

**array_type**
```
      : ARRAY < data_type >
```

**map_type**
```
      : MAP < primitive_type, data_type >
```

**struct_type**
```
      : STRUCT < col_name : data_type [COMMENT col_comment], ...>
```

**union_type**
```
       : UNIONTYPE < data_type, data_type, ... >  -- (Note:     Available in Hive 0.7.0 and later)
```

**row_format**
```
      : DELIMITED [FIELDS TERMINATED BY char [ESCAPED BY char]] [COLLECTION ITEMS TERMINATED BY char]
    [MAP KEYS TERMINATED BY char] [LINES TERMINATED BY char]
    [NULL DEFINED AS char]   -- (Note: Available in Hive 0.13 and later)
      | SERDE serde_name [WITH SERDEPROPERTIES (property_name=property_value, property_name=property_value, ...)]
```

**file_format:**
```
      : SEQUENCEFILE
      | TEXTFILE    -- (Default, depending on hive.default.fileformat configuration)
      | RCFILE      -- (Note: Available in Hive 0.6.0 and later)
      | ORC         -- (Note: Available in Hive 0.11.0 and later)
      | PARQUET     -- (Note: Available in Hive 0.13.0 and later)
      | AVRO        -- (Note: Available in Hive 0.14.0 and later)
      | INPUTFORMAT input_format_classname OUTPUTFORMAT output_format_classname
```

**constraint_specification:**
```
      : [, PRIMARY KEY (col_name, ...) DISABLE NOVALIDATE ]
    [, CONSTRAINT constraint_name FOREIGN KEY (col_name, ...) REFERENCES table_name(col_name, ...) DISABLE NOVALIDATE 
TEMPORARY（临时表）
Hive从0.14.0开始提供创建临时表的功能，表只对当前session有效，session退出后，表自动删除。
语法：CREATE TEMPORARY TABLE …
```

###### **注意：**
1. 如果创建的临时表表名已存在，那么当前session引用到该表名时实际用的是临时表，只有drop或rename临时表名才能使用原始表
2. 临时表限制：不支持分区字段和创建索引

EXTERNAL（外部表）
Hive上有两种类型的表，一种是Managed Table(默认的)，另一种是External Table（加上EXTERNAL关键字）。它俩的主要区别在于：当我们drop表时，Managed Table会同时删去data（存储在HDFS上）和meta data（存储在MySQL），而External Table只会删meta data。
```
hive> create external table external_table(
	  > id int,
	>  name string 
	> );
```
PARTITIONED BY（分区表）
产生背景：如果一个表中数据很多，我们查询时就很慢，耗费大量时间，如果要查询其中部分数据该怎么办呢，这是我们引入分区的概念。

可以根据PARTITIONED BY创建分区表，一个表可以拥有一个或者多个分区，每个分区以文件夹的形式单独存在表文件夹的目录下；

分区是以字段的形式在表结构中存在，通过describe table命令可以查看到字段存在，但是该字段不存放实际的数据内容，仅仅是分区的表示。

分区建表分为2种，一种是单分区，也就是说在表文件夹目录下只有一级文件夹目录。另外一种是多分区，表文件夹下出现多文件夹嵌套模式。

单分区：
```
hive> CREATE TABLE order_partition (
> order_number string,
    > event_time string
> )
> PARTITIONED BY (event_month string);
OK
```
多分区：
```
hive>  CREATE TABLE order_partition2 (
> order_number string,
> event_time string
> )
>  PARTITIONED BY (event_month string,every_day string);
OK
```
```
[hadoop@hadoop000 ~]$ hadoop fs -ls /user/hive/warehouse/hive.db
18/01/08 05:07:04 WARN util.NativeCodeLoader: Unable to load native-hadoop library for your platform... using builtin-java classes where applicable
Found 2 items
drwxr-xr-x   - hadoop supergroup          0 2018-01-08 05:04 /user/hive/warehouse/hive.db/order_partition
drwxr-xr-x   - hadoop supergroup          0 2018-01-08 05:05 /user/hive/warehouse/hive.db/order_partition2
[hadoop@hadoop000 ~]$
ROW FORMAT
```
官网解释：
```
: DELIMITED 
[FIELDS TERMINATED BY char [ESCAPED BY char]]       [COLLECTION ITEMS TERMINATED BY char]
[MAP KEYS TERMINATED BY char] 
[LINES TERMINATED BY char]
[NULL DEFINED AS char]   
-- (Note: Available in Hive 0.13 and later)
  | SERDE serde_name [WITH SERDEPROPERTIES (property_name=property_value, property_name=property_value, ...)]
```
DELIMITED：分隔符（可以自定义分隔符）；

FIELDS TERMINATED BY char:每个字段之间使用的分割；

例：-FIELDS TERMINATED BY ‘\n’ 字段之间的分隔符为\n;

COLLECTION ITEMS TERMINATED BY char:集合中元素与元素（array）之间使用的分隔符（collection单例集合的跟接口）；

MAP KEYS TERMINATED BY char：字段是K-V形式指定的分隔符；

LINES TERMINATED BY char：每条数据之间由换行符分割（默认[ \n ]）

一般情况下LINES TERMINATED BY char我们就使用默认的换行符\n，只需要指定FIELDS TERMINATED BY char。

创建demo1表，字段与字段之间使用\t分开，换行符使用默认\n：
```
hive> create table demo1(
> id int,
> name string
> )
> ROW FORMAT DELIMITED FIELDS TERMINATED BY '\t';
OK
```
创建demo2表，并指定其他字段：
```
hive> create table demo2 (
> id int,
> name string,
> hobbies ARRAY <string>,
> address MAP <string, string>
> )
> ROW FORMAT DELIMITED FIELDS TERMINATED BY '\t'
> COLLECTION ITEMS TERMINATED BY '-'
> MAP KEYS TERMINATED BY ':';
OK
STORED AS（存储格式）
Create Table As Select
```
创建表（拷贝表结构及数据，并且会运行MapReduce作业）
```
CREATE TABLE emp (
empno int,
ename string,
job string,
mgr int,
hiredate string,
salary double,
comm double,
deptno int
) ROW FORMAT DELIMITED FIELDS TERMINATED BY "\t";
```
加载数据
```
LOAD DATA LOCAL INPATH "/home/hadoop/data/emp.txt" OVERWRITE INTO TABLE emp;
```
复制整张表
```
hive> create table emp2 as select * from emp;
Query ID = hadoop_20180108043232_a3b15326-d885-40cd-89dd-e8fb1b8ff350
Total jobs = 3
Launching Job 1 out of 3
Number of reduce tasks is set to 0 since there's no reduce operator
Starting Job = job_1514116522188_0003, Tracking URL = http://hadoop1:8088/proxy/application_1514116522188_0003/
Kill Command = /opt/software/hadoop/bin/hadoop job  -kill job_1514116522188_0003
Hadoop job information for Stage-1: number of mappers: 1; number of reducers: 0
2018-01-08 05:21:07,707 Stage-1 map = 0%,  reduce = 0%
2018-01-08 05:21:19,605 Stage-1 map = 100%,  reduce = 0%, Cumulative CPU 1.81 sec
MapReduce Total cumulative CPU time: 1 seconds 810 msec
Ended Job = job_1514116522188_0003
Stage-4 is selected by condition resolver.
Stage-3 is filtered out by condition resolver.
Stage-5 is filtered out by condition resolver.
Moving data to: hdfs://hadoop1:9000/user/hive/warehouse/hive.db/.hive-staging_hive_2018-01-08_05-20-49_202_8556594144038797957-1/-ext-10001
Moving data to: hdfs://hadoop1:9000/user/hive/warehouse/hive.db/emp2
Table hive.emp2 stats: [numFiles=1, numRows=14, totalSize=664, rawDataSize=650]
MapReduce Jobs Launched: 
Stage-Stage-1: Map: 1   Cumulative CPU: 1.81 sec   HDFS Read: 3927 HDFS Write: 730 SUCCESS
Total MapReduce CPU Time Spent: 1 seconds 810 msec
OK
Time taken: 33.322 seconds
hive> show tables;
OK
emp
emp2
order_partition
order_partition2
Time taken: 0.071 seconds, Fetched: 4 row(s)
hive> 
```
复制表中的一些字段
```
create table emp3 as select empno,ename from emp;
```
LIKE
使用like创建表时，只会复制表的结构，不会复制表的数据
```
hive> create table emp4 like emp;
OK
Time taken: 0.149 seconds
hive> select * from emp4;
OK
Time taken: 0.151 seconds
hive> 
```
并没有查询到数据

desc formatted table_name
查询表的详细信息
```
hive> desc formatted emp;
OK
```
col_name                data_type               comment             
```
empno                   int                                         
ename                   string                                      
job                     string                                      
mgr                     int                                         
hiredate                string                                      
salary                  double                                      
comm                    double                                      
deptno                  int                                         
```
Detailed Table Information       
```
Database:               hive                     
Owner:                  hadoop                   
CreateTime:             Mon Jan 08 05:17:54 CST 2018     
LastAccessTime:         UNKNOWN                  
Protect Mode:           None                     
Retention:              0                        
Location:               hdfs://hadoop1:9000/user/hive/warehouse/hive.db/emp     
Table Type:             MANAGED_TABLE            
Table Parameters:          
COLUMN_STATS_ACCURATE    true                
numFiles                1                   
numRows                 0                   
rawDataSize             0                   
totalSize               668                 
transient_lastDdlTime    1515359982          
```
Storage Information        
```
SerDe Library:          org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe     
InputFormat:            org.apache.hadoop.mapred.TextInputFormat     
OutputFormat:           org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat     
Compressed:             No                       
Num Buckets:            -1                       
Bucket Columns:         []                       
Sort Columns:           []                       
Storage Desc Params:          
field.delim             \t                  
serialization.format    \t                  
Time taken: 0.228 seconds, Fetched: 39 row(s)
hive> 
```
通过查询可以列出创建表时的所有信息，并且我们可以在mysql中查询出这些信息（元数据）select * from table_params;

查询数据库下的所有表
```
hive> show tables;
OK
emp
emp1
emp2
emp3
emp4
order_partition
order_partition2
Time taken: 0.047 seconds, Fetched: 7 row(s)
hive> 
```
查询创建表的语法
```
hive> show create table emp;
OK
CREATE TABLE `emp`(
  `empno` int, 
  `ename` string, 
  `job` string, 
  `mgr` int, 
  `hiredate` string, 
  `salary` double, 
  `comm` double, 
  `deptno` int)
ROW FORMAT DELIMITED 
  FIELDS TERMINATED BY '\t' 
STORED AS INPUTFORMAT 
  'org.apache.hadoop.mapred.TextInputFormat' 
OUTPUTFORMAT 
  'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat'
LOCATION
  'hdfs://hadoop1:9000/user/hive/warehouse/hive.db/emp'
TBLPROPERTIES (
  'COLUMN_STATS_ACCURATE'='true', 
  'numFiles'='1', 
  'numRows'='0', 
  'rawDataSize'='0', 
  'totalSize'='668', 
  'transient_lastDdlTime'='1515359982')
Time taken: 0.192 seconds, Fetched: 24 row(s)
hive> 
Drop Table
DROP TABLE [IF EXISTS] table_name [PURGE];     -- (Note: PURGE available in Hive 0.14.0 and later)
```
指定PURGE后，数据不会放到回收箱，会直接删除

DROP TABLE删除此表的元数据和数据。如果配置了垃圾箱（并且未指定PURGE），则实际将数据移至.Trash / Current目录。元数据完全丢失

删除EXTERNAL表时，表中的数据不会从文件系统中删除
Alter Table

重命名
```
hive> alter table demo2 rename to new_demo2;
OK
Add Partitions
ALTER TABLE table_name ADD [IF NOT EXISTS] PARTITION partition_spec [LOCATION 'location'][, PARTITION partition_spec [LOCATION 'location'], ...];

partition_spec:
  : (partition_column = partition_col_value, partition_column = partition_col_value, ...)
用户可以用 ALTER TABLE ADD PARTITION 来向一个表中增加分区。分区名是字符串时加引号。


注：添加分区时可能出现FAILED: SemanticException table is not partitioned but partition spec exists错误。
原因是，你在创建表时并没有添加分区，需要在创建表时创建分区，再添加分区。

hive>  create table dept(
>  deptno int,
> dname string,
> loc string
> )
> PARTITIONED BY (dt string)
>  ROW FORMAT DELIMITED FIELDS TERMINATED BY "\t";
OK
Time taken: 0.953 seconds 


hive> load data local inpath '/home/hadoop/dept.txt'into table dept partition (dt='2018-08-08');
Loading data to table default.dept partition (dt=2018-08-08)
Partition default.dept{dt=2018-08-08} stats: [numFiles=1, numRows=0, totalSize=84, rawDataSize=0]
OK
Time taken: 5.147 seconds
```
查询结果
```
hive> select * from dept;
OK
10      ACCOUNTING      NEW YORK        2018-08-08
20      RESEARCH        DALLAS  2018-08-08
30      SALES   CHICAGO 2018-08-08
40      OPERATIONS      BOSTON  2018-08-08
Time taken: 0.481 seconds, Fetched: 4 row(s)


hive> ALTER TABLE dept ADD PARTITION (dt='2018-09-09');
OK
Drop Partitions
ALTER TABLE table_name DROP [IF EXISTS] PARTITION partition_spec[, PARTITION partition_spec, ...]

hive> ALTER TABLE dept DROP PARTITION (dt='2018-09-09');
```
查看分区语句
```
hive> show partitions dept;
OK
dt=2018-08-08
dt=2018-09-09
Time taken: 0.385 seconds, Fetched: 2 row(s)
```
按分区查询
```
hive> select * from dept where dt='2018-08-08';
OK
10      ACCOUNTING      NEW YORK        2018-08-08
20      RESEARCH        DALLAS  2018-08-08
30      SALES   CHICAGO 2018-08-08
40      OPERATIONS      BOSTON  2018-08-08
Time taken: 2.323 seconds, Fetched: 4 row(s)
```