---
layout: post
title: "JVM快速调优手册之八: GC插件&错误not_supported_for_this_jvm&命令jstatd"

date: 2019-06-19
comments: true
tags: 
	- JVM
	- 调优
categories: JVM
---
<!--more-->

<font size=4><b>1.插件安装</b></font>

tools->plugin->Available Plugin 会有值得安装的插件，如：VisualGC

![插件安装](/assets/pic/2019-06-19-8-1.png)

插件列表: [https://visualvm.dev.java.net/plugins.html](https://visualvm.dev.java.net/plugins.html)

注意：上面提供的端口配置有些麻烦，不如直接这样做:

<font size=4><b>2.要使用 VisualGC 必须在远程机上启动jstatd代理程序，否则会显示<font color=#FF4500>“not supported for this jvm” </font>错误</b></font>

<font color="blue">而启动 jstatd 时会有一个权限问题，需要做如下修改：</font>

```
[root@xxx-01 ~]# java -version
java version "1.7.0_55"
Java(TM) SE Runtime Environment (build 1.7.0_55-b13)
Java HotSpot(TM) 64-Bit Server VM (build 24.55-b03, mixed mode)
[root@xxx-01 ~]# jstatd 
Could not create remote object
access denied ("java.util.PropertyPermission" "java.rmi.server.ignoreSubClasses" "write")
java.security.AccessControlException: access denied ("java.util.PropertyPermission" "java.rmi.server.ignoreSubClasses" "write")
        at java.security.AccessControlContext.checkPermission(AccessControlContext.java:372)
        at java.security.AccessController.checkPermission(AccessController.java:559)
        at java.lang.SecurityManager.checkPermission(SecurityManager.java:549)
        at java.lang.System.setProperty(System.java:783)
        at sun.tools.jstatd.Jstatd.main(Jstatd.java:139)


[root@xxx-01 ~]# cd  /usr/java/jdk1.7.0_55
[root@xxx-01 ~]# vi /usr/java/jdk1.7.0_55/jstatd.all.policy
    grant codebase "file:${JAVA_HOME}/lib/tools.jar" {  
     permission java.security.AllPermission;  
    };  
[root@xxx-01 jdk1.7.0_55]# jstatd -J-Djava.security.policy=/usr/java/jdk1.7.0_55/jstatd.all.policy  & 
```

<font color="blue">然后后台模式启动 jstatd命令</font>

<font color="blue">主机面GC:</font>

![主机面GC](/assets/pic/2019-06-19-8-2.png)

<font color="blue">Threads:</font>

![Threads](/assets/pic/2019-06-19-8-3.png)
