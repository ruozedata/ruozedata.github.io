---
layout: post
title: "实时数仓之Maxwell读取MySQL binlog日志"
date: 2019-03-22
comments: true
tags: 
    - 实时数仓
    - Maxwell
    - 中间件
categories: [实时同步中间件]

---

<!--more--> 

### 下载maxwell

### 解压maxwell

### 修改MySQL的配置文件my.cnf

```
[root@hadoop000 ~]# cd /etc
[root@hadoop000 etc]# vi my.cnf

[mysqld]
server-id  = 1
binlog_format = ROW
```

<font size=3 color="red">PS：binlog_format必须设为ROW模式，如果设为其他模式，比如binlog_format = STATEMENT，启动maxwell时会报错</font>

```
[root@hadoop001 maxwell-1.17.1]# bin/maxwell --user='maxwell' --password='maxwell' --host='127.0.0.1' --producer=stdout
Using kafka version: 1.0.0
08:57:08,194 WARN  MaxwellMetrics - Metrics will not be exposed: metricsReportingType not configured.
08:57:08,521 INFO  TaskManager - Stopping 0 tasks
08:57:08,521 ERROR TaskManager - cause: 
com.zendesk.maxwell.MaxwellCompatibilityError: variable binlog_format must be set to 'ROW'
        at com.zendesk.maxwell.MaxwellMysqlStatus.ensureVariableState(MaxwellMysqlStatus.java:42) ~[maxwell-1.17.1.jar:1.17.1]
        at com.zendesk.maxwell.MaxwellMysqlStatus.ensureReplicationMysqlState(MaxwellMysqlStatus.java:70) ~[maxwell-1.17.1.jar:1.17.1]
        at com.zendesk.maxwell.Maxwell.startInner(Maxwell.java:173) ~[maxwell-1.17.1.jar:1.17.1]
        at com.zendesk.maxwell.Maxwell.start(Maxwell.java:156) ~[maxwell-1.17.1.jar:1.17.1]
        at com.zendesk.maxwell.Maxwell.main(Maxwell.java:245) ~[maxwell-1.17.1.jar:1.17.1]
08:57:08,525 INFO  TaskManager - Stopped all tasks
com.zendesk.maxwell.MaxwellCompatibilityError: variable binlog_format must be set to 'ROW'
        at com.zendesk.maxwell.MaxwellMysqlStatus.ensureVariableState(MaxwellMysqlStatus.java:42)
        at com.zendesk.maxwell.MaxwellMysqlStatus.ensureReplicationMysqlState(MaxwellMysqlStatus.java:70)
        at com.zendesk.maxwell.Maxwell.startInner(Maxwell.java:173)
        at com.zendesk.maxwell.Maxwell.start(Maxwell.java:156)
        at com.zendesk.maxwell.Maxwell.main(Maxwell.java:245)
```

### 启动MySQL

```
[mysqladmin@hadoop000 ~]$ service mysql start
Starting MySQL....                                         [  OK  ]
[mysqladmin@hadoop000 ~]$ mysql -uroot -p
Enter password: 
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 1
Server version: 5.6.23-log MySQL Community Server (GPL)
Copyright (c) 2000, 2015, Oracle and/or its affiliates. All rights reserved.
Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.
Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.
mysql> show variables like '%binlog%';
+-----------------------------------------+----------------------+
| Variable_name                           | Value                |
+-----------------------------------------+----------------------+
| binlog_cache_size                       | 32768                |
| binlog_checksum                         | CRC32                |
| binlog_direct_non_transactional_updates | OFF                  |
| binlog_error_action                     | IGNORE_ERROR         |
| binlog_format                           | ROW                  | //binlog_format已生效
| binlog_gtid_simple_recovery             | OFF                  |
| binlog_max_flush_queue_time             | 0                    |
| binlog_order_commits                    | ON                   |
| binlog_row_image                        | FULL                 |
| binlog_rows_query_log_events            | OFF                  |
| binlog_stmt_cache_size                  | 32768                |
| binlogging_impossible_mode              | IGNORE_ERROR         |
| innodb_api_enable_binlog                | OFF                  |
| innodb_locks_unsafe_for_binlog          | ON                   |
| max_binlog_cache_size                   | 18446744073709547520 |
| max_binlog_size                         | 1073741824           |
| max_binlog_stmt_cache_size              | 18446744073709547520 |
| simplified_binlog_gtid_recovery         | OFF                  |
| sync_binlog                             | 0                    |
+-----------------------------------------+----------------------+
19 rows in set (0.00 sec)
```

