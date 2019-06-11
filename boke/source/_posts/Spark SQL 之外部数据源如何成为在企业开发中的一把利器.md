---
layout: post
title: "Spark SQL 之外部数据源如何成为在企业开发中的一把利器"
date: 2018-06-06
comments: true
tags: [spark,高级]
categories: Spark SQL
---
#### 1 概述
1.Spark1.2中，Spark SQL开始正式支持外部数据源。Spark SQL开放了一系列接入外部数据源的接口，来让开发者可以实现。使得Spark SQL可以加载任何地方的数据，例如mysql，hive，hdfs，hbase等，而且支持很多种格式如json, parquet, avro, csv格式。我们可以开发出任意的外部数据源来连接到Spark SQL，然后我们就可以通过外部数据源API来进行操作。
2.我们通过外部数据源API读取各种格式的数据，会得到一个DataFrame，这是我们熟悉的方式啊，就可以使用DataFrame的API或者SQL的API进行操作哈。
3.外部数据源的API可以自动做一些列的裁剪，什么叫列的裁剪，假如一个user表有id,name,age,gender4个列，在做select的时候你只需要id,name这两列，那么其他列会通过底层的优化去给我们裁剪掉。
4.保存操作可以选择使用SaveMode，指定如何保存现有数据（如果存在）。
<!--more--> 
#### 2.读取json文件
启动shell进行测试
```
//标准写法
val df=spark.read.format("json").load("path")
//另外一种写法
spark.read.json("path")

看看源码这两者之间到底有啥不同呢？
/**
   * Loads a JSON file and returns the results as a `DataFrame`.
   *
   * See the documentation on the overloaded `json()` method with varargs for more details.
   *
   * @since 1.4.0
   */
  def json(path: String): DataFrame = {
    // This method ensures that calls that explicit need single argument works, see SPARK-16009
    json(Seq(path): _*)
  }
我们调用josn() 方法其实进行了 overloaded ，我们继续查看
 def json(paths: String*): DataFrame = format("json").load(paths : _*)
 这句话是不是很熟悉，其实就是我们的标准写法
 ```
 
 ```
 scala> val df=spark.read.format("json").load("file:///opt/software/spark-2.2.0-bin-2.6.0-cdh5.7.0/examples/src/main/resources/people.json")

df: org.apache.spark.sql.DataFrame = [age: bigint, name: string]

df.printSchema
root
 |-- age: long (nullable = true)
 |-- name: string (nullable = true)

 df.show
+----+-------+
| age|   name|
+----+-------+
|null|Michael|
|  30|   Andy|
|  19| Justin|
+----+-------+
 ```
#### 3 读取parquet数据
```
val df=spark.read.format("parquet").load("file:///opt/software/spark-2.2.0-bin-2.6.0-cdh5.7.0/examples/src/main/resources/users.parquet")
df: org.apache.spark.sql.DataFrame = [name: string, favorite_color: string ... 1 more field]

df.show
+------+--------------+----------------+
|  name|favorite_color|favorite_numbers|
+------+--------------+----------------+
|Alyssa|          null|  [3, 9, 15, 20]|
|   Ben|           red|              []|
+------+--------------+----------------+
```

#### 4 读取hive中的数据
 ```
spark.sql("show tables").show
+--------+----------+-----------+
|database| tableName|isTemporary|
+--------+----------+-----------+
| default|states_raw|      false|
| default|states_seq|      false|
| default|        t1|      false|
+--------+----------+-----------+

spark.table("states_raw").show
+-----+------+
| code|  name|
+-----+------+
|hello|  java|
|hello|hadoop|
|hello|  hive|
|hello| sqoop|
|hello|  hdfs|
|hello| spark|
+-----+------+

scala> spark.sql("select name from states_raw ").show
+------+
|  name|
+------+
|  java|
|hadoop|
|  hive|
| sqoop|
|  hdfs|
| spark|
+------+
 ```
 
 
