---
layout: post
title: "配置多台虚拟机之间的SSH信任"
date: 2018-03-28
comments: true
tags: 
	- 基础
	- 环境搭建 
	- linux
categories:  Linux
---
#### 本机环境
<!--more--> 
![1](/assets/blogImg/640.png)

3台机器执行命令ssh-keygen
![2](/assets/blogImg/641.png)

选取第一台,生成authorized_keys文件
![3](/assets/blogImg/642.png)

hadoop002 hadoop003传输id_rsa.pub文件到hadoop001
![4](/assets/blogImg/643.png)
![5](/assets/blogImg/644.png)

hadoop001机器 合并id_rsa.pub2、id_rsa.pub3到authorized_keys
![6](/assets/blogImg/645.png)

设置每台机器的权限
```
chmod 700 -R ~/.ssh
chmod 600 ~/.ssh/authorized_keys 
```

将authorized_keys分发到hadoop002、hadoop003机器
![7](/assets/blogImg/646.png)

![8](/assets/blogImg/647.png)

验证(每台机器上执行下面的命令，只输入yes，不输入密码，说明配置成功)
```
[root@hadoop001 ~]# ssh root@hadoop002 date
[root@hadoop002 ~]# ssh root@hadoop001 date
[root@hadoop003 ~]# ssh root@hadoop001 date
```