### 创建maxwell的数据库和用户

```
mysql> create database maxwell;
mysql> GRANT ALL on maxwell.* to 'maxwell'@'%' identified by 'maxwell';
mysql> GRANT SELECT, REPLICATION CLIENT, REPLICATION SLAVE on *.* to 'maxwell'@'%';
mysql> flush privileges;    //一定记得刷新权限
```

### 在MySQL中创建一个测试数据库和表

```
//创建一个数据库
mysql> create database hlwtest;
mysql> grant all privileges on hlwtest.* to hlw@'%' identified by '123456';
mysql> flush privileges;
mysql> use hlwtest;
Database changed
mysql> show tables;
Empty set (0.00 sec)
//建表语句
create table emp (
    empno numeric(4) primary key,
    ename varchar(10),
    job varchar(9),
    mgr numeric(4),
    hiredate datetime,
    sal numeric(7,2),
    comm numeric(7,2),
    deptno numeric(2)
);
//查看数据库中的表
mysql> show tables;
+-------------------+
| Tables_in_hlwtest |
+-------------------+
| emp               |
+-------------------+
mysql> desc emp;
+----------+--------------+------+-----+---------+-------+
| Field    | Type         | Null | Key | Default | Extra |
+----------+--------------+------+-----+---------+-------+
| empno    | decimal(4,0) | NO   | PRI | NULL    |       |
| ename    | varchar(10)  | YES  |     | NULL    |       |
| job      | varchar(9)   | YES  |     | NULL    |       |
| mgr      | decimal(4,0) | YES  |     | NULL    |       |
| hiredate | datetime     | YES  |     | NULL    |       |
| sal      | decimal(7,2) | YES  |     | NULL    |       |
| comm     | decimal(7,2) | YES  |     | NULL    |       |
| deptno   | decimal(2,0) | YES  |     | NULL    |       |
+----------+--------------+------+-----+---------+-------+
//导入测试数据
mysql> LOAD DATA LOCAL INFILE '/root/data/emp.txt' INTO TABLE emp FIELDS TERMINATED BY '\t' LINES TERMINATED BY '\r\n';
mysql> select * from emp;
+-------+--------+-----------+------+---------------------+----------+---------+--------+
| empno | ename  | job       | mgr  | hiredate            | sal      | comm    | deptno |
+-------+--------+-----------+------+---------------------+----------+---------+--------+
|  7369 | SMITH  | CLERK     | 7902 | 1980-12-17 00:00:00 |   800.00 |    0.00 |     20 |
|  7499 | ALLEN  | SALESMAN  | 7698 | 1981-02-20 00:00:00 |  1600.00 |  300.00 |     30 |
|  7521 | WARD   | SALESMAN  | 7698 | 1981-02-22 00:00:00 |  1250.00 |  500.00 |     30 |
|  7566 | JONES  | MANAGER   | 7839 | 1981-04-02 00:00:00 |  2975.00 |    0.00 |     20 |
|  7654 | MARTIN | SALESMAN  | 7698 | 1981-09-28 00:00:00 |  1250.00 | 1400.00 |     30 |
|  7698 | BLAKE  | MANAGER   | 7839 | 1981-05-01 00:00:00 |  2850.00 |    0.00 |     30 |
|  7782 | CLARK  | MANAGER   | 7839 | 1981-06-09 00:00:00 |  2450.00 |    0.00 |     10 |
|  7788 | SCOTT  | ANALYST   | 7566 | 1987-04-19 00:00:00 |  3000.00 |    0.00 |     20 |
|  7839 | KING   | PRESIDENT |    0 | 1981-11-17 00:00:00 |  5000.00 |    0.00 |     10 |
|  7844 | TURNER | SALESMAN  | 7698 | 1981-09-08 00:00:00 |  1500.00 |    0.00 |     30 |
|  7876 | ADAMS  | CLERK     | 7788 | 1987-05-23 00:00:00 |  1100.00 |    0.00 |     20 |
|  7900 | JAMES  | CLERK     | 7698 | 1981-12-03 00:00:00 |   950.00 |    0.00 |     30 |
|  7902 | FORD   | ANALYST   | 7566 | 1981-12-03 00:00:00 |  3000.00 |    0.00 |     20 |
|  7934 | MILLER | CLERK     | 7782 | 1982-01-23 00:00:00 |  1300.00 |    0.00 |     10 |
|  8888 | HIVE   | PROGRAM   | 7839 | 1988-01-23 00:00:00 | 10300.00 |    0.00 |   NULL |
+-------+--------+-----------+------+---------------------+----------+---------+--------+
```

