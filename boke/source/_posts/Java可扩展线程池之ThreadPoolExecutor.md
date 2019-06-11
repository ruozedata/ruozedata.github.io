---
layout: post
title: "Java可扩展线程池之ThreadPoolExecutor"
date: 2018-06-13
comments: true
tags: 
	- java
categories: Java
---


#### 1、ThreadPoolExecutor
我们知道ThreadPoolExecutor是可扩展的,它提供了几个可以在子类中改写的空方法如下：
```
protected void beforeExecute(Thread t, Runnable r) { }
protected void beforeExecute(Thread t, Runnable r) { }  
protected void terminated() { }
```
<!--more--> 
#### 2、为什么要进行扩展？
因为在实际应用中，可以对线程池运行状态进行跟踪，输出一些有用的调试信息，以帮助故障诊断。
#### 3、ThreadPoolExecutor.Worker的run方法实现
通过看源码我们发现 ThreadPoolExecutor的工作线程其实就是Worker实例，Worker.runTask()会被线程池以多线程模式异步调用，则以上三个方法也将被多线程同时访问。
```
1// 基于jdk1.8.0_161final void runWorker(Worker w) {
 2         Thread wt = Thread.currentThread();
 3         Runnable task = w.firstTask;
 4         w.firstTask = null;
 5         w.unlock(); // allow interrupts
 6         boolean completedAbruptly = true;        
 7             try {            
 8             while (task != null || (task = getTask()) != null) {
 9                  w.lock();                
10              if ((runStateAtLeast(ctl.get(), STOP) ||
11                     (Thread.interrupted() &&
12                      runStateAtLeast(ctl.get(), STOP))) &&
13                    !wt.isInterrupted())
14                    wt.interrupt();               
15              try {
16                    beforeExecute(wt, task);
17                    Throwable thrown = null;                   
18              try {
19                        task.run();
20                    } catch (RuntimeException x) {
21                        thrown = x; throw x;
22                    } catch (Error x) {
23                        thrown = x; throw x;
24                    } catch (Throwable x) {
25                        thrown = x; throw new Error(x);
26                    } finally {
27                        afterExecute(task, thrown);
28                    }
29                } finally {
30                    task = null;
31                    w.completedTasks++;
32                    w.unlock();
33                }
34            }
35            completedAbruptly = false;
36        } finally {
37            processWorkerExit(w, completedAbruptly);
38        }
39    }
```
#### 4、扩展线程池实现
```
 1public class ExtThreadPool {
 2    public static class MyTask implements Runnable {
 3        public String name;        
 4        public MyTask(String name) {            
 5          this.name = name;
 6        }       
 7        public void run() {
 8            System.out.println("正在执行:Thread ID:" + Thread.currentThread().getId() + ",Task Name:" + name);            try {
 9                Thread.sleep(100);
10            } catch (InterruptedException e) {
11                e.printStackTrace();
12            }
13        }
14    }    
15public static void main(String args[]) throws InterruptedException {
16ExecutorService executorService = new ThreadPoolExecutor( 5,5,0L,
17TimeUnit.MILLISECONDS,new LinkedBlockingDeque<Runnable>()) {            
18protected void beforeExecute(Thread t, Runnable r) {
19 System.out.println("准备执行：" + ((MyTask) r).name);
20}            
21protected void afterExecute(Thread t, Runnable r) {
22  System.out.println("执行完成" + ((MyTask) r).name);
23}            
24protected void terminated() {
25  System.out.println("线程池退出！");
26}
27};        
28for (int i = 0; i < 5; i++) {
29 MyTask task = new MyTask("TASK--" + i);
30            executorService.execute(task);
31            Thread.sleep(10);
32        }
33 executorService.shutdown();
34    }
35}
```
输出结果如下：
```
准备执行：TASK–0 
正在执行:Thread ID:10,Task Name:TASK–0 
准备执行：TASK–1 
正在执行:Thread ID:11,Task Name:TASK–1 
准备执行：TASK–2 
正在执行:Thread ID:12,Task Name:TASK–2 
准备执行：TASK–3 
正在执行:Thread ID:13,Task Name:TASK–3 
准备执行：TASK–4 
正在执行:Thread ID:14,Task Name:TASK–4 
线程池退出！
```
这样就实现了在执行前后进行的一些控制，除此之外我们还可以输出每个线程的执行时间，或者一些其他增强操作。 
#### 5、思考？
请读者思考shutdownNow和shutdown方法的区别？
如何优雅的关闭线程池？
