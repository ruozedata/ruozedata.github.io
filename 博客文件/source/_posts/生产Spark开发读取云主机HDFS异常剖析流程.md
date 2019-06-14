---
layout: post
title: "生产Spark开发读取云主机HDFS异常剖析流程"
date: 2019-02-26
comments: true
tags: 
	- spark
	- HDFS
categories: Spark Other
---
### 问题背景：

#### 云主机是 Linux 环境，搭建 Hadoop 伪分布式

- 公网 IP：139.198.xxx.xxx
- 内网 IP：192.168.137.2
- 主机名：hadoop001

#### 本地的core-site.xml配置如下：
<!--more--> 
```
<configuration>
<property>
        <name>fs.defaultFS</name>
        <value>hdfs://hadoop001:9001</value>
</property>
<property>
        <name>hadoop.tmp.dir</name>
        <value>hdfs://hadoop001:9001/hadoop/tmp</value>
</property>
</configuration>
```

#### 本地的hdfs-site.xml配置如下：

```
<configuration>
<property>
       <name>dfs.replication</name>
       <value>1</value>
 </property>
</configuration>
```

#### 云主机hosts文件配置：

```
[hadoop@hadoop001 ~]$ cat /etc/hosts
127.0.0.1   localhost localhost.localdomain localhost4 localhost4.localdomain4
::1         localhost localhost.localdomain localhost6 localhost6.localdomain6
# hostname loopback address
  192.168.137.2   hadoop001
```

云主机将内网IP和主机名hadoop001做了映射

#### 本地hosts文件配置

```
139.198.18.XXX     hadoop001
```

本地已经将公网IP和域名hadoop001做了映射

### 问题症状

1. **在云主机上开启 HDFS，JPS 查看进程都没有异常，通过 Shell 操作 HDFS 文件也没有问题**
2. **通过浏览器访问 50070 端口管理界面也没有问题**
3. **在本地机器上使用 Java API 操作远程 HDFS 文件，URI 使用公网 IP，代码如下：**

    ```
    val uri = new URI("hdfs://hadoop001:9001")
    val fs = FileSystem.get(uri,conf)
    val listfiles = fs.listFiles(new Path("/data"),true)
        while (listfiles.hasNext) {
        val nextfile = listfiles.next()
        println("get file path:" + nextfile.getPath().toString())
        }
    ------------------------------运行结果---------------------------------
    get file path:hdfs://hadoop001:9001/data/infos.txt
    ```
