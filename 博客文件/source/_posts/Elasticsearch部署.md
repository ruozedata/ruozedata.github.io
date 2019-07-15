---
layout: post
title: "Elasticsearch部署"
date: 2019-06-21
comments: true
tags: 
    - Elasticsearch
categories: [Elasticsearch]

---

<!--more--> 

上传解压elasticsearch的tar包

```
[root@hadoop001 elasticsearch]# ll
total 236
drwxr-xr-x  2 root root   4096 Apr 22 11:28 bin
drwxr-xr-x  2 root root   4096 Aug 14  2017 config
drwxr-xr-x  2 root root   4096 Aug 14  2017 lib
-rw-r--r--  1 root root  11358 Aug 14  2017 LICENSE.txt
drwxr-xr-x 13 root root   4096 Aug 14  2017 modules
-rw-r--r--  1 root root 194187 Aug 14  2017 NOTICE.txt
drwxr-xr-x  2 root root   4096 Aug 14  2017 plugins
-rw-r--r--  1 root root   9549 Aug 14  2017 README.textile
[root@hadoop001 elasticsearch]# cd config/
[root@hadoop001 config]# ll
total 16
-rw-rw---- 1 root root 2854 Aug 14  2017 elasticsearch.yml
-rw-rw---- 1 root root 3064 Aug 14  2017 jvm.options
-rw-rw---- 1 root root 4456 Aug 14  2017 log4j2.properties
[root@hadoop001 config]# vi elasticsearch.yml
cluster.name: HLWCluster
node.name: hadoop001
path.data: /root/app/elasticsearch/data
path.logs: /root/app/elasticsearch/logs
network.host: 172.26.183.103
[root@hadoop001 config]# cd ../
[root@hadoop001 elasticsearch]# cd bin
[root@hadoop001 bin]# ll
total 348
-rwxr-xr-x 1 root root   8075 Aug 14  2017 elasticsearch
-rw-r--r-- 1 root root   3343 Aug 14  2017 elasticsearch.bat
-rw-r--r-- 1 root root   1023 Aug 14  2017 elasticsearch.in.bat
-rwxr-xr-x 1 root root    367 Aug 14  2017 elasticsearch.in.sh
-rwxr-xr-x 1 root root   2550 Aug 14  2017 elasticsearch-keystore
-rw-r--r-- 1 root root    743 Aug 14  2017 elasticsearch-keystore.bat
-rwxr-xr-x 1 root root   2540 Aug 14  2017 elasticsearch-plugin
-rw-r--r-- 1 root root    731 Aug 14  2017 elasticsearch-plugin.bat
-rw-r--r-- 1 root root  11239 Aug 14  2017 elasticsearch-service.bat
-rw-r--r-- 1 root root 104448 Aug 14  2017 elasticsearch-service-mgr.exe
-rw-r--r-- 1 root root 103936 Aug 14  2017 elasticsearch-service-x64.exe
-rw-r--r-- 1 root root  80896 Aug 14  2017 elasticsearch-service-x86.exe
-rwxr-xr-x 1 root root    223 Aug 14  2017 elasticsearch-systemd-pre-exec
-rwxr-xr-x 1 root root   2514 Aug 14  2017 elasticsearch-translog
-rw-r--r-- 1 root root   1435 Aug 14  2017 elasticsearch-translog.bat
[root@hadoop001 bin]# ./elasticsearch
[2019-04-22T11:47:17,068][WARN ][o.e.b.ElasticsearchUncaughtExceptionHandler] [hadoop001] uncaught exception in thread [main]
org.elasticsearch.bootstrap.StartupException: java.lang.RuntimeException: can not run elasticsearch as root
        at org.elasticsearch.bootstrap.Elasticsearch.init(Elasticsearch.java:127) ~[elasticsearch-5.5.2.jar:5.5.2]
        at org.elasticsearch.bootstrap.Elasticsearch.execute(Elasticsearch.java:114) ~[elasticsearch-5.5.2.jar:5.5.2]
        at org.elasticsearch.cli.EnvironmentAwareCommand.execute(EnvironmentAwareCommand.java:67) ~[elasticsearch-5.5.2.jar:5.5.2]
        at org.elasticsearch.cli.Command.mainWithoutErrorHandling(Command.java:122) ~[elasticsearch-5.5.2.jar:5.5.2]
        at org.elasticsearch.cli.Command.main(Command.java:88) ~[elasticsearch-5.5.2.jar:5.5.2]
        at org.elasticsearch.bootstrap.Elasticsearch.main(Elasticsearch.java:91) ~[elasticsearch-5.5.2.jar:5.5.2]
        at org.elasticsearch.bootstrap.Elasticsearch.main(Elasticsearch.java:84) ~[elasticsearch-5.5.2.jar:5.5.2]
Caused by: java.lang.RuntimeException: can not run elasticsearch as root
        at org.elasticsearch.bootstrap.Bootstrap.initializeNatives(Bootstrap.java:106) ~[elasticsearch-5.5.2.jar:5.5.2]
        at org.elasticsearch.bootstrap.Bootstrap.setup(Bootstrap.java:194) ~[elasticsearch-5.5.2.jar:5.5.2]
        at org.elasticsearch.bootstrap.Bootstrap.init(Bootstrap.java:351) ~[elasticsearch-5.5.2.jar:5.5.2]
        at org.elasticsearch.bootstrap.Elasticsearch.init(Elasticsearch.java:123) ~[elasticsearch-5.5.2.jar:5.5.2]
        ... 6 more
[root@hadoop001 bin]# cd ../logs
[root@hadoop001 logs]# ll
total 4
-rw-r--r-- 1 root root    0 Apr 22 11:47 HLWCluster_deprecation.log
-rw-r--r-- 1 root root    0 Apr 22 11:47 HLWCluster_index_indexing_slowlog.log
-rw-r--r-- 1 root root    0 Apr 22 11:47 HLWCluster_index_search_slowlog.log
-rw-r--r-- 1 root root 2691 Apr 22 11:47 HLWCluster.log
[root@hadoop001 logs]# cat HLWCluster.log
[2019-04-22T11:47:17,058][ERROR][o.e.b.Bootstrap          ] Exception
java.lang.RuntimeException: can not run elasticsearch as root
        at org.elasticsearch.bootstrap.Bootstrap.initializeNatives(Bootstrap.java:106) ~[elasticsearch-5.5.2.jar:5.5.2]
        at org.elasticsearch.bootstrap.Bootstrap.setup(Bootstrap.java:194) ~[elasticsearch-5.5.2.jar:5.5.2]
        at org.elasticsearch.bootstrap.Bootstrap.init(Bootstrap.java:351) [elasticsearch-5.5.2.jar:5.5.2]
        at org.elasticsearch.bootstrap.Elasticsearch.init(Elasticsearch.java:123) [elasticsearch-5.5.2.jar:5.5.2]
        at org.elasticsearch.bootstrap.Elasticsearch.execute(Elasticsearch.java:114) [elasticsearch-5.5.2.jar:5.5.2]
        at org.elasticsearch.cli.EnvironmentAwareCommand.execute(EnvironmentAwareCommand.java:67) [elasticsearch-5.5.2.jar:5.5.2]
        at org.elasticsearch.cli.Command.mainWithoutErrorHandling(Command.java:122) [elasticsearch-5.5.2.jar:5.5.2]
        at org.elasticsearch.cli.Command.main(Command.java:88) [elasticsearch-5.5.2.jar:5.5.2]
        at org.elasticsearch.bootstrap.Elasticsearch.main(Elasticsearch.java:91) [elasticsearch-5.5.2.jar:5.5.2]
        at org.elasticsearch.bootstrap.Elasticsearch.main(Elasticsearch.java:84) [elasticsearch-5.5.2.jar:5.5.2]
[2019-04-22T11:47:17,068][WARN ][o.e.b.ElasticsearchUncaughtExceptionHandler] [hadoop001] uncaught exception in thread [main]
org.elasticsearch.bootstrap.StartupException: java.lang.RuntimeException: can not run elasticsearch as root
        at org.elasticsearch.bootstrap.Elasticsearch.init(Elasticsearch.java:127) ~[elasticsearch-5.5.2.jar:5.5.2]
        at org.elasticsearch.bootstrap.Elasticsearch.execute(Elasticsearch.java:114) ~[elasticsearch-5.5.2.jar:5.5.2]
        at org.elasticsearch.cli.EnvironmentAwareCommand.execute(EnvironmentAwareCommand.java:67) ~[elasticsearch-5.5.2.jar:5.5.2]
        at org.elasticsearch.cli.Command.mainWithoutErrorHandling(Command.java:122) ~[elasticsearch-5.5.2.jar:5.5.2]
        at org.elasticsearch.cli.Command.main(Command.java:88) ~[elasticsearch-5.5.2.jar:5.5.2]
        at org.elasticsearch.bootstrap.Elasticsearch.main(Elasticsearch.java:91) ~[elasticsearch-5.5.2.jar:5.5.2]
        at org.elasticsearch.bootstrap.Elasticsearch.main(Elasticsearch.java:84) ~[elasticsearch-5.5.2.jar:5.5.2]
Caused by: java.lang.RuntimeException: can not run elasticsearch as root
        at org.elasticsearch.bootstrap.Bootstrap.initializeNatives(Bootstrap.java:106) ~[elasticsearch-5.5.2.jar:5.5.2]
        at org.elasticsearch.bootstrap.Bootstrap.setup(Bootstrap.java:194) ~[elasticsearch-5.5.2.jar:5.5.2]
        at org.elasticsearch.bootstrap.Bootstrap.init(Bootstrap.java:351) ~[elasticsearch-5.5.2.jar:5.5.2]
        at org.elasticsearch.bootstrap.Elasticsearch.init(Elasticsearch.java:123) ~[elasticsearch-5.5.2.jar:5.5.2]
        ... 6 more
```

