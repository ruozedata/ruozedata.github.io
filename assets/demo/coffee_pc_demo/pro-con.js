// build time:Sat Jun 08 2019 20:32:41 GMT+0800 (GMT+08:00)
(function(){var t,e,r,a;t=10;r=function(t,e){if(t==null){t=4}if(e==null){e=6}return t+e};e=function(){function e(){}e.prototype.data={mutex:1,empty:t,full:0,front:0,rear:0,buf:[]};e.prototype.init=function(){var e,r,a=this;e=0;while(e<t){r=$('<div class="bufBox"><div class="bufCover">'+e+"</div>"+e+"");$("#buf").append(r);this.data.buf.push("e");e++}$("#produce").click(function(){return a.producer()});return $("#consume").click(function(){return a.consumer()})};e.prototype.p=function(t){return--t};e.prototype.v=function(t){return++t};e.prototype.produceItem=function(){$('<p class="desPro">生产了产品</p>').insertBefore($("#des p:first"));return"m"};e.prototype.consumeItem=function(){return $('<p class="desCon">消费了产品</p>').insertBefore($("#des p:first"))};e.prototype.enterItem=function(e){var r;this.data.front=(this.data.front+1)%t;this.data.buf[this.data.front]=e;r="存入产品"+this.data.buf[this.data.front]+"到缓冲区"+this.data.front;$("<p class="desPro">"+r+"</p>").insertBefore($("#des p:first"));return $($(".bufCover")[this.data.front]).animate({height:"50px"})};e.prototype.removeItem=function(){var e;this.data.rear=(this.data.rear+1)%t;this.data.buf[this.data.rear]="e";e="取出产品"+this.data.buf[this.data.rear]+"从缓冲区"+this.data.rear;$("<p class="desCon">"+e+"</p>").insertBefore($("#des p:first"));return $($(".bufCover")[this.data.rear]).animate({height:"0px"})};e.prototype.producer=function(){var e;if(this.data.full===t){$("<p class="desSpe">缓冲区已全满</p>").insertBefore($("#des p:first"));return}e=this.produceItem();this.data.empty=this.p(this.data.empty);this.data.mutex=this.p(this.data.mutex);this.enterItem(e);this.data.mutex=this.v(this.data.mutex);return this.data.full=this.v(this.data.full)};e.prototype.consumer=function(){if(this.data.empty===t){$("<p class="desSpe">缓冲区已空</p>").insertBefore($("#des p:first"));return}this.data.full=this.p(this.data.full);this.data.mutex=this.p(this.data.mutex);this.removeItem();this.data.mutex=this.v(this.data.mutex);this.data.empty=this.v(this.data.empty);return this.consumeItem()};return e}();a=new e;a.init()}).call(this);
//rebuild by neat </t){r=$('<div>