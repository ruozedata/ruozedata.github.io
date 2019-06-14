---
layout: post
title: "Elasticsearch常用操作解析"
date: 2019-05-13
comments: true
tags: 
    - Elasticsearch
categories: Elasticsearch
---

<!--more--> 

### 创建Maven管理的Java项目

在pom.xml中添加依赖：

```
<es.version>6.1.1</es.version>
 
<dependency>
    <groupId>org.elasticsearch.client</groupId>
    <artifactId>transport</artifactId>
    <version>${es.version}</version>
</dependency>
```

然后创建一个单元测试类ESApp：

```
private TransportClient client;
 
    @Before
    public void setUp() throws Exception {
        Settings settings = Settings.builder()
                .put("cluster.name", "mycluster")
                .put("client.transport.sniff", "true")//增加自动嗅探配置
                .build();
 
        client = new PreBuiltTransportClient(settings);
        client.addTransportAddress(new TransportAddress(InetAddress.getByName("10.8.24.94"), 9300));
 
        System.out.println(client.toString());
    }
```

运行后报错

```
java.lang.NoClassDefFoundError: com/fasterxml/jackson/core/JsonFactory
```

```
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-core</artifactId>
    <version>2.9.3</version>
</dependency>
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.9.3</version>
</dependency>
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-annotations</artifactId>
    <version>2.9.3</version>
</dependency>
```

运行后成功拿到ES的client：

![enter description here](/assets/blogImg/es.png)

### 创建一个Index

```

@Test
    public void createIndex() {
        client.admin().indices().prepareCreate(INDEX).get();
        System.out.println("创建Index成功");
    }
```

### 删除一个Index

```
@Test
    public void deleteIndex() {
        client.admin().indices().prepareDelete(INDEX).get();
        System.out.println("删除Index成功");
    }
```

### 放入数据的三种方式

```
//不推荐使用，太繁琐拼json格式
 @Test
    public void createDoc() {
        String json = "{\"name\":\"若泽数据\"}";
 
        IndexResponse response = client.prepareIndex(INDEX, TYPE, "100")
                .setSource(json, XContentType.JSON)
                .get();
    }
 
    //推荐使用
    @Test
    public void test01() throws Exception {
        Map<String, Object> json = new HashMap<String, Object>();
        json.put("name", "ruozedata");
        json.put("message", "trying out Elasticsearch");
 
        IndexResponse response = client.prepareIndex(INDEX, TYPE, "101").setSource(json).get();
        System.out.println(response.getVersion());
    }
 
//推荐使用
    @Test
    public void test02() throws Exception {
 
        XContentBuilder builder = jsonBuilder()
                .startObject()
                .field("user", "ruoze")
                .field("postDate", new Date())
                .field("message", "trying out Elasticsearch")
                .endObject();
 
        IndexResponse response = client.prepareIndex(INDEX, TYPE, "102").setSource(builder).get();
        System.out.println(response.getVersion());
    }
```

### 拿到一条数据

```

@Test
    public void getDoc() {
        GetResponse response = client.prepareGet(INDEX, TYPE, "100").get();
        System.out.println(response.getSourceAsString());
    }
```

### 拿到多条数据

```
@Test
    public void getDocsByIds() {
 
        MultiGetResponse responses = client.prepareMultiGet()
                .add(INDEX, TYPE,"100")
                .add(INDEX, TYPE, "101", "102", "1000")
                .get();
 
        for (MultiGetItemResponse response : responses) {
            GetResponse res = response.getResponse();
            if (res.isExists()) {
                System.out.println(res);
            } else {
                System.out.println("没有这条数据");
            }
 
        }
    }
```