### 启动maxwell进程，首先使用stdout模式测试一下

```
[root@hadoop001 maxwell-1.17.1]# bin/maxwell --user='maxwell' --password='maxwell' --host='127.0.0.1' --producer=stdout
Using kafka version: 1.0.0
19:04:48,030 WARN  MaxwellMetrics - Metrics will not be exposed: metricsReportingType not configured.
19:04:48,365 INFO  SchemaStoreSchema - Creating maxwell database
19:04:48,559 INFO  Maxwell - Maxwell v1.17.1 is booting (StdoutProducer), starting at Position[BinlogPosition[mysql-bin.000014:5999], lastHeartbeat=0]
19:04:48,713 INFO  AbstractSchemaStore - Maxwell is capturing initial schema
19:04:49,339 INFO  BinlogConnectorReplicator - Setting initial binlog pos to: mysql-bin.000014:5999
19:04:49,506 INFO  BinaryLogClient - Connected to 127.0.0.1:3306 at mysql-bin.000014/5999 (sid:6379, cid:10)
19:04:49,506 INFO  BinlogConnectorLifecycleListener - Binlog connected.
```

### 向测试表中insert一条数据

```
mysql> insert into emp (empno,ename,job,mgr,hiredate,sal,comm,deptno) values (6001,'SIWA','DESIGNER',7001,'2019-03-08',1000,6000,40);
```

### 查看maxwell控制台

```
{"database":"hlwtest","table":"emp","type":"insert","ts":1552043107,"xid":444,"commit":true,"data":{"empno":6001,"ename":"SIWA","job":"DESIGNER","mgr":7001,"hiredate":"2019-03-08 00:00:00","sal":1000.00,"comm":6000.00,"deptno":40}}
```

### 再insert一条数据，查看下binlog日志内容

```
//MySQL
mysql> update emp set sal=500 where empno=6001;
//Maxwell
{"database":"hlwtest","table":"emp","type":"update","ts":1552090904,"xid":138,"commit":true,"data":{"empno":6001,"ename":"SIWA","job":"DESIGNER","mgr":7001,"hiredate":"2019-03-08 00:00:00","sal":500.00,"comm":6000.00,"deptno":40},"old":{"sal":1000.00}}
```

首先使用show binlog events的方式查看

