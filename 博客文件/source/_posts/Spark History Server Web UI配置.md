---
layout: post
title: "Spark History Server Web UI配置"
date: 2018-05-21
comments: true
tags: [spark,高级]
categories:  Spark Other
---


##### 1.进入spark目录和配置文件
```
[root@hadoop000 ~]# cd /opt/app/spark/conf
[root@hadoop000 conf]# cp spark-defaults.conf.template spark-defaults.conf
```
<!--more--> 
##### 2.创建spark-history的存储日志路径为hdfs上(当然也可以在linux文件系统上)
```
[root@hadoop000 conf]# hdfs dfs -ls /Found 3 items
drwxr-xr-x   - root root          0 2017-02-14 12:43 /spark
drwxrwx---   - root root          0 2017-02-14 12:58 /tmp
drwxr-xr-x   - root root          0 2017-02-14 12:58 /user
You have new mail in /var/spool/mail/root
[root@hadoop000 conf]# hdfs dfs -ls /sparkFound 1 items
drwxrwxrwx   - root root          0 2017-02-15 21:44 /spark/checkpointdata
[root@hadoop000 conf]# hdfs dfs -mkdir /spark/historylog
```
在HDFS中创建一个目录，用于保存Spark运行日志信息。Spark History Server从此目录中读取日志信息 
##### 3.配置
```
[root@hadoop000 conf]# vi spark-defaults.conf
spark.eventLog.enabled           true
spark.eventLog.compress          true
spark.eventLog.dir             hdfs://nameservice1/spark/historylog
spark.yarn.historyServer.address 172.16.101.55:18080
```
spark.eventLog.dir保存日志相关信息的路径，可以是hdfs://开头的HDFS路径，也可以是file://开头的本地路径，都需要提前创建 
spark.yarn.historyServer.address : Spark history server的地址(不加http://). 
这个地址会在Spark应用程序完成后提交给YARN RM，然后可以在RM UI上点击链接跳转到history server UI上.

##### 4.添加SPARK_HISTORY_OPTS参数 
```
[root@hadoop01 conf]# vi spark-env.sh

#!/usr/bin/env bashexport SCALA_HOME=/root/learnproject/app/scalaexport JAVA_HOME=/usr/java/jdk1.8.0_111export SPARK_MASTER_IP=172.16.101.55export SPARK_WORKER_MEMORY=1gexport SPARK_PID_DIR=/root/learnproject/app/pidexport HADOOP_CONF_DIR=/root/learnproject/app/hadoop/etc/hadoopexport SPARK_HISTORY_OPTS="-Dspark.history.fs.logDirectory=hdfs://mycluster/spark/historylog \
-Dspark.history.ui.port=18080 \
-Dspark.history.retainedApplications=20"
```
##### 5.启动服务和查看
```
[root@hadoop01 spark]# ./sbin/start-history-server.sh starting org.apache.spark.deploy.history.HistoryServer, logging to /root/learnproject/app/spark/logs/spark-root-org.apache.spark.deploy.history.HistoryServer-1-sht-sgmhadoopnn-01.out[root@hadoop01  ~]# jps28905 HistoryServer30407 ProdServerStart30373 ResourceManager30957 NameNode16949 Jps30280 DFSZKFailoverController31445 JobHistoryServer
[root@hadoop01  ~]# ps -ef|grep sparkroot     17283 16928  0 21:42 pts/2    00:00:00 grep spark
root     28905     1  0 Feb16 ?        00:09:11 /usr/java/jdk1.8.0_111/bin/java -cp /root/learnproject/app/spark/conf/:/root/learnproject/app/spark/jars/*:/root/learnproject/app/hadoop/etc/hadoop/ -Dspark.history.fs.logDirectory=hdfs://mycluster/spark/historylog -Dspark.history.ui.port=18080 -Dspark.history.retainedApplications=20 -Xmx1g org.apache.spark.deploy.history.HistoryServer
You have new mail in /var/spool/mail/root
[root@hadoop01  ~]# netstat -nlp|grep 28905
tcp        0      0 0.0.0.0:18080               0.0.0.0:*                   LISTEN      28905/java          

```
以上配置是针对使用自己编译的Spark部署到集群中一到两台机器上作为提交作业客户端的，如果你是CDH集群中集成的Spark那么可以在管理界面直接查看！