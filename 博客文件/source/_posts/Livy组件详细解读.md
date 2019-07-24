---
layout: post
title: "Livy组件详细解读"
date: 2019-03-25
comments: true
tags: 
    - Livy
categories: 
    - 其他组件

---

<!--more--> 

### Livy使用 - 关于Session的操作

官网案例：[http://livy.incubator.apache.org/examples/](http://livy.incubator.apache.org/examples/)<br>
REST API：[http://livy.incubator.apache.org/docs/latest/rest-api.html](http://livy.incubator.apache.org/docs/latest/rest-api.html)

通过REST API的方式去获取到会话，返回活的交互式会话<br>
打开Postman，在其上面进行操作：

```
GET 192.168.26.131:8998/sessions
{
    "from": 0,
    "total": 0,
    "sessions": []
}
```

<font size=3><b>创建一个新的交互式Scala，Python，R的shell在集群中</b></font>

在Postman上进行操作（操作失败）：`POST 192.168.26.131:8998/sessions`

```
1. 选择Body --> from-data
2. 输入信息：
    Key Value
    kind spark
3. 点击Bulk Edit --> raw
4. 选择：JSON(application/json)
5. Send之后，发现挂了：
    “Unrecognized token ‘kind’: was expecting (‘true’, ‘false’ or ‘null’)\n at [Source: (org.eclipse.jetty.server.HttpInputOverHTTP); line: 1, column: 6]”
```

使用以下方式创建Session

```
[hadoop@hadoop001 conf]$ curl -X POST --data '{"kind":"spark"}' -H "Content-Type:application/json" 192.168.26.131:8998/sessions
```

启动失败，打印如下日志：

```
18/06/09 06:35:27 WARN SparkEntries: SparkSession is not supported
java.net.ConnectException: Call From hadoop001/192.168.26.131 to hadoop001:8020 failed on connection exception: java.net.ConnectException: Connection refused; For more details see:  http://wiki.apache.org/hadoop/ConnectionRefused
```

解决方案：**启动HDFS**

重新启动，启动成功，打印日志

```
18/06/09 06:42:56 INFO LineBufferedStream: stdout: 18/06/09 06:42:56 INFO SparkEntries: Spark context finished initialization in 6153ms
18/06/09 06:42:56 INFO LineBufferedStream: stdout: 18/06/09 06:42:56 INFO SparkEntries: Created Spark session.
```

启动成功之后，返回如下JSON信息

```
{
	"id":0,
	"appId":null,
	"owner":null,
	"proxyUser":null,
	"state":"starting",
	"kind":"spark",
	"appInfo":
		{
			"driverLogUrl":null,
			"sparkUiUrl":null
		},
	"log":["stdout: ","\nstderr: "]
}
```

创建Seesion成功之后，再去查看活的Seesion信息：

2种方式：

```
1. Postman的方式，上面已经有操作
2. curl 192.168.26.131:8998/sessions|python -m json.tool
```

返回的JSON信息

```
{
    "from": 0,
    "total": 1,
    "sessions": [
        {
            "id": 0,
            "appId": null,
            "owner": null,
            "proxyUser": null,
            "state": "idle",
            "kind": "spark",
            "appInfo": {
                "driverLogUrl": null,
                "sparkUiUrl": null
            },
            "log": [
                "18/06/09 06:42:53 INFO Utils: Successfully started service 'org.apache.spark.network.netty.NettyBlockTransferService' on port 37616.",
                "18/06/09 06:42:53 INFO NettyBlockTransferService: Server created on 192.168.26.131:37616",
                "18/06/09 06:42:53 INFO BlockManager: Using org.apache.spark.storage.RandomBlockReplicationPolicy for block replication policy",
                "18/06/09 06:42:53 INFO BlockManagerMaster: Registering BlockManager BlockManagerId(driver, 192.168.26.131, 37616, None)",
                "18/06/09 06:42:53 INFO BlockManagerMasterEndpoint: Registering block manager 192.168.26.131:37616 with 413.9 MB RAM, BlockManagerId(driver, 192.168.26.131, 37616, None)",
                "18/06/09 06:42:53 INFO BlockManagerMaster: Registered BlockManager BlockManagerId(driver, 192.168.26.131, 37616, None)",
                "18/06/09 06:42:53 INFO BlockManager: Initialized BlockManager: BlockManagerId(driver, 192.168.26.131, 37616, None)",
                "18/06/09 06:42:56 INFO EventLoggingListener: Logging events to hdfs://192.168.26.131:8020/spark_log/local-1528497773147",
                "18/06/09 06:42:56 INFO SparkEntries: Spark context finished initialization in 6153ms",
                "18/06/09 06:42:56 INFO SparkEntries: Created Spark session."
            ]
        }
    ]
}
```

### Livy基本使用 — 提交简单的作业

**查询session的状态**

打开Postman，在其上面进行操作

```
GET 192.168.26.131:8998/sessions/0/state
{
    "id": 0,
    "state": "idle"
}
```

#### 执行代码片段，简单的加法操作(一)

```
[hadoop@hadoop001 livy-0.5.0-incubating-bin]$curl -X POST 192.168.26.131:8998/sessions/0/statements  -H "Content-Type:application/json" -d '{"code":"1+1"}'
{"id":0,"code":"1+1","state":"waiting","output":null,"progress":0.0}
```

查询代码片段执行是否成功

打开Postman，在其上面进行操作

```
GET 192.168.26.131:8998/sessions/0/statements/0
{
    "id": 0,
    "code": "1+1",
    "state": "available",
    "output": {
        "status": "ok",
        "execution_count": 0,
        "data": {
            "text/plain": "res0: Int = 2\n"
        }
    },
    "progress": 1
}
```

#### 执行代码片段，简单的加法操作(二)

1. 打开Postman，在其上面进行操作：`POST 192.168.26.131:8998/sessions/0/statements`
2. 点击Body --> raw --> JSON{application/json}
3. 输入信息<br>

    ```
    {
        "kind":"spark",
        "code":"1+2"
    }
    ```

4. 点击Send，返回以下信息<br>

    ```
    {
        "id": 1,
        "code": "1+2",
        "state": "waiting",
        "output": null,
        "progress": 0
    }
    ```

查询代码片段执行是否成功

打开Postman，在其上面进行操作

```
GET 192.168.26.131:8998/sessions/0/statements/1
{
    "id": 1,
    "code": "1+2",
    "state": "available",
    "output": {
        "status": "ok",
        "execution_count": 1,
        "data": {
            "text/plain": "res1: Int = 3\n"
        }
    },
    "progress": 1
}
```

如果想执行wordcount操作的话，就直接把代码贴在code处就行了

通过web ui查看代码片段执行结果

![mark](http://pucwi7op1.bkt.clouddn.com/blog/20190724/3Ufd0Ms05OFw.png?imageslim)

代码片段与其执行结果都在图中进行了显示

**删除session状态**

打开Postman，在其上面进行操作：

```
DELETE 192.168.26.131:8998/sessions/0
{
    "msg": "deleted"
}
```

### Livy架构解读

如下图所示

![mark](http://pucwi7op1.bkt.clouddn.com/blog/20190724/4AcICUfX8CnR.png?imageslim)

有个客户端client，中间有个livy server，后面有spark interactive session和spark batch session（在这2个里面的底层都是有一个SparkContext的）

client发请求过来(http或rest)到livy server，然后会去spark interactive session和spark batch session分别去创建2个session；与spark集群交互打交道，去创建session的方式有2种：http或rpc，现在用的比较多的方式是：rpc

livy server就是一个rest的服务，收到客户端的请求之后，与spark集群进行连接；客户端只需要把请求发到server上就可以了

这样的话，就分为了3层：

1. 最左边：其实就是一个客户单，只需要向livy server发送请求
2. 到livy server之后就会去spark集群创建我们的session
3. session创建好之后，客户端就可以把作业以代码片段的方式提交上来就OK了，其实就是以请求的方式发到server上就行

这样能带来一个优点，对于原来提交作业机器的压力可以减少很多，我们只要保障Livy Server的HA就OK了<br>
对于这个是可以保证的

对比:

1. 使用spark-submit(yarn-client模式)必须在客户端进行提交，如果客户端那台机器挂掉了(driver跑在客户端上，因此driver也就挂了)，那么作业全部都完成不了，这就存在一个单点问题
2. 在提交作业的时候，很多监控，可以通过UI搞的定，可以获取相应的接口，自己定制化的去开发监控界面
3. 通过rest api去把接口拿到、去把数据拿到，这样就可以自己定制化出来了，是很方便的

**总体执行的流程**

```
客户端发一个请求到livy server
Livy Server发一个请求到Spark集群，去创建session
session创建完之后，会返回一个请求到Livy Server
这样Livy Server就知道session创建过程中的一个状态
客户端的操作
如：如果客户端再发一个请求过来看一下，比如说看session信息啥的(可以通过GET API搞定)
```

**多用户的特性**

上述是一个用户的操作，如果第二个、第三个用户来，可以这样操作：

```
提交过去的时候，可以共享一个session
其实一个session就是一个SparkContext
比如：蓝色的client共享一个session，黑色的client共享一个session，可以通过一定的标识，它们自己能够识别出来
```

**安全性的扩展思路**

中间过程，在Livy Server这里，是可以做安全框架的