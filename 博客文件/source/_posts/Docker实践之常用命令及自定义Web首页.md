---
layout: post
title: "Docker实践之常用命令及自定义Web首页"
date: 2019-06-28
comments: true
tags: 
    - Docker
categories: [Docker]

---

<!--more-->

### 常用命令

```
[root@hadoop004 ~]# docker --help
//常用命令：
--------------------------------------------
  exec        Run a command in a running container
  history     Show the history of an image
  images      List images
  kill        Kill one or more running containers
  logs        Fetch the logs of a container
  ps          List containers
  pull        Pull an image or a repository from a registry
  push        Push an image or a repository to a registry
  rename      Rename a container
  restart     Restart one or more containers
  rm          Remove one or more containers
  rmi         Remove one or more images
  run         Run a command in a new container
  search      Search the Docker Hub for images
  start       Start one or more stopped containers
  stats       Display a live stream of container(s) resource usage statistics
  stop        Stop one or more running containers
  tag         Create a tag TARGET_IMAGE that refers to SOURCE_IMAGE
  top         Display the running processes of a container
  version     Show the Docker version information
```

```
[root@hadoop004 ~]# docker search nginx
NAME                                                   DESCRIPTION                                     STARS               OFFICIAL            AUTOMATED
nginx                                                  Official build of Nginx.                        10179               [OK]
jwilder/nginx-proxy                                    Automated Nginx reverse proxy for docker con…   1454                                    [OK]
richarvey/nginx-php-fpm                                Container running Nginx + PHP-FPM capable of…   645                                     [OK]
jrcs/letsencrypt-nginx-proxy-companion                 LetsEncrypt container to use with nginx as p…   436                                     [OK]
```

```
[root@hadoop004 ~]# docker pull nginx   //拉取官方版本的nginx
Using default tag: latest
latest: Pulling from library/nginx
f17d81b4b692: Pull complete
82dca86e04c3: Downloading  11.24MB/22.2MB
82dca86e04c3: Pull complete
046ccb106982: Pull complete
Digest: sha256:d59a1aa7866258751a261bae525a1842c7ff0662d4f34a355d5f36826abc0341
Status: Downloaded newer image for nginx:latest
```

docker相当于一个小型的linux系统，但是它又只是一个单一的进程，可以不对外暴露端口号，如果对外暴露端口号，那也只能有一个

```
[root@hadoop004 ~]# docker run \     //运行一个实例
--name huluwa-niginx-v1 \            //自定义一个名字
-d \                                 //后台运行
-p 8080:80 \                         //对外暴露的端口号，对应linux的8080端口号
nginx:latest                         //运行的镜像名及版本
d08ffca661436d9fc676355bc52940c264e7cee62c08c56e489fb9e09e1ff538
```

```
[root@hadoop004 ~]# docker ps     //查看当前活动的实例
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                  NAMES
d08ffca66143        nginx:latest        "nginx -g 'daemon of…"   2 minutes ago
```

```
[root@hadoop004 ~]# ps -ef | grep docker
root     23182     1  0 22:00 ?        00:00:07 /usr/bin/dockerd
root     23189 23182  0 22:00 ?        00:00:03 docker-containerd --config /var/run/docker/containerd/containerd.toml
root     25014 23182  0 22:27 ?        00:00:00 /usr/bin/docker-proxy -proto tcp -host-ip 0.0.0.0 -host-port 8080 -container-ip 172.17.0.2 -container-port 80
root     25021 23189  0 22:27 ?        00:00:00 docker-containerd-shim -namespace moby -workdir /var/lib/docker/containerd/daemon/io.containerd.runtime.v1.linux/moby/d08ffca661436d9fc676355bc52940c264e7cee62c08c56e489fb9e09e1ff538 -address /var/run/docker/containerd/docker-containerd.sock -containerd-binary /usr/bin/docker-containerd -runtime-root /var/run/docker/runtime-runc
root     25492 10525  0 22:35 pts/0    00:00:00 grep --color=auto docker
```
```
/usr/bin/docker-proxy -proto tcp<br>
-host-ip 0.0.0.0   //<br>
-host-port 8080   //linux系统的端口号<br>
-container-ip 172.17.0.2  //docker相当于一个小型的linux系统，这就是小型系统的IP地址<br>
-container-port 80  //docker内部的一个端口号<br>
```

