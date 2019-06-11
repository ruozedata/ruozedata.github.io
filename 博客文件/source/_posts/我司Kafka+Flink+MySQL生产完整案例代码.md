---
layout: post
title: "我司Kafka+Flink+MySQL生产完整案例代码"
date: 2018-12-20
comments: true
tags: 
	- flink
categories: Flink
---



<font color=#FF4500 >
</font>

###### 1.版本信息：

Flink Version:1.6.2
Kafka Version:0.9.0.0
MySQL Version:5.6.21
###### 2.Kafka 消息样例及格式：[IP TIME URL STATU_CODE REFERER]
```
1.74.103.143    2018-12-20 18:12:00  "GET /class/130.html HTTP/1.1"     404 https://search.yahoo.com/search?p=Flink实战
```
<!--more--> 
###### 3.工程pom.xml
```
<scala.version>2.11.8</scala.version>
<flink.version>1.6.2</flink.version>
 <dependency>
      <groupId>org.apache.flink</groupId>
      <artifactId>flink-java</artifactId>
      <version>${flink.version}</version>
    </dependency>
    <dependency>
      <groupId>org.apache.flink</groupId>
      <artifactId>flink-streaming-java_2.11</artifactId>
      <version>${flink.version}</version>
    </dependency>
    <dependency>
      <groupId>org.apache.flink</groupId>
      <artifactId>flink-clients_2.11</artifactId>
      <version>${flink.version}</version>
    </dependency>
    <!--Flink-Kafka -->
    <dependency>
      <groupId>org.apache.flink</groupId>
      <artifactId>flink-connector-kafka-0.9_2.11</artifactId>
      <version>${flink.version}</version>
    </dependency>
    <dependency>
      <groupId>mysql</groupId>
      <artifactId>mysql-connector-java</artifactId>
      <version>5.1.39</version>
    </dependency>
```
4.sConf类 定义与MySQL连接的JDBC的参数
```
package com.soul.conf;
/**
 * @author 若泽数据soulChun
 * @create 2018-12-20-15:11
 */
public class sConf {
    public static final String USERNAME = "root";
    public static final String PASSWORD = "www.ruozedata.com";
    public static final String DRIVERNAME = "com.mysql.jdbc.Driver";
    public static final String URL = "jdbc:mysql://localhost:3306/soul";
}
```
###### 5.MySQLSlink类
```
package com.soul.kafka;
import com.soul.conf.sConf;
import org.apache.flink.api.java.tuple.Tuple5;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.functions.sink.RichSinkFunction;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
/**
 * @author 若泽数据soulChun
 * @create 2018-12-20-15:09
 */
public class MySQLSink extends RichSinkFunction<Tuple5<String, String, String, String, String>> {
    private static final long serialVersionUID = 1L;
    private Connection connection;
    private PreparedStatement preparedStatement;
    public void invoke(Tuple5<String, String, String, String, String> value) {
        try {
            if (connection == null) {
                Class.forName(sConf.DRIVERNAME);
                connection = DriverManager.getConnection(sConf.URL, sConf.USERNAME, sConf.PASSWORD);
            }
            String sql = "insert into log_info (ip,time,courseid,status_code,referer) values (?,?,?,?,?)";
            preparedStatement = connection.prepareStatement(sql);
            preparedStatement.setString(1, value.f0);
            preparedStatement.setString(2, value.f1);
            preparedStatement.setString(3, value.f2);
            preparedStatement.setString(4, value.f3);
            preparedStatement.setString(5, value.f4);
            System.out.println("Start insert");
            preparedStatement.executeUpdate();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    public void open(Configuration parms) throws Exception {
        Class.forName(sConf.DRIVERNAME);
        connection = DriverManager.getConnection(sConf.URL, sConf.USERNAME, sConf.PASSWORD);
    }
    public void close() throws Exception {
        if (preparedStatement != null) {
            preparedStatement.close();
        }
        if (connection != null) {
            connection.close();
        }
    }
}
```
###### 6.数据清洗日期工具类
```
package com.soul.utils;
import org.apache.commons.lang3.time.FastDateFormat;
import java.util.Date;
/**
 * @author soulChun
 * @create 2018-12-19-18:44
 */
public class DateUtils {
    private static FastDateFormat SOURCE_FORMAT = FastDateFormat.getInstance("yyyy-MM-dd HH:mm:ss");
    private static FastDateFormat TARGET_FORMAT = FastDateFormat.getInstance("yyyyMMddHHmmss");
    public static Long  getTime(String  time) throws Exception{
        return SOURCE_FORMAT.parse(time).getTime();
    }
    public static String parseMinute(String time) throws  Exception{
        return TARGET_FORMAT.format(new Date(getTime(time)));
    }
    
    //测试一下
    public static void main(String[] args) throws Exception{
        String time = "2018-12-19 18:55:00";
        System.out.println(parseMinute(time));
    }
}
```

