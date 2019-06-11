---
layout: post
title: "12生产预警平台项目之RedisLive监控工具的详细安装"
date: 2018-09-14
comments: true
tags: 
	- spark
	- 高级
	- 生产预警平台项目
categories: 生产预警平台项目
---
<!--more--> 
```
GitHub: https://github.com/nkrode/RedisLive
```
#### 1.安装python2.7.5 和pip
```
http://blog.itpub.net/30089851/viewspace-2132450/
```
#### 2.下载RedisLive
```
[root@sht-sgmhadoopdn-04 app]# wget https://github.com/nkrode/RedisLive/archive/master.zip
[root@sht-sgmhadoopdn-04 app]# unzip master 
[root@sht-sgmhadoopdn-04 app]# mv RedisLive-master RedisLive
[root@sht-sgmhadoopdn-04 app]# cd RedisLive/
[root@sht-sgmhadoopdn-04 RedisLive]# ll
total 20
drwxr-xr-x 2 root root 4096 Aug 20  2015 design
-rw-r--r-- 1 root root 1067 Aug 20  2015 MIT-LICENSE.txt
-rw-r--r-- 1 root root  902 Aug 20  2015 README.md
-rw-r--r-- 1 root root   58 Aug 20  2015 requirements.txt
drwxr-xr-x 7 root root 4096 Aug 20  2015 src
[root@sht-sgmhadoopdn-04 RedisLive]#
```
#### 3.查看版本要求(刚开始安装没注意版本，直接pip导致后面各种问题，所以请仔细看下面过程)
```
[root@sht-sgmhadoopdn-04 RedisLive]# cat requirements.txt
argparse==1.2.1
python-dateutil==1.5
redis
tornado==2.1.1
[root@sht-sgmhadoopdn-04 RedisLive]# cd ../
```
#### 4.pip安装环境要求
```
[root@sht-sgmhadoopdn-04 app]# pip install tornado
[root@sht-sgmhadoopdn-04 app]# pip install redis
[root@sht-sgmhadoopdn-04 app]# pip install python-dateutil
[root@sht-sgmhadoopdn-04 app]# pip install argparse
```
#### 5.进入 /root/learnproject/app/RedisLive/src目录,配置redis-live.conf文件
```
[root@sht-sgmhadoopdn-04 app]# cd -
/root/learnproject/app/RedisLive
[root@sht-sgmhadoopdn-04 RedisLive]# cd src
[root@sht-sgmhadoopdn-04 src]# ll
total 40
drwxr-xr-x 4 root root 4096 Aug 20  2015 api
drwxr-xr-x 2 root root 4096 Aug 20  2015 dataprovider
drwxr-xr-x 2 root root 4096 Aug 20  2015 db
-rw-r--r-- 1 root root    0 Aug 20  2015 __init__.py
-rw-r--r-- 1 root root  381 Aug 20  2015 redis-live.conf.example
-rwxr-xr-x 1 root root 1343 Aug 20  2015 redis-live.py
-rwxr-xr-x 1 root root 9800 Aug 20  2015 redis-monitor.py
drwxr-xr-x 2 root root 4096 Aug 20  2015 util
drwxr-xr-x 4 root root 4096 Aug 20  2015 www
You have mail in /var/spool/mail/root
[root@sht-sgmhadoopdn-04 src]# 
[root@sht-sgmhadoopdn-04 src]# cp redis-live.conf.example redis-live.conf
[root@sht-sgmhadoopdn-04 src]# 
[root@sht-sgmhadoopdn-04 src]# vi redis-live.conf
{
        "RedisServers":
        [
                {
                        "server": "172.16.101.66",
                        "port" : 6379
                }
        ],
        "DataStoreType" : "redis",
        "RedisStatsServer":
        {
          "server" : "172.16.101.66",
          "port" : 6379
        }
}
```