第一个报错：不能用root用户去运行

```
[root@hadoop001 app]# useradd esuser
[root@hadoop001 app]# chown -R esuser:esuser elasticsearch-5.5.2
[root@hadoop001 app]# mv ./elasticsearch-5.5.2 /home/esuser/elasticsearch-5.5.2
[root@hadoop001 app]# su - esuser
[esuser@hadoop001 ~]$ cd elasticsearch
[esuser@hadoop001 elasticsearch]$ pwd
/home/esuser/elasticsearch
[esuser@hadoop001 elasticsearch]$ ll
total 244
drwxr-xr-x  2 esuser esuser   4096 Apr 22 11:28 bin
drwxr-xr-x  2 esuser esuser   4096 Apr 22 11:46 config
drwxr-xr-x  2 esuser esuser   4096 Apr 22 11:42 data
drwxr-xr-x  2 esuser esuser   4096 Aug 14  2017 lib
-rw-r--r--  1 esuser esuser  11358 Aug 14  2017 LICENSE.txt
drwxr-xr-x  2 esuser esuser   4096 Apr 22 11:47 logs
drwxr-xr-x 13 esuser esuser   4096 Aug 14  2017 modules
-rw-r--r--  1 esuser esuser 194187 Aug 14  2017 NOTICE.txt
drwxr-xr-x  2 esuser esuser   4096 Aug 14  2017 plugins
-rw-r--r--  1 esuser esuser   9549 Aug 14  2017 README.textile
[esuser@hadoop001 elasticsearch]$ cd config
[esuser@hadoop001 config]$ vi elasticsearch.yml
path.data: /home/esuser/elasticsearch/data
path.logs: /home/esuser/elasticsearch/logs
[esuser@hadoop001 config]$ cd ../bin
[esuser@hadoop001 bin]$ ./elasticsearch
[2019-04-22T12:16:04,747][INFO ][o.e.n.Node               ] [hadoop001] initializing ...
[2019-04-22T12:16:04,822][INFO ][o.e.e.NodeEnvironment    ] [hadoop001] using [1] data paths, mounts [[/ (rootfs)]], net usable_space [17.8gb], net total_space [39.2gb], spins? [unknown], types [rootfs]
[2019-04-22T12:16:04,823][INFO ][o.e.e.NodeEnvironment    ] [hadoop001] heap size [1.9gb], compressed ordinary object pointers [true]
[2019-04-22T12:16:04,824][INFO ][o.e.n.Node               ] [hadoop001] node name [hadoop001], node ID [oKhZUG8wTl2bz38DZ_5rHA]
[2019-04-22T12:16:04,824][INFO ][o.e.n.Node               ] [hadoop001] version[5.5.2], pid[4894], build[b2f0c09/2017-08-14T12:33:14.154Z], OS[Linux/3.10.0-862.14.4.el7.x86_64/amd64], JVM[Oracle Corporation/Java HotSpot(TM) 64-Bit Server VM/1.8.0_45/25.45-b02]
[2019-04-22T12:16:04,824][INFO ][o.e.n.Node               ] [hadoop001] JVM arguments [-Xms2g, -Xmx2g, -XX:+UseConcMarkSweepGC, -XX:CMSInitiatingOccupancyFraction=75, -XX:+UseCMSInitiatingOccupancyOnly, -XX:+AlwaysPreTouch, -Xss1m, -Djava.awt.headless=true, -Dfile.encoding=UTF-8, -Djna.nosys=true, -Djdk.io.permissionsUseCanonicalPath=true, -Dio.netty.noUnsafe=true, -Dio.netty.noKeySetOptimization=true, -Dio.netty.recycler.maxCapacityPerThread=0, -Dlog4j.shutdownHookEnabled=false, -Dlog4j2.disable.jmx=true, -Dlog4j.skipJansi=true, -XX:+HeapDumpOnOutOfMemoryError, -Des.path.home=/home/esuser/elasticsearch]
[2019-04-22T12:16:06,014][INFO ][o.e.p.PluginsService     ] [hadoop001] loaded module [aggs-matrix-stats]
[2019-04-22T12:16:06,014][INFO ][o.e.p.PluginsService     ] [hadoop001] loaded module [ingest-common]
[2019-04-22T12:16:06,014][INFO ][o.e.p.PluginsService     ] [hadoop001] loaded module [lang-expression]
[2019-04-22T12:16:06,014][INFO ][o.e.p.PluginsService     ] [hadoop001] loaded module [lang-groovy]
[2019-04-22T12:16:06,014][INFO ][o.e.p.PluginsService     ] [hadoop001] loaded module [lang-mustache]
[2019-04-22T12:16:06,014][INFO ][o.e.p.PluginsService     ] [hadoop001] loaded module [lang-painless]
[2019-04-22T12:16:06,014][INFO ][o.e.p.PluginsService     ] [hadoop001] loaded module [parent-join]
[2019-04-22T12:16:06,015][INFO ][o.e.p.PluginsService     ] [hadoop001] loaded module [percolator]
[2019-04-22T12:16:06,015][INFO ][o.e.p.PluginsService     ] [hadoop001] loaded module [reindex]
[2019-04-22T12:16:06,015][INFO ][o.e.p.PluginsService     ] [hadoop001] loaded module [transport-netty3]
[2019-04-22T12:16:06,015][INFO ][o.e.p.PluginsService     ] [hadoop001] loaded module [transport-netty4]
[2019-04-22T12:16:06,015][INFO ][o.e.p.PluginsService     ] [hadoop001] no plugins loaded
[2019-04-22T12:16:08,200][INFO ][o.e.d.DiscoveryModule    ] [hadoop001] using discovery type [zen]
[2019-04-22T12:16:08,882][INFO ][o.e.n.Node               ] [hadoop001] initialized
[2019-04-22T12:16:08,883][INFO ][o.e.n.Node               ] [hadoop001] starting ...
[2019-04-22T12:16:09,051][INFO ][o.e.t.TransportService   ] [hadoop001] publish_address {172.26.183.103:9300}, bound_addresses {172.26.183.103:9300}
[2019-04-22T12:16:09,063][INFO ][o.e.b.BootstrapChecks    ] [hadoop001] bound or publishing to a non-loopback or non-link-local address, enforcing bootstrap checks
ERROR: [2] bootstrap checks failed
[1]: max file descriptors [65535] for elasticsearch process is too low, increase to at least [65536]
[2]: max virtual memory areas vm.max_map_count [65530] is too low, increase to at least [262144]
[2019-04-22T12:16:09,080][INFO ][o.e.n.Node               ] [hadoop001] stopping ...
[2019-04-22T12:16:09,110][INFO ][o.e.n.Node               ] [hadoop001] stopped
[2019-04-22T12:16:09,110][INFO ][o.e.n.Node               ] [hadoop001] closing ...
[2019-04-22T12:16:09,128][INFO ][o.e.n.Node               ] [hadoop001] closed
```

