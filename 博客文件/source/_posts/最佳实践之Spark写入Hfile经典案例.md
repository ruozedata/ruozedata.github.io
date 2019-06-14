---
layout: post
title: "最佳实践之Spark写入Hfile经典案例"
date: 2019-03-01
comments: true
tags: [Spark,Hfile,高级]
categories: [Spark Other]
---

<font size="5" color="blue"><b>本文由小伙伴提供</b></font>

将HDFS上的数据解析出来，然后通过hfile方式批量写入Hbase(需要多列写入) 写⼊数据的关键api:
<!--more--> 
```
saveAsNewAPIHadoopFile(
        stagingFolder,
        classOf[ImmutableBytesWritable],
        classOf[KeyValue],
        classOf[HFileOutputFormat2],
        job.getConfiguration)
```

<font size="4" color="red"><b>特殊地方：</b></font>

1. **最初写hfile警告**

	```
	Does it contain files in subdirectories that correspond to column family names
	```
	
	这个原因大概三种
	
	* 代码问题
	* 数据源问题
	* setMapOutputKeyClass 和 saveAsNewAPIHadoopFile中的Class不不⼀一致

	这里是我的是数据源问题


2. **正常写put操作的时候，服务端自动帮助排序，因此在使用put操作的时候没有涉及到这样的错误**

	```
	Added a key not lexically larger than previous
	```
	
	但是在写hfile的时候如果出现报错:
	
	```
	Added a key not lexically larger than previous
	```
	
	这样的错误，一般会认为rowkey没有做好排序，然后傻fufu的去验证了一下，rowkey的确做了排序。
	
	真正原因:
	
	`spark写hfile时候是按照rowkey+列族+列名进⾏行排序的，因此在写⼊数据的时候，要做到整体有序 (事情还没完)`
	
3. **因为需要多列写入，最好的⽅式:要么反射来动态获取列名称和列值 、 要么通过datafame去获取(df.columns)**	
	反射方式：
	
	```
	val listData: RDD[(ImmutableBytesWritable, ListBuffer[KeyValue])] = rdd.map
	{
	        line =>
	          val rowkey = line.vintime
	          val clazz = Class.forName(XXXXXXXXXXXXXXXX)
	          val fields = clazz.getDeclaredFields
	          var list = new ListBuffer[String]()
	          var kvlist = new ListBuffer[KeyValue]()//
	          if (fields != null && fields.size > 0) {
	            for (field <- fields) {
	              field.setAccessible(true)
	              val column = field.getName
	              list.append(column)
	} }
	          val newList = list.sortWith(_ < _)
	          val ik = new ImmutableBytesWritable(Bytes.toBytes(rowkey))
	          for(column <- newList){
	            val declaredField: Field =
	line.getClass.getDeclaredField(column)
	}
	  declaredField.setAccessible(true)
	  val value = declaredField.get(line).toString
	  val kv: KeyValue = new KeyValue(
	    Bytes.toBytes(rowkey),
	    Bytes.toBytes(columnFamily),
	    Bytes.toBytes(column),
	    Bytes.toBytes(value))
	  kvlist.append(kv)
	}
	(ik, kvlist)
	}
	```
	
	datafame的方式:
	
	```
	val tmpData: RDD[(ImmutableBytesWritable, util.LinkedList[KeyValue])] =
	df.rdd.map(
	      line =>{
	        val rowkey = line.getAs[String]("vintime")
	        val ik = new ImmutableBytesWritable(Bytes.toBytes(rowkey))
	        var linkedList = new util.LinkedList[KeyValue]()
	        for (column <- columns) {
	        val kv: KeyValue = new KeyValue(
	            Bytes.toBytes(rowkey),
	            Bytes.toBytes(columnFamily),
	            Bytes.toBytes(column),
	            Bytes.toBytes(line.getAs[String](column)))
	          linkedList.add(kv)
	        }
	        (ik, linkedList)
	      })
	    val result: RDD[(ImmutableBytesWritable, KeyValue)] =
	tmpData.flatMapValues(
	      s => {
	        val values: Iterator[KeyValue] =
	JavaConverters.asScalaIteratorConverter(s.iterator()).asScala
	        values
	      }
	    ).sortBy(x =>x._1 , true)
	```
	
	仔细观察可以发现，其实两者都做了排序操作，但是即便经过(1)步骤后仍然报错:
	
	```
	Added a key not lexically larger than previous
	```
	
	那么再回想⼀下之前写hfile的要求:
	
	rowkey+列族+列都要有序，那么如果出现数据的重复，也不算是有序的操作! 因为，做一下数据的去重:
	
	```
	val key: RDD[(String, TransferTime)] = data.reduceByKey((x, y) => y)
	val unitData: RDD[TransferTime] = key.map(line => line._2)
	```
	
	果然，这样解决了:Added a key not lexically larger than previous这个异常 但是会报如下另⼀个异常:
	
	```
	Kryo serialization failed: Buffer overflow
	```
	
	这个是因为在对⼀些类做kryo序列化时候，数据量的缓存⼤小超过了默认值，做⼀下调整即可
	
	```
	sparkConf.set("spark.kryoserializer.buffer.max" , "256m")
	sparkConf.set("spark.kryoserializer.buffer" , "64m")
	```
	
