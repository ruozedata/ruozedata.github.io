---
layout: post
title: "上海某公司的生产MySQL灾难性挽救"
date: 2019-05-30
comments: true
tags: 
	- 案例
	- 架构
	- 环境搭建
categories: 
	- [其他组件]
	- [故障案例]
---

### 1.背景
本人([若泽数据](www.ruozedata.com)J哥)的媳妇，是个漂亮的妹子，同时也是一枚爬虫&Spark开发工程师。

前天，她的公司MySQL(阿里云ECS服务器)，由于磁盘爆了加上人为的修复，导致各种问题，然后经过2天的折腾，终于公司的大神修复不了了。于是就丢给她了，顺理成章的就丢给我了。我想说，难道J哥这么出名吗？那为了在妹子面前不能丢我们真正大佬的神技，于是乎我就很爽快接了这个MySQL故障恢复，此次故障的是一个数据盘，1T。
这时的我，说真的并没有意识到，此事是如此的繁杂，特此写此博文记录一下，毕竟J哥我年纪也大了。  

PS:   
这里吐槽一下，并没有周日全备+周1~周6增量备份机制哟，不然恢复就爽歪歪了。
<!--more--> 
### 2.故障现象

```
查看表结构、查询表数据都如下抛错:
ERROR 1030 (HY000): Got error 122 from storage engine
```
![enter description here](/assets/blogImg/2019530_1.png)
### 3.尝试修复第一次，失败
3.1 使用repair命令修复表

