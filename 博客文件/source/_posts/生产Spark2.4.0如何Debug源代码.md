---
layout: post
title: "生产Spark2.4.0如何Debug源代码"
date: 2019-04-17
comments: true
tags: [spark,高级]
categories: [Spark Other]
---



### 源码获取与编译

1. 直接从Spark官网获取源码或者从GitHub获取
	![enter description here](/assets/blogImg/2019-04-17-1.png)
	
![enter description here](/assets/blogImg/2019-04-17-2.png)

下载源码
	
```
wget https://archive.apache.org/dist/spark/spark-2.4.0/spark-2.4.0.tgz
```
解压源码

```
tar -zxf spark-2.4.0.tgz
```
<!--more--> 

2. Spark源码编译
此处不再啰嗦，直接去腾讯课堂，搜索“若泽大数据”即可找到编译视频。
	
### 源码导入IDEA

![enter description here](/assets/blogImg/2019-04-17-3.png)


### 运行hive-thriftserver2

从spark-2.4.0-bin-2.6.0-cdh5.7.0/sbin/start-thriftserver.sh 脚本中找到 hive-thriftserver2 的入口类：

```
org.apache.spark.sql.hive.thriftserver.HiveThriftServer2
```

![enter description here](/assets/blogImg/2019-04-17-4.png)

### 配置运行环境

```
Menu -> Run -> Edit Configurations -> 选择 + -> Application
```

![enter description here](/assets/blogImg/2019-04-17-5.png)

-Dspark.master=local[2] 代表使用本地模式运行Spark代码

运行之前需要做一件很重要的事情，将 hive-thriftserver 这个子项目的pom依赖全部由provided改为compile：

```
<dependency>
    <groupId>org.eclipse.jetty</groupId>
    <artifactId>jetty-server</artifactId>
    <scope>compile</scope>
</dependency>
<dependency>
    <groupId>org.eclipse.jetty</groupId>
    <artifactId>jetty-servlet</artifactId>
    <scope>compile</scope>
</dependency>
```

### 添加运行依赖的jars

```
Menu -> File -> Project Structure -> Modules -> spark-hive-thriftserver_2.11 -> Dependencies 添加依赖 jars -> {Spark_home}/assembly/target/scala-2.11/jars/
```

![enter description here](/assets/blogImg/2019-04-17-6.png)

### 中间遇到的问题

问题一

```
spark\sql\hive-thriftserver\src\main\java\org\apache\hive\service\cli\thrift\ThriftCLIService.java

Error:(52, 75) not found: value TCLIService

public abstract class ThriftCLIService extends AbstractService implements TCLIService.Iface, Runnable {………..
```

解决办法： 在spark\sql\hive-thriftserver\src\gen\java右键中点Mark Directory as -> Sources Root即可

问题二

```
Exception in thread "main" java.lang.NoClassDefFoundError: org/w3c/dom/ElementTraversal  
    at java.lang.ClassLoader.defineClass1(Native Method)  
```

解决办法：在 hive-thriftserve 子项目的pom文件中添加依赖

```
<dependency>
    <groupId>xml-apis</groupId>
    <artifactId>xml-apis</artifactId>
    <version>1.4.01</version>
</dependency>
```

问题三

```
java.net.BindException: Cannot assign requested address: Service 'sparkDriver' failed after 16 retries (starting from 0)! Consider explicitly setting the appropriate port for the service 'sparkDriver' (for example spark.ui.port for SparkUI) to an available port or increasing spark.port.maxRetries.
```

解决办法： 在 /etc/hosts 文件中配置相应的地址映射。

### 成功运行

在 HiveThriftServer2 中打断点进行调试源码即可。

打一个断点如下所示：
![enter description here](/assets/blogImg/2019-04-17-7.png)
就能看到断点所打印出来的信息。