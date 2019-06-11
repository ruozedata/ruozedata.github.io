---
layout: post
title: "linux常用命令（一）"
date: 2018-04-01
comments: true
tags: 
	- linux
	- 基础 
categories:  Linux
---
Linux最常用实战命令（一）
<!--more--> 
1. 查看当前目录    pwd

2. 查看IP

- ifconfig    查看虚拟机ip 

- hostname    主机名字
	- i    查看主机名映射的IP

3. 切换目录    cd

- cd ~    切换家目录（root为/root，普通用户为/home/用户名）

- cd /filename    以绝对路径切换目录

- cd -    返回上一次操作路径，并输出路径

- cd ../    返回上一层目录

4. 清理桌面    clear

5. 显示当前目录文件和文件夹  ls

- ls -l(ll)   显示详细信息

- ls -la    显示详细信息+隐藏文件（以 . 开头，例：.ssh）

- ls -lh    显示详细信息+文件大小

- ls -lrt    显示详细信息+按时间排序

6. 查看文件夹大小    du -sh

7. 命令帮助

- man 命令

- 命令 --help


8. 创建文件夹    mkdir

- mkdir -p filename1/filename2    递归创建文件夹

9. 创建文件    touch/vi/echo xx>filename

10. 查看文件内容

- cat filename    直接打印所有内容

- more filename    根据窗口大小进行分页显示


11. 文件编辑 vi

- vi分为命令行模式，插入模式，尾行模式

- 命令行模式--->插入模式：按i或a键

- 插入模式--->命令行模式：按Esc键

- 命令行模式--->尾行模式：按Shift和:键

	插入模式

	- dd    删除光标所在行

	- n+dd    删除光标以下的n行

	- dG    删除光标以下行

	- gg    第一行第一个字母

	- G    最后一行第一个字母

	- shift+$    该行最后一个字母

	尾行模式

	- q!    强制退出

	- qw    写入并退出

	- qw!    强制写入退出

	- x    退出，如果存在改动，则保存再退出