###### 7.MySQL建表

```
create table log_info(
ID INT NOT NULL AUTO_INCREMENT,
IP VARCHAR(50),
TIME VARCHAR(50),
CourseID VARCHAR(10),
Status_Code VARCHAR(10),
Referer VARCHAR(100),
PRIMARY KEY ( ID )
)ENGINE=InnoDB DEFAULT CHARSET=utf8;
```
###### 8.主程序：

主要是将time的格式转成yyyyMMddHHmmss,

还有取URL中的课程ID，将不是/class开头的过滤掉。
```
package com.soul.kafka;
import com.soul.utils.DateUtils;
import org.apache.flink.api.common.functions.FilterFunction;
import org.apache.flink.api.common.functions.MapFunction;
import org.apache.flink.api.common.serialization.SimpleStringSchema;
import org.apache.flink.api.java.tuple.Tuple5;
import org.apache.flink.streaming.api.TimeCharacteristic;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.connectors.kafka.FlinkKafkaConsumer09;
import java.util.Properties;
/**
 * @author soulChun
 * @create 2018-12-19-17:23
 */
public class FlinkCleanKafka {
    public static void main(String[] args) throws Exception {
        final StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.enableCheckpointing(5000);
        Properties properties = new Properties();
        properties.setProperty("bootstrap.servers", "localhost:9092");//kafka的节点的IP或者hostName，多个使用逗号分隔
        properties.setProperty("zookeeper.connect", "localhost:2181");//zookeeper的节点的IP或者hostName，多个使用逗号进行分隔
        properties.setProperty("group.id", "test-consumer-group");//flink consumer flink的消费者的group.id
        FlinkKafkaConsumer09<String> myConsumer = new FlinkKafkaConsumer09<String>("imooc_topic", new SimpleStringSchema(), properties);
        DataStream<String> stream = env.addSource(myConsumer);
//        stream.print().setParallelism(2);
        DataStream CleanData = stream.map(new MapFunction<String, Tuple5<String, String, String, String, String>>() {
            @Override
            public Tuple5<String, String, String, String, String> map(String value) throws Exception {
                String[] data = value.split("\\\t");
                String CourseID = null;
                String url = data[2].split("\\ ")[2];
                if (url.startsWith("/class")) {
                    String CourseHTML = url.split("\\/")[2];
                    CourseID = CourseHTML.substring(0, CourseHTML.lastIndexOf("."));
//                    System.out.println(CourseID);
                }
                return Tuple5.of(data[0], DateUtils.parseMinute(data[1]), CourseID, data[3], data[4]);
            }
        }).filter(new FilterFunction<Tuple5<String, String, String, String, String>>() {
            @Override
            public boolean filter(Tuple5<String, String, String, String, String> value) throws Exception {
                return value.f2 != null;
            }
        });
        CleanData.addSink(new MySQLSink());
        env.execute("Flink kafka");
    }
}
```

###### 9.启动主程序，查看MySQL表数据在递增
```
mysql> select count(*) from log_info;
+----------+
| count(*) |
+----------+
|    15137 |
+----------+
```
Kafka过来的消息是我模拟的，一分钟产生100条。

以上是我司生产项目代码的抽取出来的案例代码V1。稍后还有WaterMark之类会做分享。

