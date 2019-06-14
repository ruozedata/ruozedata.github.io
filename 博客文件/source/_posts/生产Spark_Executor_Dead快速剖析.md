---
layout: post
title: "生产Spark Executor Dead快速剖析"
date: 2019-03-12
comments: true
tags: [spark,高级]
categories: Spark Other
---

## 问题现象

通过Spark UI查看Executors，发现存在Executor Dead的情况

![enter description here](/assets/blogImg/2019-03-12-1.png)

进一步查看dead Executor stderr日志，发现如下报错信息：

![enter description here](/assets/blogImg/2019-03-12-2.png)

## 解决过程
<!--more--> 
<font color=#FF4500>打开GC日志，配置如下</font>

```
--conf "spark.executor.extraJavaOptions= -verbose:gc -XX:+PrintGCDetails -XX:+PrintGCDateStamps"
--conf "spark.driver.extraJavaOptions= -verbose:gc -XX:+PrintGCDetails -XX:+PrintGCDateStamps"
```

<font color=#FF4500>打开exeutor gc日志，发现一直在**full gc**，几乎每秒1次，基本处于拒绝服务状态</font>

![enter description here](./assets/blogImg/2019-03-12-3.png)

<font size=4><b>至此找到问题原因，executor内存不够导致dead，调大executor内存即可 ，所以排错方法定位很重要！</b></font>