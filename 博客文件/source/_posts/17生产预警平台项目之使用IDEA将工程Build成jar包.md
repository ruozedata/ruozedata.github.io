---
layout: post
title: "17生产预警平台项目之使用IDEA将工程Build成jar包"
date: 2018-09-25
comments: true
tags: 
	- spark
	- 高级
	- 生产预警平台项目
categories: 生产预警平台项目
---
<!--more--> 
#### 1.File-->Project Structure
![enter description here](/assets/blogImg/0925_1.png)
#### 2.Artifacts-->+-->JAR-->From modules with dependencies
![enter description here](/assets/blogImg/0925_2.png)

#### 3. 单击... -->选择OnLineLogAnalysis2
![enter description here](/assets/blogImg/0925_3.png)
![enter description here](/assets/blogImg/0925_4.png)

        

#### 4.选择项目的根目录
    
![enter description here](/assets/blogImg/0925_5.png)

#### 5.修改Name-->选择输出目录-->选择Output directory-->Apply-->OK
![enter description here](/assets/blogImg/0925_6.png)

#### 6.Build-->Build Artifacts-->Build
![enter description here](/assets/blogImg/0925_7.png)
![enter description here](/assets/blogImg/0925_8.png)
![enter description here](/assets/blogImg/0925_9.png)



===================================
 说明:
1.打包方式很多，大家自行google.
2.由于我是引用influxdb的源码包,需要引入许多依赖jar包,所以我需要将相关依赖jar包全部打包到本程序的jar包,故该jar包大概160M。
(当然也可以只需要打本程序的jar包，只不过需要事先将相关的所有或者部分依赖jar包，前提上传到集群，然后spark-submit使用--jars引用即可)