// build time:Tue Jul 09 2019 13:48:30 GMT+0800 (GMT+08:00)
(function(){var e,t,n;e=function(e){this.points=0;return this.name=e};e.prototype.play=function(){this.points++;return t.played()};n={element:document.getElementById("results"),update:function(e){var t,n,r,s;r="";for(n in e){s=e[n];if(e.hasOwnProperty(n)){r=r+("<span><strong>"+n+"</strong>:"+s+"</span>")}}this.element.innerHTML=r;t=e.Home-e.Guest;if(t>15){alert("Home Win!");return location.reload()}else if(t