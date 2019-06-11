---
layout: post
title: "Hadoop全网最详细的伪分布式部署(HDFS)"
date: 2018-04-08
comments: true
tags: 
	- hadoop
	- 环境搭建
	- 基础
categories:  Hadoop
---
Hadoop全网最详细的伪分布式部署(HDFS)
<!--more--> 
###### 1.添加hadoop用户
```
[root@hadoop-01 ~]# useradd hadoop

[root@hadoop-01 ~]# vi /etc/sudoers
# 找到root 	ALL=(ALL) 	ALL，添加

hadoop 	ALL=(ALL)       NOPASSWD:ALL
```
###### 2.上传并解压
```
[root@hadoop-01 software]# rz #上传hadoop-2.8.1.tar.gz

[root@hadoop-01 software]# tar -xzvf hadoop-2.8.1.tar.gz
```
###### 3.软连接
```
[root@hadoop-01 software]# ln -s /opt/software/hadoop-2.8.1 /opt/software/hadoop
```
###### 4.设置环境变量
```
[root@hadoop-01 software]# vi /etc/profile

export HADOOP_HOME=/opt/software/hadoop

export PATH=$HADOOP_HOME/bin:$HADOOP_HOME/sbin:$PATH

[root@hadoop-01 software]# source /etc/profile
```
###### 5.设置用户、用户组
```
[root@hadoop-01 software]# chown -R hadoop:hadoop hadoop

[root@hadoop-01 software]# chown -R hadoop:hadoop hadoop/*

[root@hadoop-01 software]# chown -R hadoop:hadoop hadoop-2.8.1		

[root@hadoop-01 software]# cd hadoop

[root@hadoop-01 hadoop]# rm -f *.txt
```
###### 6.切换hadoop用户
```
[root@hadoop-01 software]# su - hadoop

[root@hadoop-01 hadoop]# ll

total 32

drwxrwxr-x. 2 hadoop hadoop 4096 Jun  2 14:24 bin

drwxrwxr-x. 3 hadoop hadoop 4096 Jun  2 14:24 etc

drwxrwxr-x. 2 hadoop hadoop 4096 Jun  2 14:24 include

drwxrwxr-x. 3 hadoop hadoop 4096 Jun  2 14:24 lib

drwxrwxr-x. 2 hadoop hadoop 4096 Aug 20 13:59 libexec

drwxr-xr-x. 2 hadoop hadoop 4096 Aug 20 13:59 logs

drwxrwxr-x. 2 hadoop hadoop 4096 Jun  2 14:24 sbin

drwxrwxr-x. 4 hadoop hadoop 4096 Jun  2 14:24 share	

		

# bin:		可执行文件

# etc: 		配置文件

# sbin:		shell脚本，启动关闭hdfs,yarn等
```

###### 7.配置文件

```
[hadoop@hadoop-01 ~]# cd /opt/software/hadoop

[hadoop@hadoop-01 hadoop]# vi etc/hadoop/core-site.xml

<configuration>

    <property>

        <name>fs.defaultFS</name>

        <value>hdfs://192.168.137.130:9000</value>    # 配置自己机器的IP

    </property>

</configuration>

		

[hadoop@hadoop-01 hadoop]# vi etc/hadoop/hdfs-site.xml

<configuration>

    <property>

        <name>dfs.replication</name>

        <value>1</value>

    </property>

</configuration>
```

###### 8.配置hadoop用户的ssh信任关系

