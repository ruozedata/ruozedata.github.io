---
layout: post
title: "人人都应该会的ZooKeeper实战操作"
date: 2019-07-23
comments: true
tags: 
    - ZooKeeper
    - 实战操作
categories: 
    - ZooKeeper
   
---

<!--more--> 

### ZooKeeper数据结构

ZooKeeper数据模型的结构与Unix文件系统很类似，整体上可以看作是一棵树，每个节点称做一个ZNode。

很显然zookeeper集群自身维护了一套数据结构。这个存储结构是一个树形结构，其上的每一个节点，我们称之为"znode"，每一个znode默认能够存储1MB的数据，每个ZNode都可以通过其路径唯一标识。

![mark](http://pucwi7op1.bkt.clouddn.com/blog/20190724/kUEByXevaAuM.png?imageslim)

### Zookeeper节点类型

1. Znode有两种类型

	- 短暂(ephemeral):客户端和服务器端断开连接后，创建的节点自己删除
	- 持久(persistent):客户端和服务器端断开连接后，创建的节点不删除

2. ZNode有四种形式的目录节点(默认是persistent)

	```
	(1)持久化目录节点（PERSISTENT）
    	客户端与zookeeper断开连接后，该节点依旧存在
	(2)持久化顺序编号目录节点（PERSISTENT_SEQUENTIAL）
    	客户端与zookeeper断开连接后，该节点依旧存在，只是Zookeeper给该节点名称进行顺序编号
	(3)临时目录节点（EPHEMERAL）
		客户端与zookeeper断开连接后，该节点被删除
	(4)临时顺序编号目录节点（EPHEMERAL_SEQUENTIAL）
 		客户端与zookeeper断开连接后，该节点被删除，只是Zookeeper给该节点名称进行顺序编号
	```
	
3. 创建znode时设置顺序标识，znode名称后会附加一个值，顺序号是一个单调递增的计数器，由父节点维护

4. 在分布式系统中，顺序号可以被用于为所有的事件进行全局排序，这样客户端可以通过顺序号推断事件的顺序
	
### Zookeeper特点
	
- Zookeeper：一个领导者（leader），多个跟随者（follower）组成的集群。
- Leader负责进行投票的发起和决议，更新系统状态。
- Follower用于接收客户请求并向客户端返回结果，在选举Leader过程中参与投票。
- 集群中只要有半数以上节点存活，Zookeeper集群就能正常服务。
- 全局数据一致：每个server保存一份相同的数据副本，client无论连接到哪个server，数据都是一致的。
- 更新请求顺序进行，来自同一个client的更新请求按其发送顺序依次执行。
- 数据更新原子性，一次数据更新要么成功，要么失败。
- 实时性，在一定时间范围内，client能读到最新数据。
	
### 客户端命令行操作

|命令基本语法|		功能描述		|
|:--------:|:-----------------:|
|   help   |显示所有操作命令|
|ls path [watch]	|使用 ls 命令来查看当前znode中所包含的内容|
|ls2 path [watch]|查看当前节点数据并能看到更新次数等数据|
|create	|普通创建 -s 含有序列 -e 临时（重启或者超时消失）|
|get path [watch]	|获得节点的值|
|set	|设置节点的具体值|
|stat	|查看节点状态|
|delete	|删除节点|
|rmr	|递归删除节点|
	
1. 启动客户端

	```
	[hadoop@hadoop bin]$ ./zkCli.sh
	```
	
2. 查看当前znode中所包含的内容

	```
	[zk: localhost:2181(CONNECTED) 3] ls /
	[controller_epoch, brokers, zookeeper, admin, isr_change_notification, consumers, config]
	```
	
3. 查看当前节点数据并能看到更新次数等数据

	```
	[zk: localhost:2181(CONNECTED) 4] ls2 /
	[controller_epoch, brokers, zookeeper, admin, 	isr_change_notification, consumers, config]
	cZxid = 0x0
	ctime = Wed Dec 31 16:00:00 GMT-08:00 1969
	mZxid = 0x0
	mtime = Wed Dec 31 16:00:00 GMT-08:00 1969
	pZxid = 0x658
	cversion = 45
	dataVersion = 0
	aclVersion = 0
	ephemeralOwner = 0x0
	dataLength = 0
	numChildren = 7
	```
	
4. 创建节点

	```
	[zk: localhost:2181(CONNECTED) 7] create /test test
	Created /test
	[zk: localhost:2181(CONNECTED) 10] create /test/t1 t1
	Created /test/t1
	```
	
5. 获取节点的值

	```
	[zk: localhost:2181(CONNECTED) 9] get /test
	test
	cZxid = 0x67b
	ctime = Sun Apr 29 21:10:19 GMT-08:00 2018
	mZxid = 0x67b
	mtime = Sun Apr 29 21:10:19 GMT-08:00 2018
	pZxid = 0x67b
	cversion = 0
	dataVersion = 0
	aclVersion = 0
	ephemeralOwner = 0x0
	dataLength = 4
	numChildren = 0
	[zk: localhost:2181(CONNECTED) 11] get /test/t1
	t1
	cZxid = 0x67c
	ctime = Sun Apr 29 21:12:47 GMT-08:00 2018
	mZxid = 0x67c
	mtime = Sun Apr 29 21:12:47 GMT-08:00 2018
	pZxid = 0x67c
	cversion = 0
	dataVersion = 0
	aclVersion = 0
	ephemeralOwner = 0x0
	dataLength = 2
	```
	
	这里获取节点信息可以看到一堆信息，那这些代表什么意思呢？
	
	下面我们来看看具体的含义：
	
	- czxid - 引起这个znode创建的zxid，创建节点的事务的zxid（ZooKeeper Transaction Id）。每次修改ZooKeeper状态都会收到一个zxid形式的时间戳，也就是ZooKeeper事务ID。事务ID是ZooKeeper中所有修改总的次序。每个修改都有唯一的zxid，如果zxid1小于	zxid2，那么zxid1在zxid2之前发生。
	- ctime - znode被创建的毫秒数(从1970年开始)
	- mzxid - znode最后更新的zxid
	- mtime - znode最后修改的毫秒数(从1970年开始)
	- pZxid-znode最后更新的子节点zxid
	- cversion - znode子节点变化号，znode子节点修改次数
	- dataversion - znode数据变化号
	- aclVersion - znode访问控制列表的变化号
	- ephemeralOwner- 如果是临时节点，这个是znode拥有者的session id。如果不是临时节点则是0。
	- dataLength- znode的数据长度
	- numChildren - znode子节点数量
	
6. 创建临时节点

	```
	[zk: localhost:2181(CONNECTED) 12] create -e /tmp_test tmp_test
	Created /tmp_test
	[zk: localhost:2181(CONNECTED) 13] ls /
	[controller_epoch, brokers, zookeeper, test, tmp_test, admin, isr_change_notification, consumers, config]
	退出
	[zk: localhost:2181(CONNECTED) 14] quit
	Quitting...
	2018-04-29 21:17:58,754 [myid:] - INFO  [main:ZooKeeper@684] - Session: 0x1630235a6260042 closed
	2018-04-29 21:17:58,755 [myid:] - INFO  [main-EventThread:ClientCnxn$EventThread@512] - EventThread shut down
	重启
	[hadoop@hadoop bin]$ ./zkCli.sh
	再次查看
	[zk: localhost:2181(CONNECTED) 0] ls /
	[controller_epoch, brokers, zookeeper, test, admin, isr_change_notification, consumers, config]
	```
	
7. 创建带序号的节点

	```
	[zk: localhost:2181(CONNECTED) 1] create -s /num_test num_test
	Created /num_test0000000028
	[zk: localhost:2181(CONNECTED) 2] create -s /num_test1 num_test1
	Created /num_test10000000029
	[zk: localhost:2181(CONNECTED) 3] create -s /num_test2 num_test2
	Created /num_test20000000030
	```
	
8. 修改节点值

	```
	[zk: localhost:2181(CONNECTED) 1] set /test change_test
	cZxid = 0x67b
	ctime = Sun Apr 29 21:10:19 GMT-08:00 2018
	mZxid = 0x689
	mtime = Sun Apr 29 21:26:53 GMT-08:00 2018
	pZxid = 0x67c
	cversion = 1
	dataVersion = 1
	aclVersion = 0
	ephemeralOwner = 0x0
	dataLength = 11
	numChildren = 1
	```

9. 删除节点

	```
	[zk: localhost:2181(CONNECTED) 3] delete /num_test0000000028
	```

10. 递归删除节点

	```
	[zk: localhost:2181(CONNECTED) 4] rmr /test
	```

11. 查看节点状态

	```
	[zk: localhost:2181(CONNECTED) 7] stat /consumers
	cZxid = 0x2
	ctime = Wed Apr 25 01:41:56 GMT-08:00 2018
	mZxid = 0x2
	mtime = Wed Apr 25 01:41:56 GMT-08:00 2018
	pZxid = 0x3f5
	cversion = 37
	dataVersion = 0
	aclVersion = 0
	ephemeralOwner = 0x0
	dataLength = 0
	numChildren = 7
	```
















	
	