#### 6.第一次尝试启动redis-monitor.py抛错 _sqlite3
```
[root@sht-sgmhadoopdn-04 src]# ./redis-monitor.py --duration 120 
ImportError: No module named _sqlite3
[root@sht-sgmhadoopdn-04 src]# yum install -y sqlite-devel
[root@sht-sgmhadoopdn-04 src]# yum install -y sqlite
[root@sht-sgmhadoopdn-04 ~]# find / -name _sqlite3.so
/usr/local/python27/lib/python2.7/lib-dynload/_sqlite3.so
/usr/local/Python-2.7.5/build/lib.linux-x86_64-2.7/_sqlite3.so
/usr/lib64/python2.6/lib-dynload/_sqlite3.so
[root@sht-sgmhadoopdn-04 ~]# cp /usr/local/python27/lib/python2.7/lib-dynload/_sqlite3.so /usr/local/lib/python2.7/lib-dynload/
[root@sht-sgmhadoopdn-04 ~]# python
Python 2.7.5 (default, Sep 17 2016, 15:34:31) 
[GCC 4.4.7 20120313 (Red Hat 4.4.7-4)] on linux2
Type "help", "copyright", "credits" or "license" for more information.
>>> import sqlite3
>>>
参考: http://ju.outofmemory.cn/entry/97658
```

#### 7.第二次尝试启动redis-monitor.py抛错 redis
```
[root@sht-sgmhadoopdn-04 src]# ./redis-monitor.py --duration 120 
ImportError: No module named redis
[root@sht-sgmhadoopdn-04 src]# find / -name redis
/etc/rc.d/init.d/redis
/root/learnproject/app/redis
/root/learnproject/app/redis-monitor/src/main/java/sun/redis
/root/learnproject/app/redis-monitor/src/test/java/sun/redis
/usr/local/redis
/usr/local/python27/lib/python2.7/site-packages/redis
[root@sht-sgmhadoopdn-04 src]# 
[root@sht-sgmhadoopdn-04 src]# cp -r  /usr/local/python27/lib/python2.7/site-packages/redis  /usr/local/lib/python2.7/lib-dynload/
[root@sht-sgmhadoopdn-04 src]# python 
Python 2.7.5 (default, Sep 17 2016, 15:34:31) 
[GCC 4.4.7 20120313 (Red Hat 4.4.7-4)] on linux2
Type "help", "copyright", "credits" or "license" for more information.
>>> import redis

```

#### 8.第三次尝试启动redis-monitor.py，成功；按ctrl+c中断掉
```
[root@sht-sgmhadoopdn-04 src]# ./redis-monitor.py --duration 120 
^Cshutting down...
You have mail in /var/spool/mail/root
[root@sht-sgmhadoopdn-04 src]#
```

#### 9.尝试第一次启动redis-live.py ，tornado.ioloop