4. 在本地机器使用SparkSQL读取hdfs上的文件并转换为DF的过程中

	```
	object SparkSQLApp {
	  def main(args: Array[String]): Unit = {
	  val spark = SparkSession.builder().appName("SparkSQLApp").master("local[2]").getOrCreate()
	  val info = spark.sparkContext.textFile("/data/infos.txt")
	  import spark.implicits._
	  val infoDF = info.map(_.split(",")).map(x=>Info(x(0).toInt,x(1),x(2).toInt)).toDF()
	  infoDF.show()
	  spark.stop()
	  }
	  case class Info(id:Int,name:String,age:Int)
	}
	```
	
	出现如下报错信息：
	
	```
	....
    ....
    ....
    19/02/23 16:07:00 INFO Executor: Running task 0.0 in stage 0.0 (TID 0)
    19/02/23 16:07:00 INFO HadoopRDD: Input split: hdfs://hadoop001:9001/data/infos.txt:0+17
    19/02/23 16:07:21 WARN BlockReaderFactory: I/O error constructing remote block reader.
    java.net.ConnectException: Connection timed out: no further information
        at sun.nio.ch.SocketChannelImpl.checkConnect(Native Method)
        at sun.nio.ch.SocketChannelImpl.finishConnect(SocketChannelImpl.java:717)
    .....
    ....
    19/02/23 16:07:21 INFO DFSClient: Could not obtain BP-1358284489-192.168.137.2-1550394746448:blk_1073741840_1016 from any node: java.io.IOException: No live nodes contain block BP-1358284489-192.168.137.2-1550394746448:blk_1073741840_1016 after checking nodes = [DatanodeInfoWithStorage[192.168.137.2:50010,DS-fb2e7244-165e-41a5-80fc-4bb90ae2c8cd,DISK]], ignoredNodes = null No live nodes contain current block Block locations: DatanodeInfoWithStorage[192.168.137.2:50010,DS-fb2e7244-165e-41a5-80fc-4bb90ae2c8cd,DISK] Dead nodes:  DatanodeInfoWithStorage[192.168.137.2:50010,DS-fb2e7244-165e-41a5-80fc-4bb90ae2c8cd,DISK]. Will get new block locations from namenode and retry...
    19/02/23 16:07:21 WARN DFSClient: DFS chooseDataNode: got # 1 IOException, will wait for 272.617680460432 msec.
    19/02/23 16:07:42 WARN BlockReaderFactory: I/O error constructing remote block reader.
    java.net.ConnectException: Connection timed out: no further information
        at sun.nio.ch.SocketChannelImpl.checkConnect(Native Method)
        at sun.nio.ch.SocketChannelImpl.finishConnect(SocketChannelImpl.java:717)
    ...
    ...
    19/02/23 16:07:42 WARN DFSClient: Failed to connect to /192.168.137.2:50010 for block, add to deadNodes and continue. java.net.ConnectException: Connection timed out: no further information
    java.net.ConnectException: Connection timed out: no further information
        at sun.nio.ch.SocketChannelImpl.checkConnect(Native Method)
        at sun.nio.ch.SocketChannelImpl.finishConnect(SocketChannelImpl.java:717)
        at org.apache.hadoop.net.SocketIOWithTimeout.connect(SocketIOWithTimeout.java:206)
        at org.apache.hadoop.net.NetUtils.connect(NetUtils.java:530)
        at org.apache.hadoop.hdfs.DFSClient.newConnectedPeer(DFSClient.java:3499)
    ...
    ...
    19/02/23 16:08:12 WARN DFSClient: Failed to connect to /192.168.137.2:50010 for block, add to deadNodes and continue. java.net.ConnectException: Connection timed out: no further information
    java.net.ConnectException: Connection timed out: no further information
        at sun.nio.ch.SocketChannelImpl.checkConnect(Native Method)
        at sun.nio.ch.SocketChannelImpl.finishConnect(SocketChannelImpl.java:717)
        at org.apache.hadoop.net.SocketIOWithTimeout.connect(SocketIOWithTimeout.java:206)
        at org.apache.hadoop.net.NetUtils.connect(NetUtils.java:530)
    ...
    ...
    19/02/23 16:08:12 INFO DFSClient: Could not obtain BP-1358284489-192.168.137.2-1550394746448:blk_1073741840_1016 from any node: java.io.IOException: No live nodes contain block BP-1358284489-192.168.137.2-1550394746448:blk_1073741840_1016 after checking nodes = [DatanodeInfoWithStorage[192.168.137.2:50010,DS-fb2e7244-165e-41a5-80fc-4bb90ae2c8cd,DISK]], ignoredNodes = null No live nodes contain current block Block locations: DatanodeInfoWithStorage[192.168.137.2:50010,DS-fb2e7244-165e-41a5-80fc-4bb90ae2c8cd,DISK] Dead nodes:  DatanodeInfoWithStorage[192.168.137.2:50010,DS-fb2e7244-165e-41a5-80fc-4bb90ae2c8cd,DISK]. Will get new block locations from namenode and retry...
    19/02/23 16:08:12 WARN DFSClient: DFS chooseDataNode: got # 3 IOException, will wait for 11918.913311370841 msec.
    19/02/23 16:08:45 WARN BlockReaderFactory: I/O error constructing remote block reader.
    java.net.ConnectException: Connection timed out: no further information
        at sun.nio.ch.SocketChannelImpl.checkConnect(Native Method)
        at sun.nio.ch.SocketChannelImpl.finishConnect(SocketChannelImpl.java:717)
    ...
    ...
    19/02/23 16:08:45 WARN DFSClient: Could not obtain block: BP-1358284489-192.168.137.2-1550394746448:blk_1073741840_1016 file=/data/infos.txt No live nodes contain current block Block locations: DatanodeInfoWithStorage[192.168.137.2:50010,DS-fb2e7244-165e-41a5-80fc-4bb90ae2c8cd,DISK] Dead nodes:  DatanodeInfoWithStorage[192.168.137.2:50010,DS-fb2e7244-165e-41a5-80fc-4bb90ae2c8cd,DISK]. Throwing a BlockMissingException
    19/02/23 16:08:45 WARN DFSClient: Could not obtain block: BP-1358284489-192.168.137.2-1550394746448:blk_1073741840_1016 file=/data/infos.txt No live nodes contain current block Block locations: DatanodeInfoWithStorage[192.168.137.2:50010,DS-fb2e7244-165e-41a5-80fc-4bb90ae2c8cd,DISK] Dead nodes:  DatanodeInfoWithStorage[192.168.137.2:50010,DS-fb2e7244-165e-41a5-80fc-4bb90ae2c8cd,DISK]. Throwing a BlockMissingException
    19/02/23 16:08:45 WARN DFSClient: DFS Read
    org.apache.hadoop.hdfs.BlockMissingException: Could not obtain block: BP-1358284489-192.168.137.2-1550394746448:blk_1073741840_1016 file=/data/infos.txt
        at org.apache.hadoop.hdfs.DFSInputStream.chooseDataNode(DFSInputStream.java:1001)
    ...
    ...
    19/02/23 16:08:45 WARN TaskSetManager: Lost task 0.0 in stage 0.0 (TID 0, localhost, executor driver): org.apache.hadoop.hdfs.BlockMissingException: Could not obtain block: BP-1358284489-192.168.137.2-1550394746448:blk_1073741840_1016 file=/data/infos.txt
        at org.apache.hadoop.hdfs.DFSInputStream.chooseDataNode(DFSInputStream.java:1001)
        at org.apache.hadoop.hdfs.DFSInputStream.blockSeekTo(DFSInputStream.java:648)
    ...
    ...
    19/02/23 16:08:45 ERROR TaskSetManager: Task 0 in stage 0.0 failed 1 times; aborting job
    19/02/23 16:08:45 INFO TaskSchedulerImpl: Removed TaskSet 0.0, whose tasks have all completed, from pool 
    19/02/23 16:08:45 INFO TaskSchedulerImpl: Cancelling stage 0
    19/02/23 16:08:45 INFO DAGScheduler: ResultStage 0 (show at SparkSQLApp.scala:30) failed in 105.618 s due to Job aborted due to stage failure: Task 0 in stage 0.0 failed 1 times, most recent failure: Lost task 0.0 in stage 0.0 (TID 0, localhost, executor driver): org.apache.hadoop.hdfs.BlockMissingException: Could not obtain block: BP-1358284489-192.168.137.2-1550394746448:blk_1073741840_1016 file=/data/infos.txt
        at org.apache.hadoop.hdfs.DFSInputStream.chooseDataNode(DFSInputStream.java:1001)
    ...
    ...
    Caused by: org.apache.hadoop.hdfs.BlockMissingException: Could not obtain block: BP-1358284489-192.168.137.2-1550394746448:blk_1073741840_1016 file=/data/infos.txt
        at org.apache.hadoop.hdfs.DFSInputStream.chooseDataNode(DFSInputStream.java:1001)
    ...
    ...
	```
	
