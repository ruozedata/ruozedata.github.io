---
layout: post
title: "spark2.4.2详细介绍"
date: 2019-04-23
comments: true
tags: [spark,高级]
categories:  Spark Other
---


Spark发布了最新的版本spark-2.4.2
根据官网介绍，此版本对于使用spark2.4的用户来说帮助是巨大的

#### 版本介绍
![enter description here](/assets/blogImg/spark2.4.2_1.jpg)
Spark2.4.2是一个包含稳定性修复的维护版本。 此版本基于Spark2.4维护分支。<font color=#FF4500 > **我们强烈建议所有2.4用户升级到此稳定版本。**</font>
<!--more--> 


#### 显著的变化
![enter description here](/assets/blogImg/spark2.4.2_2.jpg)
- SPARK-27419：在spark2.4中将spark.executor.heartbeatInterval设置为小于1秒的值时，它将始终失败。 因为该值将转换为0，心跳将始终超时，并最终终止执行程序。
- 还原SPARK-25250：可能导致作业永久挂起，在2.4.2中还原。

#### 详细更改
![enter description here](/assets/blogImg/spark2.4.2_3.jpg)

###### BUG
|issues|内容摘要|
|-|-|
|[\[ SPARK-26961 \]](https://issues.apache.org/jira/browse/SPARK-26961) | 在Spark Driver中发现Java死锁|
|[\[ SPARK-26998 \]](https://issues.apache.org/jira/browse/SPARK-26998) | 在Standalone模式下执行'ps -ef'程序进程,输出spark.ssl.keyStorePassword的明文|
|[\[ SPARK-27216 \]](https://issues.apache.org/jira/browse/SPARK-27216) | 将RoaringBitmap升级到0.7.45以修复Kryo不安全的ser / dser问题|
|[\[ SPARK-27244 \]](https://issues.apache.org/jira/browse/SPARK-27244) | 使用选项logConf = true时密码将以conf的明文形式记录|
|[\[ SPARK-27267 \]](https://issues.apache.org/jira/browse/SPARK-27267) | 用Snappy 1.1.7.1解压、压缩空序列化数据时失败|
|[\[ SPARK-27275 \]](https://issues.apache.org/jira/browse/SPARK-27275) | EncryptedMessage.transferTo中的潜在损坏|
|[\[ SPARK-27301 \]](https://issues.apache.org/jira/browse/SPARK-27301) | DStreamCheckpointData因文件系统已缓存而无法清理|
|[\[ SPARK-27338 \]](https://issues.apache.org/jira/browse/SPARK-27338) | TaskMemoryManager和UnsafeExternalSorter $ SpillableIterator之间的死锁|
|[\[ SPARK-27351 \]](https://issues.apache.org/jira/browse/SPARK-27351) | 在仅使用空值列的AggregateEstimation之后的错误outputRows估计|
|[\[ SPARK-27390 \]](https://issues.apache.org/jira/browse/SPARK-27390) | 修复包名称不匹配|
|[\[ SPARK-27394 \]](https://issues.apache.org/jira/browse/SPARK-27394) | 当没有任务开始或结束时，UI 的陈旧性可能持续数分钟或数小时|
|[\[ SPARK-27403 \]](https://issues.apache.org/jira/browse/SPARK-27403) | 修复updateTableStats以使用新统计信息或无更新表统计信息|
|[\[ SPARK-27406 \]](https://issues.apache.org/jira/browse/SPARK-27406) | 当两台机器具有不同的Oops大小时，UnsafeArrayData序列化会中断|
|[\[ SPARK-27419 \]](https://issues.apache.org/jira/browse/SPARK-27419) | 将spark.executor.heartbeatInterval设置为小于1秒的值时，它将始终失败|
|[\[ SPARK-27453 \]](https://issues.apache.org/jira/browse/SPARK-27453) | DSV1静默删除DataFrameWriter.partitionBy|
###### 改进
|issues|内容摘要|
|-|-|
|[\[ SPARK-27346 \]](https://issues.apache.org/jira/browse/SPARK-27346) | 松开在ExpressionInfo的'examples'字段中换行断言条件|
|[\[ SPARK-27358 \]](https://issues.apache.org/jira/browse/SPARK-27358) | 将jquery更新为1.12.x以获取安全修复程序|
|[\[ SPARK-27479 \]](https://issues.apache.org/jira/browse/SPARK-27479) | 隐藏“org.apache.spark.util.kvstore”的API文档|
###### 工作
|issues|内容摘要|
|-|-|
|[\[ SPARK-27382 \]](https://issues.apache.org/jira/browse/SPARK-27382) | 在HiveExternalCatalogVersionsSuite中更新Spark 2.4.x测试|