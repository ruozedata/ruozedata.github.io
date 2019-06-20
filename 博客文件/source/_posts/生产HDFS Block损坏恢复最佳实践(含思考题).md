---
layout: post
title: "生产HDFS Block损坏恢复最佳实践(含思考题)"
date: 2019-06-06
comments: true
tags: 
    - HDFS
    - 高级
    - Block损坏恢复
    - 实践
categories: [故障案例]

---

<!--more--> 

### 文件ruozedata.md

```
上传:
-bash-4.2$ hdfs dfs -mkdir /blockrecover
-bash-4.2$ echo "www.ruozedata.com" > ruozedata.md

-bash-4.2$ hdfs dfs -put ruozedata.md /blockrecover
-bash-4.2$ hdfs dfs -ls /blockrecover
Found 1 items
-rw-r--r--   3 hdfs supergroup         18 2019-03-03 14:42 /blockrecover/ruozedata.md
-bash-4.2$ 

校验: 健康状态
-bash-4.2$ hdfs fsck /
Connecting to namenode via http://yws76:50070/fsck?ugi=hdfs&path=%2F
FSCK started by hdfs (auth:SIMPLE) from /192.168.0.76 for path / at Sun Mar 03 14:44:44 CST 2019
...............................................................................Status: HEALTHY
 Total size:    50194618424 B
 Total dirs:    354
 Total files:   1079
 Total symlinks:                0
 Total blocks (validated):      992 (avg. block size 50599413 B)
 Minimally replicated blocks:   992 (100.0 %)
 Over-replicated blocks:        0 (0.0 %)
 Under-replicated blocks:       0 (0.0 %)
 Mis-replicated blocks:         0 (0.0 %)
 Default replication factor:    3
 Average block replication:     3.0
 Corrupt blocks:                0
 Missing replicas:              0 (0.0 %)
 Number of data-nodes:          3
 Number of racks:               1
FSCK ended at Sun Mar 03 14:44:45 CST 2019 in 76 milliseconds

The filesystem under path '/' is HEALTHY
-bash-4.2$ 
```

### 直接DN节点上删除文件一个block的一个副本(3副本)

```
删除块和meta文件:
[root@yws87 subdir135]# rm -rf blk_1075808214 blk_1075808214_2068515.meta

直接重启HDFS，直接模拟损坏效果，然后fsck检查:
-bash-4.2$ hdfs fsck /
Connecting to namenode via http://yws77:50070/fsck?ugi=hdfs&path=%2F
FSCK started by hdfs (auth:SIMPLE) from /192.168.0.76 for path / at Sun Mar 03 16:02:04 CST 2019
.
/blockrecover/ruozedata.md:  Under replicated BP-1513979236-192.168.0.76-1514982530341:blk_1075808214_2068515. Target Replicas is 3 but found 2 live replica(s), 0 decommissioned replica(s), 0 decommissioning replica(s).
...............................................................................Status: HEALTHY
 Total size:    50194618424 B
 Total dirs:    354
 Total files:   1079
 Total symlinks:                0
 Total blocks (validated):      992 (avg. block size 50599413 B)
 Minimally replicated blocks:   992 (100.0 %)
 Over-replicated blocks:        0 (0.0 %)
 Under-replicated blocks:       1 (0.10080645 %)
 Mis-replicated blocks:         0 (0.0 %)
 Default replication factor:    3
 Average block replication:     2.998992
 Corrupt blocks:                0
 Missing replicas:              1 (0.033602152 %)
 Number of data-nodes:          3
 Number of racks:               1
FSCK ended at Sun Mar 03 16:02:04 CST 2019 in 148 milliseconds


The filesystem under path '/' is HEALTHY
-bash-4.2$ 
```

### 手动修复hdfs debug

```
-bash-4.2$ hdfs |grep debug
没有输出debug参数的任何信息结果！
故hdfs命令帮助是没有debug的，但是确实有hdfs debug这个组合命令，切记。

修复命令:
-bash-4.2$ hdfs debug  recoverLease  -path /blockrecover/ruozedata.md -retries 10
recoverLease SUCCEEDED on /blockrecover/ruozedata.md
-bash-4.2$ 

直接DN节点查看，block文件和meta文件恢复:
[root@yws87 subdir135]# ll
total 8
-rw-r--r-- 1 hdfs hdfs 56 Mar  3 14:28 blk_1075808202
-rw-r--r-- 1 hdfs hdfs 11 Mar  3 14:28 blk_1075808202_2068503.meta
[root@yws87 subdir135]# ll
total 24
-rw-r--r-- 1 hdfs hdfs 56 Mar  3 14:28 blk_1075808202
-rw-r--r-- 1 hdfs hdfs 11 Mar  3 14:28 blk_1075808202_2068503.meta
-rw-r--r-- 1 hdfs hdfs 18 Mar  3 15:23 blk_1075808214
-rw-r--r-- 1 hdfs hdfs 11 Mar  3 15:23 blk_1075808214_2068515.meta
```

### 自动修复

```
当数据块损坏后，DN节点执行directoryscan操作之前，都不会发现损坏；
也就是directoryscan操作是间隔6h
dfs.datanode.directoryscan.interval : 21600

在DN向NN进行blockreport前，都不会恢复数据块;
也就是blockreport操作是间隔6h
dfs.blockreport.intervalMsec : 21600000

当NN收到blockreport才会进行恢复操作。
```

具体参考生产上HDFS（CDH5.12.0）对应的版本的文档参数:[http://archive.cloudera.com/cdh5/cdh/5/hadoop-2.6.0-cdh5.12.0/hadoop-project-dist/hadoop-hdfs/hdfs-default.xml](http://archive.cloudera.com/cdh5/cdh/5/hadoop-2.6.0-cdh5.12.0/hadoop-project-dist/hadoop-hdfs/hdfs-default.xml)

### 总结

生产上本人一般倾向于使用 手动修复方式，但是前提要手动删除损坏的block块。

切记，是删除损坏block文件和meta文件，而不是删除hdfs文件。 

当然还可以先把文件get下载，然后hdfs删除，再对应上传。

切记删除不要执行: hdfs fsck / -delete 这是删除损坏的文件， 那么数据不就丢了嘛；除非无所谓丢数据，或者有信心从其他地方可以补数据到hdfs！

### 思考题

- 那么如何确定一个文件的损失的块位置，哪几种方法呢？
- CDH的配置里搜索没有这两个参数，怎么调整生效呢？

块扫描: [https://blog.cloudera.com/blog/2016/12/hdfs-datanode-scanners-and-disk-checker-explained/](https://blog.cloudera.com/blog/2016/12/hdfs-datanode-scanners-and-disk-checker-explained/)