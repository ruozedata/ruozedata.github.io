---
layout: post
title: "生产上Spark对MySQL加载并发提高的两种代码(彩蛋)"
date: 2019-07-30
comments: true
tags: 
    - Spark
    - 高级
    - SQL
categories: [Spark SQL]

---

<!--more--> 



1.通过使用表字段数字类型的最大值和最小值加上numPartitions组合做相应的分区设置

背景：tableA的主键ID为Int类型，且属于以1为自增步长的自增键，那么对全表做数据加载方式如下

```
val sql = "select * from tableA" // 查询tableA数据
val upperBound = jdbc("select count(1) from tableA") // 自定义jdbc方法，查询tableA的数据总量
val readTablePartitionNum = upperBound / 10000 + 1 // 根据数据总量 / 10000 加上1的方式给此表自动计算分区数量
val rowKeyCol = “ID” // 分区的字段(此种方式该值的数据类型必须为整形)
mysqlDf = spark.read.format("jdbc")
    .option("url", jdbcMap.get("url"))
    .option("driver", jdbcMap.get("drivername"))
    .option("dbtable", sql)
    .option("user", jdbcMap.get("username"))
    .option("password", jdbcMap.get("password"))
    .option("numPartitions", readTablePartitionNum)
    .option("partitionColumn", rowKeyCol)
    .option("lowerBound", 0)
    .option("upperBound", upperBound)
    .load()
```

其中此方法jdbc的源代码截图如下

![1](/assets/pic/2019-07-30-1.png)

2.还有另外一种场景会出现主键ID并非数字类型，比如主键用的是UUID？上面的方式就不能使用了，但是又需要将数据相对均匀分布的放在N个partition内，此处可以使用第二种方式，按照不同条件做分区。

背景：tableA的表主键ID为UUID，有时间字段cretime，且此表数据属于均匀增长的业务表。

```
/** 使用 创建时间字段 做分区
* 1.MySQL主键为整形 且非全量校验
* 2.MySQL主键为字符串
*/
 val prop = new java.util.Properties
 prop.setProperty("user", jdbcMap.get("username"))
 prop.setProperty("password", jdbcMap.get("password"))
 prop.setProperty("Driver", jdbcMap.get("drivername"))
 
 // 此处省略了Array里生成从开始时间结束时间，及粒度的方法(业务)，最后Array结果如下
 // 这是J哥我留给你们的挑战作业，你会做吗？

 val predicates = Array("cretime >= '2019-01-01' and cretime < '2019-01-02'"
                       ,"cretime >= '2019-01-02' and cretime < '2019-01-03'"
                       ,"cretime >= '2019-01-03' and cretime < '2019-01-04'")
 
 mysqlDf = spark.read.jdbc(jdbcMap.get("url"), s"test.tableA", predicates, prop)

```

其中此方法jdbc的源代码截图如下 

![2](/assets/pic/2019-07-30-2.png)

总结两点：

1.其中截图都有一块明确说明，分区的数量不要创建太多，否则很容易将你拉取的mysql数据库拉垮掉(重要)。

此处有两种操作方式: 

```
A)给作业的总core不要设置太大
B)在创建jdbc时，不要将numPartition计算过后的值设置太大(第一种方式)，或者不要将parts数组的长度设置太大(第二种方式)
2.在操作中需要注意"select * “的使用，此处我两种方式都未设置对列的筛选，得益于spark的优化引擎，我后续对此两个DF都只用到了每个DataFrame的两个列，另外，在拿取到dataframe的时候千万小心使用persist()
```

方法，因为persist方法没有优化列选取，直接抓取的所有当前dataframe能拿到的列，这样对mysql是有压力的。






