---
layout: post
title: "Hive全网最详细的编译及部署"
date: 2018-04-11
comments: true
tags: 
	- hive
	- 环境搭建
	- 基础
categories:  Hive
---
若泽大数据，Hive全网最详细的编译及部署
<!--more--> 
###### 一、需要安装的软件

- 相关环境：
	- jdk-7u80 
   	- hadoop-2.6.0-cdh5.7.1 不支持jdk1.8，因此此处也延续jdk1.7

	- apache-maven-3.3.9

	- mysql5.1

	- hadoop伪分布集群已启动



###### 二、安装jdk
```
mkdir  /usr/java && cd  /usr/java/    

tar -zxvf  /tmp/server-jre-7u80-linux-x64.tar.gz

chown -R root:root  /usr/java/jdk1.7.0_80/ 

echo 'export JAVA_HOME=/usr/java/jdk1.7.0_80'>>/etc/profile

source /etc/profile
```


###### 三、安装maven
```
cd /usr/local/

unzip /tmp/apache-maven-3.3.9-bin.zip

chown root: /usr/local/apache-maven-3.3.9 -R

echo 'export MAVEN_HOME=/usr/local/apache-maven-3.3.9'>>/etc/profile

echo 'export MAVEN_OPTS="-Xms256m -Xmx512m"'>>/etc/profile

echo 'export PATH=$MAVEN_HOME/bin:$JAVA_HOME/bin:$PATH'>>/etc/profile

source /etc/profile
```


###### 四、安装mysql
```
yum -y install mysql-server mysql

/etc/init.d/mysqld start

chkconfig mysqld on

mysqladmin -u root password 123456

mysql -uroot -p123456

use mysql;

GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' IDENTIFIED BY 'v123456' WITH GRANT OPTION;

GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' IDENTIFIED BY '123456' WITH GRANT OPTION;

GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY '123456' WITH GRANT OPTION;

update user set password=password('123456') where user='root';

delete from user where not (user='root') ;

delete from user where user='root' and password=''; 

drop database test;

DROP USER ''@'%';

flush privileges;
```


###### 五、下载hive源码包：
输入：http://archive.cloudera.com/cdh5/cdh/5/
根据cdh版本选择对应hive软件包：
hive-1.1.0-cdh5.7.1-src.tar.gz
解压后使用maven命令编译成安装包



###### 六、编译:
```
cd /tmp/

tar -xf hive-1.1.0-cdh5.7.1-src.tar.gz

cd /tmp/hive-1.1.0-cdh5.7.1

mvn clean package -DskipTests -Phadoop-2 -Pdist

# 编译生成的包在以下位置：

# packaging/target/apache-hive-1.1.0-cdh5.7.1-bin.tar.gz
```


###### 七、安装编译生成的Hive包，然后测试
```
cd /usr/local/

tar -xf /tmp/apache-hive-1.1.0-cdh5.7.1-bin.tar.gz

ln -s apache-hive-1.1.0-cdh5.7.1-bin hive

chown -R hadoop:hadoop apache-hive-1.1.0-cdh5.7.1-bin 

chown -R hadoop:hadoop hive 

echo 'export HIVE_HOME=/usr/local/hive'>>/etc/profile

echo 'export PATH=$HIVE_HOME/bin:$PATH'>>/etc/profile
```


###### 八、更改环境变量
```
su - hadoop

cd /usr/local/hive

cd conf
```


1、hive-env.sh
```
cp hive-env.sh.template  hive-env.sh&&vi hive-env.sh

HADOOP_HOME=/usr/local/hadoop
```


2、hive-site.xml
```
vi hive-site.xml



<?xml version="1.0"?>

<?xml-stylesheet type="text/xsl" href="configuration.xsl"?>

<configuration> 

    <property>

        <name>javax.jdo.option.ConnectionURL</name>

        <value>jdbc:mysql://localhost:3306/vincent_hive?createDatabaseIfNotExist=true</value>

    </property>

    <property>

        <name>javax.jdo.option.ConnectionDriverName</name>

        <value>com.mysql.jdbc.Driver</value>

    </property>

    <property>

        <name>javax.jdo.option.ConnectionUserName</name>

        <value>root</value>

    </property>

    <property>

        <name>javax.jdo.option.ConnectionPassword</name>

        <value>vincent</value>

    </property>

</configuration>

```



###### 九、拷贝mysql驱动包到$HIVE_HOME/lib

上方的hive-site.xml使用了java的mysql驱动包
需要将这个包上传到hive的lib目录之下
解压 mysql-connector-java-5.1.45.zip 对应的文件到目录即可
```
cd /tmp

unzip mysql-connector-java-5.1.45.zip

cd mysql-connector-java-5.1.45

cp mysql-connector-java-5.1.45-bin.jar /usr/local/hive/lib/


```
未拷贝有相关报错：

The specified datastore driver ("com.mysql.jdbc.Driver") was not found in the CLASSPATH. 

Please check your CLASSPATH specification, 

and the name of the driver.