```
mysql> repair table wenshu.wenshu2018;  
错误依旧:
ERROR 1030 (HY000): Got error 122 from storage engine
```
3.2 谷歌一篇有指导意义的
[https://stackoverflow.com/questions/68029/got-error-122-from-storage-engine](https://stackoverflow.com/questions/68029/got-error-122-from-storage-engine)

* 3.2.1 让其扩容数据磁盘为1.5T，试试，依旧这个错误；
* 3.2.2 临时目录修改为大的磁盘空间，试试，依旧这个错误；
* 3.2.3 取消磁盘限额，试试，依旧这个错误；
* 3.2.4 就是一开始的repair命令修复，试试，依旧这个错误；  

这时的我，也无语了，什么鬼！谷歌一页页搜索验证，没有用！

### 4.先部署相同系统的相同版本的机器和MySQL
于是J哥，快速在【若泽数据】的阿里云账号上买了1台Ubuntu 16.04.6的按量付费机器
迅速部署MySQL5.7.26。

* 4.1 购买按量付费机器(假如不会购买，找J哥)
* 4.2 部署MySQL

```
a.更新apt-get
$ apt-get update

b.安装MySQL-Server
$ apt-get install mysql-server

之后会问你，是否要下载文件， 输入 y 就好了
然后会出现让你设置 root 密码的界面
输入密码: ruozedata123
然后再重复一下，
再次输入密码: ruozedata123

c.安装MySQL-Client
$ apt install mysql-client

d.我们可以使用
$ mysql -uroot -pruozedata123
来连接服务器本地的 MySQL
```

### 5.尝试先通过frm文件恢复表结构，失败
```
a. 建立一个数据库，比如wenshu.

b. 在ruozedata数据库下建立同名的数据表wenshu2018，表结构随意，这里只有一个id字段，操作过程片段如下：

mysql> create table wenshu2018 (id bigint) engine=InnoDB;
mysql> show tables;
+--------------+
| Tables_in_aa |
+--------------+
| wenshu2018   |
+--------------+
1 rows in set (0.00 sec)

mysql> desc wenshu2018;
+-------+------------+------+-----+---------+-------+
| Field | Type       | Null | Key | Default | Extra |
+-------+------------+------+-----+---------+-------+
| id    | bigint(20) | NO   |     | NULL    |       |
+-------+------------+------+-----+---------+-------+
1 row in set (0.00 sec)

c.停止mysql服务器，将wenshu2018.frm文件scp远程拷贝到新的正常数据库的数据目录wenshu下，覆盖掉下边同名的frm文件：

d.重新启动MYSQL服务

e.测试下是否恢复成功，进入wenshu数据库，用desc命令测试下，错误为:
mysql Tablespace is missing for table `wenshu`.`wenshu2018`.

```
### 6.尝试有没有备份的表结构恢复数据，失败
媳妇公司给出一个表结构,如下，经过测试无法恢复，原因就是无法和ibd文件匹配。

```
DROP TABLE IF EXISTS cpws_batch;
CREATE TABLE cpws_batch  (
  id int(11) NOT NULL AUTO_INCREMENT,
  doc_id varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  source text CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
  error_msg text CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
  crawl_time datetime NULL DEFAULT NULL,
  status tinyint(4) NULL DEFAULT NULL COMMENT '0/1 成功/失败',
  PRIMARY KEY (id) USING BTREE,
  INDEX ix_status(status) USING BTREE,
  INDEX ix_doc_id(doc_id) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Compact;

```

### 7.如何获取正确的表结构，这是【成功的第一步】

```
$ curl -s get.dbsake.net > /tmp/dbsake
$ chmod u+x /tmp/dbsake
$ /tmp/dbsake frmdump /mnt/mysql_data/wenshu/wenshu2018.frm 
--
-- Table structure for table wenshu_0_1000
-- Created with MySQL Version 5.7.25
--

CREATE TABLE wenshu2018 (
  id int(11) NOT NULL AUTO_INCREMENT,
  doc_id varchar(255) DEFAULT NULL,
  source text,
  error_msg text,
  crawl_time datetime DEFAULT NULL,
  status tinyint(4) DEFAULT NULL COMMENT '0/1 成功/失败',
  PRIMARY KEY (id),
  KEY ix_status (status),
  KEY ix_doc_id (doc_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 
/*!50100  PARTITION BY RANGE (id)
(PARTITION p0 VALUES LESS THAN (4000000) ENGINE = InnoDB,
 PARTITION p1 VALUES LESS THAN (8000000) ENGINE = InnoDB,
 PARTITION p2 VALUES LESS THAN (12000000) ENGINE = InnoDB,
 PARTITION p3 VALUES LESS THAN (16000000) ENGINE = InnoDB,
 PARTITION p4 VALUES LESS THAN (20000000) ENGINE = InnoDB,
 PARTITION p5 VALUES LESS THAN (24000000) ENGINE = InnoDB,
 PARTITION p6 VALUES LESS THAN (28000000) ENGINE = InnoDB,
 PARTITION p7 VALUES LESS THAN (32000000) ENGINE = InnoDB,
 PARTITION p8 VALUES LESS THAN (36000000) ENGINE = InnoDB,
 PARTITION p9 VALUES LESS THAN (40000000) ENGINE = InnoDB,
 PARTITION p10 VALUES LESS THAN (44000000) ENGINE = InnoDB,
 PARTITION p11 VALUES LESS THAN MAXVALUE ENGINE = InnoDB) */;
```
对比Step6的表结构，感觉就差分区设置而已，坑！
这时，J哥有种信心，恢复应该小菜了。

### 8.由于恢复ECS机器是若泽数据账号购买，这时需要从媳妇公司账号的机器传输这张表ibd文件，差不多300G，尽管我们是阿里云的同一个区域同一个可用区，加上调大外网带宽传输，依然不能等待这么久传输！

### 9.要求媳妇公司购买同账户下同区域的可用区域的云主机，系统盘300G，没有买数据盘，先尝试做恢复看看，能不能成功恢复第一个表哟？【成功的第二步】
```
9.1首先需要一个跟要恢复的表结构完全一致的表，至关重要
mysql> CREATE DATABASE wenshu /*!40100 DEFAULT CHARACTER SET utf8mb4 */;
USE wenshu;
CREATE TABLE wenshu2018 (
  id int(11) NOT NULL AUTO_INCREMENT,
  doc_id varchar(255) DEFAULT NULL,
  source text,
  error_msg text,
  crawl_time datetime DEFAULT NULL,
  status tinyint(4) DEFAULT NULL COMMENT '0/1 成功/失败',
  PRIMARY KEY (id),
  KEY ix_status (status),
  KEY ix_doc_id (doc_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 
/*!50100  PARTITION BY RANGE (id)
(PARTITION p0 VALUES LESS THAN (4000000) ENGINE = InnoDB,
 PARTITION p1 VALUES LESS THAN (8000000) ENGINE = InnoDB,
 PARTITION p2 VALUES LESS THAN (12000000) ENGINE = InnoDB,
 PARTITION p3 VALUES LESS THAN (16000000) ENGINE = InnoDB,
 PARTITION p4 VALUES LESS THAN (20000000) ENGINE = InnoDB,
 PARTITION p5 VALUES LESS THAN (24000000) ENGINE = InnoDB,
 PARTITION p6 VALUES LESS THAN (28000000) ENGINE = InnoDB,
 PARTITION p7 VALUES LESS THAN (32000000) ENGINE = InnoDB,
 PARTITION p8 VALUES LESS THAN (36000000) ENGINE = InnoDB,
 PARTITION p9 VALUES LESS THAN (40000000) ENGINE = InnoDB,
 PARTITION p10 VALUES LESS THAN (44000000) ENGINE = InnoDB,
 PARTITION p11 VALUES LESS THAN MAXVALUE ENGINE = InnoDB) */;

9.2然后DISCARD TABLESPACE
mysql> ALTER TABLE wenshu.wenshu2018 DISCARD TABLESPACE;

9.3把要恢复的ibd文件复制到mysql的data文件夹下，修改用户和用户组为mysql
$ scp wenshu2018#P#p*.ibd  新建机器IP:/mnt/mysql_data/wenshu/
$ chown -R mysql:mysql /mnt/mysql_data/wenshu/wenshu2018#P#p*.ibd

9.4然后执行IMPORT TABLESPACE
mysql> ALTER TABLE wenshu.wenshu2018 IMPORT TABLESPACE;

9.5等待，有戏，耗时3h，这时我相信应该么问题的

9.6查询数据，果然恢复有结果，心里暗暗自喜
mysql> select * from wenshu.wenshu2018 limit 1\G;

```

### 10.给媳妇公司两个选择，这个很重要，在自己公司给领导做选择时，也要应该这样，多项选择，利弊说明，供对方选择
* 10.1 重新购买一台新的服务器，在初始化配置时，就加上1块1.5T的大磁盘。好处是无需挂盘操作，坏处是需要重新做第一个表，浪费3h；
* 10.2 购买1.5T的大磁盘，挂载这个机器上。好处是无需再做一次第一个表，坏处是需要修改mysql的数据目录指向为这个大磁盘。系统盘扩容最大也就500G，所以必须外加一个数据盘1.5T容量。

所以J哥是职场老手了！贼笑！

### 11.服务器加数据磁盘，1.5T，购买、挂载、格式化
接下来的操作是我媳妇独立完成的，这里表扬一下:

* 11.1 先买云盘 [https://help.aliyun.com/document_detail/25445.html?spm=a2c4g.11186623.6.753.40132c30MbE8n8](https://help.aliyun.com/document_detail/25445.html?spm=a2c4g.11186623.6.753.40132c30MbE8n8)
* 11.2 再挂载云盘 到对应机器 [https://help.aliyun.com/document_detail/25446.html?spm=a2c4g.11186623.6.756.30874f291pXOwB](https://help.aliyun.com/document_detail/25446.html?spm=a2c4g.11186623.6.756.30874f291pXOwB)
* 11.3 最后Linux格式化数据盘 [https://help.aliyun.com/document_detail/116650.html?spm=a2c4g.11186623.6.759.11f67d562yD9Lr](https://help.aliyun.com/document_detail/116650.html?spm=a2c4g.11186623.6.759.11f67d562yD9Lr)

图2所示，df -h命令查看，大磁盘/dev/vdb1
![enter description here](/assets/blogImg/2019530_2.png)

### 12.MySQL修改数据目录为大磁盘，重新启动失败，解决

```
12.1 修改数据目录为大磁盘
$ mkdir -p /mnt/mysql_data
$ chown mysql:mysql /mnt/mysql_data
$ vi /etc/mysql/mysql.conf.d/mysqld.cnf
datadir         = /mnt/mysql_data

12.2 无法启动mysql
$ service mysql restart
无法启动成功，查看日志
2019-05-28T03:41:31.181777Z 0 [Note] InnoDB: If the mysqld execution user is authorized, page cleaner thread priority can be changed. See the man page of setpriority().
2019-05-28T03:41:31.191805Z 0 [ERROR] InnoDB: The innodb_system data file 'ibdata1' must be writable
2019-05-28T03:41:31.192055Z 0 [ERROR] InnoDB: The innodb_system data file 'ibdata1' must be writable
2019-05-28T03:41:31.192119Z 0 [ERROR] InnoDB: Plugin initialization aborted with error Generic error

12.3 百思不得其解，CentOS也没有这么麻烦，Ubuntu难道这么搞事吗？
12.4 新增mysqld内容
$ vi /etc/apparmor.d/local/usr.sbin.mysqld
# Site-specific additions and overrides for usr.sbin.mysqld.
# For more details, please see /etc/apparmor.d/local/README.
/mnt/mysql_data/ r,
/mnt/mysql_data/** rwk,

12.5 reload apparmor的配置并重启
$ service apparmor reload 
$ service apparmor restart 
 
12.6 重启mysql
$ service mysql restart
如果启动不了，查看/var/log/mysql/error.log
如果出现：InnoDB: The innodb_system data file 'ibdata1' must be writable 仔细核对目录权限

12.7 进mysql查询数据验证，成功
select * from wenshu.wenshu2018 limit 1\G;
```

### 13.开始指导我媳妇做第二个、第三个表，批量恢复，耗时共计16小时，全部恢复完成。

## 最后@若泽数据J哥总结一下:
* 表结构正确的获取；
* 机器磁盘规划提前思考；
* ibd数据文件恢复；
* 最后加上一个聪明的媳妇！(PS:老板会给媳妇涨薪水不🙅‍♂️)




