---
layout: post
title: "02生产预警平台项目之Flume-1.7.0源码编译导入eclipse"
date: 2018-08-28
comments: true
tags: 
	- spark
	- 高级
	- 生产预警平台项目
categories: 生产预警平台项目
---
<!--more--> 

### 【前提】:
1.windows 7 安装maven-3.3.9
  其中在conf/setting.xml文件添加
  D:\software\apache-maven-3.3.9\repository
  http://blog.csdn.net/defonds/article/details/41957287
2.windows 7 安装eclipse 64位(百度下载，解压即可)
3.eclipse安装maven插件，选择第二种方式link
http://blog.csdn.net/lfsfxy9/article/details/9397937
其中 eclipse-maven3-plugin.7z 这个包可以加群258669058找我，分享给你
 
### 【flume-ng 1.7.0源码的编译导入eclipse】:
#### 1.下载官网的源码(不要下载GitHub上源码，因为这时pom文件中版本为1.8.0，编译会有问题)
http://archive.apache.org/dist/flume/1.7.0/
  a.下载apache-flume-1.7.0-src.tar.gz
  b.解压重命名为flume-1.7.0

#### 2.修改pom.xml (大概在621行，将自带的repository注释掉，添加以下的)
```
<repository>
       <id>maven.tempo-db.com</id>
       <url>http://maven.oschina.net/service/local/repositories/sonatype-public-grid/content/</url>
 </repository>
 ```
 ![enter description here](/assets/blogImg/0828_1.png)
####  3.打开cmd,编译
 cd /d D:\[WORK]\Training\05Hadoop\Compile\flume-1.7.0
 mvn compile
  ![enter description here](/assets/blogImg/0828_2.png)
####    4.打开eclipse,单击Window-->Perferences-->左侧的Maven-->User Settings
  然后设置自己的mvn的setting.xml路径和Local Repository
  (最好使用Maven3.3.x版本以上，我是3.3.9)
    ![enter description here](/assets/blogImg/0828_3.png)
####    5.关闭eclipse的 Project-->Buid Automatically
   ![enter description here](/assets/blogImg/0828_4.png)
####    6.关闭eclipse的Download repository index updates on startup

   ![enter description here](/assets/blogImg/0828_5.png)
####    7.导入flume1.7.0源码
   a.File-->Import-->Maven-->Existing Maven Projects-->Next
   b.选择目录--> Finish
####    8.检查源码，没有抛任何错误
   ![enter description here](/assets/blogImg/0828_6.png)
   