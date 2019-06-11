---
layout: post
title: "03生产预警平台项目之hadoop-2.7.3编译和搭建集群环境(HDFS HA,Yarn HA)"
date: 2018-09-03
comments: true
tags: 
	- spark
	- 高级
	- 生产预警平台项目
categories: 生产预警平台项目
---

<!--more--> 

### 1.下载hadoop2.7.3最新源码
```
[root@sht-sgmhadoopnn-01 ~]# mkdir -p learnproject/compilesoft
[root@sht-sgmhadoopnn-01 ~]# cd learnproject/compilesoft
[root@sht-sgmhadoopnn-01 compilesoft]# wget http://www-eu.apache.org/dist/hadoop/common/hadoop-2.7.3/hadoop-2.7.3-src.tar.gz
[root@sht-sgmhadoopnn-01 compilesoft]# tar -xzvf hadoop-2.7.3-src.tar.gz
[root@sht-sgmhadoopnn-01 compilesoft]# cd hadoop-2.7.3-src
[root@sht-sgmhadoopnn-01 hadoop-2.7.3-src]# cat BUILDING.txt 
Build instructions for Hadoop
----------------------------------------------------------------------------------
Requirements:
* Unix System
* JDK 1.7+
* Maven 3.0 or later
* Findbugs 1.3.9 (if running findbugs)
* ProtocolBuffer 2.5.0
* CMake 2.6 or newer (if compiling native code), must be 3.0 or newer on Mac
* Zlib devel (if compiling native code)
* openssl devel ( if compiling native hadoop-pipes and to get the best HDFS encryption performance )
* Linux FUSE (Filesystem in Userspace) version 2.6 or above ( if compiling fuse_dfs )
* Internet connection for first build (to fetch all Maven and Hadoop dependencies)
----------------------------------------------------------------------------------
Installing required packages for clean install of Ubuntu 14.04 LTS Desktop:
* Oracle JDK 1.7 (preferred)
  $ sudo apt-get purge openjdk*
  $ sudo apt-get install software-properties-common
  $ sudo add-apt-repository ppa:webupd8team/java
  $ sudo apt-get update
  $ sudo apt-get install oracle-java7-installer
* Maven
  $ sudo apt-get -y install maven
* Native libraries
  $ sudo apt-get -y install build-essential autoconf automake libtool cmake zlib1g-dev pkg-config libssl-dev
* ProtocolBuffer 2.5.0 (required)
  $ sudo apt-get -y install libprotobuf-dev protobuf-compiler
Optional packages:
* Snappy compression
  $ sudo apt-get install snappy libsnappy-dev
* Bzip2
  $ sudo apt-get install bzip2 libbz2-dev
* Jansson (C Library for JSON)
  $ sudo apt-get install libjansson-dev
* Linux FUSE
  $ sudo apt-get install fuse libfuse-dev
```
### 2.安装依赖包
```
[root@sht-sgmhadoopnn-01 compilesoft]# yum install svn autoconf automake libtool cmake ncurses-devel openssl-devel gcc*
```
### 3.安装jdk
```
[root@sht-sgmhadoopnn-01 compilesoft]# vi /etc/profile
export JAVA_HOME=/usr/java/jdk1.7.0_67-cloudera
export PATH=$JAVA_HOME/bin:$PATH
[root@sht-sgmhadoopnn-01 compilesoft]# source /etc/profile
[root@sht-sgmhadoopnn-01 compilesoft]# java -version
java version "1.7.0_67"
Java(TM) SE Runtime Environment (build 1.7.0_67-b01)
Java HotSpot(TM) 64-Bit Server VM (build 24.65-b04, mixed mode)
You have mail in /var/spool/mail/root
[root@sht-sgmhadoopnn-01 compilesoft]#
```
### 4.安装maven
```
[root@sht-sgmhadoopnn-01compilesoft]# wget http://ftp.cuhk.edu.hk/pub/packages/apache.org/maven/maven-3/3.3.9/binaries/apache-maven-3.3.9-bin.tar.gz -O apache-maven-3.3.9-bin.tar.gz
[root@sht-sgmhadoopnn-01 compilesoft]# tar xvf apache-maven-3.3.9-bin.tar.gz
[root@sht-sgmhadoopnn-01 compilesoft]# vi /etc/profile
export JAVA_HOME=/usr/java/jdk1.7.0_67-cloudera
export MAVEN_HOME=/root/learnproject/compilesoft/apache-maven-3.3.9
#在编译过程中为了防止Java内存溢出，需要加入以下环境变量
export MAVEN_OPTS="-Xmx2048m -XX:MaxPermSize=512m"
export PATH=$MAVEN_HOME/bin:$JAVA_HOME/bin:$PATH
[root@sht-sgmhadoopnn-01 compilesoft]# source /etc/profile
[root@sht-sgmhadoopnn-01 compilesoft]# mvn -version
Apache Maven 3.3.9 (bb52d8502b132ec0a5a3f4c09453c07478323dc5; 2015-11-11T00:41:47+08:00)
Maven home: /root/learnproject/compilesoft/apache-maven-3.3.9
Java version: 1.7.0_67, vendor: Oracle Corporation
Java home: /usr/java/jdk1.7.0_67-cloudera/jre
Default locale: en_US, platform encoding: UTF-8
OS name: "linux", version: "2.6.32-431.el6.x86_64", arch: "amd64", family: "unix"
You have new mail in /var/spool/mail/root
[root@sht-sgmhadoopnn-01 apache-maven-3.3.9]#
```
### 5.编译安装protobuf
```
[root@sht-sgmhadoopnn-01compilesoft]# wget ftp://ftp.netbsd.org/pub/pkgsrc/distfiles/protobuf-2.5.0.tar.gz -O protobuf-2.5.0.tar.gz
[root@hadoop-01 compilesoft]# tar -zxvf protobuf-2.5.0.tar.gz
[root@hadoop-01 compilesoft]# cd protobuf-2.5.0/
[root@hadoop-01 protobuf-2.5.0]# ./configure 
[root@hadoop-01 protobuf-2.5.0]# make
[root@hadoop-01 protobuf-2.5.0]# make install
#查看protobuf版本以测试是否安装成功
[root@hadoop-01 protobuf-2.5.0]# protoc --version
protoc: error while loading shared libraries: libprotobuf.so.8: cannot open shared object file: No such file or directory
[root@hadoop-01 protobuf-2.5.0]# export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/usr/local/lib
[root@hadoop-01 protobuf-2.5.0]# protoc --version
libprotoc 2.5.0
[root@hadoop-01 protobuf-2.5.0]#
```
### 6.安装snappy
```
[root@sht-sgmhadoopnn-01 compilesoft]# wget http://pkgs.fedoraproject.org/repo/pkgs/snappy/snappy-1.1.1.tar.gz/8887e3b7253b22a31f5486bca3cbc1c2/snappy-1.1.1.tar.gz
#用root用户执行以下命令
[root@sht-sgmhadoopnn-01 compilesoft]#tar -zxvf snappy-1.1.1.tar.gz
[root@sht-sgmhadoopnn-01 compilesoft]# cd snappy-1.1.1/
[root@sht-sgmhadoopnn-01 snappy-1.1.1]# ./configure
[root@sht-sgmhadoopnn-01 snappy-1.1.1]# make
[root@sht-sgmhadoopnn-01 snappy-1.1.1]# make install
#查看snappy库文件
[root@sht-sgmhadoopnn-01 snappy-1.1.1]# ls -lh /usr/local/lib |grep snappy
-rw-r--r--  1 root root 229K Jun 21 15:46 libsnappy.a
-rwxr-xr-x  1 root root  953 Jun 21 15:46 libsnappy.la
lrwxrwxrwx  1 root root   18 Jun 21 15:46 libsnappy.so -> libsnappy.so.1.2.0
lrwxrwxrwx  1 root root   18 Jun 21 15:46 libsnappy.so.1 -> libsnappy.so.1.2.0
-rwxr-xr-x  1 root root 145K Jun 21 15:46 libsnappy.so.1.2.0
[root@sht-sgmhadoopnn-01 snappy-1.1.1]#
```
### 7.编译
```
[root@sht-sgmhadoopnn-01 compilesoft]# cd hadoop-2.7.3-src
mvn clean package -Pdist,native -DskipTests -Dtar
或
mvn package -Pdist,native -DskipTests -Dtar
[root@sht-sgmhadoopnn-01 hadoop-2.7.3-src]# mvn clean package –Pdist,native –DskipTests –Dtar
[INFO] Executing tasks
main:
     [exec] $ tar cf hadoop-2.7.3.tar hadoop-2.7.3
     [exec] $ gzip -f hadoop-2.7.3.tar
     [exec] 
     [exec] Hadoop dist tar available at: /root/learnproject/compilesoft/hadoop-2.7.3-src/hadoop-dist/target/hadoop-2.7.3.tar.gz
     [exec] 
[INFO] Executed tasks
[INFO] 
[INFO] --- maven-javadoc-plugin:2.8.1:jar (module-javadocs) @ hadoop-dist ---
[INFO] Building jar: /root/learnproject/compilesoft/hadoop-2.7.3-src/hadoop-dist/target/hadoop-dist-2.7.3-javadoc.jar
[INFO] ------------------------------------------------------------------------
[INFO] Reactor Summary:
[INFO] 
[INFO] Apache Hadoop Main ................................. SUCCESS [ 14.707 s]
[INFO] Apache Hadoop Build Tools .......................... SUCCESS [  6.832 s]
[INFO] Apache Hadoop Project POM .......................... SUCCESS [ 12.989 s]
[INFO] Apache Hadoop Annotations .......................... SUCCESS [ 14.258 s]
[INFO] Apache Hadoop Assemblies ........................... SUCCESS [  0.411 s]
[INFO] Apache Hadoop Project Dist POM ..................... SUCCESS [  4.814 s]
[INFO] Apache Hadoop Maven Plugins ........................ SUCCESS [ 23.566 s]
[INFO] Apache Hadoop MiniKDC .............................. SUCCESS [02:31 min]
[INFO] Apache Hadoop Auth ................................. SUCCESS [ 29.587 s]
[INFO] Apache Hadoop Auth Examples ........................ SUCCESS [ 13.954 s]
[INFO] Apache Hadoop Common ............................... SUCCESS [03:03 min]
[INFO] Apache Hadoop NFS .................................. SUCCESS [  9.285 s]
[INFO] Apache Hadoop KMS .................................. SUCCESS [ 45.068 s]
[INFO] Apache Hadoop Common Project ....................... SUCCESS [  0.049 s]
[INFO] Apache Hadoop HDFS ................................. SUCCESS [03:49 min]
[INFO] Apache Hadoop HttpFS ............................... SUCCESS [01:08 min]
[INFO] Apache Hadoop HDFS BookKeeper Journal .............. SUCCESS [ 28.935 s]
[INFO] Apache Hadoop HDFS-NFS ............................. SUCCESS [  4.599 s]
[INFO] Apache Hadoop HDFS Project ......................... SUCCESS [  0.044 s]
[INFO] hadoop-yarn ........................................ SUCCESS [  0.043 s]
[INFO] hadoop-yarn-api .................................... SUCCESS [02:49 min]
[INFO] hadoop-yarn-common ................................. SUCCESS [ 40.792 s]
[INFO] hadoop-yarn-server ................................. SUCCESS [  0.041 s]
[INFO] hadoop-yarn-server-common .......................... SUCCESS [ 15.750 s]
[INFO] hadoop-yarn-server-nodemanager ..................... SUCCESS [ 25.311 s]
[INFO] hadoop-yarn-server-web-proxy ....................... SUCCESS [  6.415 s]
[INFO] hadoop-yarn-server-applicationhistoryservice ....... SUCCESS [ 12.274 s]
[INFO] hadoop-yarn-server-resourcemanager ................. SUCCESS [ 27.555 s]
[INFO] hadoop-yarn-server-tests ........................... SUCCESS [  7.751 s]
[INFO] hadoop-yarn-client ................................. SUCCESS [ 11.347 s]
[INFO] hadoop-yarn-server-sharedcachemanager .............. SUCCESS [  5.612 s]
[INFO] hadoop-yarn-applications ........................... SUCCESS [  0.038 s]
[INFO] hadoop-yarn-applications-distributedshell .......... SUCCESS [  4.029 s]
[INFO] hadoop-yarn-applications-unmanaged-am-launcher ..... SUCCESS [  2.611 s]
[INFO] hadoop-yarn-site ................................... SUCCESS [  0.077 s]
[INFO] hadoop-yarn-registry ............................... SUCCESS [  8.045 s]
[INFO] hadoop-yarn-project ................................ SUCCESS [  5.456 s]
[INFO] hadoop-mapreduce-client ............................ SUCCESS [  0.226 s]
[INFO] hadoop-mapreduce-client-core ....................... SUCCESS [ 28.462 s]
[INFO] hadoop-mapreduce-client-common ..................... SUCCESS [ 25.872 s]
[INFO] hadoop-mapreduce-client-shuffle .................... SUCCESS [  6.697 s]
[INFO] hadoop-mapreduce-client-app ........................ SUCCESS [ 14.121 s]
[INFO] hadoop-mapreduce-client-hs ......................... SUCCESS [  9.328 s]
[INFO] hadoop-mapreduce-client-jobclient .................. SUCCESS [ 23.801 s]
[INFO] hadoop-mapreduce-client-hs-plugins ................. SUCCESS [  2.412 s]
[INFO] Apache Hadoop MapReduce Examples ................... SUCCESS [  8.876 s]
[INFO] hadoop-mapreduce ................................... SUCCESS [  4.237 s]
[INFO] Apache Hadoop MapReduce Streaming .................. SUCCESS [ 14.285 s]
[INFO] Apache Hadoop Distributed Copy ..................... SUCCESS [ 19.759 s]
[INFO] Apache Hadoop Archives ............................. SUCCESS [  3.069 s]
[INFO] Apache Hadoop Rumen ................................ SUCCESS [  7.446 s]
[INFO] Apache Hadoop Gridmix .............................. SUCCESS [  5.765 s]
[INFO] Apache Hadoop Data Join ............................ SUCCESS [  3.752 s]
[INFO] Apache Hadoop Ant Tasks ............................ SUCCESS [  2.771 s]
[INFO] Apache Hadoop Extras ............................... SUCCESS [  5.612 s]
[INFO] Apache Hadoop Pipes ................................ SUCCESS [ 10.332 s]
[INFO] Apache Hadoop OpenStack support .................... SUCCESS [  7.131 s]
[INFO] Apache Hadoop Amazon Web Services support .......... SUCCESS [01:32 min]
[INFO] Apache Hadoop Azure support ........................ SUCCESS [ 10.622 s]
[INFO] Apache Hadoop Client ............................... SUCCESS [ 12.540 s]
[INFO] Apache Hadoop Mini-Cluster ......................... SUCCESS [  1.142 s]
[INFO] Apache Hadoop Scheduler Load Simulator ............. SUCCESS [  7.354 s]
[INFO] Apache Hadoop Tools Dist ........................... SUCCESS [ 12.269 s]
[INFO] Apache Hadoop Tools ................................ SUCCESS [  0.035 s]
[INFO] Apache Hadoop Distribution ......................... SUCCESS [ 58.051 s]
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time: 26:29 min
[INFO] Finished at: 2016-12-24T21:07:09+08:00
[INFO] Final Memory: 214M/740M
[INFO] ------------------------------------------------------------------------
You have mail in /var/spool/mail/root
[root@sht-sgmhadoopnn-01 hadoop-2.7.3-src]# 
[root@sht-sgmhadoopnn-01 hadoop-2.7.3-src]# cp /root/learnproject/compilesoft/hadoop-2.7.3-src/hadoop-dist/target/hadoop-2.7.3.tar.gz ../../
You have mail in /var/spool/mail/root
[root@sht-sgmhadoopnn-01 hadoop-2.7.3-src]# cd ../../
[root@sht-sgmhadoopnn-01 learnproject]# ll
total 193152
drwxr-xr-x 5 root root      4096 Dec 24 20:24 compilesoft
-rw-r--r-- 1 root root 197782815 Dec 24 21:16 hadoop-2.7.3.tar.gz
[root@sht-sgmhadoopnn-01 learnproject]#
```
### 8.搭建HDFS HA,YARN HA集群（5个节点）

