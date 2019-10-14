---
layout: post
title: "Hadoop如何使用lzo压缩完整篇"
date: 2019-10-12
comments: true
tags: 
    - Hadoop
    - 高级
    - 压缩
    - lzo
categories: [Hadoop]

---

<!--more--> 


### 为啥使用了lzo仍然不能分片

在hdfs.xml中，有这样的配置

```
<property>
    <name>dfs.blocksize</name>
    <value>134217728</value>
 </property>
```

这个配置设置了块大小为128M，在mapreduce的过程中，inputformat执行完毕之后，默认就会根据该配置，对文件进行切块(split)，进而根据块的数量来决定map task的数量。

除了textFile之外，压缩格式中的lzo，bz2也可以进行文件的切块操作。

但是从一般情况，lzo本身是无法进行切块的——如果直接将大于128M的data.lzo文件作为map的输入时，默认blocksize为128M的情况下，number of splits的值仍然为1，即data.lzo仍然被当为一块直接输入map task。

所以为了实现lzo的切块，需要为lzo的压缩文件生成一个索引文件data.lzo.index。

### 如何生成lzo文件

`lzop -v data`，就会生成data.lzo文件

### 给data.lzo配置索引文件

需要准备hadoop-lzo-0.4.21-SNAPSHOT.jar，如果没有的话就需要编译生成一下。

1.安装编译所需文件

`yum -y install lzo-devel zlib-devel gcc autoconf automake libtool`

2.下载，解压

`wget https://github.com/twitter/hadoop-lzo/archive/master.zip`

3.修改pom.xml，将其中的hadoop.current.version改为自己的hadoop版本
4.编译

在hadoop-lzo-master/下执行`mvn clean package -Dmaven.test.skip=true`进行编译，编译好的jar包在hadoop-lzo-master/target/

5.修改hadoop的配置文件

```
core-site.xml
<property>
    <name>io.compression.codecs</name>
    <value>org.apache.hadoop.io.compress.GzipCodec,
        org.apache.hadoop.io.compress.DefaultCodec,
        org.apache.hadoop.io.compress.BZip2Codec,
        org.apache.hadoop.io.compress.SnappyCodec,
        com.hadoop.compression.lzo.LzoCodec,
        com.hadoop.compression.lzo.LzopCodec
    </value>
</property>
    
<property>
    <name>io.compression.codec.lzo.class</name>
    <value>com.hadoop.compression.lzo.LzoCodec</value>
</property>

mapred-site.xml
<property>
    <name>mapreduce.map.output.compress</name>
    <value>true</value>
</property>

<property>
    <name>mapreduce.map.output.compress.codec</name>
    <value>com.hadoop.compression.lzo.LzoCodec</value>
</property>
```

6.重启hadoop集群，将data.lzo丢到hdfs里。

7.创建index文件

```
# 使用mapreduce创建索引
hadoop jar /home/hadoop/hadoop-lzo-0.4.21-SNAPSHOT.jar com.hadoop.compression.lzo.DistributedLzoIndexer /input/data.lzo

# 使用本地程序创建索引
hadoop jar /home/hadoop/hadoop-lzo-0.4.21-SNAPSHOT.jar com.hadoop.compression.lzo.LzoIndexer /input/data.lzo
```

8.执行自己的mapreduce程序的时候，输入路径为/input而非/input/data.lzo，这样就能实现lzo的分片操作了。