#### 5 保存数据
注意： 
1. 保存的文件夹不能存在，否则报错(默认情况下，可以选择不同的模式)：org.apache.spark.sql.AnalysisException: path file:/home/hadoop/data already exists.; 
2. 保存成文本格式，只能保存一列，否则报错：org.apache.spark.sql.AnalysisException: Text data source supports only a single column, and you have 2 columns.;
```
val df=spark.read.format("json").load("file:///opt/software/spark-2.2.0-bin-2.6.0-cdh5.7.0/examples/src/main/resources/people.json")
//保存
df.select("name").write.format("text").save("file:///home/hadoop/data/out")

结果：
[hadoop@hadoop out]$ pwd
/home/hadoop/data/out
[hadoop@hadoop out]$ ll
total 4
-rw-r--r--. 1 hadoop hadoop 20 Apr 24 00:34 part-00000-ed7705d2-3fdd-4f08-a743-5bc355471076-c000.txt
-rw-r--r--. 1 hadoop hadoop  0 Apr 24 00:34 _SUCCESS
[hadoop@hadoop out]$ cat part-00000-ed7705d2-3fdd-4f08-a743-5bc355471076-c000.txt 
Michael
Andy
Justin


//保存为json格式
df.write.format("json").save("file:///home/hadoop/data/out1")

结果
[hadoop@hadoop data]$ cd out1
[hadoop@hadoop out1]$ ll
total 4
-rw-r--r--. 1 hadoop hadoop 71 Apr 24 00:35 part-00000-948b5b30-f104-4aa4-9ded-ddd70f1f5346-c000.json
-rw-r--r--. 1 hadoop hadoop  0 Apr 24 00:35 _SUCCESS
[hadoop@hadoop out1]$ cat part-00000-948b5b30-f104-4aa4-9ded-ddd70f1f5346-c000.json 
{"name":"Michael"}
{"age":30,"name":"Andy"}
{"age":19,"name":"Justin"}
```
上面说了在保存数据时如果目录已经存在，在默认模式下会报错，那我们下面讲解保存的几种模式：
![enter description here](/assets/blogImg/606_1.png)
#### 6 读取mysql中的数据
```
val jdbcDF = spark.read
.format("jdbc")
.option("url", "jdbc:mysql://localhost:3306")
.option("dbtable", "basic01.tbls")
.option("user", "root")
.option("password", "123456")
.load()

scala> jdbcDF.printSchema
root
 |-- TBL_ID: long (nullable = false)
 |-- CREATE_TIME: integer (nullable = false)
 |-- DB_ID: long (nullable = true)
 |-- LAST_ACCESS_TIME: integer (nullable = false)
 |-- OWNER: string (nullable = true)
 |-- RETENTION: integer (nullable = false)
 |-- SD_ID: long (nullable = true)
 |-- TBL_NAME: string (nullable = true)
 |-- TBL_TYPE: string (nullable = true)
 |-- VIEW_EXPANDED_TEXT: string (nullable = true)
 |-- VIEW_ORIGINAL_TEXT: string (nullable = true)

jdbcDF.show
```
#### 7 spark SQL操作mysql表数据
```
CREATE TEMPORARY VIEW jdbcTable
USING org.apache.spark.sql.jdbc
OPTIONS (
  url "jdbc:mysql://localhost:3306",
  dbtable "basic01.tbls",
  user 'root',
  password '123456',
  driver "com.mysql.jdbc.Driver"
);

查看：
show tables;
default states_raw      false
default states_seq      false
default t1      false
jdbctable       true

select * from jdbctable;
1       1519944170      6       0       hadoop  0       1       page_views      MANAGED_TABLE   NULL    NULL
2       1519944313      6       0       hadoop  0       2       page_views_bzip2        MANAGED_TABLE   NULL    NULL
3       1519944819      6       0       hadoop  0       3       page_views_snappy       MANAGED_TABLE   NULL    NULL
21      1520067771      6       0       hadoop  0       21      tt      MANAGED_TABLE   NULL    NULL
22      1520069148      6       0       hadoop  0       22      page_views_seq  MANAGED_TABLE   NULL    NULL
23      1520071381      6       0       hadoop  0       23      page_views_rcfile       MANAGED_TABLE   NULL    NULL
24      1520074675      6       0       hadoop  0       24      page_views_orc_zlib     MANAGED_TABLE   NULL    NULL
27      1520078184      6       0       hadoop  0       27      page_views_lzo_index    MANAGED_TABLE   NULL    NULL
30      1520083461      6       0       hadoop  0       30      page_views_lzo_index1   MANAGED_TABLE   NULL    NULL
31      1524370014      1       0       hadoop  0       31      t1      EXTERNAL_TABLE  NULL    NULL
37      1524468636      1       0       hadoop  0       37      states_raw      MANAGED_TABLE   NULL    NULL
38      1524468678      1       0       hadoop  0       38      states_seq      MANAGED_TABLE   NULL    NULL

mysql中的tbls的数据已经存在jdbctable表中了。
jdbcDF.show
```
#### 8 分区推测（Partition Discovery）
表分区是在像Hive这样的系统中使用的常见优化方法。 在分区表中，数据通常存储在不同的目录中，分区列值在每个分区目录的路径中编码。 所有内置的文件源（包括Text / CSV / JSON / ORC / Parquet）都能够自动发现和推断分区信息。 例如，我们创建如下的目录结构;
```
hdfs dfs -mkdir -p /user/hive/warehouse/gender=male/country=CN

添加json文件：
people.json 
{"name":"Michael"}
{"name":"Andy", "age":30}
{"name":"Justin", "age":19}

 hdfs dfs -put people.json /user/hive/warehouse/gender=male/country=CN
 ```
我们使用spark sql读取外部数据源：
```
val df=spark.read.format("json").load("/user/hive/warehouse/gender=male/country=CN/people.json")

scala> df.printSchema
root
 |-- age: long (nullable = true)
 |-- name: string (nullable = true)


scala> df.show

+----+-------+
| age|   name|
+----+-------+
|null|Michael|
|  30|   Andy|
|  19| Justin|
+----+-------+
```
我们改变读取的目录
```
val df=spark.read.format("json").load("/user/hive/warehouse/gender=male/")
scala> df.printSchema
root
 |-- age: long (nullable = true)
 |-- name: string (nullable = true)
 |-- country: string (nullable = true)


scala> df.show
+----+-------+-------+
| age|   name|country|
+----+-------+-------+
|null|Michael|     CN|
|  30|   Andy|     CN|
|  19| Justin|     CN|
+----+-------+-------+
```
大家有没有发现什么呢？Spark SQL将自动从路径中提取分区信息。 
注意，分区列的数据类型是自动推断的。目前支持数字数据类型，日期，时间戳和字符串类型。有时用户可能不想自动推断分区列的数据类型。对于这些用例，自动类型推断可以通过
<font color=#FF4500 >spark.sql.sources.partitionColumnTypeInference.enabled</font>进行配置，默认为true。当禁用类型推断时，字符串类型将用于分区列。
从Spark 1.6.0开始，默认情况下，分区发现仅在给定路径下找到分区。对于上面的示例，如果用户将路径/table/gender=male传递给
<font color=#FF4500>SparkSession.read.parquet或SparkSession.read.load</font>，则不会将性别视为分区列。如果用户需要指定启动分区发现的基本路径，则可以basePath在数据源选项中进行设置。例如，当path/to/table/gender=male是数据路径并且用户将basePath设置为path/to/table/时，性别将是分区列。