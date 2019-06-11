---
layout: post
title: "Spark在携程的实践（二）"
date: 2018-12-16
comments: true
tags: 
	- spark
	- 高级
categories: Spark Other
---
以下内容来自第三届携程大数据沙龙

### 七、遇到的问题
##### orc split
Spark读取Hive表用的各个文件格式的InuptFormat，计算读取表需要的task数量依赖于InputFormat#getSplits
由于大部分表的存储格式主要使用的是orc，当一个orc文件超过256MB，split算法并行去读取orc元数据，有时候Driver内存飙升，OOM crash，Full GC导致network timeout，spark context stop
Hive读这些大表为何没有问题？因为Hive默认使用的是CombineHiveInputFormat，split是基于文件大小的。
Spark也需要实现类似于Hive的CombineInputFormat，还能解决小文件过多导致提交task数量过多的问题。
Executor Container killed
Executor : Container killed by YARN for exceeding memory limits. 13.9 GB of 12 GB physical memory used. Consider boosting spark.yarn.executor.memoryOverhead
<!--more--> 
##### 原因：
1.Shuffle Read时netty堆外内存的使用
2.Window function spill threshold过小，导致每4096条或者64MB为一个文件写到磁盘
外部排序同时打开每个文件，每个文件占用1MB的堆外内存，导致container使用的内存远超过申请的内存，遂被yarn kill。
解决：
Patch：
[SPARK-19659] Fetch big blocks to disk when shuffle-read
[SPARK-21369][CORE] Don't use Scala Tuple2 in common/network-*
参数：spark.reducer.maxReqSizeShuffleToMem=209715200
Patch：
[SPARK-21595]Separate thresholds for buffering and spilling in ExternalAppendOnlyUnsafeRowArray
参数：
spark.sql.windowExec.buffer.in.memory.threshold=4096
spark.sql.windowExec.buffer.spill.threshold= 1024 * 1024 * 1024 / 2
##### 小文件问题
Spark写数据时生成很多小文件，对NameNode产生巨大的压力，在一开始Spark灰度上线的时候，文件数和Block数飙升，文件变小导致压缩率降低，容量也跟着上去。
##### 移植Hive MergeFileTask的实现
在Spark最后写目标表的阶段追加入了一个MergeFileTask，参考了Hive的实现
org.apache.hadoop.hive.ql.io.merge.MergeFileTask
org.apache.hadoop.hive.ql.exec.OrcFileMergeOperator
##### 无数据的情况下不创建空文件
[SPARK-21435][SQL]
Empty files should be skipped while write to file
### 八、优化
1.查询分区表时支持broadcast join，加速查询
2.减少Broadcast join的内存压力 SPARK-22170
3.Fetch失败后能快速失败，以免作业卡几个小时 SPARK-19753
4.Spark Thrift Server稳定性
经常挂掉，日志里异常，more than one active taskSet for stage
Apply SPARK-23433仍有少数挂掉的情况，
提交SPARK-24677到社区，修复之
5.作业hang住 SPARK-21834 SPARK-19326 SPARK-11334
### 九、未来计划
##### 自动调优内存
手机spark driver和executor内存使用情况
根据作业历史的内存使用情况，在调度系统端自动设置合适的内存
https://github.com/uber-common/jvm-profiler
##### spark adaptive
动态调整执行计划 SortMergeJoin转化为BroadcastHashJoin
动态处理数据倾斜
https://issues.apache.org/jira/browse/SPARK-23128
https://github.com/Intel-bigdata/spark-adaptive