```
//MySQL
mysql> show master status;
+------------------+----------+--------------+------------------+-------------------+
| File             | Position | Binlog_Do_DB | Binlog_Ignore_DB | Executed_Gtid_Set |
+------------------+----------+--------------+------------------+-------------------+
| mysql-bin.000016 |    40967 |              |                  |                   |
+------------------+----------+--------------+------------------+-------------------+
mysql> show binlog events in 'mysql-bin.000016' from 3954 limit 3;
+------------------+------+-------------+-----------+-------------+--------------------------------+
| Log_name         | Pos  | Event_type  | Server_id | End_log_pos | Info                           |
+------------------+------+-------------+-----------+-------------+--------------------------------+
| mysql-bin.000016 | 3954 | Table_map   |         1 |        4025 | table_id: 71 (hlwtest.emp)     |
| mysql-bin.000016 | 4025 | Update_rows |         1 |        4127 | table_id: 71 flags: STMT_END_F |
| mysql-bin.000016 | 4127 | Xid         |         1 |        4158 | COMMIT /* xid=138 */           |
+------------------+------+-------------+-----------+-------------+--------------------------------+
```

从解析的binlog中可以看出row模式下,DML操作会记录为:TABLE_MAP_EVENT+ROW_LOG_EVENT(包括WRITE_ROWS_EVENT ，UPDATE_ROWS_EVENT，DELETE_ROWS_EVENT).

为什么一个update在ROW模式下需要分解成两个event：
一个Table_map，一个Update_rows。我们想象一下，一个update如果更新了10000条数据，那么对应的表结构信息是否需要记录10000次?其实是对同一个表的操作，所以这里binlog只是记录了一个Table_map用于记录表结构相关信息,而后面的Update_rows记录了更新数据的行信息,注意此表中的table_id是会变化的。

然后使用/usr/local/mysql/bin目录下的mysqlbinlog工具解析binlog日志

```
[mysqladmin@hadoop001 bin]$ mysqlbinlog --start-position="3954" --stop-position="4158" /usr/local/mysql/arch/mysql-bin.000016
/*!50530 SET @@SESSION.PSEUDO_SLAVE_MODE=1*/;
/*!40019 SET @@session.max_insert_delayed_threads=0*/;
/*!50003 SET @OLD_COMPLETION_TYPE=@@COMPLETION_TYPE,COMPLETION_TYPE=0*/;
DELIMITER /*!*/;
# at 3954
#190309  8:21:44 server id 1  end_log_pos 4025 CRC32 0xf962b4b1         Table_map: `hlwtest`.`emp` mapped to number 71
# at 4025
#190309  8:21:44 server id 1  end_log_pos 4127 CRC32 0x5013e9f3         Update_rows: table id 71 flags: STMT_END_F
BINLOG '
GAeDXBMBAAAARwAAALkPAAAAAEcAAAAAAAEAB2hsd3Rlc3QAA2VtcAAI9g8P9hL29vYPBAAKAAkA
BAAABwIHAgIA/rG0Yvk=
GAeDXB8BAAAAZgAAAB8QAAAAAEcAAAAAAAEAAgAI//8Al3EEU0lXQQhERVNJR05FUptZmaKQAACA
A+gAgBdwAKgAl3EEU0lXQQhERVNJR05FUptZmaKQAACAAfQAgBdwAKjz6RNQ
'/*!*/;
# at 4127
#190309  8:21:44 server id 1  end_log_pos 4158 CRC32 0xfc03c0c3         Xid = 138
COMMIT/*!*/;
DELIMITER ;
# End of log file
ROLLBACK /* added by mysqlbinlog */;
/*!50003 SET COMPLETION_TYPE=@OLD_COMPLETION_TYPE*/;
/*!50530 SET @@SESSION.PSEUDO_SLAVE_MODE=0*/;
```

完全看不懂，这时需要添加参数（--base64-output=decode-rows -v）对输出结果解码

