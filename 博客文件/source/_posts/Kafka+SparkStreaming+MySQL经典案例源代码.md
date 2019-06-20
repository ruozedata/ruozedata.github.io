---
layout: post
title: "Kafka+SparkStreaming+MySQL经典案例源代码"
date: 2019-03-18
comments: true
tags: 
    - Spark Streaming
    - 高级
    - Kafka
    - MySQL
categories: [Spark Streaming]

---

<!--more--> 

**步骤：**

- 安装部署单机Kafka
- 创建MySQL表
- SparkStreaming实时消费

## 安装Kafka

注：出于方便以及机器问题，使用单机部署，并不需要另外安装zookeeper，使用kafka自带的zookeeper。

1. 下载[https://kafka.apache.org/downloads](https://kafka.apache.org/downloads)（使用版本：kafka_2.11-0.10.0.1.tgz）
2. 编辑`server.properties`文件
	
	```
	host.name=内网地址      					         # kafka绑定的interface
	advertised.listeners=PLAINTEXT://外网映射地址:9092    # 注册到zookeeper的地址和端口#添加如上两个地址（云主机！）
	log.dirs=/opt/software/kafka/logs		            #配置log日志地址
	```

3. bin/zookeeper-server-start.sh  ../config/zookeeper.properties

	如果使用bin/zookeeper-server-start.sh config/zookeeper.properties会导致无法找到config目录而报错。所以最好将kafka配置到全局环境变量中
	
	使用`nohup /zookeeper-server-start.sh  ../config/zookeeper.properties &` 启动后台服务

4. bin/kafka-server-start.sh ../config/server.properties
	
	可以用使用`nohup kafka-server-start.sh config/server.properties &`启动后台服务

5. bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic test   #创建topic
6. bin/kafka-topics.sh --list --zookeeper localhost:2181 测试是否创建成功
7. 启动生产者：bin/kafka-console-producer.sh --broker-list localhost/或者云主机外网ip:9092 --topic test

## 安装MySQL

1. 使用yum安装mysql5.6

	```
	安装:
    cat >/etc/yum.repos.d/MySQL5.6.repo<<EOF
    # Enable to use MySQL 5.6
    [mysql56-community]
    name=MySQL 5.6 Community Server
    baseurl=http://repo.mysql.com/yum/mysql-5.6-community/el/6/\$basearch/
    enabled=1
    gpgcheck=0
    EOF
    yum -y install mysql-community-server
    # 使用已经下载好的rpm包安装：
    # yum -y localinstall \
    # mysql-community-common-5.6.39-2.el6.x86_64.rpm \
    # mysql-community-client-5.6.39-2.el6.x86_64.rpm \
    # mysql-community-libs-compat-5.6.39-2.el6.x86_64.rpm \
    # mysql-community-libs-5.6.39-2.el6.x86_64.rpm \
    # mysql-community-server-5.6.39-2.el6.x86_64.rpm
    chkconfig mysqld on
    /etc/init.d/mysqld start

    启动:
    mysqladmin -u root password root
    mysql -uroot -proot
    use mysql;
    GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' IDENTIFIED BY 'root' WITH GRANT OPTION;
    GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' IDENTIFIED BY 'root' WITH GRANT OPTION;
    GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY 'root' WITH GRANT OPTION;
    update user set password=password('root') where user='root';
    delete from user where not (user='root') ;
    delete from user where user='root' and password=''; 
    drop database test;
    DROP USER ''@'%';
    flush privileges;
    exit;
	```

2. 创建测试表

	```
    create database ruozedata;
    use ruozedata;
    grant all privileges on ruozedata.* to ruoze@'%' identified by '123456';
    CREATE TABLE `test` ( `ip` varchar(255) NOT NULL, `total` int(11) NOT NULL, PRIMARY KEY (`ip`) ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
	```

## KafkaAndSparkStreamingToMySQL

```
package com.ruozedata.G5
import org.apache.log4j.Level
import org.apache.log4j.Logger
import org.apache.spark.SparkConf
import org.apache.spark.streaming.{Seconds, StreamingContext}
import kafka.serializer.StringDecoder
import org.apache.spark.streaming.kafka.KafkaUtils
import java.sql.DriverManager
import java.sql.PreparedStatement
import java.sql.Connection
object KafkaAndSparkStreamingToMySQL {
  def main(args: Array[String]): Unit = {
    // 减少日志输出
  Logger.getLogger("org.apache.spark").setLevel(Level.ERROR)
  val sparkConf = new SparkConf().setAppName("www.ruozedata.com").setMaster("local[2]")
  val sparkStreaming = new StreamingContext(sparkConf, Seconds(10))
  // 创建topic名称
  val topic = Set("test")
  // 制定Kafka的broker地址
  val kafkaParams = Map[String, String]("metadata.broker.list" -> "139.198.189.141:9092")
  // 创建DStream，接受kafka数据irectStream[String, String, StringDecoder,StringDecoder](sparkStreaming, kafkaParams, topic)
  val kafkaStream = KafkaUtils.createDirectStream[String, String, StringDecoder, StringDecoder](sparkStreaming, kafkaParams, topic)
  val line = kafkaStream.map(e => {
    new String(e.toString())
  })
  // 获取数据
  val logRDD = kafkaStream.map(_._2)
  // 将数据打印在屏幕
  logRDD.print()
  // 对接受的数据进行分词处理
  val datas = logRDD.map(line => {
    // 201.105.101.108,productid=1  输入数据
    val index: Array[String] = line.split(",")
    val ip = index(0);
    (ip, 1)
  })
  // 打印在屏幕
  datas.print()
  // 将数据保存在mysql数据库
  datas.foreachRDD(cs => {
    var conn: Connection = null;
    var ps: PreparedStatement = null;
    try {
      Class.forName("com.mysql.jdbc.Driver").newInstance();
      cs.foreachPartition(f => {
        conn = DriverManager.getConnection(
          "jdbc:mysql://128.12.xx.xx:3306/ruozedata?useUnicode=true&characterEncoding=utf8",
          "ruoze",
          "123456");
        ps = conn.prepareStatement("insert into result values(?,?)");
        f.foreach(s => {
          ps.setString(1, s._1);
          ps.setInt(2, s._2);
          ps.executeUpdate();
        })
      })
    } catch {
      case t: Throwable => t.printStackTrace() // TODO: handle error
    } finally {
      if (ps != null) {
        ps.close()
      }
      if (conn != null) {
        conn.close();
      }
    }
  })
  sparkStreaming.start()
  sparkStreaming.awaitTermination()
}
}
```

## POM文件

```
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/maven-v4_0_0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.ruozedata</groupId>
    <artifactId>train-scala</artifactId>
    <version>1.0</version>
    <inceptionYear>2008</inceptionYear>
    <properties>
        <scala.version>2.11.8</scala.version>
        <spark.version>2.2.0</spark.version>
        <hadoop.version>2.6.0-cdh5.7.0</hadoop.version>
    </properties>
    <repositories>
        <repository>
            <id>scala-tools.org</id>
            <name>Scala-Tools Maven2 Repository</name>
            <url>http://scala-tools.org/repo-releases</url>
        </repository>
        <repository>
            <id>cloudera</id>
            <name>cloudera</name>
            <url>https://repository.cloudera.com/artifactory/cloudera-repos/</url>
        </repository>
    </repositories>
    <pluginRepositories>
        <pluginRepository>
            <id>scala-tools.org</id>
            <name>Scala-Tools Maven2 Repository</name>
            <url>http://scala-tools.org/repo-releases</url>
        </pluginRepository>
    </pluginRepositories>
    <dependencies>
        <!--Scala 依赖-->
        <dependency>
            <groupId>org.scala-lang</groupId>
            <artifactId>scala-library</artifactId>
            <version>${scala.version}</version>
        </dependency>
        <dependency>
            <groupId>org.apache.commons</groupId>
            <artifactId>commons-lang3</artifactId>
            <version>3.5</version>
        </dependency>
        <!--
        <dependency>
            <groupId>org.apache.spark</groupId>
            <artifactId>spark-core_2.11</artifactId>
            <version>${spark.version}</version>
        </dependency>
        -->
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
        <artifactId>spark-streaming-flume_2.11</artifactId>
        <version>${spark.version}</version>
    </dependency>
        <dependency>
            <groupId>org.apache.spark</groupId>
            <artifactId>spark-streaming-kafka-0-8_2.11</artifactId>
            <version>${spark.version}</version>
        </dependency>
        <dependency>
            <groupId>org.apache.hadoop</groupId>
            <artifactId>hadoop-client</artifactId>
            <version>${hadoop.version}</version>
        </dependency>
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>5.1.28</version>
            <scope>provided</scope>
        </dependency>
    </dependencies>
    <build>
        <sourceDirectory>src/main/scala</sourceDirectory>
        <testSourceDirectory>src/test/scala</testSourceDirectory>
        <plugins>
            <plugin>
                <groupId>org.scala-tools</groupId>
                <artifactId>maven-scala-plugin</artifactId>
                <executions>
                    <execution>
                        <goals>
                            <goal>compile</goal>
                            <goal>testCompile</goal>
                        </goals>
                    </execution>
                </executions>
                <configuration>
                    <scalaVersion>${scala.version}</scalaVersion>
                    <args>
                        <arg>-target:jvm-1.5</arg>
                    </args>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-eclipse-plugin</artifactId>
                <configuration>
                    <downloadSources>true</downloadSources>
                    <buildcommands>
                        <buildcommand>ch.epfl.lamp.sdt.core.scalabuilder</buildcommand>
                    </buildcommands>
                    <additionalProjectnatures>
                        <projectnature>ch.epfl.lamp.sdt.core.scalanature</projectnature>
                    </additionalProjectnatures>
                    <classpathContainers>
                        <classpathContainer>org.eclipse.jdt.launching.JRE_CONTAINER</classpathContainer>
                        <classpathContainer>ch.epfl.lamp.sdt.launching.SCALA_CONTAINER</classpathContainer>
                    </classpathContainers>
                </configuration>
            </plugin>
            <plugin>
                <artifactId>maven-assembly-plugin</artifactId>
                <configuration>
                    <archive>
                        <manifest>
                            <mainClass></mainClass>
                        </manifest>
                    </archive>
                    <descriptorRefs>
                        <descriptorRef>jar-with-dependencies</descriptorRef>
                    </descriptorRefs>
                </configuration>
            </plugin>
        </plugins>
    </build>
    <reporting>
        <plugins>
            <plugin>
                <groupId>org.scala-tools</groupId>
                <artifactId>maven-scala-plugin</artifactId>
                <configuration>
                    <scalaVersion>${scala.version}</scalaVersion>
                </configuration>
            </plugin>
        </plugins>
    </reporting>
</project>
```

<font color=#FF4500>样本数据模拟kafka生产消费的:</font>

![生产消费](/assets/pic/2019-03-18-1.png)

<font color=#FF4500>样本数据写入到kafka,spark streaming消费，写入到mysql:</font>

![写入到mysql](/assets/pic/2019-03-18-2.png)

<font color=#FF4500>spark streaming打印结果:</font>

![打印结果](/assets/pic/2019-03-18-3.png)