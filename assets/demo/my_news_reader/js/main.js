// build time:Fri Jun 14 2019 14:07:38 GMT+0800 (GMT+08:00)
function H$(t){return document.getElementById(t)}function H$$(t,e){if(e)return e.getElementsByTagName(t);else return document.getElementsByTagName(t)}var tagElems=[];(function(){function t(t,e){var o=[];typeof e=="undefined"&&(e=t,t=0);for(;t<e;t++)o.push(t);return o}array.prototype.randomeach="function(e){if(typeof" e!="function" )throw new typeerror;var o="this.length,r=t(o);while(o){var" n="Math.floor(Math.random()*o--);if(e(this[r[n]])===!1)break;r[n]=r[o]}},Array.prototype.forEach||(Array.prototype.forEach=function(t){var" e="this.length;if(typeof" t!="function" r="0;r<e;r++)r" in this&&t.call(o,this[r],r,this)})})();function _shadowclone(t){var t)t.hasownproperty(o)&&(e[o]="t[o]);return" e}function attrstyle(t,e){if(t.style[e]){return t.style[e]}else if(t.currentstyle){return t.currentstyle[e]}else if(document.defaultview&&document.defaultview.getcomputedstyle){e="e.replace(/([A-Z])/g," -$1").tolowercase();return" document.defaultview.getcomputedstyle(t,null).getpropertyvalue(e)}else{return null}}function autoloader(t,e){if(typeof typeerror;this._generator="t;this._timeout=e;this._context=arguments[2];this._pool=[]}AutoLoader.prototype._load=function(){var" t="this;clearTimeout(this._loading);this._loading=setTimeout(function(){t._pool.push(t._generator.apply(t._context))},this._timeout)};AutoLoader.prototype.get=function(){var" t;cleartimeout(this._loading);this._pool.length>0?t=this._pool.pop():t=this._generator.apply(this._context);return t};function _cutGrid(t,e){function o(o){function u(o){var l,f=_shadowClone(o);h++,l=h===c?t[n.measure]-i:Math.floor(o[n.measure]*t[n.measure]/100),f[r.offset]=a+t[r.offset],f[n.offset]=i+t[n.offset],f[r.measure]=s,f[n.measure]=l,f.colorPattern=t.colorPattern,e(f),i+=l}var s,c=o[n.name].length,h=0;f++,s=f===l?t[r.measure]-a:Math.floor(o[r.measure]*t[r.measure]/100),o.random===!1?o[n.name].forEach(u):o[n.name].randomEach(u),i=0,a+=s}var r,n;t.rows?(r={name:"rows",measure:"height",offset:"top"},n={name:"cols",measure:"width",offset:"left"}):(r={name:"cols",measure:"width",offset:"left"},n={name:"rows",measure:"height",offset:"top"});var a=0,i=0,l=t[r.name].length,f=0;t.random===!1?t[r.name].forEach(o):t[r.name].randomEach(o)}function _getGrids(t){var e=[],o=0,r=.18,n=t.colorPatterns[0];_cutGrid(t.pageLayout,function(t){t.colorPattern||(t.colorPattern=n[o++]);if(t.rows||t.cols){_cutGrid(t,arguments.callee)}else{var a=t.colorPattern,i=a.backgrounds,l=i.length,f=a.fontColor;t.fontSize=Math.floor(Math.sqrt(t.width*t.height)*r);t.backgroundColor=i[Math.floor(Math.random()*l)];t.fontColor=f;e.push(t)}});return e}var myReader=function(){function t(t){this.dom=H$(t.domId);this.len=t.len;this.block=t.block;this.fillStage(H$("container"));this.clickEve()}t.prototype={clickEve:function(){var t=this;var e=H$$("button");e[0].onclick=function(){H$("container").innerHTML="";t.fillStage(H$("container"))}},reflowTagElem:function(t,e,o,r){t.style.top=e.top*r+"px";t.style.left=e.left*o+"px";t.style.width=e.width*o-2+"px";t.style.height=e.height*r-2+"px";t.style.fontSize=e.fontSize*o+"px";t.style.color=e.fontColor;t.style.backgroundColor=e.backgroundColor;t.order=e.width*o*e.height*r},fillStage:function(t){var e=this;var o=_getGrids(window.tagConfig);o.forEach(function(o){var r=document.createElement("div");r.className="tag";e.reflowTagElem(r,o,6,4);t.appendChild(r);tagElems.push(r)})}};return t}();var myData={domId:"container"};new myReader(myData);
//rebuild by neat </e;t++)o.push(t);return>