<font size="5"><b>完整代码</b></font>	

```
object WriteTransferTime extends WriteToHbase{
  /**
* @param data 要插⼊入的数据 * @param tableName 表名
**/
  override def bulkLoadData(data: RDD[Any], tableName: String ,
columnFamily:String): Unit = {
    val bean: RDD[TransferTime] = data.map(line =>
line.asInstanceOf[TransferTime])
    val map: RDD[(String, TransferTime)] = bean.map(line => (line.vintime ,
line))
    val key: RDD[(String, TransferTime)] = map.reduceByKey((x, y) => y)
    val map1: RDD[TransferTime] = key.map(line => line._2)
    val by1: RDD[TransferTime] = map1.sortBy(f => f.vintime)
    val listData: RDD[(ImmutableBytesWritable, ListBuffer[KeyValue])] =
by1.map {
      line =>
        val rowkey = line.vintime
        val clazz =
Class.forName("com.dongfeng.code.Bean.message.TransferTime")
        val fields = clazz.getDeclaredFields
        var list = new ListBuffer[String]()
        var kvlist = new ListBuffer[KeyValue]()//
        if (fields != null && fields.size > 0) {
          for (field <- fields) {
            field.setAccessible(true)
            val column = field.getName
            list.append(column)
} }
        val newList = list.sortWith(_ < _)
        val ik = new ImmutableBytesWritable(Bytes.toBytes(rowkey))
        for(column <- newList){
          val declaredField: Field = line.getClass.getDeclaredField(column)
          declaredField.setAccessible(true)
          val value = declaredField.get(line).toString
          val kv: KeyValue = new KeyValue(
            Bytes.toBytes(rowkey),
            Bytes.toBytes(columnFamily),
            Bytes.toBytes(column),
            Bytes.toBytes(value))
          kvlist.append(kv)
        }
        (ik, kvlist)
    }
 
       val result: RDD[(ImmutableBytesWritable, KeyValue)] =
listData.flatMapValues(
      s => {
        val values: Iterator[KeyValue] = s.iterator
        values
} )
    val resultDD: RDD[(ImmutableBytesWritable, KeyValue)] = result.sortBy(x
=>x._1 , true)
    WriteToHbaseDB.hfile_load(result , TableName.valueOf(tableName) ,
columnFamily)
} }
    def hfile_load(rdd:RDD[(ImmutableBytesWritable , KeyValue)] , tableName:
TableName , columnFamily:String): Unit ={
//声明表的信息
var table: Table = null try{
val startTime = System.currentTimeMillis() println(s"开始时间:-------->${startTime}") //⽣生成的HFile的临时保存路路径
val stagingFolder = "hdfs://cdh1:9000/hfile/"+tableName+new
Date().getTime//
table = connection.getTable(tableName) //如果表不不存在，则创建表 if(!admin.tableExists(tableName)){
        createTable(tableName , columnFamily)
      }
//开始导⼊
val job = Job.getInstance(config) job.setJobName("DumpFile") job.setMapOutputKeyClass(classOf[ImmutableBytesWritable]) job.setMapOutputValueClass(classOf[KeyValue])
      rdd.sortBy(x => x._1, true).saveAsNewAPIHadoopFile(
        stagingFolder,
        classOf[ImmutableBytesWritable],
        classOf[KeyValue],
        classOf[HFileOutputFormat2],
        job.getConfiguration)
      val load = new LoadIncrementalHFiles(config)
      val regionLocator = connection.getRegionLocator(tableName)

 
HFileOutputFormat2.configureIncrementalLoad(job, table,
regionLocator)
      load.doBulkLoad(new Path(stagingFolder), table.asInstanceOf[HTable])
//      load.doBulkLoad(new Path(stagingFolder) , connection.getAdmin ,
table , regionLocator)
val endTime = System.currentTimeMillis() println(s"结束时间:-------->${endTime}") println(s"花费的时间:----------------->${(endTime - startTime)}ms")
    }catch{
      case e:IOException =>
        e.printStackTrace()
    }finally {
      if (table != null) {
        try {
// 关闭HTable对象 table.close(); } catch {
          case e: IOException =>
            e.printStackTrace();
} }
if (connection != null) { try { //关闭hbase连接. connection.close();
        } catch {
          case e: IOException =>
            e.printStackTrace();
        }
} }
} }
```