---
layout: post
title: "07生产预警平台项目之kafka-manager监控工具的搭建(sbt安装与编译)"
date: 2018-09-06
comments: true
tags: 
	- spark
	- 高级
	- 生产预警平台项目
categories: 生产预警平台项目
---


#### 1.下载sbt
```
http://www.scala-sbt.org/download.html
[root@sht-sgmhadoopnn-01 app]# rz
rz waiting to receive.
Starting zmodem transfer.  Press Ctrl+C to cancel.
Transferring sbt-0.13.13.tgz...
  100%    1025 KB    1025 KB/sec    00:00:01       0 Errors 
```
<!--more--> 
#### 2.解压
```
[root@sht-sgmhadoopnn-01 app]# tar -zxvf sbt-0.13.13.tgz
sbt-launcher-packaging-0.13.13/
sbt-launcher-packaging-0.13.13/conf/
sbt-launcher-packaging-0.13.13/conf/sbtconfig.txt
sbt-launcher-packaging-0.13.13/conf/sbtopts
sbt-launcher-packaging-0.13.13/bin/
sbt-launcher-packaging-0.13.13/bin/sbt.bat
sbt-launcher-packaging-0.13.13/bin/sbt
sbt-launcher-packaging-0.13.13/bin/sbt-launch.jar
sbt-launcher-packaging-0.13.13/bin/sbt-launch-lib.bash
[root@sht-sgmhadoopnn-01 app]# mv sbt-launcher-packaging-0.13.13 sbt
```
#### 3.添加脚本文件
```
[root@sht-sgmhadoopnn-01 bin]# vi sbt
#!/usr/bin/env bash

BT_OPTS="-Xms512M -Xmx1536M -Xss1M -XX:+CMSClassUnloadingEnabled -XX:MaxPermSize=256M"
java $SBT_OPTS -jar /root/learnproject/app/sbt/bin/sbt-launch.jar "$@"
```

#### 4.修改权限和环境变量
```
[root@sht-sgmhadoopnn-01 bin]# chmod u+x sbt
[root@sht-sgmhadoopnn-01 bin]# vi /etc/profile
export SBT_HOME=/root/learnproject/app/sbt
export PATH=$SBT_HOME/bin:$SPARK_HOME/bin:$SCALA_HOME/bin:$HADOOP_HOME/bin:$MAVEN_HOME/bin:$JAVA_HOME/bin:$PATH
"/etc/profile" 94L, 2265C written
[root@sht-sgmhadoopnn-01 bin]# source /etc/profile

```
#### 5.测试
```
/*第一次执行时，会下载一些文件包，然后才能正常使用，要确保联网了，安装成功后显示如下*/

[root@sht-sgmhadoopnn-01 bin]# sbt sbt-version
[info] Set current project to bin (in build file:/root/learnproject/app/sbt/bin/)
[info] 0.13.13
[info] Set current project to bin (in build file:/root/learnproject/app/sbt/bin/)
[info] 0.13.13
[root@sht-sgmhadoopnn-01 bin]#
```