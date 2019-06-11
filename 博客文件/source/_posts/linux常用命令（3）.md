---
layout: post
title: "Linux常用命令（三）"
date: 2018-04-01
comments: true
tags: 
	- linux
	- 基础
categories:  Linux
---
Linux最常用实战命令（三）
<!--more--> 
1. 用户、用户组

    用户

	- useradd 用户名    添加用户

	- userdel 用户名    删除用户

	- id 用户名    查看用户信息

	- passwd 用户名    修改用户密码

	- su - 用户名    切换用户

	- ll /home/    查看已有的用户

    用户组

	- groupadd 用户组    添加用户组

	- cat /etc/group    用户组的文件

	- usermod -a -G 用户组 用户    将用户添加到用户组中

    给一个普通用户添加sudo权限
```
    vi /etc/sudoers
        #在root     ALL=(ALL)    ALL    下面添加一行
        用户    ALL=(ALL)    NOPASSWD:ALL
```
2. 修改文件权限

    chown    修改文件或文件夹的所属用户和用户组

	- chown -R 用户:用户组 文件夹名    -R 为递归参数，指针对文件夹

	- chown 用户:用户组 文件名

    chmod: 修改文件夹或者文件的权限 

	- chmod -R 700 文件夹名 

	- chmod 700 文件夹名



    r  =>    4

    w  =>    2

    x  =>    1

3. 后台执行命令

- & 

- nohup 

- screen

4. 多人合作    screen

- screen -list    查看会话 

- screen -S    建立一个后台的会话 

- screen -r    进入会话 

- ctrl+a+d    退出会话