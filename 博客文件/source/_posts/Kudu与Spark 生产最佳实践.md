---
layout: post
title: "Kudu与Spark 生产最佳实践"
date: 2019-05-07
comments: true
tags: [spark,Kudu,高级]
categories: Spark Other
---

<!--more--> 

### 环境

```
 <properties>
    <scala.version>2.11.8</scala.version>
    <spark.version>2.2.0</spark.version>
    <kudu.version>1.5.0</kudu.version>
</properties>
```

### 测试代码

```
import org.apache.spark.sql.SparkSession
import org.apache.spark.sql.types.{StringType, StructField, StructType}
import org.apache.kudu.client._
import collection.JavaConverters._
object KuduApp {
  def main(args: Array[String]): Unit = {
    val spark = SparkSession.builder().appName("KuduApp").master("local[2]").getOrCreate()
     //Read a table from Kudu
    val df = spark.read
          .options(Map("kudu.master" -> "10.19.120.70:7051", "kudu.table" -> "test_table"))
          .format("kudu").load
        df.schema.printTreeString()
//    // Use KuduContext to create, delete, or write to Kudu tables
//    val kuduContext = new KuduContext("10.19.120.70:7051", spark.sparkContext)
//
//
//    // The schema is encoded in a string
//    val schemalString="id,age,name"
//
//    // Generate the schema based on the string of schema
//    val fields=schemalString.split(",").map(filedName=>StructField(filedName,StringType,nullable =true ))
//    val schema=StructType(fields)
//
//
//    val KuduTable = kuduContext.createTable(
//     "test_table", schema, Seq("id"),
//     new CreateTableOptions()
//       .setNumReplicas(1)
//       .addHashPartitions(List("id").asJava, 3)).getSchema
//
//    val  id  = KuduTable.getColumn("id")
//    print(id)
//
//    kuduContext.tableExists("test_table")
  }
}
```

现象:通过spark sql 操作报如下错误:

```
Exception in thread "main" java.lang.ClassNotFoundException: Failed to find data source: kudu. Please find packages at http://spark.apache.org/third-party-projects.html
    at org.apache.spark.sql.execution.datasources.DataSource$.lookupDataSource(DataSource.scala:549)
    at org.apache.spark.sql.execution.datasources.DataSource.providingClass$lzycompute(DataSource.scala:86)
    at org.apache.spark.sql.execution.datasources.DataSource.providingClass(DataSource.scala:86)
    at org.apache.spark.sql.execution.datasources.DataSource.resolveRelation(DataSource.scala:301)
    at org.apache.spark.sql.DataFrameReader.load(DataFrameReader.scala:178)
    at org.apache.spark.sql.DataFrameReader.load(DataFrameReader.scala:146)
    at cn.zhangyu.KuduApp$.main(KuduApp.scala:18)
    at cn.zhangyu.KuduApp.main(KuduApp.scala)
Caused by: java.lang.ClassNotFoundException: kudu.DefaultSource
    at java.net.URLClassLoader.findClass(URLClassLoader.java:381)
    at java.lang.ClassLoader.loadClass(ClassLoader.java:424)
    at sun.misc.Launcher$AppClassLoader.loadClass(Launcher.java:349)
    at java.lang.ClassLoader.loadClass(ClassLoader.java:357)
    at org.apache.spark.sql.execution.datasources.DataSource$$anonfun$21$$anonfun$apply$12.apply(DataSource.scala:533)
    at org.apache.spark.sql.execution.datasources.DataSource$$anonfun$21$$anonfun$apply$12.apply(DataSource.scala:533)
    at scala.util.Try$.apply(Try.scala:192)
    at org.apache.spark.sql.execution.datasources.DataSource$$anonfun$21.apply(DataSource.scala:533)
    at org.apache.spark.sql.execution.datasources.DataSource$$anonfun$21.apply(DataSource.scala:533)
    at scala.util.Try.orElse(Try.scala:84)
    at org.apache.spark.sql.execution.datasources.DataSource$.lookupDataSource(DataSource.scala:533)
    ... 7 more
```

而通过KuduContext是可以操作的没有报错,代码为上面注解部分

### 解决思路