第二次报错：<br>
ERROR: [2] bootstrap checks failed<br>
[1]: max file descriptors [65535] for elasticsearch process is too low, increase to at least [65536]<br>
[2]: max virtual memory areas vm.max_map_count [65530] is too low, increase to at least [262144]

```
[root@hadoop001 ~]# vi /etc/security/limits.conf
* soft nofile 65536
* hard nofile 131072 
[root@hadoop001 ~]# vi /etc/sysctl.conf
vm.max_map_count=262144
[root@hadoop001 etc]# sysctl -p
vm.swappiness = 0
net.ipv4.neigh.default.gc_stale_time = 120
net.ipv4.conf.all.rp_filter = 0
net.ipv4.conf.default.rp_filter = 0
net.ipv4.conf.default.arp_announce = 2
net.ipv4.conf.lo.arp_announce = 2
net.ipv4.conf.all.arp_announce = 2
net.ipv4.tcp_max_tw_buckets = 5000
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 1024
net.ipv4.tcp_synack_retries = 2
net.ipv6.conf.all.disable_ipv6 = 1
net.ipv6.conf.default.disable_ipv6 = 1
net.ipv6.conf.lo.disable_ipv6 = 1
kernel.sysrq = 1
vm.max_map_count = 262144
```

以上设置永久生效需要重启reboot