```
[mysqladmin@hadoop001 bin]$ mysqlbinlog --base64-output=decode-rows -v --start-position="3954" --stop-position="4158" /usr/local/mysql/arch/mysql-bin.000016
/*!50530 SET @@SESSION.PSEUDO_SLAVE_MODE=1*/;
/*!40019 SET @@session.max_insert_delayed_threads=0*/;
/*!50003 SET @OLD_COMPLETION_TYPE=@@COMPLETION_TYPE,COMPLETION_TYPE=0*/;
DELIMITER /*!*/;
# at 3954
#190309  8:21:44 server id 1  end_log_pos 4025 CRC32 0xf962b4b1         Table_map: `hlwtest`.`emp` mapped to number 71
# at 4025
#190309  8:21:44 server id 1  end_log_pos 4127 CRC32 0x5013e9f3         Update_rows: table id 71 flags: STMT_END_F
### UPDATE `hlwtest`.`emp`
### WHERE
###   @1=6001
###   @2='SIWA'
###   @3='DESIGNER'
###   @4=7001
###   @5='2019-03-08 00:00:00'
###   @6=1000.00
###   @7=6000.00
###   @8=40
### SET
###   @1=6001
###   @2='SIWA'
###   @3='DESIGNER'
###   @4=7001
###   @5='2019-03-08 00:00:00'
###   @6=500.00
###   @7=6000.00
###   @8=40
# at 4127
#190309  8:21:44 server id 1  end_log_pos 4158 CRC32 0xfc03c0c3         Xid = 138
COMMIT/*!*/;
DELIMITER ;
# End of log file
ROLLBACK /* added by mysqlbinlog */;
/*!50003 SET COMPLETION_TYPE=@OLD_COMPLETION_TYPE*/;
/*!50530 SET @@SESSION.PSEUDO_SLAVE_MODE=0*/;
```

可以看到Mysql每次列的修改（update）都需要记录表中所有列的值。这样就存在一个问题，如果表中包含很多的大字段，表的单行长度就会非常长，这样每次update就会导致大量的 binlog空间生成。针对这个问题，在mysql 5.6中进行了改进，复制支持”row image control” ，只记录修改的列而不是行中所有的列，这对一些包含 BLOGs 字段的数据来说可以节省很大的处理能力，因此此项改进不仅节省了磁盘空间，同时也提升了性能。

### 当数据库的binlog format 是statement 模式时，查看下binlog日志

```
mysql> update emp set sal=501 where empno=6001;
mysql> show master status;
+------------------+----------+--------------+------------------+-------------------+
| File             | Position | Binlog_Do_DB | Binlog_Ignore_DB | Executed_Gtid_Set |
+------------------+----------+--------------+------------------+-------------------+
| mysql-bin.000017 |      355 |              |                  |                   |
+------------------+----------+--------------+------------------+-------------------+
1 row in set (0.00 sec)
mysql> show binlog events in 'mysql-bin.000017';
+------------------+-----+-------------+-----------+-------------+--------------------------------------------------------+
| Log_name         | Pos | Event_type  | Server_id | End_log_pos | Info                                                   |
+------------------+-----+-------------+-----------+-------------+--------------------------------------------------------+
| mysql-bin.000017 |   4 | Format_desc |         1 |         120 | Server ver: 5.6.23-log, Binlog ver: 4                  |
| mysql-bin.000017 | 120 | Query       |         1 |         205 | BEGIN                                                  |
| mysql-bin.000017 | 205 | Query       |         1 |         324 | use `hlwtest`; update emp set sal=501 where empno=6001 |
| mysql-bin.000017 | 324 | Xid         |         1 |         355 | COMMIT /* xid=24 */                                    |
+------------------+-----+-------------+-----------+-------------+--------------------------------------------------------+
4 rows in set (0.01 sec)
//使用/usr/local/mysql/bin目录下的mysqlbinlog工具解析binlog日志
[mysqladmin@hadoop001 ~]$ /usr/local/mysql/binmysqlbinlog /usr/local/mysql/arch/mysql-bin.000017
...
# at 205
#190309  9:00:29 server id 1  end_log_pos 324 CRC32 0x1c4a065d  Query   thread_id=3     exec_time=0     error_code=0
use `hlwtest`/*!*/;
SET TIMESTAMP=1552093229/*!*/;
update emp set sal=501 where empno=6001
/*!*/;
# at 324
#190309  9:00:29 server id 1  end_log_pos 355 CRC32 0xf7071a73  Xid = 24
COMMIT/*!*/;
...
```