---
layout: post
title: "docker常用命令以及安装mysql"
date: 2019-05-08
comments: true
tags: 
	- docker
categories: Docker
---

### 1.简介

Docker是一个开源的应用容器引擎；是一个轻量级容器技术；

Docker支持将软件编译成一个镜像；然后在镜像中各种软件做好配置，将镜像发布出去，其他使用者可以直接使用这个镜像；

运行中的这个镜像称为容器，容器启动是非常快速的。
<!--more--> 
### 2.核心概念

docker主机(Host)：安装了Docker程序的机器（Docker直接安装在操作系统之上）；

docker客户端(Client)：连接docker主机进行操作；

docker仓库(Registry)：用来保存各种打包好的软件镜像；

docker镜像(Images)：软件打包好的镜像；放在docker仓库中；

docker容器(Container)：镜像启动后的实例称为一个容器；容器是独立运行的一个或一组应用

### 3.安装环境

```
VM ware Workstation10
CentOS-7-x86_64-DVD-1804.iso
uname -r
3.10.0-862.el7.x86_64
```
**检查内核版本，必须是3.10及以上** 查看命令：uname -r

### 4.在linux虚拟机上安装docker

步骤：

1、检查内核版本，必须是3.10及以上
uname -r

2、安装docker
yum install docker

3、输入y确认安装
Dependency Updated:
  audit.x86_64 0:2.8.1-3.el7_5.1                                  audit-libs.x86_64 0:2.8.1-3.el7_5.1                                 

Complete!
(成功标志)

4、启动docker
```
[root@hadoop000 ~]# systemctl start docker
[root@hadoop000 ~]# docker -v
Docker version 1.13.1, build 8633870/1.13.1
```
5、开机启动docker
```
[root@hadoop000 ~]# systemctl enable docker
Created symlink from /etc/systemd/system/multi-user.target.wants/docker.service to /usr/lib/systemd/system/docker.service.
```
6、停止docker
```
[root@hadoop000 ~]# systemctl stop docker
``` 
### 5.常用命令

镜像操作
|操作|命令|说明|
|---|---|---|
检索	|docker search 关键字 eg：docker search redis|	我们经常去docker hub上检索镜像的详细信息，如镜像的TAG。|
拉取	|docker pull 镜像名:tag|	:tag是可选的，tag表示标签，多为软件的版本，默认是latest
列表|	docker images	|查看所有本地镜像
删除|docker rmi image-id	|删除指定的本地镜像

当然大家也可以在官网查找：https://hub.docker.com/

容器操作
软件镜像（QQ安装程序）----运行镜像----产生一个容器（正在运行的软件，运行的QQ）；

步骤：

- 1、搜索镜像
[root@localhost ~]# docker search tomcat
- 2、拉取镜像
[root@localhost ~]# docker pull tomcat
- 3、根据镜像启动容器
docker run --name mytomcat -d tomcat:latest
- 4、docker ps  
查看运行中的容器
- 5、 停止运行中的容器
docker stop  容器的id
- 6、查看所有的容器
docker ps -a
- 7、启动容器
docker start 容器id
- 8、删除一个容器
 docker rm 容器id
- 9、启动一个做了端口映射的tomcat
[root@localhost ~]# docker run -d -p 8888:8080 tomcat
-d：后台运行
-p: 将主机的端口映射到容器的一个端口    主机端口:容器内部的端口

- 10、为了演示简单关闭了linux的防火墙
service firewalld status ；查看防火墙状态
service firewalld stop：关闭防火墙
systemctl disable firewalld.service #禁止firewall开机启动
- 11、查看容器的日志
docker logs container-name/container-id

更多命令参看
https://docs.docker.com/engine/reference/commandline/docker/
可以参考镜像文档

### 6.使用docker安装mysql

- docker pull mysql
```
docker pull mysql 
Using default tag: latest
Trying to pull repository docker.io/library/mysql ... 
latest: Pulling from docker.io/library/mysql
a5a6f2f73cd8: Pull complete 
936836019e67: Pull complete 
283fa4c95fb4: Pull complete 
1f212fb371f9: Pull complete 
e2ae0d063e89: Pull complete 
5ed0ae805b65: Pull complete 
0283dc49ef4e: Pull complete 
a7e1170b4fdb: Pull complete 
88918a9e4742: Pull complete 
241282fa67c2: Pull complete 
b0fecf619210: Pull complete 
bebf9f901dcc: Pull complete 
Digest: sha256:b7f7479f0a2e7a3f4ce008329572f3497075dc000d8b89bac3134b0fb0288de8
Status: Downloaded newer image for docker.io/mysql:latest
[root@hadoop000 ~]# docker images
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
docker.io/mysql     latest              f991c20cb508        10 days ago         486 MB
```
- 启动
```
[root@hadoop000 ~]# docker images
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
docker.io/mysql     latest              f991c20cb508        10 days ago         486 MB
[root@hadoop000 ~]# docker run --name mysql01 -d mysql
756620c8e5832f4f7ef3e82117c31760d18ec169d45b8d48c0a10ff2536dcc4a
[root@hadoop000 ~]# docker ps -a
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS                     PORTS               NAMES
756620c8e583        mysql               "docker-entrypoint..."   9 seconds ago       Exited (1) 7 seconds ago                       mysql01
[root@hadoop000 ~]# docker logs 756620c8e583
error: database is uninitialized and password option is not specified 
  You need to specify one of MYSQL_ROOT_PASSWORD, MYSQL_ALLOW_EMPTY_PASSWORD and MYSQL_RANDOM_ROOT_PASSWORD
```
可以看到上面启动的方式是错误的，提示我们要带上具体的密码
```
[root@hadoop000 ~]# docker run -p 3306:3306 --name mysql02 -e MYSQL_ROOT_PASSWORD=123456 -d mysql
eae86796e132027df994e5f29775eb04c6a1039a92905c247f1d149714fedc06
```
```
–name：给新创建的容器命名，此处命名为pwc-mysql
-e：配置信息，此处配置mysql的root用户的登陆密码
-p：端口映射，此处映射主机3306端口到容器pwc-mysql的3306端口
-d：成功启动容器后输出容器的完整ID，例如上图 73f8811f669ee...
```
- 查看是否启动成功
```
[root@hadoop000 ~]# docker ps
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                               NAMES
eae86796e132        mysql               "docker-entrypoint..."   8 minutes ago       Up 8 minutes        0.0.0.0:3306->3306/tcp, 33060/tcp   mysql02
```
- 登陆MySQL
```
docker exec -it mysql04 /bin/bash
root@e34aba02c0c3:/# mysql -uroot -p123456 
mysql: [Warning] Using a password on the command line interface can be insecure.
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 80
Server version: 8.0.13 MySQL Community Server - GPL

Copyright (c) 2000, 2018, Oracle and/or its affiliates. All rights reserved.

Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

mysql> 
```
- 其他的高级操作
```
docker run --name mysql03 -v /conf/mysql:/etc/mysql/conf.d -e MYSQL_ROOT_PASSWORD=my-secret-pw -d mysql:tag
把主机的/conf/mysql文件夹挂载到 mysqldocker容器的/etc/mysql/conf.d文件夹里面
改mysql的配置文件就只需要把mysql配置文件放在自定义的文件夹下（/conf/mysql）

docker run --name some-mysql -e MYSQL_ROOT_PASSWORD=my-secret-pw -d mysql:tag --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
指定mysql的一些配置参数
```
