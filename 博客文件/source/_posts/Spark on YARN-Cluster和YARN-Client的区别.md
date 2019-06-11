---
layout: post
title: "Spark on YARN-Cluster和YARN-Client的区别"
date: 2018-05-12
comments: true
tags: [高级,spark,架构]
categories:  Spark Other
---
##### 一. YARN-Cluster和YARN-Client的区别
![](/assets/blogImg/512_1.png)
（1）SparkContext初始化不同，这也导致了Driver所在位置的不同，YarnCluster的Driver是在集群的某一台NM上，但是Yarn-Client就是在driver所在的机器上； 
（2）而Driver会和Executors进行通信，这也导致了Yarn_cluster在提交App之后可以关闭Client，而Yarn-Client不可以； 
（3）最后再来说应用场景，Yarn-Cluster适合生产环境，Yarn-Client适合交互和调试。
<!--more--> 
##### 二. yarn client 模式
![](/assets/blogImg/512_2.png)
<font color=#FF4200 >yarn-client  模式的话 ，把 客户端关掉的话 ，是不能提交任务的 。
</font>
##### 三.yarn  cluster 模式
![](/assets/blogImg/512_3.png)
<font color=#FF4200 >yarn-cluster 模式的话， client 关闭是可以提交任务的 ，
</font>
##### 总结:
**1.spark-shell/spark-sql 只支持 yarn-client模式；
2.spark-submit对于两种模式都支持。**