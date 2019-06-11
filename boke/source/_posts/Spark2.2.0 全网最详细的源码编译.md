---
layout: post
title: "Spark2.2.0 全网最详细的源码编译"
date: 2018-04-14
comments: true
tags: 
	- spark
	- 基础
	- 环境搭建
categories:  Spark Other
---
若泽大数据，Spark2.2.0 全网最详细的源码编译
<!--more--> 
#### 环境准备
***
JDK： Spark 2.2.0及以上版本只支持JDK1.8 
***
Maven：3.3.9
设置maven环境变量时，需设置maven内存：
export MAVEN_OPTS=”-Xmx2g -XX:ReservedCodeCacheSize=512m”
***
Scala：2.11.8
***
Git
#### 编译
下载spark的tar包，并解压
```
[hadoop@hadoop000 source]$ wget https://d3kbcqa49mib13.cloudfront.net/spark-2.2.0.tgz
[hadoop@hadoop000 source]$ tar -xzvf spark-2.2.0.tgz
```
编辑dev/make-distribution.sh
```
[hadoop@hadoop000 spark-2.2.0]$ vi dev/make-distribution.sh
注释以下内容：
#VERSION=$("$MVN" help:evaluate -Dexpression=project.version $@ 2>/dev/null | grep -v "INFO" | tail -n 1)
#SCALA_VERSION=$("$MVN" help:evaluate -Dexpression=scala.binary.version $@ 2>/dev/null\
#    | grep -v "INFO"\
#    | tail -n 1)
#SPARK_HADOOP_VERSION=$("$MVN" help:evaluate -Dexpression=hadoop.version $@ 2>/dev/null\
#    | grep -v "INFO"\
#    | tail -n 1)
#SPARK_HIVE=$("$MVN" help:evaluate -Dexpression=project.activeProfiles -pl sql/hive $@ 2>/dev/null\
#    | grep -v "INFO"\
#    | fgrep --count "<id>hive</id>";\
#    # Reset exit status to 0, otherwise the script stops here if the last grep finds nothing\
#    # because we use "set -o pipefail"
#    echo -n)
```
添加以下内容：
```
VERSION=2.2.0
SCALA_VERSION=2.11
SPARK_HADOOP_VERSION=2.6.0-cdh5.7.0
SPARK_HIVE=1
```
编辑pom.xml
```
[hadoop@hadoop000 spark-2.2.0]$ vi pom.xml
添加在repositorys内
<repository>
      <id>clouders</id>
      <name>clouders Repository</name>
      <url>https://repository.cloudera.com/artifactory/cloudera-repos/</url>
</repository>
```
安装
```
[hadoop@hadoop000 spark-2.2.0]$ ./dev/make-distribution.sh --name 2.6.0-cdh5.7.0 --tgz -Dhadoop.version=2.6.0-cdh5.7.0 -Phadoop-2.6 -Phive -Phive-thriftserver -Pyarn
```
稍微等待几小时，网络较好的话，非常快。
也可以参考J哥博客： 
基于CentOS6.4环境编译Spark-2.1.0源码  http://blog.itpub.net/30089851/viewspace-2140779/