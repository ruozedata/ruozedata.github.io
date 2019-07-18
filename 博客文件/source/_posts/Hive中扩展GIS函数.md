---
layout: post
title: "Hive中扩展GIS函数"
date: 2019-05-27
comments: true
tags: 
    - Hive
    - 扩展函数
categories: [Hive]

---

<!--more--> 

### 应用场景

目前，Hive表中存在需要把经纬度转化为距离，和一些其他相关的计算函数，但是在hive中并没有集成这些函数。当然我们可以自定义UDF函数，但是现在提供一个更加简单的方法，通过源码编译的方式，集成GIS函数。

### 环境

```
<profile>
    <id>hadoop-2.7</id>
    <properties>
        <hadoop.version>2.7.3</hadoop.version>
    </properties>
</profile>
<profile>
    <id>hive-1.2</id>
    <properties>
        <hive.version>1.2.1</hive.version>
    </properties>
</profile>
<java.source.version>1.8</java.source.version>
<java.target.version>1.8</java.target.version>
<hadoop.version>2.7.3</hadoop.version>
<hive.version>1.2.1</hive.version>
```

下载源码：[https://github.com/Esri/spatial-framework-for-hadoop](https://github.com/Esri/spatial-framework-for-hadoop)

在github上下载源码在本地idea进行编译，修改最外层的pom.xml,修改hadoop、hive、java版本为生产环境中版本

- idea中添加项目

![mark](http://pucwi7op1.bkt.clouddn.com/blog/20190718/VlrXfEQpCkTN.png?imageslim)

- 打包

    打包后会出现如下两个jar包

    ![mark](http://pucwi7op1.bkt.clouddn.com/blog/20190718/nNBsGvGrElPr.png?imageslim)

    ```
    spatial-sdk-json-2.1.1-SNAPSHOT.jar
    spatial-sdk-hive-2.1.1-SNAPSHOT.jar
    ```

然后下载最新的esri-geometry-java中的esri-geometry-api-2.2.1.jar，上传三个jar到linux系统(jar权限设置成最高),在hive的shell控制台输入添加jar和创建函数语句。

### 创建函数

**如果jar包在本地则创建临时函数，只在当前session有效，我们可以把jar包上传到HDFS上创建永久函数**

```
add jar  /iDatalight/jars/esri-geometry-api-2.2.1.jar;
add jar  /iDatalight/jars/spatial-sdk-json-2.1.0.jar;
add jar  /iDatalight/jars/spatial-sdk-hive-2.1.0.jar;
```

自定义函数使用可以参考官方文档UDF文档,创建自定义函数可以参考spatial-framework-for-hadoop项目的hive下function-ddl.sql，但创建永久函数需要去掉temporary

```
CREATE FUNCTION STPoint as 'com.esri.hadoop.hive.ST_Point' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_AsBinary as 'com.esri.hadoop.hive.ST_AsBinary' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_AsGeoJSON as 'com.esri.hadoop.hive.ST_AsGeoJson' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_AsJSON as 'com.esri.hadoop.hive.ST_AsJson' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_AsShape as 'com.esri.hadoop.hive.ST_AsShape' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_AsText as 'com.esri.hadoop.hive.ST_AsText' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_GeomFromJSON as 'com.esri.hadoop.hive.ST_GeomFromJson' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_GeomFromGeoJSON as 'com.esri.hadoop.hive.ST_GeomFromGeoJson' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_GeomFromShape as 'com.esri.hadoop.hive.ST_GeomFromShape' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_GeomFromText as 'com.esri.hadoop.hive.ST_GeomFromText' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_GeomFromWKB as 'com.esri.hadoop.hive.ST_GeomFromWKB' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_PointFromWKB as 'com.esri.hadoop.hive.ST_PointFromWKB' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_LineFromWKB as 'com.esri.hadoop.hive.ST_LineFromWKB' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_PolyFromWKB as 'com.esri.hadoop.hive.ST_PolyFromWKB' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_MPointFromWKB as 'com.esri.hadoop.hive.ST_MPointFromWKB' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_MLineFromWKB as 'com.esri.hadoop.hive.ST_MLineFromWKB' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_MPolyFromWKB as 'com.esri.hadoop.hive.ST_MPolyFromWKB' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_GeomCollection as 'com.esri.hadoop.hive.ST_GeomCollection' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_GeometryType as 'com.esri.hadoop.hive.ST_GeometryType' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_LineString as 'com.esri.hadoop.hive.ST_LineString' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_Polygon as 'com.esri.hadoop.hive.ST_Polygon' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_MultiPoint as 'com.esri.hadoop.hive.ST_MultiPoint' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_MultiLineString as 'com.esri.hadoop.hive.ST_MultiLineString' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_MultiPolygon as 'com.esri.hadoop.hive.ST_MultiPolygon' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_SetSRID as 'com.esri.hadoop.hive.ST_SetSRID' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_SRID as 'com.esri.hadoop.hive.ST_SRID' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_IsEmpty as 'com.esri.hadoop.hive.ST_IsEmpty' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_IsSimple as 'com.esri.hadoop.hive.ST_IsSimple' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_Dimension as 'com.esri.hadoop.hive.ST_Dimension' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_X as 'com.esri.hadoop.hive.ST_X' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_Y as 'com.esri.hadoop.hive.ST_Y' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_MinX as 'com.esri.hadoop.hive.ST_MinX' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_MaxX as 'com.esri.hadoop.hive.ST_MaxX' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_MinY as 'com.esri.hadoop.hive.ST_MinY' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_MaxY as 'com.esri.hadoop.hive.ST_MaxY' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_IsClosed as 'com.esri.hadoop.hive.ST_IsClosed' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_IsRing as 'com.esri.hadoop.hive.ST_IsRing' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_Length as 'com.esri.hadoop.hive.ST_Length' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_GeodesicLengthWGS84 as 'com.esri.hadoop.hive.ST_GeodesicLengthWGS84' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_Area as 'com.esri.hadoop.hive.ST_Area' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_Is3D as 'com.esri.hadoop.hive.ST_Is3D' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_Z as 'com.esri.hadoop.hive.ST_Z' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_MinZ as 'com.esri.hadoop.hive.ST_MinZ' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_MaxZ as 'com.esri.hadoop.hive.ST_MaxZ' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_IsMeasured as 'com.esri.hadoop.hive.ST_IsMeasured' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_M as 'com.esri.hadoop.hive.ST_M' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_MinM as 'com.esri.hadoop.hive.ST_MinM' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_MaxM as 'com.esri.hadoop.hive.ST_MaxM' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_CoordDim as 'com.esri.hadoop.hive.ST_CoordDim' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_NumPoints as 'com.esri.hadoop.hive.ST_NumPoints' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_PointN as 'com.esri.hadoop.hive.ST_PointN' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_StartPoint as 'com.esri.hadoop.hive.ST_StartPoint' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_EndPoint as 'com.esri.hadoop.hive.ST_EndPoint' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_ExteriorRing as 'com.esri.hadoop.hive.ST_ExteriorRing' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_NumInteriorRing as 'com.esri.hadoop.hive.ST_NumInteriorRing' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_InteriorRingN as 'com.esri.hadoop.hive.ST_InteriorRingN' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_NumGeometries as 'com.esri.hadoop.hive.ST_NumGeometries' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_GeometryN as 'com.esri.hadoop.hive.ST_GeometryN' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create function ST_Centroid as 'com.esri.hadoop.hive.ST_Centroid' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create  function ST_Contains as 'com.esri.hadoop.hive.ST_Contains' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create  function ST_Crosses as 'com.esri.hadoop.hive.ST_Crosses' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create  function ST_Disjoint as 'com.esri.hadoop.hive.ST_Disjoint' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create  function ST_EnvIntersects as 'com.esri.hadoop.hive.ST_EnvIntersects' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create  function ST_Envelope as 'com.esri.hadoop.hive.ST_Envelope' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create  function ST_Equals as 'com.esri.hadoop.hive.ST_Equals' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create  function ST_Overlaps as 'com.esri.hadoop.hive.ST_Overlaps' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create  function ST_Intersects as 'com.esri.hadoop.hive.ST_Intersects' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create  function ST_Relate as 'com.esri.hadoop.hive.ST_Relate' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create  function ST_Touches as 'com.esri.hadoop.hive.ST_Touches' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create  function ST_Within as 'com.esri.hadoop.hive.ST_Within' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create  function ST_Distance as 'com.esri.hadoop.hive.ST_Distance' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create  function ST_Boundary as 'com.esri.hadoop.hive.ST_Boundary' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create  function ST_Buffer as 'com.esri.hadoop.hive.ST_Buffer' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create  function ST_ConvexHull as 'com.esri.hadoop.hive.ST_ConvexHull' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create  function ST_Intersection as 'com.esri.hadoop.hive.ST_Intersection' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create  function ST_Union as 'com.esri.hadoop.hive.ST_Union' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create  function ST_Difference as 'com.esri.hadoop.hive.ST_Difference' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create  function ST_SymmetricDiff as 'com.esri.hadoop.hive.ST_SymmetricDiff' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create  function ST_SymDifference as 'com.esri.hadoop.hive.ST_SymmetricDiff' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create  function ST_Aggr_ConvexHull as 'com.esri.hadoop.hive.ST_Aggr_ConvexHull' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create  function ST_Aggr_Intersection as 'com.esri.hadoop.hive.ST_Aggr_Intersection' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create  function ST_Aggr_Union as 'com.esri.hadoop.hive.ST_Aggr_Union' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create  function ST_Bin as 'com.esri.hadoop.hive.ST_Bin' using jar 'hdfs:///iDatalight/jars/esri-geometry-api-2.2.2.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-hive-2.1.1.jar',jar 'hdfs:///iDatalight/jars/spatial-sdk-json-2.1.1.jar';
create  function ST_BinEnvelope as 'com.esri.hadoop.hive.ST_BinEnvelope' using jar 'hdfs:///iDatalight/ja
```




