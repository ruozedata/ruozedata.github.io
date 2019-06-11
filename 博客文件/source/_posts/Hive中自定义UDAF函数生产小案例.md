---
layout: post
title: "Hive中自定义UDAF函数生产小案例"
date: 2018-05-23
comments: true
tags: 
	- hive
categories:  Hive
---
#### 一、UDAF 回顾
- 1.定义：UDAF(User Defined Aggregation Funcation ) 用户自定义聚类方法，和group by联合使用，接受多个输入数据行，并产生一个输出数据行。
- 2.Hive有两种UDAF：简单和通用 
简单：利用抽象类UDAF和UDAFEvaluator，使用Java反射导致性能损失，且有些特性不能使用，如可变长度参数列表 。
通用：利用接口GenericUDAFResolver2（或抽象类AbstractGenericUDAFResolver）和抽象类GenericUDAFEvaluator，可以使用所有功能，但比较复杂，不直观。
- 3.一个计算函数必须实现的5个方法的具体含义如下：
init()：主要是负责初始化计算函数并且重设其内部状态，一般就是重设其内部字段。一般在静态类中定义一个内部字段来存放最终的结果。
iterate()：每一次对一个新值进行聚集计算时候都会调用该方法，计算函数会根据聚集计算结果更新内部状态。当输 入值合法或者正确计算了，则就返回true。
terminatePartial()：Hive需要部分聚集结果的时候会调用该方法，必须要返回一个封装了聚集计算当前状态的对象。
merge()：Hive进行合并一个部分聚集和另一个部分聚集的时候会调用该方法。
terminate()：Hive最终聚集结果的时候就会调用该方法。计算函数需要把状态作为一个值返回给用户。
#### 二、需求
使用UDAF简单方式实现统计区域产品用户访问排名
<!--more--> 
#### 三、自定义UDAF函数代码实现
```
package hive.org.ruozedata;
import java.util.*;
import org.apache.hadoop.hive.ql.exec.UDAF;
import org.apache.hadoop.hive.ql.exec.UDAFEvaluator;
import org.apache.log4j.Logger;
public class UserClickUDAF extends UDAF {
    // 日志对象初始化
    public static Logger logger = Logger.getLogger(UserClickUDAF.class);
    // 静态类实现UDAFEvaluator
    public static class Evaluator implements UDAFEvaluator {
        // 设置成员变量，存储每个统计范围内的总记录数
        private static Map<String, String> courseScoreMap;
        private static Map<String, String> city_info;
        private static Map<String, String> product_info;
        private static Map<String, String> user_click;
        //初始化函数,map和reduce均会执行该函数,起到初始化所需要的变量的作用
        public Evaluator() {
            init();
        }
        // 初始化函数间传递的中间变量
        public void init() {
            courseScoreMap = new HashMap<String, String>();
            city_info = new HashMap<String, String>();
            product_info = new HashMap<String, String>();
       }

        //map阶段，返回值为boolean类型，当为true则程序继续执行，当为false则程序退出
        public boolean iterate(String pcid, String pcname, String pccount) {
            if (pcid == null || pcname == null || pccount == null) {
                return true;
            }
            if (pccount.equals("-1")) {
                // 城市表
                city_info.put(pcid, pcname);
            }
            else if (pccount.equals("-2")) {
                // 产品表
                product_info.put(pcid, pcname);
            }
            else {
                // 处理用户点击关联
                unionCity_Prod_UserClic1(pcid, pcname, pccount);
           }
            return true;
        }

        // 处理用户点击关联
        private void unionCity_Prod_UserClic1(String pcid, String pcname, String pccount) {
            if (product_info.containsKey(pcid)) {
                if (city_info.containsKey(pcname)) {
                    String city_name = city_info.get(pcname);
                    String prod_name = product_info.get(pcid);
                    String cp_name = city_name + prod_name;
                    // 如果之前已经Put过Key值为区域信息，则把记录相加处理
                    if (courseScoreMap.containsKey(cp_name)) {
                        int pcrn = 0;
                        String strTemp = courseScoreMap.get(cp_name);
                        String courseScoreMap_pn 
                         = strTemp.substring(strTemp.lastIndexOf("\t".toString())).trim();
                        pcrn = Integer.parseInt(pccount) + Integer.parseInt(courseScoreMap_pn);
                        courseScoreMap.put(cp_name, city_name + "\t" + prod_name + "\t"+ Integer.toString(pcrn));
                    }
                    else {
                        courseScoreMap.put(cp_name, city_name + "\t" + prod_name + "\t"+ pccount);
                    }
                }
            }
        }

        /**
         * 类似于combiner,在map范围内做部分聚合，将结果传给merge函数中的形参mapOutput
         * 如果需要聚合，则对iterator返回的结果处理，否则直接返回iterator的结果即可
         */
        public Map<String, String> terminatePartial() {
            return courseScoreMap;
        }

        // reduce 阶段，用于逐个迭代处理map当中每个不同key对应的 terminatePartial的结果
        public boolean merge(Map<String, String> mapOutput) {
            this.courseScoreMap.putAll(mapOutput);
            return true;
        }
        // 处理merge计算完成后的结果，即对merge完成后的结果做最后的业务处理
        public String terminate() {
            return courseScoreMap.toString();
        }
    }
}
```
#### 四、创建hive中的临时函数
```
DROP TEMPORARY FUNCTION user_click;
add jar /data/hive_udf-1.0.jar;
CREATE TEMPORARY FUNCTION user_click AS 'hive.org.ruozedata.UserClickUDAF';
```
#### 五、调用自定义UDAF函数处理数据
```
insert overwrite directory '/works/tmp1' ROW FORMAT DELIMITED FIELDS TERMINATED BY '\t'
select regexp_replace(substring(rs, instr(rs, '=')+1), '}', '') from (
  select explode(split(user_click(pcid, pcname, type),',')) as rs from (
    select * from (
      select '-2' as type, product_id as pcid, product_name as pcname from product_info
      union all
      select '-1' as type, city_id as pcid,area as pcname from city_info
      union all
      select count(1) as type,
             product_id as pcid,
             city_id as pcname
        from user_click
       where action_time='2016-05-05'
      group by product_id,city_id
    ) a
  order by type) b
) c ;
```
#### 六、创建Hive临时外部表
```
create external table tmp1(
city_name string,
product_name string,
rn string
)
ROW FORMAT DELIMITED FIELDS TERMINATED BY '\t'
location '/works/tmp1';
```

#### 七、统计最终区域前3产品排名
```
select * from (
select city_name,
       product_name,
       floor(sum(rn)) visit_num,
       row_number()over(partition by city_name order by sum(rn) desc) rn,
       '2016-05-05' action_time
  from tmp1 
 group by city_name,product_name
) a where rn <=3 ;
```
#### 八、最终结果
![enter description here](/assets/blogImg/hive523.png)