8.1公钥/密钥   配置无密码登录
```
[hadoop@hadoop-01 ~]# ssh-keygen -t rsa -P '' -f ~/.ssh/id_rsa

[hadoop@hadoop-01 ~]# cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys

[hadoop@hadoop-01 ~]# chmod 0600 ~/.ssh/authorized_keys		
```
8.2 查看日期，看是否配置成功
```
[hadoop@hadoop-01 ~]# ssh hadoop-01 date

The authenticity of host 'hadoop-01 (192.168.137.130)' can't be established.

RSA key fingerprint is 09:f6:4a:f1:a0:bd:79:fd:34:e7:75:94:0b:3c:83:5a.

Are you sure you want to continue connecting (yes/no)? yes   # 第一次回车输入yes

Warning: Permanently added 'hadoop-01,192.168.137.130' (RSA) to the list of known hosts.

Sun Aug 20 14:22:28 CST 2017

		

[hadoop@hadoop-01 ~]# ssh hadoop-01 date   #不需要回车输入yes,即OK

Sun Aug 20 14:22:29 CST 2017

		

[hadoop@hadoop-01 ~]# ssh localhost date

The authenticity of host 'hadoop-01 (192.168.137.130)' can't be established.

RSA key fingerprint is 09:f6:4a:f1:a0:bd:79:fd:34:e7:75:94:0b:3c:83:5a.

Are you sure you want to continue connecting (yes/no)? yes   # 第一次回车输入yes

Warning: Permanently added 'hadoop-01,192.168.137.130' (RSA) to the list of known hosts.

Sun Aug 20 14:22:28 CST 2017

[hadoop@hadoop-01 ~]# ssh localhost date   #不需要回车输入yes,即OK

Sun Aug 20 14:22:29 CST 2017
```
###### 9.格式化和启动
```
[hadoop@hadoop-01 hadoop]# bin/hdfs namenode -format

[hadoop@hadoop-01 hadoop]# sbin/start-dfs.sh

ERROR:

	hadoop-01: Error: JAVA_HOME is not set and could not be found.

	localhost: Error: JAVA_HOME is not set and could not be found.
```
9.1解决方法:添加环境变量
```
[hadoop@hadoop-01 hadoop]#  vi etc/hadoop/hadoop-env.sh

# 将export JAVA_HOME=${JAVA_HOME}改为

export JAVA_HOME=/usr/java/jdk1.8.0_45
```
		
```
[hadoop@hadoop-01 hadoop]# sbin/start-dfs.sh

ERROR:

	mkdir: cannot create directory `/opt/software/hadoop-2.8.1/logs': Permission denied
```
9.2解决方法:添加权限
```
[hadoop@hadoop-01 hadoop]# exit

[root@hadoop-01 hadoop]# cd ../

[root@hadoop-01 software]# chown -R hadoop:hadoop hadoop-2.8.1

[root@hadoop-01 software]# su - hadoop

[root@hadoop-01 ~]# cd /opt/software/hadoop
```
		

9.3 继续启动
```
[hadoop@hadoop-01 hadoop]# sbin/start-dfs.sh
```
9.4检查是否成功
```
[hadoop@hadoop-01 hadoop]# jps

19536 DataNode

19440 NameNode

19876 Jps

19740 SecondaryNameNode
```

9.5访问： http://192.168.137.130:50070




9.6修改dfs启动的进程，以hadoop-01启动

启动的三个进程：

namenode: hadoop-01    bin/hdfs getconf -namenodes

datanode: localhost    datanodes (using default slaves file)   etc/hadoop/slaves

secondarynamenode: 0.0.0.0
```


[hadoop@hadoop-01 ~]# cd /opt/software/hadoop

[hadoop@hadoop-01 hadoop]# echo  "hadoop-01" > ./etc/hadoop/slaves 

[hadoop@hadoop-01 hadoop]# cat ./etc/hadoop/slaves 

hadoop-01

	

[hadoop@hadoop-01 hadoop]# vi ./etc/hadoop/hdfs-site.xml

<property>

    <name>dfs.namenode.secondary.http-address</name>

    <value>hadoop-01:50090</value>

</property>

<property>

    <name>dfs.namenode.secondary.https-address</name>

    <value>hadoop-01:50091</value>

</property>
```
	

9.7重启
```
[hadoop@hadoop-01 hadoop]# sbin/stop-dfs.sh

[hadoop@hadoop-01 hadoop]# sbin/start-dfs.sh
```