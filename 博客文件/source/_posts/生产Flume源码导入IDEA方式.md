---
layout: post
title: "生产Flume源码导入IDEA方式"
date: 2019-06-17
comments: true
tags: 
    - Flume
categories: [Flume]

---

<!--more--> 

#### 下载flume-ng-1.6.0-cdh5.7.0-src.tar.gz

下载地址:[http://archive.cloudera.com/cdh5/cdh/5/flume-ng-1.6.0-cdh5.7.0-src.tar.gz](http://archive.cloudera.com/cdh5/cdh/5/flume-ng-1.6.0-cdh5.7.0-src.tar.gz)

#### win安装好maven-3.3.9

#### 解压flume-ng-1.6.0-cdh5.7.0-src.tar.gz并进入解压路径

#### 编译：mvn clean compile

报错

```
[ERROR] Failed to execute goal org.apache.maven.plugins:maven-enforcer-plugin:1.0:enforce (clean) on project flume-parent: Some Enforcer rules have failed. Look above for specific messages explaining
why the rule failed. -> [Help 1]
```

换成以下编译命令，跳过enforcer

`mvn clean compile validate -Denforcer.skip=true`

报错

```
[ERROR] Failed to execute goal on project flume-ng-morphline-solr-sink: Could not resolve dependencies for project org.apache.flume.flume-ng-sinks:flume-ng-morphline-solr-sink:jar:1.6.0-cdh5.7.0: Fail
ed to collect dependencies at org.kitesdk:kite-morphlines-all:pom:1.0.0-cdh5.7.0 -> org.kitesdk:kite-morphlines-useragent:jar:1.0.0-cdh5.7.0 -> ua_parser:ua-parser:jar:1.3.0: Failed to read artifact d
escriptor for ua_parser:ua-parser:jar:1.3.0: Could not transfer artifact ua_parser:ua-parser:pom:1.3.0 from/to maven-twttr (http://maven.twttr.com): Connect to maven.twttr.com:80 [maven.twttr.com/31.1
3.83.8] failed: Connection timed out: connect -> [Help 1]
```

`flume-ng-morphline-solr-sink`我们用不到，可以直接注释掉，在`flume-ng-sinks`下的pom中找到并注释

```
<modules>
    <module>flume-hdfs-sink</module>
    <module>flume-irc-sink</module>
    <module>flume-ng-hbase-sink</module>
    <module>flume-ng-elasticsearch-sink</module>
    <!--<module>flume-ng-morphline-solr-sink</module> -->
    <module>flume-ng-kafka-sink</module>
</modules>
```

然后重新编译`mvn clean compile validate -Denforcer.skip=true`，成功

![编译](/assets/pic/2019-06-17-1.png)

#### 导入IDEA

![1](/assets/pic/2019-06-17-2.png)

![2](/assets/pic/2019-06-17-3.png)

![3](/assets/pic/2019-06-17-4.png)

![4](/assets/pic/2019-06-17-5.png)

![5](/assets/pic/2019-06-17-6.png)

![6](/assets/pic/2019-06-17-7.png)

然后等到导入完毕！

![7](/assets/pic/2019-06-17-8.png)

导入后没有任何报错，这时我们就可以对源码进行修改了！