查询kudu官网:[https://kudu.apache.org/docs/developing.html](https://kudu.apache.org/docs/developing.html)

官网中说出了版本的问题:

```
如果将Spark 2与Scala 2.11一起使用，请使用kudu-spark2_2.11工件。
kudu-spark版本1.8.0及更低版本的语法略有不同。有关有效示例，请参阅您的版本的文档。可以在发布页面上找到版本化文档。
spark-shell --packages org.apache.kudu:kudu-spark2_2.11:1.9.0
看到了 官网使用的是1.9.0的版本.
```

<font size=3 color="red">但是但是但是</font>

官网下面说到了下面几个集成问题:

1. <font size=3 color="red"><b>Spark 2.2+在运行时需要Java 8，即使Kudu Spark 2.x集成与Java 7兼容。Spark 2.2是Kudu 1.5.0的默认依赖版本。</b></font>
2. 当注册为临时表时，必须为名称包含大写或非ascii字符的Kudu表分配备用名称。
3. 包含大写或非ascii字符的列名的Kudu表不能与SparkSQL一起使用。可以在Kudu中重命名列以解决此问题。
4. <>并且OR谓词不会被推送到Kudu，而是由Spark任务进行评估。只有LIKE带有后缀通配符的谓词才会被推送到Kudu，这意味着它LIKE "FOO%"被推下但LIKE "FOO%BAR"不是。
5. Kudu不支持Spark SQL支持的每种类型。例如， Date不支持复杂类型。
6. Kudu表只能在SparkSQL中注册为临时表。使用HiveContext可能无法查询Kudu表。

<font size=3><b>
那就很奇怪了我用的1.5.0版本报错为:找不到类,数据源有问题

但是把kudu改成1.9.0 问题解决
</b></font>

运行结果:

```
root
 |-- id: string (nullable = false)
 |-- age: string (nullable = true)
 |-- name: string (nullable = true)
```

### Spark集成最佳实践

每个群集避免多个Kudu客户端。

一个常见的Kudu-Spark编码错误是实例化额外的KuduClient对象。在kudu-spark中，a KuduClient属于KuduContext。Spark应用程序代码不应创建另一个KuduClient连接到同一群集。相反，应用程序代码应使用KuduContext访问KuduClient使用

```
KuduContext#syncClient。
  // Use KuduContext to create, delete, or write to Kudu tables
    val kuduContext = new KuduContext("10.19.120.70:7051", spark.sparkContext)
    val list = kuduContext.syncClient.getTablesList.getTablesList
    if (list.iterator().hasNext){
      print(list.iterator().next())
    }
```

要诊断KuduClientSpark作业中的多个实例，请查看主服务器的日志中的符号，这些符号会被来自不同客户端的许多GetTableLocations或 GetTabletLocations请求过载，通常大约在同一时间。这种症状特别适用于Spark Streaming代码，其中创建KuduClient每个任务将导致来自新客户端的主请求的周期性波。

### Spark操作kudu(Scala demo)

```
package cn.zhangyu
import org.apache.kudu.spark.kudu._
import org.apache.spark.sql.{Row, SparkSession}
import org.apache.spark.sql.types.{IntegerType, StringType, StructField, StructType}
import org.slf4j.LoggerFactory
import org.apache.kudu.client._
import collection.JavaConverters._
object SparkTest {
  //kuduMasters and tableName
  val kuduMasters = "192.168.13.130:7051"
  val tableName = "kudu_spark_table"
  //table column
  val idCol = "id"
  val ageCol = "age"
  val nameCol = "name"
  //replication
  val tableNumReplicas = Integer.getInteger("tableNumReplicas", 1)
  val logger = LoggerFactory.getLogger(SparkTest.getClass)
  def main(args: Array[String]): Unit = {
    //create SparkSession
    val spark = SparkSession.builder().appName("KuduApp").master("local[2]").getOrCreate()
    //create kuduContext
    val kuduContext = new KuduContext(kuduMasters,spark.sparkContext)
    //schema
    val schema = StructType(
      List(
        StructField(idCol, IntegerType, false),
        StructField(nameCol, StringType, false),
        StructField(ageCol,StringType,false)
      )
    )
    var tableIsCreated = false
    try{
    // Make sure the table does not exist
    if (kuduContext.tableExists(tableName)) {
      throw new RuntimeException(tableName + ": table already exists")
    }
    //create
    kuduContext.createTable(tableName, schema, Seq(idCol),
      new CreateTableOptions()
        .addHashPartitions(List(idCol).asJava, 3)
        .setNumReplicas(tableNumReplicas))
    tableIsCreated = true
    import spark.implicits._
    //write
    logger.info(s"writing to table '$tableName'")
        val data = Array(Person(1,"12","zhangsan"),Person(2,"20","lisi"),Person(3,"30","wangwu"))
        val personRDD = spark.sparkContext.parallelize(data)
        val personDF = personRDD.toDF()
        kuduContext.insertRows(personDF,tableName)
    //useing SparkSQL read table
    val sqlDF = spark.sqlContext.read
      .options(Map("kudu.master" -> kuduMasters, "kudu.table" -> tableName))
      .format("kudu").kudu
    sqlDF.createOrReplaceTempView(tableName)
    spark.sqlContext.sql(s"SELECT * FROM $tableName ").show
    //upsert some rows
    val upsertPerson = Array(Person(1,"10","jack"))
    val upsertPersonRDD = spark.sparkContext.parallelize(upsertPerson)
    val upsertPersonDF = upsertPersonRDD.toDF()
    kuduContext.updateRows(upsertPersonDF,tableName)
    //useing RDD read table
    val readCols = Seq(idCol,ageCol,nameCol)
    val readRDD = kuduContext.kuduRDD(spark.sparkContext, tableName, readCols)
    val userTuple = readRDD.map { case Row( id: Int,age: String,name: String) => (id,age,name) }
    println("count:"+userTuple.count())
    userTuple.collect().foreach(println(_))
    //delete table
    kuduContext.deleteTable(tableName)    
    }catch {
      // Catch, log and re-throw. Not the best practice, but this is a very
      // simplistic example.
      case unknown : Throwable => logger.error(s"got an exception: " + unknown)
        throw unknown
    } finally {
      // Clean up.
      if (tableIsCreated) {
        logger.info(s"deleting table '$tableName'")
        kuduContext.deleteTable(tableName)
      }
      logger.info(s"closing down the session")
      spark.close()
    }
  }
}
case class Person(id: Int,age: String,name: String)
```