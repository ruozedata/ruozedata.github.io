---
layout: post
title: "生产上Shell的最佳实践"
date: 2019-03-26
comments: true
tags: 
    - Shell
    - 实践
categories: 
    - Shell

---

<!--more--> 

### 起因

shell脚本在任何场景中都比较常见，对于大数据中也是如此，本文将以metastore service为例，讲解如何在大数据场景中编写一个通用的metastore service的shell脚本

### hive metastore service

通常来说Hive的使用方式有2种：

1. 直接启动hive
2. 启动hiveserver2，配合beeline一起使用

关于metastore service的使用：

1. 可以将metastore存在某一个地方，通过链接的方式去连接过来
2. 也可以直接让metastore连接到本地

相关的wiki地址：[https://cwiki.apache.org/confluence/display/Hive/Configuration+Properties#ConfigurationProperties-MetaStore](https://cwiki.apache.org/confluence/display/Hive/Configuration+Properties#ConfigurationProperties-MetaStore)

![mark](http://pucwi7op1.bkt.clouddn.com/blog/20190724/oHNvcKq8M0X3.png?imageslim)

我们可以发现hive.metastore.local默认是true，可以自己去改成false，从而成为远程连接的模式

在hive-site.xml中添加

```
<property>
    <name>hive.metastore.uris</name>
    <value>thrift://localhost:9083</value>
</property>
<property>
    <name>hive.metastore.local</name>
    <value>false</value>
</property>
```

配置完成后，直接启动会产生报错

![mark](http://pucwi7op1.bkt.clouddn.com/blog/20190724/CfmwWqULyrA0.png?imageslim)

需要先启动metastore service

![mark](http://pucwi7op1.bkt.clouddn.com/blog/20190724/pR7qUDTXIcH9.png?imageslim)

启动metastore service之后，再启动hive就不会报错了

<font color="red" size=3><b>需要注意的问题</b></font>

1. 配置了上述内容之后，相当于我们不是用本地的metastore了，所有的东西都是启动在thrift://localhost:9083上，默认是9083端口
2. 如果启用了metastore service，本地的类似这些配置都是不需要在hive-site.xml中添加了

![mark](http://pucwi7op1.bkt.clouddn.com/blog/20190724/o19sVa8cFF6C.png?imageslim)

因为这些东西在server端已经全部配置过了，因此在client端就不需要再配这些东西了

### 开启metastore service的作用

这是统一元数据管理的第一步<br>
要做统一的元数据管理，使用这种模式是第一步，所有的东西都是通过服务的方式去拿的<br>
通过jps –m查看metastore service相关信息

![mark](http://pucwi7op1.bkt.clouddn.com/blog/20190724/jh3eFk5thr78.png?imageslim)

### 通用的metastore脚本编写

需要通过shell的方式对metastore进行一系列的启停<br>
对于impala、hive、spark sql等一系列计算框架，都可以使用这个metastore脚本

创建metastore.sh脚本，并赋予执行权限

```
$> chmod u+x metastore.sh
```

需求:

1. 只允许`hadoop`用户进行server的start&stop，其它用户是不能进行操作的
2. `./metastore.sh xxx` 只允许输入1个参数，对应的参数应为`start、stop、status、restart`；若没有输入，应有对应的提醒
3. 将对应的日志记录到metastore.log中去，对应的路径为：`/home/hadoop/shell/metastore/logs/metastore.log`
4. 启动metastore service之前需要检测对应的进程是否已经存在
5. 启动metastore service，在编写的过程中可以借鉴hadoop、spark相关脚本的写法

### 以hive为例

首先需要将`hive-site.xml`**拷贝**到`/home/hadoop/shell/metastore/conf`目录下<br>
只需要保留上述的2项配置内容即可

如何获取metastore service的进程id

![mark](http://pucwi7op1.bkt.clouddn.com/blog/20190724/zk9hV0BrjMRf.png?imageslim)

具体内容参见

```
source ~/.bash_profile
# 只能hadoop用户启停
if [ "`whoami`" != hadoop ] ; then
    echo "User [`whoami`] can't startup this program, please use hadoop startup this program..."
    exit -1
fi
usage="Usage: metastore.sh {start|stop|status|restart}"
# 如果没有输入start、stop、status、restart，会提示相关信息
# 并且只允许输入一个参数
if [ $# -ne 1 ] ; then
    echo $usage
    exit 1
fi
# 显示当前目录
RPG="$0"
HOME=`cd $(dirname "$RPG"); pwd`
# 记录日志
logfile=$HOME/logs/metastore.log
HIVE_BIN="/home/hadoop/app/hive-1.1.0-cdh5.7.0/bin/hive"
# 启动的时候需要指定hive_conf，客户端和服务端的是很可能不一样的，因此需要指定
HIVE_CONF="$HOME/conf"
# 启动之前需要检测进程是否存在
# 获取已经运行的进程ID
get_pid() {
    pid=`ps -ef | grep org.apache.hadoop.hive.metastore.HiveMetaStore | grep -v grep | awk '{print $2}'`
}
# 判断进程是否正在运行
process_is_running() {
    pid=`get_pid`
    if [ -z $pid ]
    then
        echo 1  # 没有运行
    else
        echo 0  # 正在运行
    fi
}
# running=`process_is_running`
# echo $running
# 启动metaserver
start() {
    echo "start"
    pid=`get_pid`
    if test `process_is_running` -eq 0
    then
        echo "WARN: process is running, pid is $pid"
        exit 1
    else
        echo "Starting Hive metastore"
        # 日志记录下来
        $HIVE_BIN --config ${HIVE_CONF} --service metastore 2>&1 >> $logfile &
        # 启动以后，等一段时间去检测是否启动成功
        sleep 10s
        pid=`get_pid`
        if test `process_is_running` -eq 0
        then
            echo "start success! pid is $pid"
        else
            echo "start fail...."
        fi
    fi
}
# start=`start `
# echo $start
stop() {
    echo "stop"
}
status() {
    echo "status"
}
restart() {
    echo "restart"
}
case "$1" in
    (start)
        start
    ;;
    (stop)
        stop
    ;;
    (restart)
        stop
        start
    ;;
    (status)
        status
    ;;
esac
```

对于stop、status、restart的内容没有写，后续进行完善更新

对于任何一个服务都可以按照这个模板进行封装