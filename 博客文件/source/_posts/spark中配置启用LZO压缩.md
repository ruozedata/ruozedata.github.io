---
layout: post
title: "spark中配置启用LZO压缩"
date: 2018-08-20
comments: true
tags: 
	- spark
	- 高级
categories: Spark Other
---

Spark中配置启用LZO压缩，步骤如下：
### 一、spark-env.sh配置
```
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/app/hadoop-2.6.0-cdh5.7.0/lib/native
export SPARK_LIBRARY_PATH=$SPARK_LIBRARY_PATH:/app/hadoop-2.6.0-cdh5.7.0/lib/native
export SPARK_CLASSPATH=$SPARK_CLASSPATH:/app/hadoop-2.6.0-cdh5.7.0/share/hadoop/yarn/*:/app/hadoop-2.6.0-cdh5.7.0/share/hadoop/yarn/lib/*:/app/hadoop-2.6.0-cdh5.7.0/share/hadoop/common/*:/app/hadoop-2.6.0-cdh5.7.0/share/hadoop/common/lib/*:/app/hadoop-2.6.0-cdh5.7.0/share/hadoop/hdfs/*:/app/hadoop-2.6.0-cdh5.7.0/share/hadoop/hdfs/lib/*:/app/hadoop-2.6.0-cdh5.7.0/share/hadoop/mapreduce/*:/app/hadoop-2.6.0-cdh5.7.0/share/hadoop/mapreduce/lib/*:/app/hadoop-2.6.0-cdh5.7.0/share/hadoop/tools/lib/*:/app/spark-2.2.0-bin-2.6.0-cdh5.7.0/jars/*
```
### 二、spark-defaults.conf配置
```
spark.driver.extraClassPath /app/hadoop-2.6.0-cdh5.7.0/share/hadoop/common/hadoop-lzo-0.4.19.jar
spark.executor.extraClassPath /app/hadoop-2.6.0-cdh5.7.0/share/hadoop/common/hadoop-lzo-0.4.19.jar
```
<font color=#FF4500 >注：指向编译生成lzo的jar包</font>
<!--more--> 
### 三、测试
#### 1、读取Lzo文件
```
spark-shell --master local[2]
scala> import com.hadoop.compression.lzo.LzopCodec
scala> val page_views = sc.textFile("/user/hive/warehouse/page_views_lzo/page_views.dat.lzo")
```
#### 2、写出lzo文件
```
spark-shell --master local[2]
scala> import com.hadoop.compression.lzo.LzopCodec
scala> val lzoTest = sc.parallelize(1 to 10)
scala> lzoTest.saveAsTextFile("/input/test_lzo", classOf[LzopCodec])
```
结果：
```
[hadoop@spark220 common]$ hdfs dfs -ls /input/test_lzo
Found 3 items
-rw-r--r--   1 hadoop supergroup          0 2018-03-16 23:24 /input/test_lzo/_SUCCESS
-rw-r--r--   1 hadoop supergroup         60 2018-03-16 23:24 /input/test_lzo/part-00000.lzo
-rw-r--r--   1 hadoop supergroup         61 2018-03-16 23:24 /input/test_lzo/part-00001.lzo
```
至此配置与测试完成。
### 四、配置与测试中存问题
#### 1、引用native，缺少LD_LIBRARY_PATH
##### 1.1、错误提示：
```
Caused by: java.lang.RuntimeException: native-lzo library not available
  at com.hadoop.compression.lzo.LzopCodec.getDecompressorType(LzopCodec.java:120)
  at org.apache.hadoop.io.compress.CodecPool.getDecompressor(CodecPool.java:178)
  at org.apache.hadoop.mapred.LineRecordReader.(LineRecordReader.java:111)
  at org.apache.hadoop.mapred.TextInputFormat.getRecordReader(TextInputFormat.java:67)
  at org.apache.spark.rdd.HadoopRDD$$anon$1.liftedTree1$1(HadoopRDD.scala:246)
  at org.apache.spark.rdd.HadoopRDD$$anon$1.(HadoopRDD.scala:245)
  at org.apache.spark.rdd.HadoopRDD.compute(HadoopRDD.scala:203)
  at org.apache.spark.rdd.HadoopRDD.compute(HadoopRDD.scala:94)
  at org.apache.spark.rdd.RDD.computeOrReadCheckpoint(RDD.scala:323)
  at org.apache.spark.rdd.RDD.iterator(RDD.scala:287)
  at org.apache.spark.rdd.MapPartitionsRDD.compute(MapPartitionsRDD.scala:38)
  at org.apache.spark.rdd.RDD.computeOrReadCheckpoint(RDD.scala:323)
  at org.apache.spark.rdd.RDD.iterator(RDD.scala:287)
  at org.apache.spark.scheduler.ResultTask.runTask(ResultTask.scala:87)
  at org.apache.spark.scheduler.Task.run(Task.scala:108)
  at org.apache.spark.executor.Executor$TaskRunner.run(Executor.scala:335)
  at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1149)
  at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:624)
  at java.lang.Thread.run(Thread.java:748)
```
##### 1.2、解决办法：在spark的conf中配置spark-evn.sh，增加以下内容：
```
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/app/hadoop-2.6.0-cdh5.7.0/lib/native
export SPARK_LIBRARY_PATH=$SPARK_LIBRARY_PATH:/app/hadoop-2.6.0-cdh5.7.0/lib/native
export SPARK_CLASSPATH=$SPARK_CLASSPATH:/app/hadoop-2.6.0-cdh5.7.0/share/hadoop/yarn/*:/app/hadoop-2.6.0-cdh5.7.0/share/hadoop/yarn/lib/*:/app/hadoop-2.6.0-cdh5.7.0/share/hadoop/common/*:/app/hadoop-2.6.0-cdh5.7.0/share/hadoop/common/lib/*:/app/hadoop-2.6.0-cdh5.7.0/share/hadoop/hdfs/*:/app/hadoop-2.6.0-cdh5.7.0/share/hadoop/hdfs/lib/*:/app/hadoop-2.6.0-cdh5.7.0/share/hadoop/mapreduce/*:/app/hadoop-2.6.0-cdh5.7.0/share/hadoop/mapreduce/lib/*:/app/hadoop-2.6.0-cdh5.7.0/share/hadoop/tools/lib/*:/app/spark-2.2.0-bin-2.6.0-cdh5.7.0/jars/*
```
#### 2、无法找到LzopCodec类
##### 2.1、错误提示：
```
Caused by: java.lang.IllegalArgumentException: Compression codec com.hadoop.compression.lzo.LzopCodec not found.
    at org.apache.hadoop.io.compress.CompressionCodecFactory.getCodecClasses(CompressionCodecFactory.java:135)
    at org.apache.hadoop.io.compress.CompressionCodecFactory.<init>(CompressionCodecFactory.java:175)
    at org.apache.hadoop.mapred.TextInputFormat.configure(TextInputFormat.java:45)
Caused by: java.lang.ClassNotFoundException: Class com.hadoop.compression.lzo.LzopCodec not found
    at org.apache.hadoop.conf.Configuration.getClassByName(Configuration.java:1980)
    at org.apache.hadoop.io.compress.CompressionCodecFactory.getCodecClasses(CompressionCodecFactory.java:128)

```
##### 2.2、解决办法：在spark的conf中配置spark-defaults.conf，增加以下内容：
```

spark.driver.extraClassPath /app/hadoop-2.6.0-cdh5.7.0/share/hadoop/common/hadoop-lzo-0.4.19.jar
spark.executor.extraClassPath /app/hadoop-2.6.0-cdh5.7.0/share/hadoop/common/hadoop-lzo-0.4.19.ja
```