参考: 
http://blog.itpub.net/30089851/viewspace-1994585/
https://github.com/Hackeruncle/Hadoop

### 9.搭建集群,验证版本和支持的压缩信息
```
[root@sht-sgmhadoopnn-01 app]# hadoop version
Hadoop 2.7.3
Subversion Unknown -r Unknown
Compiled by root on 2016-12-24T12:45Z
Compiled with protoc 2.5.0
From source with checksum 2e4ce5f957ea4db193bce3734ff29ff4
This command was run using /root/learnproject/app/hadoop/share/hadoop/common/hadoop-common-2.7.3.jar
[root@sht-sgmhadoopnn-01 app]# hadoop checknative
16/12/25 15:55:43 INFO bzip2.Bzip2Factory: Successfully loaded & initialized native-bzip2 library system-native
16/12/25 15:55:43 INFO zlib.ZlibFactory: Successfully loaded & initialized native-zlib library
Native library checking:
hadoop:  true /root/learnproject/app/hadoop/lib/native/libhadoop.so.1.0.0
zlib:    true /lib64/libz.so.1
snappy:  true /usr/local/lib/libsnappy.so.1
lz4:     true revision:99
bzip2:   true /lib64/libbz2.so.1
openssl: true /usr/lib64/libcrypto.so
[root@sht-sgmhadoopnn-01 app]# file /root/learnproject/app/hadoop/lib/native/libhadoop.so.1.0.0
/root/learnproject/app/hadoop/lib/native/libhadoop.so.1.0.0: ELF 64-bit LSB shared object, x86-64, version 1 (SYSV), dynamically linked, not stripped
[root@sht-sgmhadoopnn-01 app]#
```
[参考]
- http://happyshome.cn/blog/deploy/centos/hadoop2.7.2.html
- http://blog.csdn.net/haohaixingyun/article/details/52800048
