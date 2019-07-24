---
layout: post
title: "生产上Flume如何源码编译and远程Debug"
date: 2019-07-11
comments: true
tags: 
    - Flume
    - 源码编译
categories: 
    - Flume
   
---

<!--more--> 

### 本地环境

1. apache-flume-1.8.0-src （官网下载源码，或者git下载）
2. jdk1.8

### 编译

1. 用Inteallij IDEA 导入已下载的flume工程
2. 修改`flume-parent`下的 pom.xml 添加 aliyun的仓库（加快下载，有些包直接从maven repository上下载很慢 ）

    ```
    <repositories><!-- 代码库 -->
        <repository>
            <id>maven-ali</id>
            <url>http://maven.aliyun.com/nexus/content/groups/public/</url>
            <releases>
                <enabled>true</enabled>
            </releases>
            <snapshots>
                <enabled>true</enabled>
                <updatePolicy>always</updatePolicy>
                <checksumPolicy>fail</checksumPolicy>
            </snapshots>
        </repository>
    </repositories>
    ```

3. 开始漫长的编译过程

	如果是第一次的话，可能下载包要花2个多小时，中间可能会报错（报错主要是某些包没下载成功，此时可以手动从仓库中手动下载到本地，然后放在本地 的maven 包路径下，默认的本地的包路径是 C:\Users\你的用户名.m2\repository 下面）
	
	```
	mvn clean
	mvn install -DskipTests -U -Dtar
	```

4. 由于整个项目是用pom管理包和模块，十分方便，如果在整个编译过程中，某些模块你需要编译，或者编译耗时，或者编译失败，并且你暂时用不到整个模块，可以从pom中注释掉这个模块，不做编译，具体做法如下图所示（具体的根据你的需求操作即可）	
![mark](http://pucwi7op1.bkt.clouddn.com/blog/20190724/9xjUKMaIiAlm.png?imageslim)
	
### 远程调试

1. 修改服务器上的 bin/flume-ng 中的JAVA_OPTS变量，支持远程调试

	```
	JAVA_OPTS="-Xmx20m -Xdebug -Xrunjdwp:transport=dt_socket,address=8000,server=y,suspend=y"
	```
	
	具体如下：

![mark](http://pucwi7op1.bkt.clouddn.com/blog/20190724/3LFwnuvEtCmR.png?imageslim)

2. Inteallij IDEA配置 ，远程调试

![mark](http://pucwi7op1.bkt.clouddn.com/blog/20190724/kIM6h3SrtMSb.png?imageslim)
	
![mark](http://pucwi7op1.bkt.clouddn.com/blog/20190724/xq1oTGBX3gIa.png?imageslim)
	
![mark](http://pucwi7op1.bkt.clouddn.com/blog/20190724/IjVaRSdXrHWJ.png?imageslim)

3. 在任意代码出打上断点

![mark](http://pucwi7op1.bkt.clouddn.com/blog/20190724/zyyRQQtEuqLu.png?imageslim)

4. 启动flume-ng（按实际情况修改下面命令）
	
	```
	bin/flume-ng agent --conf conf --conf-file ./conf/flume-custom.properties --name hd1 -Dflume.root.logger=INFO,console
	```

	启动后日志如下：

![mark](http://pucwi7op1.bkt.clouddn.com/blog/20190724/vrL4ekeR7sdi.png?imageslim)

5. Inteallij IDEA 开始debug，可以发现在断点处停止，debug流程成功了

![mark](http://pucwi7op1.bkt.clouddn.com/blog/20190724/hSlp85lEX5Dy.png?imageslim)

### 思考

- 源码编译耗时费力，需要耐心，熬过去了，会有很大收获，同样也是更好理解源码的开始，万事开头难
- remote debug可以更方便的了解执行流程，学习源码的捷径

