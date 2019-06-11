---
layout: post
title: "Hive自定义函数(UDF)的部署使用，你会吗？"
date: 2018-04-27
comments: true
tags: 
	- hive 
categories:  Hive 
---
Hive自定义函数(UDF)的部署使用，你会吗，三种方式！
<!--more--> 
<font color=#FF4500 >
</font>

###### 一.临时函数
1. idea编写udf
2. 打包
 Maven Projects ---->Lifecycle ---->package ----> 右击 Run Maven Build
3. rz上传至服务器
4. 添加jar包 
hive>add xxx.jar jar_filepath;
5. 查看jar包 
hive>list jars;
6. 创建临时函数
hive>create temporary function my_lower as 'com.example.hive.udf.Lower';

###### 二.持久函数
1. idea编写udf
2. 打包
 Maven Projects ---->Lifecycle ---->package ----> 右击 Run Maven Build
3. rz上传至服务器
4. 上传到HDFS
$ hdfs dfs -put xxx.jar  hdfs:///path/to/xxx.jar
5. 创建持久函数
hive>CREATE FUNCTION myfunc AS 'myclass' USING JAR 'hdfs:///path/to/xxx.jar';

**注意点：**
- 1. 此方法在show functions时是看不到的，但是可以使用
- 2. 需要上传至hdfs

###### 三.持久函数，并注册
环境介绍：CentOS7+hive-1.1.0-cdh5.7.0+Maven3.3.9
1. 下载源码 
   hive-1.1.0-cdh5.7.0-src.tar.gz 
   http://archive.cloudera.com/cdh5/cdh/5/hive-1.1.0-cdh5.7.0-src.tar.gz 

2. 解压源码
   tar -zxvf hive-1.1.0-cdh5.7.0-src.tar.gz -C /home/hadoop/
   cd /home/hadoop/hive-1.1.0-cdh5.7.0

3. 将HelloUDF.java文件增加到HIVE源码中
   cp HelloUDF.java /home/hadoop/hive-1.1.0-cdh5.7.0/ql/src/java/org/apache/hadoop/hive/ql/udf/

4. 修改FunctionRegistry.java 文件
```
   cd /home/hadoop/hive-1.1.0-cdh5.7.0/ql/src/java/org/apache/hadoop/hive/ql/exec/
   vi FunctionRegistry.java
   在import中增加：import org.apache.hadoop.hive.ql.udf.HelloUDF;
   在文件头部 static 块中添加：system.registerUDF("helloUDF", HelloUDF.class, false);
```
5. 重新编译
   cd /home/hadoop/hive-1.1.0-cdh5.7.0
   mvn clean package -DskipTests -Phadoop-2 -Pdist

6. 编译结果全部为：BUILD SUCCESS
   文件所在目录：/home/hadoop/hive-1.1.0-cdh5.7.0/hive-1.1.0-cdh5.7.0/packaging/target

7. 配置hive环境
   配置hive环境时，可以全新配置或将编译后带UDF函数的包复制到旧hive环境中：
   7.1. 全部配置：参照之前文档  [Hive全网最详细的编译及部署](https://ruozedata.github.io/2018/04/11/Hive%E5%85%A8%E7%BD%91%E6%9C%80%E8%AF%A6%E7%BB%86%E7%9A%84%E7%BC%96%E8%AF%91%E5%8F%8A%E9%83%A8%E7%BD%B2/)

   7.2. 将编译后带UDF函数的包复制到旧hive环境
      到/home/hadoop/hive-1.1.0-cdh5.7.0/packaging/target/apache-hive-1.1.0-cdh5.7.0-bin/apache-hive-1.1.0-cdh5.7.0-bin/lib下，找到hive-exec-1.1.0-cdh5.7.0.jar包，并将旧环境中对照的包替换掉
      命令：
	  ```
      cd /home/hadoop/app/hive-1.1.0-cdh5.7.0/lib
      mv hive-exec-1.1.0-cdh5.7.0.jar hive-exec-1.1.0-cdh5.7.0.jar_bak
      cd /home/hadoop/hive-1.1.0-cdh5.7.0/packaging/target/apache-hive-1.1.0-cdh5.7.0-bin/apache-hive-1.1.0-cdh5.7.0-bin/lib
      cp hive-exec-1.1.0-cdh5.7.0.jar /home/hadoop/app/hive-1.1.0-cdh5.7.0/lib
	  ```
   最终启动hive

8. 测试：
```
   hive
   hive (default)> show functions ;   -- 能查看到有 helloudf
   hive(default)>select deptno,dname,helloudf(dname) from dept;   -- helloudf函数生效
   ```