---
layout: post
title: "生产改造Spark1.6源代码，create table语法支持Oracle列表分区"
date: 2018-05-08
comments: true
tags: [高级,spark,源码阅读]
categories:  Spark Other
---

<font color=#FF4500 >
</font>

##### 1.需求
通过Spark SQL JDBC 方法，抽取Oracle表数据。

##### 2.问题
大数据开发人员反映，使用效果上列表分区优于散列分区。但Spark SQL JDBC方法只支持数字类型分区，而业务表的列表分区字段是个字符串。目前Oracle表使用列表分区，对省级代码分 区。
参考 http://spark.apache.org/docs/1.6.2/sql-programming-guide.html#jdbc-to-other-databases
<!--more--> 
##### 3.Oracle的分区
###### 3.1列表分区:
该分区的特点是某列的值只有几个，基于这样的特点我们可以采用列表分区。
例一:
```
CREATE TABLE PROBLEM_TICKETS
(
PROBLEM_ID NUMBER(7) NOT NULL PRIMARY KEY, DESCRIPTION VARCHAR2(2000),
CUSTOMER_ID NUMBER(7) NOT NULL, DATE_ENTERED DATE NOT NULL,
STATUS VARCHAR2(20)
)
PARTITION BY LIST (STATUS)
(
PARTITION PROB_ACTIVE VALUES ('ACTIVE') TABLESPACE PROB_TS01,
PARTITION PROB_INACTIVE VALUES ('INACTIVE') TABLESPACE PROB_TS02
)
```

###### 3.2散列分区: 
这类分区是在列值上使用散列算法，以确定将行放入哪个分区中。当列的值没有合适的条件时，建议使用散列分区。 散列分区为通过指定分区编号来均匀分布数据的一种分区类型，因为通过在I/O设备上进行散列分区，使得这些分区大小一致。 
例一:
```
CREATE TABLE HASH_TABLE
(
COL NUMBER(8),
INF VARCHAR2(100) 
)
PARTITION BY HASH (COL)
(
PARTITION PART01 TABLESPACE HASH_TS01, 
PARTITION PART02 TABLESPACE HASH_TS02, 
PARTITION PART03 TABLESPACE HASH_TS03
)
```
##### 4.改造  
蓝色代码是改造Spark源代码,加课程顾问领取PDF。
###### 1) Spark SQL JDBC的建表脚本中需要加入列表分区配置项。 
```
CREATE TEMPORARY TABLE TBLS_IN
USING org.apache.spark.sql.jdbc OPTIONS (
driver "com.mysql.jdbc.Driver",
url "jdbc:mysql://spark1:3306/hivemetastore", dbtable "TBLS",
fetchSize "1000",
partitionColumn "TBL_ID",
numPartitions "null",
lowerBound "null",
upperBound "null",
user "hive2user",
password "hive2user",
partitionInRule "1|15,16,18,19|20,21"
); 
```
###### 2)程序入口org.apache.spark.sql.execution.datasources.jdbc.DefaultSource，方法createRelation
```
override def createRelation(
sqlContext: SQLContext,
parameters: Map[String, String]): BaseRelation = {
val url = parameters.getOrElse("url", sys.error("Option 'url' not specified"))
val table = parameters.getOrElse("dbtable", sys.error("Option 'dbtable' not specified")) val partitionColumn = parameters.getOrElse("partitionColumn", null)
var lowerBound = parameters.getOrElse("lowerBound", null)
var upperBound = parameters.getOrElse("upperBound", null) var numPartitions = parameters.getOrElse("numPartitions", null)

// add partition in rule
val partitionInRule = parameters.getOrElse("partitionInRule", null)
// validind all the partition in rule 
if (partitionColumn != null
&& (lowerBound == null || upperBound == null || numPartitions == null)
&& partitionInRule == null 
){
   sys.error("Partitioning incompletely specified") 
}

val partitionInfo = 
if (partitionColumn == null) { 
    null
} else {

	val inPartitions = if("null".equals(numPartitions)){
	val inGroups = partitionInRule.split("\\|") numPartitions = inGroups.length.toString lowerBound = "0"
	upperBound = "0"
	inGroups }
	else{
	Array[String]() 
	}

	JDBCPartitioningInfo( partitionColumn, 
	lowerBound.toLong, 
	upperBound.toLong, 
	numPartitions.toInt, 
	inPartitions)

}

val parts = JDBCRelation.columnPartition(partitionInfo)
val properties = new Properties() // Additional properties that we will pass to getConnection parameters.foreach(kv => properties.setProperty(kv._1, kv._2))
// parameters is immutable
if(numPartitions != null){
properties.put("numPartitions" , numPartitions) }
JDBCRelation(url, table, parts, properties)(sqlContext)

 } 
}
```
###### 3)org.apache.spark.sql.execution.datasources.jdbc.JDBCRelation，方法columnPartition
```
def columnPartition(partitioning: JDBCPartitioningInfo): Array[Partition] = {
if (partitioning == null) return Array[Partition](JDBCPartition(null, 0))
val column = partitioning.column
var i: Int = 0
var ans = new ArrayBuffer[Partition]()

// partition by long if(partitioning.inPartitions.length == 0){

val numPartitions = partitioning.numPartitions
if (numPartitions == 1) return Array[Partition](JDBCPartition(null, 0)) // Overflow and silliness can happen if you subtract then divide.
// Here we get a little roundoff, but that's (hopefully) OK.
val stride: Long = (partitioning.upperBound / numPartitions

- partitioning.lowerBound / numPartitions)
var currentValue: Long = partitioning.lowerBound
while (i < numPartitions) {
val lowerBound = if (i != 0) s"$column >= $currentValue" else null
currentValue += stride
val upperBound = if (i != numPartitions - 1) s"$column < $currentValue" else null val whereClause =

if (upperBound == null) { 
  lowerBound

} else if (lowerBound == null) { 
  upperBound

} else {
  s"$lowerBound AND $upperBound" 
}
  ans += JDBCPartition(whereClause, i)
   i= i+ 1 }

}

// partition by in 
else{
    while(i < partitioning.inPartitions.length){
           val inContent = partitioning.inPartitions(i)
           val whereClause = s"$column in ($inContent)" 
           ans += JDBCPartition(whereClause, i)
           i= i+ 1
     } 

  }

  ans.toArray 
}
```

###### 4)对外方法org.apache.spark.sql.SQLContext , 方法jdbc
```
def jdbc(
url: String,
table: String,
columnName: String,
lowerBound: Long,
upperBound: Long,
numPartitions: Int,
inPartitions: Array[String] = Array[String]()

): DataFrame = {
read.jdbc(url, table, columnName, lowerBound, upperBound, numPartitions, inPartitions ,new Properties)
}
```