### 问题分析

1. **本地 Shell 可以正常操作，排除集群搭建和进程没有启动的问题**
2. **云主机没有设置防火墙，排除防火墙没关的问题**
3. **云服务器防火墙开放了 DataNode 用于数据传输服务端口 默认是 50010**
4. **我在本地搭建了另一台虚拟机，该虚拟机和本地在同一局域网，本地可以正常操作该虚拟机的hdfs，基本确定了是由于内外网的原因。**
5. **查阅资料发现 HDFS 中的文件夹和文件名都是存放在 NameNode 上，操作不需要和 DataNode 通信，因此可以正常创建文件夹和创建文件说明本地和远程 NameNode 通信没有问题。那么很可能是本地和远程 DataNode 通信有问题**

### 问题猜想

由于本地测试和云主机不在一个局域网，hadoop配置文件是以内网ip作为机器间通信的ip。在这种情况下,我们能够访问到namenode机器，namenode会给我们数据所在机器的ip地址供我们访问数据传输服务，但是当写数据的时候，NameNode 和DataNode 是通过内网通信的，返回的是datanode内网的ip,我们无法根据该IP访问datanode服务器。

我们来看一下其中一部分报错信息：

```
19/02/23 16:07:21 WARN BlockReaderFactory: I/O error constructing remote block reader.
java.net.ConnectException: Connection timed out: no further information
...
19/02/23 16:07:42 WARN DFSClient: Failed to connect to /192.168.137.2:50010 for block, add to deadNodes and continue....
```

从报错信息中可以看出，连接不到192.168.137.2:50010，也就是datanode的地址，因为外网必须访问“139.198.18.XXX:50010”才能访问到datanode。

为了能够让开发机器访问到hdfs，我们可以通过域名访问hdfs，让namenode返回给我们datanode的域名。

### 问题解决

#### 尝试一：

在开发机器的hosts文件中配置datanode对应的外网ip和域名（上文已经配置），并且在与hdfs交互的程序中添加如下代码:

```
val conf = new Configuration()
conf.set("dfs.client.use.datanode.hostname", "true")
```

报错依旧

#### 尝试二：

```
val spark = SparkSession
      .builder()
      .appName("SparkSQLApp")
       .master("local[2]")
      .config("dfs.client.use.datanode.hostname", "true")
      .getOrCreate()
```

报错依旧

#### 尝试三：

在hdfs-site.xml中添加如下配置：

```
<property>
	<name>dfs.client.use.datanode.hostname</name>
	<value>true</value>
</property>
```
运行成功

<font color=#FF4500>通过查阅资料，建议在**hdfs-site.xml**中增加***dfs.datanode.use.datanode.hostname***属性，表示datanode之间的通信也通过域名方式</font>

```
<property>
	<name>dfs.datanode.use.datanode.hostname</name>
	<value>true</value>
</property>
```

这样能够使得更换内网IP变得十分简单、方便，而且可以让特定datanode间的数据交换变得更容易。但与此同时也<font color=#FF4500>存在一个副作用</font>，当DNS解析失败时会导致整个Hadoop不能正常工作，所以要保证DNS的可靠

<font size=5><b>总结：将默认的通过IP访问，改为通过域名方式访问。</b></font>

### 参考资料

[https://blog.csdn.net/vaf714/article/details/82996860](https://blog.csdn.net/vaf714/article/details/82996860)

[https://www.cnblogs.com/krcys/p/9146329.html](https://www.cnblogs.com/krcys/p/9146329.html)

[https://blog.csdn.net/dominic_tiger/article/details/71773656](https://blog.csdn.net/dominic_tiger/article/details/71773656)

[https://rainerpeter.wordpress.com/2014/02/12/connect-to-hdfs-running-in-ec2-using-public-ip-addresses/](https://rainerpeter.wordpress.com/2014/02/12/connect-to-hdfs-running-in-ec2-using-public-ip-addresses/)