---
layout: post
title: "Hue解决下载10万行的限制"
date: 2019-02-18
comments: true
tags: 
    - Hue
categories: [其他组件]

---

<!--more--> 

### 问题描述

通过HUE impala/hive查询后，导出查询结果集最多只有10万行

### 问题原因

Hue默认配置原因，默认现在行数为10万行，列数为100列

<font color="red">注意：应该以hue管理员账户登录，否则看不到配置</font>

![mark](http://pucwi7op1.bkt.clouddn.com/blog/20190718/C32aP587vrYe.png?imageslim)

### 解决方案

修改hue所在机器的默认配置后，重启hue即可

具体操作：

<font color="red">**查找配置文件所在路径，选择src那个路径**</font>

![mark](http://pucwi7op1.bkt.clouddn.com/blog/20190718/3B5giojNSG4T.png?imageslim)

```
vi /opt/cloudera/parcels/CDH-5.12.0-1.cdh5.12.0.p0.29/lib/hue/apps/beeswax/src/beeswax/conf.py 
```

```
DOWNLOAD_CELL_LIMIT = Config(
  key='download_cell_limit',
  # 表格限制的大小，行数 * 列数。加一个0即可，修改后可下载的行数变成100万
  default=10000000,
  type=int,
  help=_t('A limit to the number of cells (rows * columns) that can be downloaded from a query '
          '(e.g. - 10K rows * 1K columns = 10M cells.) '
          'A value of -1 means there will be no limit.'))
def get_deprecated_download_cell_limit():
  """Get the old default"""
  # 表格的大小除100，就是行数，100是列数
  return DOWNLOAD_CELL_LIMIT.get() / 100 if DOWNLOAD_CELL_LIMIT.get() > 0 else DOWNLOAD_CELL_LIMIT.get(
DOWNLOAD_ROW_LIMIT = Config(
  key='download_row_limit',
  # 行数的限制
  dynamic_default=get_deprecated_download_cell_limit,
  type=int,
  help=_t('A limit to the number of rows that can be downloaded from a query before it is truncated. '
          'A value of -1 means there will be no limit.'))
```