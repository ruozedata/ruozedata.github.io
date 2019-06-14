---
layout: post
title: "生产SparkStreaming数据零丢失最佳实践(含代码)"
date: 2019-06-14
comments: true
tags: [spark,spark streaming,高级]
categories: [Spark Streaming]
---



## MySQL创建存储offset的表格

```
mysql> use test
mysql> create table hlw_offset(
        topic varchar(32),
        groupid varchar(50),
        partitions int,
        fromoffset bigint,
        untiloffset bigint,
        primary key(topic,groupid,partitions)
        );
```
<!--more--> 
## Maven依赖包

```
<scala.version>2.11.8</scala.version>
<spark.version>2.3.1</spark.version>
<scalikejdbc.version>2.5.0</scalikejdbc.version>
--------------------------------------------------
<dependency>
    <groupId>org.scala-lang</groupId>
    <artifactId>scala-library</artifactId>
    <version>${scala.version}</version>
</dependency>
<dependency>
    <groupId>org.apache.spark</groupId>
    <artifactId>spark-core_2.11</artifactId>
    <version>${spark.version}</version>
</dependency>
<dependency>
    <groupId>org.apache.spark</groupId>
    <artifactId>spark-sql_2.11</artifactId>
    <version>${spark.version}</version>
</dependency>
<dependency>
    <groupId>org.apache.spark</groupId>
    <artifactId>spark-streaming_2.11</artifactId>
    <version>${spark.version}</version>
</dependency>
<dependency>
    <groupId>org.apache.spark</groupId>
    <artifactId>spark-streaming-kafka-0-8_2.11</artifactId>
    <version>${spark.version}</version>
</dependency>
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <version>5.1.27</version>
</dependency>
<!-- https://mvnrepository.com/artifact/org.scalikejdbc/scalikejdbc -->
<dependency>
    <groupId>org.scalikejdbc</groupId>
    <artifactId>scalikejdbc_2.11</artifactId>
    <version>2.5.0</version>
</dependency>
<dependency>
    <groupId>org.scalikejdbc</groupId>
    <artifactId>scalikejdbc-config_2.11</artifactId>
    <version>2.5.0</version>
</dependency>
<dependency>
    <groupId>com.typesafe</groupId>
    <artifactId>config</artifactId>
    <version>1.3.0</version>
</dependency>
<dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-lang3</artifactId>
    <version>3.5</version>
</dependency>
```

## 实现思路

```
1）StreamingContext
2）从kafka中获取数据(从外部存储获取offset-->根据offset获取kafka中的数据)
3）根据业务进行逻辑处理
4）将处理结果存到外部存储中--保存offset
5）启动程序，等待程序结束
```

## 代码实现

1. SparkStreaming主体代码如下

	```
	import kafka.common.TopicAndPartition
	import kafka.message.MessageAndMetadata
	import kafka.serializer.StringDecoder
	import org.apache.spark.SparkConf
	import org.apache.spark.streaming.kafka.{HasOffsetRanges, KafkaUtils}
	import org.apache.spark.streaming.{Seconds, StreamingContext}
	import scalikejdbc._
	import scalikejdbc.config._
	object JDBCOffsetApp {
	  def main(args: Array[String]): Unit = {
	    //创建SparkStreaming入口
	    val conf = new SparkConf().setMaster("local[2]").setAppName("JDBCOffsetApp")
	    val ssc = new StreamingContext(conf,Seconds(5))
	    //kafka消费主题
	    val topics = ValueUtils.getStringValue("kafka.topics").split(",").toSet
	    //kafka参数
	    //这里应用了自定义的ValueUtils工具类，来获取application.conf里的参数，方便后期修改
	    val kafkaParams = Map[String,String](
	      "metadata.broker.list"->ValueUtils.getStringValue("metadata.broker.list"),
	      "auto.offset.reset"->ValueUtils.getStringValue("auto.offset.reset"),
	      "group.id"->ValueUtils.getStringValue("group.id")
	    )
	    //先使用scalikejdbc从MySQL数据库中读取offset信息
	    //+------------+------------------+------------+------------+-------------+
	    //| topic      | groupid          | partitions | fromoffset | untiloffset |
	    //+------------+------------------+------------+------------+-------------+
	    //MySQL表结构如上，将“topic”，“partitions”，“untiloffset”列读取出来
	    //组成 fromOffsets: Map[TopicAndPartition, Long]，后面createDirectStream用到
	    DBs.setup()
	    val fromOffset = DB.readOnly( implicit session => {
	      SQL("select * from hlw_offset").map(rs => {
	        (TopicAndPartition(rs.string("topic"),rs.int("partitions")),rs.long("untiloffset"))
	      }).list().apply()
	    }).toMap
	    //如果MySQL表中没有offset信息，就从0开始消费；如果有，就从已经存在的offset开始消费
	      val messages = if (fromOffset.isEmpty) {
	        println("从头开始消费...")
	        KafkaUtils.createDirectStream[String,String,StringDecoder,StringDecoder](ssc,kafkaParams,topics)
	      } else {
	        println("从已存在记录开始消费...")
	        val messageHandler = (mm:MessageAndMetadata[String,String]) => (mm.key(),mm.message())
	        KafkaUtils.createDirectStream[String,String,StringDecoder,StringDecoder,(String,String)](ssc,kafkaParams,fromOffset,messageHandler)
	      }
	      messages.foreachRDD(rdd=>{
	        if(!rdd.isEmpty()){
	          //输出rdd的数据量
	          println("数据统计记录为："+rdd.count())
	          //官方案例给出的获得rdd offset信息的方法，offsetRanges是由一系列offsetRange组成的数组
	//          trait HasOffsetRanges {
	//            def offsetRanges: Array[OffsetRange]
	//          }
	          val offsetRanges = rdd.asInstanceOf[HasOffsetRanges].offsetRanges
	          offsetRanges.foreach(x => {
	            //输出每次消费的主题，分区，开始偏移量和结束偏移量
	            println(s"---${x.topic},${x.partition},${x.fromOffset},${x.untilOffset}---")
	           //将最新的偏移量信息保存到MySQL表中
	            DB.autoCommit( implicit session => {
	              SQL("replace into hlw_offset(topic,groupid,partitions,fromoffset,untiloffset) values (?,?,?,?,?)")
	            .bind(x.topic,ValueUtils.getStringValue("group.id"),x.partition,x.fromOffset,x.untilOffset)
	              .update().apply()
	            })
	          })
	        }
	      })
	    ssc.start()
	    ssc.awaitTermination()
	  }
	}
	```

