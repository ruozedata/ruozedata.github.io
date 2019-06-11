---
layout: post
title: "linux常用命令（二）"
date: 2018-04-01
comments: true
tags: 
	- linux
	- 基础
categories:  Linux
---
Linux最常用实战命令（二）
<!--more--> 
1. 实时查看文件内容    tail filename

- tail -f filename    当文件(名)被修改后，不能监视文件内容

- tail -F filename    当文件(名)被修改后，依然可以监视文件内容

2. 复制、移动文件

- cp oldfilename newfilename    复制

- mv oldfilename newfilename    移动/重命名

3. echo

- echo "xxx"     输出

- echo "xxx" > filename    覆盖

- echo "xxx" >> filename    追加

4. 删除    rm

- rm -f    强制删除

- rm -rf    强制删除文件夹，r 表示递归参数，指针对文件夹及文件夹里面文件 

5. 别名 alias

- alias x="xxxxxx"    临时引用别名

- alias x="xxxxxx" 配置到环境变量中即为永久生效

6. 查看历史命令    history

- history    显示出所有历史记录 

- history n    显示出n条记录 

- !n    执行第n条记录

7. 管道命令    （ | ）
- 管道的两边都是命令，左边的命令先执行，执行的结果作为右边命令的输入

8. 查看进程、查看id、端口

- ps -ef ｜grep 进程名    查看进程基本信息

- netstat -npl｜grep 进程名或进程id    查看服务id和端口



9. 杀死进程     kill

- kill -9 进程名/pid    强制删除

- kill -9 $(pgrep 进程名)：杀死与该进程相关的所有进程

10. rpm 搜索、卸载

- rpm -qa | grep xxx     搜索xxx

- rpm --nodeps -e xxx    删除xxx

- --nodeps    不验证包的依赖性

11. 查询

- find 路径 -name xxx    (推荐)

- which xxx

- local xxx

12. 查看磁盘、内存、系统的情况

- df -h    查看磁盘大小及其使用情况

- free -m    查看内存大小及其使用情况

- top    查看系统情况

13. 软连接

- ln -s 原始目录 目标目录

14. 压缩、解压

- tar -czf    压缩     tar -xzvf    解压

- zip    压缩    unzip    解压