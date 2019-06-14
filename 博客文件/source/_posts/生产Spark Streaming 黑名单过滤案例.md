---
layout: post
title: "生产Spark Streaming 黑名单过滤案例"
date: 2019-03-08
comments: true
tags: [spark,spark streaming,高级]
categories: [Spark Streaming]
---

测试数据(通过Socket传入)：

```
20180808,zs
20180808,ls
20180808,ww
```

黑名单列表(生产存在表)：

```
zs
ls
```

### 思路

1. 原始日志可以通过Streaming直接读取成一个DStream
2. 名单通过RDD来模拟一份
<!--more--> 
### 逻辑实现

1. 将DStream转成以下格式(黑名单只有名字)

	`(zs,(20180808,zs))(ls,(20180808,ls))(ww,( 20180808,ww))`

2. 将黑名单转成

	`(zs, true)(ls, true)`

3. DStram与RDD进行LeftJoin(DStream能与RDD进行Join就是借用的transform算子)

### 具体代码实现及注释

```
package com.soul.spark.Streaming
import org.apache.spark.SparkConf
import org.apache.spark.streaming.{Seconds, StreamingContext}
/**
  * @author soulChun
  * @create 2019-01-10-16:12
  */
object TransformApp {
  def main(args: Array[String]): Unit = {
    val sparkConf = new SparkConf().setAppName("StatafulFunApp").setMaster("local[2]")
    val ssc = new StreamingContext(sparkConf,Seconds(10))
    //构建黑名单
    val blacks = List("zs", "ls")
    //通过map操作将黑名单结构转换成(zs, true)(ls, true)
    val blackRDD = ssc.sparkContext.parallelize(blacks).map(x => (x, true))
    val lines = ssc.socketTextStream("localhost", 8769)
    //lines (20180808,zs)
    //lines 通过map.split(1)之后取得就是zs,然后加一个x就转成了(zs,(20180808,zs)).就可以和blackRDD进行Join了
    val clicklog = lines.map(x => (x.split(",")(1), x)).transform(rdd => {
      //Join之后数据结构就变成了(zs,[(20180808,zs),true]),过滤掉第二个元素中的第二个元素等于true的
      rdd.leftOuterJoin(blackRDD).filter(x => x._2._2.getOrElse(false) != true)
        //我们最后要输出的格式是(20180808,zs)，所以取Join之后的第二个元素中的第一个元素
        .map(x => x._2._1)
    })
    ssc.start()
    ssc.awaitTermination()
  }
}
```

最后输出：

![代码实现](/source/assets/blogImg/2019-03-08-1.png)