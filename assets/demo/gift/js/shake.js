// build time:Tue Jun 11 2019 15:08:42 GMT+0800 (GMT+08:00)
(function(t,e){function s(){this.hasDeviceMotion="ondevicemotion"in t;this.threshold=15;this.lastTime=new Date;this.lastX=null;this.lastY=null;this.lastZ=null;if(typeof e.CustomEvent==="function"){this.event=new e.CustomEvent("shake",{bubbles:true,cancelable:true})}else if(typeof e.createEvent==="function"){this.event=e.createEvent("Event");this.event.initEvent("shake",true,true)}else{return false}}s.prototype.reset=function(){this.lastTime=new Date;this.lastX=null;this.lastY=null;this.lastZ=null};s.prototype.start=function(){this.reset();if(this.hasDeviceMotion){t.addEventListener("devicemotion",this,false)}};s.prototype.stop=function(){if(this.hasDeviceMotion){t.removeEventListener("devicemotion",this,false)}this.reset()};s.prototype.devicemotion=function(e){var s=e.accelerationIncludingGravity,i,n,h=0,l=0,a=0;if(this.lastX===null&&this.lastY===null&&this.lastZ===null){this.lastX=s.x;this.lastY=s.y;this.lastZ=s.z;return}h=Math.abs(this.lastX-s.x);l=Math.abs(this.lastY-s.y);a=Math.abs(this.lastZ-s.z);if(h>this.threshold&&l>this.threshold||h>this.threshold&&a>this.threshold||l>this.threshold&&a>this.threshold){i=new Date;n=i.getTime()-this.lastTime.getTime();if(n>1e3){t.dispatchEvent(this.event);this.lastTime=new Date}}this.lastX=s.x;this.lastY=s.y;this.lastZ=s.z};s.prototype.handleEvent=function(t){if(typeof this[t.type]==="function"){return this[t.type](t)}};var i=new s;i&&i.start()})(window,document);
//rebuild by neat 