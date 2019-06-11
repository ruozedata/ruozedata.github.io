---
layout: post
title: "Apache Spark和DL/AI结合，谁与争锋? 期待Spark3.0的到来！"
date: 2018-06-22
comments: true
tags: 
	- 高级
	- spark
categories: Spark MLlib
---
![enter description here](/assets/blogImg/0622_1.png)
<!--more--> 

不知各位，是否关注社区的发展？关注Spark呢？

官网的Spark图标和解释语已经发生变化了。

然而在6-18号，社区提出Spark and DL/AI相结合，这无比再一次说明，Spark在大数据的地位是无法撼动的！期待Spark3.0的到来！



接下来对SPARK-24579的翻译:

在大数据和人工智能的十字路口，我们看到了Apache Spark作为一个统一的分析引擎以及AI框架如TensorFlow和Apache MXNet (正在孵化中)的兴起及这两大块的巨大成功 。 

大数据和人工智能都是推动企业创新的不可或缺的组成部分， 两个社区的多次尝试，使他们结合在一起。

我们看到AI社区的努力，为AI框架实现数据解决方案，如TF.DATA和TF.Tror。然而，50+个数据源和内置SQL、数据流和流特征，Spark仍然是对于大数据社区选择。

这就是为什么我们看到许多努力,将DL/AI框架与Spark结合起来，以利用它的力量，例如，Spark数据源TFRecords、TensorFlowOnSpark, TensorFrames等。作为项目Hydrogen的一部分，这个SPIP将Spark+AI从不同的角度统一起来。

没有在Spark和外部DL/AI框架之间交换数据，这些集成都是不可能的,也有性能问题。然而，目前还没有一种标准的方式来交换数据，因此实现和性能优化就陷入了困境。例如，在Python中，TensorFlowOnSpark使用Hadoop InputFormat/OutputFormat作为TensorFlow的TFRecords，来加载和保存数据，并将RDD数据传递给TensorFlow。TensorFrames使用TensorFlow的Java API，转换为 Spark DataFrames Rows to/from TensorFlow Tensors 。我们怎样才能降低复杂性呢?

这里的建议是标准化Spark和DL/AI框架之间的数据交换接口(或格式)，并优化从/到这个接口的数据转换。因此，DL/AI框架可以利用Spark从任何地方加载数据，而无需花费额外的精力构建复杂的数据解决方案，比如从生产数据仓库读取特性或流模型推断。Spark用户可以使用DL/AI框架，而无需学习那里实现的特定数据api。而且双方的开发人员都可以独立地进行性能优化，因为接口本身不会带来很大的开销。

ISSUE:  https://issues.apache.org/jira/browse/SPARK-24579
若泽数据，星星本人水平有限，翻译多多包涵。

对了忘记说了，本ISSUE有个PDF文档，赶快去下载吧。
https://issues.apache.org/jira/secure/attachment/12928222/%5BSPARK-24579%5D%20SPIP_%20Standardize%20Optimized%20Data%20Exchange%20between%20Apache%20Spark%20and%20DL%252FAI%20Frameworks%20.pdf