2. 自定义的ValueUtils工具类如下

	```
	import com.typesafe.config.ConfigFactory
	import org.apache.commons.lang3.StringUtils
	object ValueUtils {
	val load = ConfigFactory.load()
	  def getStringValue(key:String, defaultValue:String="") = {
	val value = load.getString(key)
	    if(StringUtils.isNotEmpty(value)) {
	      value
	    } else {
	      defaultValue
	    }
	  }
	}
	```
	
3. application.conf内容如下

	```
	metadata.broker.list = "192.168.137.251:9092"
	auto.offset.reset = "smallest"
	group.id = "hlw_offset_group"
	kafka.topics = "hlw_offset"
	serializer.class = "kafka.serializer.StringEncoder"
	request.required.acks = "1"
	# JDBC settings
	db.default.driver = "com.mysql.jdbc.Driver"
	db.default.url="jdbc:mysql://hadoop000:3306/test"
	db.default.user="root"
	db.default.password="123456"
	```

4. 自定义kafka producer

	```
	import java.util.{Date, Properties}
	import kafka.producer.{KeyedMessage, Producer, ProducerConfig}
	object KafkaProducer {
	  def main(args: Array[String]): Unit = {
	    val properties = new Properties()
	    properties.put("serializer.class",ValueUtils.getStringValue("serializer.class"))
	    properties.put("metadata.broker.list",ValueUtils.getStringValue("metadata.broker.list"))
	    properties.put("request.required.acks",ValueUtils.getStringValue("request.required.acks"))
	    val producerConfig = new ProducerConfig(properties)
	    val producer = new Producer[String,String](producerConfig)
	    val topic = ValueUtils.getStringValue("kafka.topics")
	    //每次产生100条数据
	    var i = 0
	    for (i <- 1 to 100) {
	      val runtimes = new Date().toString
	     val messages = new KeyedMessage[String, String](topic,i+"","hlw: "+runtimes)
	      producer.send(messages)
	    }
	    println("数据发送完毕...")
	  }
	}
	```
	
## 测试

1. 启动kafka服务，并创建主题

	```
	[hadoop@hadoop000 bin]$ ./kafka-server-start.sh -daemon /home/hadoop/app/kafka_2.11-0.10.0.1/config/server.properties
	[hadoop@hadoop000 bin]$ ./kafka-topics.sh --list --zookeeper localhost:2181/kafka
	[hadoop@hadoop000 bin]$ ./kafka-topics.sh --create --zookeeper localhost:2181/kafka --replication-factor 1 --partitions 1 --topic hlw_offset
	```

2. 测试前查看MySQL中offset表，刚开始是个空表

	```
	mysql> select * from hlw_offset;
	Empty set (0.00 sec)
	```

3. 通过kafka producer产生500条数据
4. 启动SparkStreaming程序

	```
	//控制台输出结果：
	从头开始消费...
	数据统计记录为：500
	---hlw_offset,0,0,500---
	```
	
	查看MySQL表，offset记录成功
	
	```
	mysql> select * from hlw_offset;
	+------------+------------------+------------+------------+-------------+
	| topic      | groupid          | partitions | fromoffset | untiloffset |
	+------------+------------------+------------+------------+-------------+
	| hlw_offset | hlw_offset_group |          0 |          0 |         500 |
	+------------+------------------+------------+------------+-------------+
	```

5. 关闭SparkStreaming程序，再使用kafka producer生产300条数据,再次启动spark程序（如果spark从500开始消费，说明成功读取了offset，做到了只读取一次语义）

	```
	//控制台结果输出：
	从已存在记录开始消费...
	数据统计记录为：300
	---hlw_offset,0,500,800---
	```

6. 查看更新后的offset MySQL数据

	```
	mysql> select * from hlw_offset;
	+------------+------------------+------------+------------+-------------+
	| topic      | groupid          | partitions | fromoffset | untiloffset |
	+------------+------------------+------------+------------+-------------+
	| hlw_offset | hlw_offset_group |          0 |        500 |         800 |
	+------------+------------------+------------+------------+-------------+
	```