```
[root@hadoop004 ~]# netstat -nlp |grep 8080
tcp6       0      0 :::8080                 :::*                    LISTEN      25014/docker-proxy
```

```
[root@hadoop004 ~]# docker images    //查看所有的镜像
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
nginx               latest              62f816a209e6        7 days ago          109MB
mysql               5.6                 a46c2a2722b9        2 weeks ago         256MB
hello-world         latest              4ab4c602aa5e        2 months ago        1.84kB
```

```
[root@hadoop004 ~]# docker ps -a   //查看所有实例，不论什么状态
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS                         PORTS                    NAMES
9883abaaad85        mysql:5.6           "docker-entrypoint.s…"   About an hour ago   Up About an hour               0.0.0.0:3308->3306/tcp   huluwa-mysql-v5
34fb53521694        mysql:5.6           "docker-entrypoint.s…"   About an hour ago   Created                                                 huluwa-mysql-v4
2a5c95f3c043        mysql:5.6           "docker-entrypoint.s…"   2 hours ago         Exited (0) About an hour ago                            huluwa-mysql-v3
84e65fd24271        mysql:5.6           "docker-entrypoint.s…"   2 hours ago         Exited (0) About an hour ago                            huluwa-mysql-v2
b3c12bcb28eb        mysql:5.6           "docker-entrypoint.s…"   2 hours ago         Exited (0) About an hour ago                            huluwa-mysqlv1
c7937fd85596        nginx:latest        "nginx -g 'daemon of…"   12 hours ago        Exited (0) 12 hours ago                                 huluwa-niginx-v2
d08ffca66143        nginx:latest        "nginx -g 'daemon of…"   13 hours ago        Exited (0) 12 hours ago                                 huluwa-niginx-v1
77a890ae6b8c        hello-world         "/hello"                 13 hours ago        Exited (0) 13 hours ago                                 elastic_ritchie
```

正在运行的status就是Up，已经关闭的status就是Exited

### 自定义首页

1. 登录初始的nginx Web页面

![enter description here](/assets/blogImg/2019-06-28-1.png)

2. 通过index.html配置一个自定义的首页

	```
	[root@hadoop004 html]# pwd
	/root/docker/nginx/html
	[root@hadoop004 html]# ll
	total 4
	-rw-r--r-- 1 root root 92 Nov 13 23:09 index.html
	```
	在windows中打开index.html页面是这样的：
![enter description here](/assets/blogImg/2019-06-28-2.png)

3. 将本地的html文件挂载到container中

	```
	[root@hadoop004 ~]# docker run \
	--name huluwa-niginx-v2 \
	-v /root/docker/nginx/html:/usr/share/nginx/html:ro \ //本地的/root/docker/nginx/html和容器里的/usr/share/nginx/html建立一个映射，将本地的文件夹挂载到容器里
	-d \
	-p 8082:80 \
	nginx:latest
	c7937fd855963c7cca831d495436881a16e7e9befa61288cb28e2ab8b986decf
	[root@hadoop004 ~]# docker ps -a
	CONTAINER ID        IMAGE               COMMAND                  CREATED              STATUS                         PORTS                  NAMES
	c7937fd85596        nginx:latest        "nginx -g 'daemon of…"   About a minute ago   Up About a minute              0.0.0.0:8082->80/tcp   huluwa-niginx-v2
	d08ffca66143        nginx:latest        "nginx -g 'daemon of…"   About an hour ago    Up About an hour               0.0.0.0:8080->80/tcp   huluwa-niginx-v1
	77a890ae6b8c        hello-world         "/hello"                 About an hour ago    Exited (0) About an hour ago                          elastic_ritchie
	```
	
4. 打开ip:8082页面查看

![enter description here](/assets/blogImg/2019-06-28-3.png)
	
发现首页已经被置换为本地文件中的index.html文件<br>
-v 把本地文件或文件夹挂载到容器中<br>
挂载的目的，就是把容器中的数据保存在本地，容器进程移除后之后，数据不会丢失，如果不挂载的话，容器进程挂掉之后，数据就全没有了<br>
ro：可读<br>
rw：可读写<br>