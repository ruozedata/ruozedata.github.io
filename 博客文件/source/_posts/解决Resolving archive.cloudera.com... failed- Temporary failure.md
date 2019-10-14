---
layout: post
title: "解决Resolving archive.cloudera.com... failed: Temporary failure"
date: 2019-08-13
comments: true
tags: 
    - CDH

categories: [故障案例]

---

<!--more--> 

#### 背景

阿里云ECS云主机，部署CDH，需要wget下载资源包。

[CDH5.16.1集群企业真正离线部署](https://mp.weixin.qq.com/s?__biz=MzA5ODY0NzgxNA==&mid=2247485164&idx=1&sn=d19b4cf1bd7d0d0fdd73f91019a70b3a&chksm=908f2c85a7f8a593a03b10a8557e67e2088e5c6e820623040a693e0bd7da9fc3a41da0b5223b&scene=21#wechat_redirect)

#### 错误

```
[root@ruozedata001 ~]# wget -c http://archive.cloudera.com/cm5/cm/5/cloudera-manager-centos7-cm5.16.2_x86_64.tar.gz
--2019-07-23 16:59:08--  http://archive.cloudera.com/cm5/cm/5/cloudera-manager-centos7-cm5.16.2_x86_64.tar.gz
Resolving archive.cloudera.com... failed: Temporary failure in name resolution.
wget: unable to resolve host address “archive.cloudera.com”

无法解析 archive.cloudera.com网址，下载资源包失败

```

#### 修改网卡，添加DNS

```
[root@ruozedata001 ~]# vi /etc/sysconfig/network-scripts/ifcfg-eth0
DEVICE=eth0
ONBOOT=yes
BOOTPROTO=static
IPADDR=172.31.236.240
NETMASK=255.255.240.0
#百度DNS服务器
DNS1=180.76.76.76
#阿里云DNS服务器
DNS2=223.5.5.5
```

#### 重启网络生效 切记

```
[root@ruozedata001 ~]# service network restart
Shutting down interface eth0:                              [  OK  ]
Shutting down loopback interface:                          [  OK  ]
Bringing up loopback interface:                            [  OK  ]
Bringing up interface eth0:  Determining if ip address 172.31.236.240 is already in use for device eth0...
RTNETLINK answers: File exists
                                                           [  OK  ]
[root@ruozedata001 ~]# ping archive.cloudera.com
PING prod.cloudera.map.fastly.net (151.101.76.167) 56(84) bytes of data.
64 bytes from 151.101.76.167: icmp_seq=1 ttl=59 time=0.719 ms
64 bytes from 151.101.76.167: icmp_seq=2 ttl=59 time=0.754 ms
^Z
[3]+  Stopped                 ping archive.cloudera.com
```

#### 下载

```
[root@ruozedata001 ~]# wget -c http://archive.cloudera.com/cm5/cm/5/cloudera-manager-centos7-cm5.16.2_x86_64.tar.gz
--2019-07-23 17:00:29--  http://archive.cloudera.com/cm5/cm/5/cloudera-manager-centos7-cm5.16.2_x86_64.tar.gz
Resolving archive.cloudera.com... 151.101.76.167
Connecting to archive.cloudera.com|151.101.76.167|:80... connected.
HTTP request sent, awaiting response... 200 OK
Length: 837950600 (799M) [binary/octet-stream]
Saving to: “cloudera-manager-centos7-cm5.16.2_x86_64.tar.gz”
100%[=============================================================================>] 837,950,600 12.3M/s   in 65s
2019-07-23 17:01:34 (12.4 MB/s) - “cloudera-manager-centos7-cm5.16.2_x86_64.tar.gz” saved [837950600/837950600]



[root@ruozedata001 ~]# wget -c https://archive.cloudera.com/cdh5/parcels/latest/CDH-5.16.2-1.cdh5.16.2.p0.8-el7.parcel

--2019-07-23 17:01:58--  https://archive.cloudera.com/cdh5/parcels/latest/CDH-5.16.2-1.cdh5.16.2.p0.8-el7.parcel
Resolving archive.cloudera.com... 151.101.76.167
Connecting to archive.cloudera.com|151.101.76.167|:443... connected.
HTTP request sent, awaiting response... 200 OK
Length: 2132782197 (2.0G) [binary/octet-stream]
Saving to: “CDH-5.16.2-1.cdh5.16.2.p0.8-el7.parcel”
100%[===========================================================================>] 2,132,782,197 12.8M/s   in 2m 46s
2019-07-23 17:04:44 (12.3 MB/s) - “CDH-5.16.2-1.cdh5.16.2.p0.8-el7.parcel” saved [2132782197/2132782197]



[root@ruozedata001 ~]# wget -c https://archive.cloudera.com/cdh5/parcels/latest/CDH-5.16.2-1.cdh5.16.2.p0.8-el7.parcel.sha1

--2019-07-23 17:04:56--  https://archive.cloudera.com/cdh5/parcels/latest/CDH-5.16.2-1.cdh5.16.2.p0.8-el7.parcel.sha1
Resolving archive.cloudera.com... 151.101.76.167
Connecting to archive.cloudera.com|151.101.76.167|:443... connected.
HTTP request sent, awaiting response... 200 OK
Length: 41 [text/plain]
Saving to: “CDH-5.16.2-1.cdh5.16.2.p0.8-el7.parcel.sha1”
100%[=============================================================================>] 41          --.-K/s   in 0s
2019-07-23 17:04:56 (3.57 MB/s) - “CDH-5.16.2-1.cdh5.16.2.p0.8-el7.parcel.sha1” saved [41/41]



[root@ruozedata001 ~]# wget -c https://archive.cloudera.com/cdh5/parcels/latest/manifest.json

--2019-07-23 17:05:09--  https://archive.cloudera.com/cdh5/parcels/latest/manifest.json
Resolving archive.cloudera.com... 151.101.76.167
Connecting to archive.cloudera.com|151.101.76.167|:443... connected.
HTTP request sent, awaiting response... 200 OK
Length: 66804 (65K) [application/json]
Saving to: “manifest.json”
100%[=============================================================================>] 66,804      --.-K/s   in 0.001s

2019-07-23 17:05:09 (44.2 MB/s) - “manifest.json” saved [66804/66804]
```