---
layout: post
title: "11生产预警平台项目之redis-3.2.5 install(单节点)"
date: 2018-09-12
comments: true
tags: 
	- spark
	- 高级
	- 生产预警平台项目
categories: 生产预警平台项目
---

#### 1.安装jdk1.8
```
[root@sht-sgmhadoopdn-04 ~]# cd /usr/java/
[root@sht-sgmhadoopdn-04 java]# wget --no-check-certificate --no-cookies --header "Cookie: oraclelicense=accept-securebackup-cookie"  http://download.oracle.com/otn-pub/java/jdk/8u111-b14/jdk-8u111-linux-x64.tar.gz
[root@sht-sgmhadoopdn-04 java]# tar -zxvf jdk-8u111-linux-x64.tar.gz
[root@sht-sgmhadoopdn-04 java]# vi /etc/profile
export JAVA_HOME=/usr/java/jdk1.8.0_111
export path=$JAVA_HOME/bin:$PATH
[root@sht-sgmhadoopdn-04 java]# source /etc/profile
[root@sht-sgmhadoopdn-04 java]# java -version
java version "1.8.0_111"
Java(TM) SE Runtime Environment (build 1.8.0_111-b14)
Java HotSpot(TM) 64-Bit Server VM (build 25.111-b14, mixed mode)
[root@sht-sgmhadoopdn-04 java]#
```

#### 2.安装 redis 3.2.5

##### 2.1 安装编绎所需包gcc,tcl
```
[root@sht-sgmhadoopdn-04 local]# yum install gcc
[root@sht-sgmhadoopdn-04 local]# yum install tcl
```
##### 2.2 下载redis-3.2.5
```
[root@sht-sgmhadoopdn-04 local]# wget http://download.redis.io/releases/redis-3.2.5.tar.gz
--2016-11-12 20:16:40--  http://download.redis.io/releases/redis-3.2.5.tar.gz
Resolving download.redis.io (download.redis.io)... 109.74.203.151
Connecting to download.redis.io (download.redis.io)|109.74.203.151|:80... connected.
HTTP request sent, awaiting response... 200 OK
Length: 1544040 (1.5M) [application/x-gzip]
Saving to: ‘redis-3.2.5.tar.gz’
100%[==========================================================================================================================>] 1,544,040    221KB/s   in 6.8s  
2016-11-12 20:16:47 (221 KB/s) - ‘redis-3.2.5.tar.gz’ saved [1544040/1544040]
```
##### 2.3 安装redis
```
[root@sht-sgmhadoopdn-04 local]# mkdir /usr/local/redis
[root@sht-sgmhadoopdn-04 local]# tar xzvf redis-3.2.5.tar.gz
[root@sht-sgmhadoopdn-04 local]# cd redis-3.2.5
[root@sht-sgmhadoopdn-04 redis-3.2.5]# make PREFIX=/usr/local/redis install
[root@sht-sgmhadoopdn-04 redis-3.2.5]# cd ../
[root@sht-sgmhadoopdn-04 redis-3.2.5]# ll /usr/local/redis/bin/
total 15056
-rwxr-xr-x 1 root root 2431728 Nov 12 20:45 redis-benchmark
-rwxr-xr-x 1 root root   25165 Nov 12 20:45 redis-check-aof
-rwxr-xr-x 1 root root 5182191 Nov 12 20:45 redis-check-rdb
-rwxr-xr-x 1 root root 2584443 Nov 12 20:45 redis-cli
lrwxrwxrwx 1 root root      12 Nov 12 20:45 redis-sentinel -> redis-server
-rwxr-xr-x 1 root root 5182191 Nov 12 20:45 redis-server
```
##### 2.4 配置redis为服务
```
[root@server redis-3.2.5]# cp utils/redis_init_script /etc/rc.d/init.d/redis
[root@server redis-3.2.5]# vi /etc/rc.d/init.d/redis 
在第二行添加：#chkconfig: 2345 80 90
EXEC=/usr/local/bin/redis-server  修改成 EXEC=/usr/local/redis/bin/redis-server
CLIEXEC=/usr/local/bin/redis-cli  修改成 CLIEXEC=/usr/local/redis/bin/redis-cli
CONF="/etc/redis/${REDISPORT}.conf" 修改成 CONF="/usr/local/redis/conf/${REDISPORT}.conf"
$EXEC $CONF 修改成  $EXEC $CONF &
[root@server redis-3.2.5]# mkdir /usr/local/redis/conf/
[root@server redis-3.2.5]# chkconfig --add redis
[root@server redis-3.2.5]# cp redis.conf /usr/local/redis/conf/6379.conf 
[root@server redis-3.2.5]# vi /usr/local/redis/conf/6379.conf 
daemonize yes
pidfile /var/run/redis_6379.pid
bind 172.16.101.66
```
##### 2.5 启动redis
```
[root@server redis-3.2.5]# cd ../redis
[root@sht-sgmhadoopdn-04 redis]# service redis start
Starting Redis server...
[root@sht-sgmhadoopdn-04 redis]# netstat -tnlp|grep redis
tcp        0      0 172.16.100.79:6379      0.0.0.0:*               LISTEN      30032/redis-server  
[root@sht-sgmhadoopdn-04 redis]#
```
##### 2.6 添加环境变量
```
[root@sht-sgmhadoopdn-04 redis]# vi /etc/profile
export REDIS_HOME=/usr/local/redis
export PATH=$REDIS_HOME/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/root/bin
[root@sht-sgmhadoopdn-04 redis]# source /etc/profile
[root@sht-sgmhadoopdn-04 redis]# which redis-cli
/usr/local/redis/bin/redis-cli
```
##### 2.7 测试 和 设置密码(本次实验未设置密码)
```

[root@sht-sgmhadoopdn-04 redis]# red
is-cli -h sht-sgmhadoopdn-04
sht-sgmhadoopdn-04:6379> 
sht-sgmhadoopdn-04:6379> set testkey testvalue 
OK
sht-sgmhadoopdn-04:6379> get test
(nil)
sht-sgmhadoopdn-04:6379> get testkey
"testvalue"
sht-sgmhadoopdn-04:6379>
[root@sht-sgmhadoopdn-04 redis]# vi /usr/local/redis/conf/6379.conf 
/*添加一个验证密码*/
requirepass 123456
[root@sht-sgmhadoopdn-04 redis]# service redis stop
[root@sht-sgmhadoopdn-04 redis]# service redis start
[root@sht-sgmhadoopdn-04 redis]# redis-cli -h sht-sgmhadoopdn-04
sht-sgmhadoopdn-04:6379> set key ss
(error) NOAUTH Authentication required.  
[root@server redis-3.2.5]# redis-cli -h sht-sgmhadoopdn-04 -a 123456
sht-sgmhadoopdn-04:6379> set a b
OK
sht-sgmhadoopdn-04:6379> get a
"b"
sht-sgmhadoopdn-04:6379> exit;
[root@sht-sgmhadoopdn-04 redis]#
```