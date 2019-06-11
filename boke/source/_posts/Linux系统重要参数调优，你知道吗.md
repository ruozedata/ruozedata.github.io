---
layout: post
title: "Linux系统重要参数调优，你知道吗"
date: 2018-06-04
comments: true
tags: 
	- linux
categories: Linux
---



#### 当前会话生效 
ulimit -u -> 查看当前最大进程数 
ulimit -n ->查看当前最大文件数 
ulimit -u xxx -> 修改当前最大进程数为xxx 
ulimit -n xxx -> 修改当前最大文件数为xxx 

#### 永久生效 
1.vi /etc/security/limits.conf，添加如下的行 
* soft noproc 11000 
* hard noproc 11000 
* soft nofile 4100 
* hard nofile 4100  
<!--more--> 
说明：
* 代表针对所有用户 
noproc 是代表最大进程数 
nofile 是代表最大文件打开数 

#### 2.让 SSH 接受 Login 程式的登入，方便在 ssh 客户端查看 ulimit -a 资源限制： 
- 1)、vi /etc/ssh/sshd_config 
把 UserLogin 的值改为 yes，并把 # 注释去掉 
- 2)、重启 sshd 服务 
/etc/init.d/sshd restart  
- 3)、修改所有 linux 用户的环境变量文件： 
vi /etc/profile 
ulimit -u 10000 
ulimit -n 4096 
ulimit -d unlimited 
ulimit -m unlimited 
ulimit -s unlimited 
ulimit -t unlimited 
ulimit -v unlimited 
- 4)、生效 
source /etc/profile
