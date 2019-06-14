---
layout: post
title: "生产SparkSQL如何读写本地外部数据源及排错"
date: 2019-03-01
comments: true
tags: [spark,SQL,高级]
categories: [Spark SQL]
---


[https://spark-packages.org/](https://spark-packages.org/)里有很多third-party数据源的package，spark把包加载进来就可以使用了

![enter description here](/assets/blogImg/2019-03-01-1.png)


csv格式在spark2.0版本之后是内置的，2.0之前属于第三方数据源
<!--more--> 
### 读取本地外部数据源

#### 直接读取一个json文件

```
[hadoop@hadoop000 bin]$ ./spark-shell --master local[2] --jars ~/software/mysql-connector-java-5.1.27.jar 
scala> spark.read.load("file:///home/hadoop/app/spark-2.3.1-bin-2.6.0-cdh5.7.0/examples/src/main/resources/people.json").show
```

运行报错：

```
Caused by: java.lang.RuntimeException: file:/home/hadoop/app/spark-2.3.1-bin-2.6.0-cdh5.7.0/examples/src/main/resources/people.json is not a Parquet file. expected magic number at tail [80, 65, 82, 49] but found [49, 57, 125, 10]
  at org.apache.parquet.hadoop.ParquetFileReader.readFooter(ParquetFileReader.java:476)
  at org.apache.parquet.hadoop.ParquetFileReader.readFooter(ParquetFileReader.java:445)
  at org.apache.parquet.hadoop.ParquetFileReader.readFooter(ParquetFileReader.java:421)
  at org.apache.spark.sql.execution.datasources.parquet.ParquetFileFormat$$anonfun$readParquetFootersInParallel$1.apply(ParquetFileFormat.scala:519)
  ... 32 more
```

查看load方法的源码：

```
/**
   * Loads input in as a `DataFrame`, for data sources that require a path (e.g. data backed by
   * a local or distributed file system).
   *
   * @since 1.4.0
   */
  def load(path: String): DataFrame = {
    option("path", path).load(Seq.empty: _*) // force invocation of `load(...varargs...)`
  }
---------------------------------------------------------
/**
   * Loads input in as a `DataFrame`, for data sources that support multiple paths.
   * Only works if the source is a HadoopFsRelationProvider.
   *
   * @since 1.6.0
   */
  @scala.annotation.varargs
  def load(paths: String*): DataFrame = {
    if (source.toLowerCase(Locale.ROOT) == DDLUtils.HIVE_PROVIDER) {
      throw new AnalysisException("Hive data source can only be used with tables, you can not " +
        "read files of Hive data source directly.")
    }
    val cls = DataSource.lookupDataSource(source, sparkSession.sessionState.conf)
    if (classOf[DataSourceV2].isAssignableFrom(cls)) {
      val ds = cls.newInstance()
      val options = new DataSourceOptions((extraOptions ++
        DataSourceV2Utils.extractSessionConfigs(
          ds = ds.asInstanceOf[DataSourceV2],
          conf = sparkSession.sessionState.conf)).asJava)
      // Streaming also uses the data source V2 API. So it may be that the data source implements
      // v2, but has no v2 implementation for batch reads. In that case, we fall back to loading
      // the dataframe as a v1 source.
      val reader = (ds, userSpecifiedSchema) match {
        case (ds: ReadSupportWithSchema, Some(schema)) =>
          ds.createReader(schema, options)
        case (ds: ReadSupport, None) =>
          ds.createReader(options)
        case (ds: ReadSupportWithSchema, None) =>
          throw new AnalysisException(s"A schema needs to be specified when using $ds.")
        case (ds: ReadSupport, Some(schema)) =>
          val reader = ds.createReader(options)
          if (reader.readSchema() != schema) {
            throw new AnalysisException(s"$ds does not allow user-specified schemas.")
          }
          reader
        case _ => null // fall back to v1
      }
      if (reader == null) {
        loadV1Source(paths: _*)
      } else {
        Dataset.ofRows(sparkSession, DataSourceV2Relation(reader))
      }
    } else {
      loadV1Source(paths: _*)
    }
  }
  private def loadV1Source(paths: String*) = {
    // Code path for data source v1.
    sparkSession.baseRelationToDataFrame(
      DataSource.apply(
        sparkSession,
        paths = paths,
        userSpecifiedSchema = userSpecifiedSchema,
        className = source,
        options = extraOptions.toMap).resolveRelation())
  }
------------------------------------------------------
private var source: String = sparkSession.sessionState.conf.defaultDataSourceName
-------------------------------------------------------
def defaultDataSourceName: String = getConf(DEFAULT_DATA_SOURCE_NAME)
--------------------------------------------------------
// This is used to set the default data source
  val DEFAULT_DATA_SOURCE_NAME = buildConf("spark.sql.sources.default")
    .doc("The default data source to use in input/output.")
    .stringConf
    .createWithDefault("parquet")
```

从源码中可以看出，如果不指定format，load默认读取的是parquet文件

```
scala> val users = spark.read.load("file:///home/hadoop/app/spark-2.3.1-bin-2.6.0-cdh5.7.0/examples/src/main/resources/users.parquet")
scala> users.show()
+------+--------------+----------------+                                        
|  name|favorite_color|favorite_numbers|
+------+--------------+----------------+
|Alyssa|          null|  [3, 9, 15, 20]|
|   Ben|           red|              []|
+------+--------------+----------------+
```

读取其他格式的文件，必须通过format指定文件格式，如下：

```
//windows idea环境下
val df1 = spark.read.format("json").option("timestampFormat", "yyyy/MM/dd HH:mm:ss ZZ").load("hdfs://192.168.137.141:9000/data/people.json")
df1.show()
+----+-------+
| age|   name|
+----+-------+
|null|Michael|
|  30|   Andy|
|  19| Justin|
+----+-------+
```

<font color=#FF4500>option("timestampFormat", "yyyy/MM/dd HH:mm:ss ZZ")必须带上，不然报错</font>

```
Exception in thread "main" java.lang.IllegalArgumentException: Illegal pattern component: XXX
```

#### 读取CSV格式文件

```
//源文件内容如下：
[hadoop@hadoop001 ~]$ hadoop fs -text /data/people.csv
name;age;job
Jorge;30;Developer
Bob;32;Developer

//windows idea环境下
val df2 = spark.read.format("csv")
      .option("timestampFormat", "yyyy/MM/dd HH:mm:ss ZZ")
      .option("sep",";")
      .option("header","true")     //use first line of all files as header
      .option("inferSchema","true")
      .load("hdfs://192.168.137.141:9000/data/people.csv")
df2.show()
df2.printSchema()
//输出结果：
+-----+---+---------+
| name|age|      job|
+-----+---+---------+
|Jorge| 30|Developer|
|  Bob| 32|Developer|
+-----+---+---------+
root
 |-- name: string (nullable = true)
 |-- age: integer (nullable = true)
 |-- job: string (nullable = true)
-----------------------------------------------------------
//如果不指定option("sep",";")
+------------------+
|      name;age;job|
+------------------+
|Jorge;30;Developer|
|  Bob;32;Developer|
+------------------+
//如果不指定option("header","true")
+-----+---+---------+
|  _c0|_c1|      _c2|
+-----+---+---------+
| name|age|      job|
|Jorge| 30|Developer|
|  Bob| 32|Developer|
+-----+---+---------+
```

读取csv格式文件还可以自定义schema

```
val peopleschema = StructType(Array(
StructField("hlwname",StringType,true), 
StructField("hlwage",IntegerType,true), 
StructField("hlwjob",StringType,true)))
val df2 = spark.read.format("csv").option("timestampFormat", "yyyy/MM/dd HH:mm:ss ZZ").option("sep",";")
        .option("header","true")
        .schema(peopleschema)
        .load("hdfs://192.168.137.141:9000/data/people.csv")
      //打印测试
      df2.show()
      df2.printSchema()
输出结果：
+-------+------+---------+
|hlwname|hlwage|   hlwjob|
+-------+------+---------+
|  Jorge|    30|Developer|
|    Bob|    32|Developer|
+-------+------+---------+
root
 |-- hlwname: string (nullable = true)
 |-- hlwage: integer (nullable = true)
 |-- hlwjob: string (nullable = true)
```

### 将读取的文件以其他格式写出

```
//将上文读取的users.parquet以json格式写出
scala> users.select("name","favorite_color").write.format("json").save("file:///home/hadoop/tmp/parquet2json/")
[hadoop@hadoop000 ~]$ cd /home/hadoop/tmp/parquet2json
[hadoop@hadoop000 parquet2json]$ ll
total 4
-rw-r--r--. 1 hadoop hadoop 56 Sep 24 10:15 part-00000-dfbd9ba5-598f-4e0c-8e81-df85120333db-c000.json
-rw-r--r--. 1 hadoop hadoop  0 Sep 24 10:15 _SUCCESS
[hadoop@hadoop000 parquet2json]$ cat part-00000-dfbd9ba5-598f-4e0c-8e81-df85120333db-c000.json 
{"name":"Alyssa"}
{"name":"Ben","favorite_color":"red"}

//将上文读取的people.json以csv格式写出
df1.write.format("csv")
     .mode("overwrite")
     .option("timestampFormat", "yyyy/MM/dd HH:mm:ss ZZ")
     .save("hdfs://192.168.137.141:9000/data/formatconverttest/")
------------------------------------------
[hadoop@hadoop001 ~]$ hadoop fs -text /data/formatconverttest/part-00000-6fd65eff-d0d3-43e5-9549-2b11bc3ca9de-c000.csv
,Michael
30,Andy
19,Justin
//发现若没有.option("header","true")，写出的csv丢失了首行的age,name信息
//若不指定.option("sep",";")，默认逗号为分隔符
```

此操作的目的在于学会类型转换，生产上最开始进来的数据大多都是text，json等行式存储的文件，一般都要转成ORC，parquet列式存储的文件，加上压缩，能把文件大小减小到10%左右，大幅度减小IO和数据处理量，提高性能

此时如果再执行一次save，路径不变，则会报错：

```
scala> users.select("name","favorite_color").write.format("json").save("file:///home/hadoop/tmp/parquet2json/")
org.apache.spark.sql.AnalysisException: path file:/home/hadoop/tmp/parquet2json already exists.;
  at org.apache.spark.sql.execution.datasources.InsertIntoHadoopFsRelationCommand.run(InsertIntoHadoopFsRelationCommand.scala:109)
  at org.apache.spark.sql.execution.command.DataWritingCommandExec.sideEffectResult$lzycompute(commands.scala:104)
.........................................................
```

可以通过设置savemode来解决这个问题

![enter description here](/assets/blogImg/2019-03-01-2.png)

默认是errorifexists

```
scala> users.select("name","favorite_color").write.format("json").mode("overwrite").save("file:///home/hadoop/tmp/parquet2json/")
```