```
[root@hadoop001 etc]# reboot
```

查看配置有没有生效

```
[root@hadoop001 ~]# su - esuser
[esuser@hadoop001 ~]$ ulimit -a
core file size          (blocks, -c) 0
data seg size           (kbytes, -d) unlimited
scheduling priority             (-e) 0
file size               (blocks, -f) unlimited
pending signals                 (-i) 63461
max locked memory       (kbytes, -l) 64
max memory size         (kbytes, -m) unlimited
open files                      (-n) 65536
pipe size            (512 bytes, -p) 8
POSIX message queues     (bytes, -q) 819200
real-time priority              (-r) 0
stack size              (kbytes, -s) 8192
cpu time               (seconds, -t) unlimited
max user processes              (-u) 4096
virtual memory          (kbytes, -v) unlimited
file locks                      (-x) unlimited
[root@hadoop001 config]# vi elasticsearch.yml
bootstrap.memory_lock: false
bootstrap.system_call_filter: false
[esuser@hadoop001 bin]$ ./elasticsearch
[2019-04-22T12:58:13,817][INFO ][o.e.n.Node               ] [hadoop001] initializing ...
[2019-04-22T12:58:13,896][INFO ][o.e.e.NodeEnvironment    ] [hadoop001] using [1] data paths, mounts [[/ (rootfs)]], net usable_space [17.8gb], net total_space [39.2gb], spins? [unknown], types [rootfs]
[2019-04-22T12:58:13,897][INFO ][o.e.e.NodeEnvironment    ] [hadoop001] heap size [1.9gb], compressed ordinary object pointers [true]
[2019-04-22T12:58:13,898][INFO ][o.e.n.Node               ] [hadoop001] node name [hadoop001], node ID [oKhZUG8wTl2bz38DZ_5rHA]
[2019-04-22T12:58:13,898][INFO ][o.e.n.Node               ] [hadoop001] version[5.5.2], pid[3085], build[b2f0c09/2017-08-14T12:33:14.154Z], OS[Linux/3.10.0-862.14.4.el7.x86_64/amd64], JVM[Oracle Corporation/Java HotSpot(TM) 64-Bit Server VM/1.8.0_45/25.45-b02]
[2019-04-22T12:58:13,898][INFO ][o.e.n.Node               ] [hadoop001] JVM arguments [-Xms2g, -Xmx2g, -XX:+UseConcMarkSweepGC, -XX:CMSInitiatingOccupancyFraction=75, -XX:+UseCMSInitiatingOccupancyOnly, -XX:+AlwaysPreTouch, -Xss1m, -Djava.awt.headless=true, -Dfile.encoding=UTF-8, -Djna.nosys=true, -Djdk.io.permissionsUseCanonicalPath=true, -Dio.netty.noUnsafe=true, -Dio.netty.noKeySetOptimization=true, -Dio.netty.recycler.maxCapacityPerThread=0, -Dlog4j.shutdownHookEnabled=false, -Dlog4j2.disable.jmx=true, -Dlog4j.skipJansi=true, -XX:+HeapDumpOnOutOfMemoryError, -Des.path.home=/home/esuser/elasticsearch]
[2019-04-22T12:58:15,302][INFO ][o.e.p.PluginsService     ] [hadoop001] loaded module [aggs-matrix-stats]
[2019-04-22T12:58:15,302][INFO ][o.e.p.PluginsService     ] [hadoop001] loaded module [ingest-common]
[2019-04-22T12:58:15,302][INFO ][o.e.p.PluginsService     ] [hadoop001] loaded module [lang-expression]
[2019-04-22T12:58:15,302][INFO ][o.e.p.PluginsService     ] [hadoop001] loaded module [lang-groovy]
[2019-04-22T12:58:15,302][INFO ][o.e.p.PluginsService     ] [hadoop001] loaded module [lang-mustache]
[2019-04-22T12:58:15,302][INFO ][o.e.p.PluginsService     ] [hadoop001] loaded module [lang-painless]
[2019-04-22T12:58:15,302][INFO ][o.e.p.PluginsService     ] [hadoop001] loaded module [parent-join]
[2019-04-22T12:58:15,303][INFO ][o.e.p.PluginsService     ] [hadoop001] loaded module [percolator]
[2019-04-22T12:58:15,303][INFO ][o.e.p.PluginsService     ] [hadoop001] loaded module [reindex]
[2019-04-22T12:58:15,303][INFO ][o.e.p.PluginsService     ] [hadoop001] loaded module [transport-netty3]
[2019-04-22T12:58:15,303][INFO ][o.e.p.PluginsService     ] [hadoop001] loaded module [transport-netty4]
[2019-04-22T12:58:15,303][INFO ][o.e.p.PluginsService     ] [hadoop001] no plugins loaded
[2019-04-22T12:58:17,555][INFO ][o.e.d.DiscoveryModule    ] [hadoop001] using discovery type [zen]
[2019-04-22T12:58:18,182][INFO ][o.e.n.Node               ] [hadoop001] initialized
[2019-04-22T12:58:18,183][INFO ][o.e.n.Node               ] [hadoop001] starting ...
[2019-04-22T12:58:18,357][INFO ][o.e.t.TransportService   ] [hadoop001] publish_address {172.26.183.103:9300}, bound_addresses {172.26.183.103:9300}
[2019-04-22T12:58:18,368][INFO ][o.e.b.BootstrapChecks    ] [hadoop001] bound or publishing to a non-loopback or non-link-local address, enforcing bootstrap checks
[2019-04-22T12:58:21,428][INFO ][o.e.c.s.ClusterService   ] [hadoop001] new_master {hadoop001}{oKhZUG8wTl2bz38DZ_5rHA}{aY3CSi1XTOCq29GPw3cFqA}{172.26.183.103}{172.26.183.103:9300}, reason: zen-disco-elected-as-master ([0] nodes joined)
[2019-04-22T12:58:21,471][INFO ][o.e.h.n.Netty4HttpServerTransport] [hadoop001] publish_address {172.26.183.103:9200}, bound_addresses {172.26.183.103:9200}
[2019-04-22T12:58:21,471][INFO ][o.e.n.Node               ] [hadoop001] started
[2019-04-22T12:58:21,473][INFO ][o.e.g.GatewayService     ] [hadoop001] recovered [0] indices into cluster_state
```

需要后台运行的话加个 -d 参数：./elasticsearch -d

```
[esuser@hadoop001 ~]$ curl -XGET '172.26.183.103:9200/?pretty'
{
  "name" : "hadoop001",
  "cluster_name" : "HLWCluster",
  "cluster_uuid" : "jb0pPZNBTwmQj6iNBWtvzg",
  "version" : {
    "number" : "5.5.2",
    "build_hash" : "b2f0c09",
    "build_date" : "2017-08-14T12:33:14.154Z",
    "build_snapshot" : false,
    "lucene_version" : "6.6.0"
  },
  "tagline" : "You Know, for Search"
}
```