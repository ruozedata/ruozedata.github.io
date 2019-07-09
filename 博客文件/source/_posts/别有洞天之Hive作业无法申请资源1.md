---
layout: post
title: "别有洞天之Hive作业无法申请资源"
date: 2019-03-21
comments: true
tags: 
    - hive
categories: [Hive]
---

<!--more--> 

### 问题描述

在使用Hive Client跑job时，一直提示job被kill，然后观察YARN的WebUI进行查看，如图：

![enter description here](/assets/blogImg/2019-03-21.png)

然后观察Hive Client的控制台输出，如下：

```
Launching Job 1 out of 3
Number of reduce tasks is set to 0 since there's no reduce operator
Starting Job = job_1552895066408_0001, Tracking URL = http://localhost:8088/proxy/application_1552895066408_0001/
Kill Command = /wangqingguo/bigdata/hadoop-2.6.0-cdh5.7.0/bin/hadoop job  -kill job_1552895066408_0001
Hadoop job information for Stage-1: number of mappers: 0; number of reducers: 0
2019-03-18 15:44:40,758 Stage-1 map = 0%,  reduce = 0%
Ended Job = job_1552895066408_0001 with errors
Error during job, obtaining debugging information...
FAILED: Execution Error, return code 2 from org.apache.hadoop.hive.ql.exec.mr.MapRedTask
MapReduce Jobs Launched:
Stage-Stage-1:  HDFS Read: 0 HDFS Write: 0 FAIL
Total MapReduce CPU Time Spent: 0 msec
```

### 解决思路 

通过YARN的WebUI看到，发现YARN没有Core和Memory，按照常理讲，如果不配置Core和Memeory，yarn-site.xml文件会有默认的值。

为了保险起见，我添加以下参数：

```
<property>
	<name>yarn.nodemanager.resource.cpu-vcores</name>
	<value>8</value>
</property>
 
<property>
	<name>yarn.nodemanager.resource.memory-mb</name>
	<value>8192</value>
</property>
 
<property>
	<name>yarn.scheduler.minimum-allocation-mb</name>
	<value>1024</value>
</property>
 
<property>
	<name>yarn.scheduler.maximum-allocation-mb</name>
	<value>8192</value>
</property>
```

重启HDFS的进程后，重新提交job，发现还是报这个错，然后通过仔细观察WebUI的log发现一句话：

`Hadoop MapReduce Error - /bin/bash: /bin/java: is a directory`

终于找到错误的所在，原来是找不到Java。

最后我在etc/hadoop/hadoop.env.sh中配置了java_home，问题解决。