---
layout: post
title: "Hive自定义函数(UDF)的编程开发，你会吗？"
date: 2018-04-25
comments: true
tags: 
	- hive
categories:  Hive
---

本地开发环境：IntelliJ IDEA+Maven3.3.9
<!--more--> 



###### 1. 创建工程
   打开IntelliJ IDEA
   File-->New-->Project...-->Maven选择Create from archetye-->org.apache.maven.archety:maven-archetype-quitkstart
###### 2. 配置
 在工程中找到pom.xml文件，添加hadoop、hive依赖
 ![Hive图1](/assets/blogImg/425hive1.png)
######  3. 创建类、并编写一个HelloUDF.java，代码如下：
  ![Hive图2](/assets/blogImg/425hive2.png)
  
**首先一个UDF必须满足下面两个条件:**
- 1. 一个UDF必须是org.apache.hadoop.hive.ql.exec.UDF的子类（换句话说就是我们一般都是去继承这个类）
- 2. 一个UDF必须至少实现了evaluate()方法


###### 4. 测试，右击运行run 'HelloUDF.main()'  

###### 5. 打包

在IDEA菜单中选择view-->Tool Windows-->Maven Projects，然后在Maven Projects窗口中选择【工程名】-->Lifecycle-->package，在package中右键选择Run Maven Build开始打包
执行成功后在日志中找：
	 <font color=#FF4500 >     [INFO] Building jar: (路径)/hive-1.0.jar  

</font>