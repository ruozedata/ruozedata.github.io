---
layout: post
title: "5min掌握，Hive的HiveServer2 和JDBC客户端&代码的生产使用"
date: 2018-05-04
comments: true
tags: 
	- hive
categories:  Hive
---

<font color=#FF4500 >
</font>

![](/assets/blogImg/504_1.png)
<!--more--> 
###### 1. 介绍：
两者都允许远程客户端使用多种编程语言，通过HiveServer或者HiveServer2，
客户端可以在不启动CLI的情况下对Hive中的数据进行操作，
两者都允许远程客户端使用多种编程语言如java，python等向hive提交请求，取回结果
（从hive0.15起就不再支持hiveserver了），但是在这里我们还是要说一下HiveServer。

HiveServer或者HiveServer2都是基于Thrift的，但HiveSever有时被称为Thrift server，
而HiveServer2却不会。既然已经存在HiveServer，为什么还需要HiveServer2呢？
这是因为HiveServer不能处理多于一个客户端的并发请求，这是由于HiveServer使用的Thrift接口所导致的限制，
不能通过修改HiveServer的代码修正。

因此在Hive-0.11.0版本中重写了HiveServer代码得到了HiveServer2，进而解决了该问题。
HiveServer2支持多客户端的并发和认证，为开放API客户端如采用jdbc、odbc、beeline的方式进行连接。

###### 2.配置参数
Hiveserver2允许在配置文件hive-site.xml中进行配置管理，具体的参数为：
参数 | 含义 | 
-|-|
hive.server2.thrift.min.worker.threads|  最小工作线程数，默认为5。  
hive.server2.thrift.max.worker.threads|  最小工作线程数，默认为500。  
hive.server2.thrift.port|  TCP 的监听端口，默认为10000。  
hive.server2.thrift.bind.host|  TCP绑定的主机，默认为localhost 

配置监听端口和路径
```
vi hive-site.xml
<property>
     <name>hive.server2.thrift.port</name>
     <value>10000</value>
</property>
<property>
    <name>hive.server2.thrift.bind.host</name>
    <value>192.168.48.130</value>
</property>
```
###### 3. 启动hiveserver2

使用hadoop用户启动
```
[hadoop@hadoop001 ~]$ cd /opt/software/hive/bin/
[hadoop@hadoop001 bin]$ hiveserver2 
which: no hbase in (/opt/software/hive/bin:/opt/software/hadoop/sbin:/opt/software/hadoop/bin:/opt/software/apache-maven-3.3.9/bin:/usr/java/jdk1.8.0_45/bin:/usr/lib64/qt-3.3/bin:/usr/local/bin:/bin:/usr/bin:/usr/local/sbin:/usr/sbin:/sbin:/home/hadoop/bin)
```

###### 4. 重新开个窗口，使用beeline方式连接
- -n 指定机器登陆的名字，当前机器的登陆用户名
- -u 指定一个连接串
- 每成功运行一个命令，hiveserver2启动的那个窗口，只要在启动beeline的窗口中执行成功一条命令，另外个窗口随即打印一个OK
- 如果命令错误，hiveserver2那个窗口就会抛出异常

使用hadoop用户启动
```
[hadoop@hadoop001 bin]$ ./beeline -u jdbc:hive2://localhost:10000/default -n hadoop
which: no hbase in (/opt/software/hive/bin:/opt/software/hadoop/sbin:/opt/software/hadoop/bin:/opt/software/apache-maven-3.3.9/bin:/usr/java/jdk1.8.0_45/bin:/usr/lib64/qt-3.3/bin:/usr/local/bin:/bin:/usr/bin:/usr/local/sbin:/usr/sbin:/sbin:/home/hadoop/bin)
scan complete in 4ms
Connecting to jdbc:hive2://localhost:10000/default
Connected to: Apache Hive (version 1.1.0-cdh5.7.0)
Driver: Hive JDBC (version 1.1.0-cdh5.7.0)
Transaction isolation: TRANSACTION_REPEATABLE_READ
Beeline version 1.1.0-cdh5.7.0 by Apache Hive
0: jdbc:hive2://localhost:10000/default>
```

使用SQL
```
0: jdbc:hive2://localhost:10000/default> show databases;
INFO  : Compiling command(queryId=hadoop_20180114082525_e8541a4a-e849-4017-9dab-ad5162fa74c1): show databases
INFO  : Semantic Analysis Completed
INFO  : Returning Hive schema: Schema(fieldSchemas:[FieldSchema(name:database_name, type:string, comment:from deserializer)], properties:null)
INFO  : Completed compiling command(queryId=hadoop_20180114082525_e8541a4a-e849-4017-9dab-ad5162fa74c1); Time taken: 0.478 seconds
INFO  : Concurrency mode is disabled, not creating a lock manager
INFO  : Executing command(queryId=hadoop_20180114082525_e8541a4a-e849-4017-9dab-ad5162fa74c1): show databases
INFO  : Starting task [Stage-0:DDL] in serial mode
INFO  : Completed executing command(queryId=hadoop_20180114082525_e8541a4a-e849-4017-9dab-ad5162fa74c1); Time taken: 0.135 seconds
INFO  : OK
+----------------+--+
| database_name  |
+----------------+--+
| default        |
+----------------+--+
1 row selected      
```

###### 5.使用编写java代码方式连接
**5.1**使用maven构建项目，pom.xml文件如下：
```
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <groupId>com.zhaotao.bigdata</groupId>
  <artifactId>hive-train</artifactId>
  <version>1.0</version>
  <packaging>jar</packaging>

  <name>hive-train</name>
  <url>http://maven.apache.org</url>

  <properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <hadoop.version>2.6.0-cdh5.7.0</hadoop.version>
    <hive.version>1.1.0-cdh5.7.0</hive.version>
  </properties>

  <repositories>
    <repository>
      <id>cloudera</id>
      <url>http://repository.cloudera.com/artifactory/cloudera-repos</url>
    </repository>
  </repositories>

  <dependencies>
    <dependency>
      <groupId>org.apache.hive</groupId>
      <artifactId>hive-exec</artifactId>
      <version>${hive.version}</version>
    </dependency>

    <dependency>
      <groupId>org.apache.hive</groupId>
      <artifactId>hive-jdbc</artifactId>
      <version>${hive.version}</version>
    </dependency>    
  </dependencies>
</project>
```
**5.2**JdbcApp.java文件代码:
```
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class JdbcApp {
     private static String driverName = "org.apache.hive.jdbc.HiveDriver";

     public static void main(String[] args) throws Exception {
         try {
            Class.forName(driverName);
         } catch (ClassNotFoundException e) {
             // TODO Auto-generated catch block
             e.printStackTrace();
             System.exit(1);
         }

         Connection con = DriverManager.getConnection("jdbc:hive2://192.168.137.200:10000/default", "root", "");
         Statement stmt = con.createStatement();
         //select table:ename
         String tableName = "emp";
         String sql = "select ename from " + tableName;
         System.out.println("Running: " + sql);
         ResultSet res = stmt.executeQuery(sql);
          while(res.next()) {
             System.out.println(res.getString(1));
         }
         // describe table
         sql = "describe " + tableName;
         System.out.println("Running: " + sql);
         res = stmt.executeQuery(sql);
         while (res.next()) {
             System.out.println(res.getString(1) + "\t" + res.getString(2));
         }
    }
}
```