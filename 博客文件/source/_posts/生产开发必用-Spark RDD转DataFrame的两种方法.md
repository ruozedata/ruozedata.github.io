---
layout: post
title: "生产开发必用-Spark RDD转DataFrame的两种方法"
date: 2018-06-14
comments: true
tags: 
	- spark
	- 高级
categories: Spark Core
---


本篇文章将介绍Spark SQL中的DataFrame，关于DataFrame的介绍可以参考:
https://blog.csdn.net/lemonzhaotao/article/details/80211231

在本篇文章中，将介绍RDD转换为DataFrame的2种方式

官网之RDD转DF: 
http://spark.apache.org/docs/latest/sql-programming-guide.html#interoperating-with-rdds
<!--more--> 
DataFrame 与 RDD 的交互

Spark SQL它支持两种不同的方式转换已经存在的RDD到DataFrame

#### 方法一
第一种方式是使用反射的方式，用反射去推倒出来RDD里面的schema。这个方式简单，但是不建议使用，因为在工作当中，使用这种方式是有限制的。 
对于以前的版本来说，case class最多支持22个字段如果超过了22个字段，我们就必须要自己开发一个类，实现product接口才行。因此这种方式虽然简单，但是不通用；因为生产中的字段是非常非常多的，是不可能只有20来个字段的。 
示例：
```
/**
  * convert rdd to dataframe 1
  * @param spark
  */
private def runInferSchemaExample(spark:SparkSession): Unit ={
  import spark.implicits._
  val rdd = spark.sparkContext.textFile("E:/大数据/data/people.txt")
  val df = rdd.map(_.split(","))
              .map(x => People(x(0), x(1).trim.toInt))  //将rdd的每一行都转换成了一个people
              .toDF         //必须先导入import spark.implicits._  不然这个方法会报错
  df.show()
  df.createOrReplaceTempView("people")
  // 这个DF包含了两个字段name和age
  val teenagersDF = spark.sql("SELECT name, age FROM people WHERE age BETWEEN 13 AND 19")
  // teenager(0)代表第一个字段
  // 取值的第一种方式：index from zero
  teenagersDF.map(teenager => "Name: " + teenager(0)).show()
  // 取值的第二种方式：byName
  teenagersDF.map(teenager => "Name: " + teenager.getAs[String]("name") + "," + teenager.getAs[Int]("age")).show()
}
// 注意：case class必须定义在main方法之外；否则会报错
case class People(name:String, age:Int)
```
#### 方法二

创建一个DataFrame，使用编程的方式 这个方式用的非常多。通过编程方式指定schema ，对于第一种方式的schema其实定义在了case class里面了。 
官网解读： 
当我们的case class不能提前定义(因为业务处理的过程当中，你的字段可能是在变化的),因此使用case class很难去提前定义。 
使用该方式创建DF的三大步骤：
- Create an RDD of Rows from the original RDD;
- Create the schema represented by a StructType matching the structure of Rows in the RDD created in Step 1.
- Apply the schema to the RDD of Rows via createDataFrame method provided by SparkSession.
示例：
```
/**
  * convert rdd to dataframe 2
  * @param spark
  */
private def runProgrammaticSchemaExample(spark:SparkSession): Unit ={
  // 1.转成RDD
  val rdd = spark.sparkContext.textFile("E:/大数据/data/people.txt")
  // 2.定义schema，带有StructType的
  // 定义schema信息
  val schemaString = "name age"
  // 对schema信息按空格进行分割
  // 最终fileds里包含了2个StructField
  val fields = schemaString.split(" ")
                            // 字段类型，字段名称判断是不是为空
                           .map(fieldName => StructField(fieldName, StringType, nullable = true))
  val schema = StructType(fields)
  // 3.把我们的schema信息作用到RDD上
  //   这个RDD里面包含了一些行
  // 形成Row类型的RDD
  val rowRDD = rdd.map(_.split(","))
                  .map(x => Row(x(0), x(1).trim))
  // 通过SparkSession创建一个DataFrame
  // 传进来一个rowRDD和schema，将schema作用到rowRDD上
  val peopleDF = spark.createDataFrame(rowRDD, schema)
  peopleDF.show()
}
```
#### [扩展]生产上创建DataFrame的代码举例

在实际生产环境中，我们其实选择的是方式二这种进行创建DataFrame的，这里将展示部分代码：
#### Schema的定义
```
object AccessConvertUtil {
  val struct = StructType(
    Array(
      StructField("url",StringType),
      StructField("cmsType",StringType),
      StructField("cmsId",LongType),
      StructField("traffic",LongType),
      StructField("ip",StringType),
      StructField("city",StringType),
      StructField("time",StringType),
      StructField("day",StringType)
    )
  )
  /**
    * 根据输入的每一行信息转换成输出的样式
    */
  def parseLog(log:String) = {
    try {
      val splits = log.split("\t")
      val url = splits(1)
      val traffic = splits(2).toLong
      val ip = splits(3)
      val domain = "http://www.imooc.com/"
      val cms = url.substring(url.indexOf(domain) + domain.length)
      val cmsTypeId = cms.split("/")
      var cmsType = ""
      var cmsId = 0l
      if (cmsTypeId.length > 1) {
        cmsType = cmsTypeId(0)
        cmsId = cmsTypeId(1).toLong
      }
      val city = IpUtils.getCity(ip)
      val time = splits(0)
      val day = time.substring(0,10).replace("-","")
      //这个Row里面的字段要和struct中的字段对应上
      Row(url, cmsType, cmsId, traffic, ip, city, time, day)
    } catch {
      case e: Exception => Row(0)
    }
  }
}
```
#### 创建DataFrame
```
object SparkStatCleanJob {
  def main(args: Array[String]): Unit = {
    val spark = SparkSession.builder().appName("SparkStatCleanJob")
      .master("local[2]").getOrCreate()
    val accessRDD = spark.sparkContext.textFile("/Users/lemon/project/data/access.log")
    //accessRDD.take(10).foreach(println)
    //RDD ==> DF，创建生成DataFrame
    val accessDF = spark.createDataFrame(accessRDD.map(x => AccessConvertUtil.parseLog(x)),
      AccessConvertUtil.struct)
    accessDF.coalesce(1).write.format("parquet").mode(SaveMode.Overwrite)
            .partitionBy("day").save("/Users/lemon/project/clean")
    spark.stop()
  }
}
```