```
[root@sht-sgmhadoopdn-04 src]# ./redis-live.py 
Traceback (most recent call last):
  File "./redis-live.py", line 3, in <module>
    import tornado.ioloop
ImportError: No module named tornado.ioloop
[root@sht-sgmhadoopdn-04 src]# find / -name  tornado
/usr/local/python27/lib/python2.7/site-packages/tornado
[root@sht-sgmhadoopdn-04 src]# cp -r /usr/local/python27/lib/python2.7/site-packages/tornado  /usr/local/lib/python2.7/lib-dynload/
```
#### 10.尝试第二次启动redis-live.py ，singledispatch
```
[root@sht-sgmhadoopdn-04 src]# ./redis-live.py 
Traceback (most recent call last):
  File "./redis-live.py", line 6, in <module>
    import tornado.web
  File "/usr/local/lib/python2.7/lib-dynload/tornado/web.py", line 84, in <module>
    from tornado import gen
  File "/usr/local/lib/python2.7/lib-dynload/tornado/gen.py", line 98, in <module>
    from singledispatch import singledispatch  # backport
ImportError: No module named singledispatch
```
这个 singledispatch 错误，其实就是在tornado里的，谷歌和思考过后，怀疑是版本问题，于是果断卸载tornado
```
[root@sht-sgmhadoopdn-04 src]# pip uninstall tornado
[root@sht-sgmhadoopdn-04 src]# rm -rf  /usr/local/lib/python2.7/lib-dynload/tornado
[root@sht-sgmhadoopdn-04 src]# find / -name tornado
[root@sht-sgmhadoopdn-04 src]# 
假如find有的话 ，就要手工删除掉
```
#### 11.于是想想其他也是要卸载掉
```
[root@sht-sgmhadoopdn-04 src]# pip uninstall argparse
[root@sht-sgmhadoopdn-04 src]# pip uninstall python-dateutil
[root@sht-sgmhadoopdn-04 src]# find / -name argparse
[root@sht-sgmhadoopdn-04 src]# find / -name python-dateutil
假如find有的话 ，就要手工删除掉
```
#### 12.关键一步: 根据step3的指定版本来安装
```
[root@sht-sgmhadoopdn-04 src]# pip install -v tornado==2.1.1
[root@sht-sgmhadoopdn-04 src]# pip install -v argparse==1.2.1
[root@sht-sgmhadoopdn-04 src]# pip install -v python-dateutil==1.5
```
#### 13.再次尝试启动redis-live.py ，抛错dateutil.parser
```
[root@sht-sgmhadoopdn-04 src]# ./redis-live.py 
Traceback (most recent call last):
  File "./redis-live.py", line 10, in <module>
    from api.controller.ServerListController import ServerListController
  File "/root/learnproject/app/RedisLive/src/api/controller/ServerListController.py", line 1, in <module>
    from BaseController import BaseController
  File "/root/learnproject/app/RedisLive/src/api/controller/BaseController.py", line 4, in <module>
    import dateutil.parser
ImportError: No module named dateutil.parser
[root@sht-sgmhadoopdn-04 src]# 
[root@sht-sgmhadoopdn-04 src]# 
[root@sht-sgmhadoopdn-04 src]# 
[root@sht-sgmhadoopdn-04 src]# 
[root@sht-sgmhadoopdn-04 src]# find / -name dateutil
/usr/local/python27/lib/python2.7/site-packages/dateutil
[root@sht-sgmhadoopdn-04 src]# cp -r /usr/local/python27/lib/python2.7/site-packages/dateutil  /usr/local/lib/python2.7/lib-dynload/
You have mail in /var/spool/mail/root
```
#### 14.再在尝试启动redis-live.py ，成功了，然后按ctrl+c中断掉
```
[root@sht-sgmhadoopdn-04 src]# ./redis-live.py 
^CTraceback (most recent call last):
  File "./redis-live.py", line 36, in <module>
    tornado.ioloop.IOLoop.instance().start()
  File "/usr/local/lib/python2.7/lib-dynload/tornado/ioloop.py", line 283, in start
    event_pairs = self._impl.poll(poll_timeout)
KeyboardInterrupt
[root@sht-sgmhadoopdn-04 src]#
```
#### 15.启动
```
[root@sht-sgmhadoopdn-04 src]# ./redis-monitor.py --duration 120 &
[root@sht-sgmhadoopdn-04 src]# ./redis-live.py  &
```
打开web界面

http://172.16.101.66:8888/index.html

![enter description here](/assets/blogImg/914_1.png)
#### 16.总结

**a.安装 python2.7+pip**

**b.pip指定版本去安装那几个组件**

#### 17.说明:

**redis live    实时redis监控面板**

可以同时监控多个redis实例 , 包括 内存使用 、分db显示的key数、客户端连接数、 命令处理数、 系统运行时间 , 以及各种直观的折线图柱状图.
缺点是使用了monitor 命令监控 , 对性能有影响 ,最好不要长时间启动 .

**redis-monitor.py:**

用来调用redis的monitor命令来收集redis的命令来进行统计

**redis-live.py:**

启动web服务

