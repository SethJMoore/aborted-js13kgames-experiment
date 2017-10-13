(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){const flyd=require("flyd");const snabbdom=require("snabbdom");const h=require("snabbdom/h").default;const patch=snabbdom.init([require("snabbdom/modules/attributes").default]);function componentOne(state){state({player:{location:{x:0,y:0},destination:{x:0,y:0}},puppy:{location:{x:0,y:0},destination:{x:0,y:0}},npcs:[]});function randomFieldLocation(){return{x:Math.round(Math.random()*document.getElementById("field").clientWidth),y:Math.round(Math.random()*document.getElementById("field").clientHeight)}}const clicks=flyd.stream();const clickActions=flyd.map(evnt=>({action:"CHANGE_DEST",destination:{x:evnt.pageX,y:evnt.pageY}}),clicks);const updateActions=flyd.stream();const actions=flyd.merge(updateActions,clickActions);function updateState(oldState,action){if(oldState.win){return oldState}let newState=oldState;switch(action.action){case"SETUP":newState.puppy.location=newState.puppy.destination=randomFieldLocation();newState.npcs=(()=>{let a=[];while(Math.random()<.95){let npc={location:randomFieldLocation(),destination:randomFieldLocation()};a.push(npc)}return a})();break;case"CHANGE_DEST":newState.player.destination=action.destination;break;case"UPDATE":newState.player.location=moveToward(oldState.player.location,oldState.player.destination);newState.puppy.location=moveToward(oldState.puppy.location,oldState.puppy.destination);newState.npcs=oldState.npcs.map(el=>{let newLoc=moveToward(el.location,el.destination);if(Math.abs(newLoc.x-newState.puppy.location.x)<10&&Math.abs(newLoc.y-newState.puppy.location.y)<10){newState.puppy.destination=el.metPlayer||oldState.puppy.destination}return{location:newLoc,destination:newLoc.x===el.destination.x&&newLoc.y===el.destination.y?randomFieldLocation():el.destination,metPlayer:el.metPlayer?el.metPlayer:Math.abs(newLoc.x-newState.player.location.x)<10&&Math.abs(newLoc.y-newState.player.location.y)<10?newState.player.location:undefined}});if(Math.abs(newState.player.location.x-newState.puppy.location.x)<5&&Math.abs(newState.player.location.y-newState.puppy.location.y)<5){newState.win=true}break;default:newState=oldState}return newState}function moveToward(loc,dest){let xDirection=dest.x-loc.x;let yDirection=dest.y-loc.y;return{x:xDirection===0?loc.x:xDirection>0?loc.x+1:loc.x-1,y:yDirection===0?loc.y:yDirection>0?loc.y+1:loc.y-1}}flyd.on(action=>state(updateState(state(),action)),actions);const vdom=flyd.map(newState=>createVDom(newState),state);function createVDom(localState){return h("div#field.field",{attrs:{style:"height:"+window.innerHeight+"px;"}},[localState.win?h("h1","You won!!!"):h("svg",{attrs:{width:"100%",height:"100%"}},[createSVGWithClass(localState.player.location,"player"),createSVGWithClass(localState.puppy.location,"puppy")].concat(localState.npcs.map(npc=>createSVGWithClass(npc.location,"npc"+(npc.metPlayer?" met":"")))))])}function createSVGWithClass(location,className){return h("circle",{attrs:{class:className,cx:location.x,cy:location.y}})}const setup=()=>{actions({action:"SETUP"});document.body.addEventListener("click",clicks);setInterval(()=>updateActions({action:"UPDATE"}),20)};return{DOM:vdom,setup:setup}}document.addEventListener("DOMContentLoaded",function(){const state=flyd.stream({entry:flyd.stream()});const entry=componentOne(state().entry);const vdoms=flyd.scan((acc,newVDOM)=>[acc[1],newVDOM],[null,document.getElementById("app")],entry.DOM);flyd.on(([oldV,newV])=>patch(oldV,newV),vdoms);entry.setup()})},{flyd:2,snabbdom:13,"snabbdom/h":9,"snabbdom/modules/attributes":12}],2:[function(require,module,exports){"use strict";var curryN=require("ramda/src/curryN");function isFunction(obj){return!!(obj&&obj.constructor&&obj.call&&obj.apply)}function trueFn(){return true}var toUpdate=[];var inStream;var order=[];var orderNextIdx=-1;var flushing=false;var flyd={};flyd.stream=function(initialValue){var endStream=createDependentStream([],trueFn);var s=createStream();s.end=endStream;s.fnArgs=[];endStream.listeners.push(s);s.toJSON=function(){return s()};if(arguments.length>0)s(initialValue);return s};flyd.combine=curryN(2,combine);function combine(fn,streams){var i,s,deps,depEndStreams;var endStream=createDependentStream([],trueFn);deps=[];depEndStreams=[];for(i=0;i<streams.length;++i){if(streams[i]!==undefined){deps.push(streams[i]);if(streams[i].end!==undefined)depEndStreams.push(streams[i].end)}}s=createDependentStream(deps,fn);s.depsChanged=[];s.fnArgs=s.deps.concat([s,s.depsChanged]);s.end=endStream;endStream.listeners.push(s);addListeners(depEndStreams,endStream);endStream.deps=depEndStreams;updateStream(s);return s}flyd.isStream=function(stream){return isFunction(stream)&&"hasVal"in stream};flyd.immediate=function(s){if(s.depsMet===false){s.depsMet=true;updateStream(s)}return s};flyd.endsOn=function(endS,s){detachDeps(s.end);endS.listeners.push(s.end);s.end.deps.push(endS);return s};flyd.map=curryN(2,function(f,s){return combine(function(s,self){self(f(s.val))},[s])});flyd.on=curryN(2,function(f,s){return combine(function(s){f(s.val)},[s])});flyd.scan=curryN(3,function(f,acc,s){var ns=combine(function(s,self){self(acc=f(acc,s.val))},[s]);if(!ns.hasVal)ns(acc);return ns});flyd.merge=curryN(2,function(s1,s2){var s=flyd.immediate(combine(function(s1,s2,self,changed){if(changed[0]){self(changed[0]())}else if(s1.hasVal){self(s1.val)}else if(s2.hasVal){self(s2.val)}},[s1,s2]));flyd.endsOn(combine(function(){return true},[s1.end,s2.end]),s);return s});flyd.transduce=curryN(2,function(xform,source){xform=xform(new StreamTransformer);return combine(function(source,self){var res=xform["@@transducer/step"](undefined,source.val);if(res&&res["@@transducer/reduced"]===true){self.end(true);return res["@@transducer/value"]}else{return res}},[source])});flyd.curryN=curryN;function boundMap(f){return flyd.map(f,this)}function ap(s2){var s1=this;return combine(function(s1,s2,self){self(s1.val(s2.val))},[s1,s2])}function streamToString(){return"stream("+this.val+")"}function createStream(){function s(n){if(arguments.length===0)return s.val;updateStreamValue(s,n);return s}s.hasVal=false;s.val=undefined;s.vals=[];s.listeners=[];s.queued=false;s.end=undefined;s.map=boundMap;s.ap=ap;s.of=flyd.stream;s.toString=streamToString;return s}function createDependentStream(deps,fn){var s=createStream();s.fn=fn;s.deps=deps;s.depsMet=false;s.depsChanged=deps.length>0?[]:undefined;s.shouldUpdate=false;addListeners(deps,s);return s}function initialDepsNotMet(stream){stream.depsMet=stream.deps.every(function(s){return s.hasVal});return!stream.depsMet}function updateStream(s){if(s.depsMet!==true&&initialDepsNotMet(s)||s.end!==undefined&&s.end.val===true)return;if(inStream!==undefined){toUpdate.push(s);return}inStream=s;if(s.depsChanged)s.fnArgs[s.fnArgs.length-1]=s.depsChanged;var returnVal=s.fn.apply(s.fn,s.fnArgs);if(returnVal!==undefined){s(returnVal)}inStream=undefined;if(s.depsChanged!==undefined)s.depsChanged=[];s.shouldUpdate=false;if(flushing===false)flushUpdate()}function updateDeps(s){var i,o,list;var listeners=s.listeners;for(i=0;i<listeners.length;++i){list=listeners[i];if(list.end===s){endStream(list)}else{if(list.depsChanged!==undefined)list.depsChanged.push(s);list.shouldUpdate=true;findDeps(list)}}for(;orderNextIdx>=0;--orderNextIdx){o=order[orderNextIdx];if(o.shouldUpdate===true)updateStream(o);o.queued=false}}function findDeps(s){var i;var listeners=s.listeners;if(s.queued===false){s.queued=true;for(i=0;i<listeners.length;++i){findDeps(listeners[i])}order[++orderNextIdx]=s}}function flushUpdate(){flushing=true;while(toUpdate.length>0){var s=toUpdate.shift();if(s.vals.length>0)s.val=s.vals.shift();updateDeps(s)}flushing=false}function updateStreamValue(s,n){if(n!==undefined&&n!==null&&isFunction(n.then)){n.then(s);return}s.val=n;s.hasVal=true;if(inStream===undefined){flushing=true;updateDeps(s);if(toUpdate.length>0)flushUpdate();else flushing=false}else if(inStream===s){markListeners(s,s.listeners)}else{s.vals.push(n);toUpdate.push(s)}}function markListeners(s,lists){var i,list;for(i=0;i<lists.length;++i){list=lists[i];if(list.end!==s){if(list.depsChanged!==undefined){list.depsChanged.push(s)}list.shouldUpdate=true}else{endStream(list)}}}function addListeners(deps,s){for(var i=0;i<deps.length;++i){deps[i].listeners.push(s)}}function removeListener(s,listeners){var idx=listeners.indexOf(s);listeners[idx]=listeners[listeners.length-1];listeners.length--}function detachDeps(s){for(var i=0;i<s.deps.length;++i){removeListener(s,s.deps[i].listeners)}s.deps.length=0}function endStream(s){if(s.deps!==undefined)detachDeps(s);if(s.end!==undefined)detachDeps(s.end)}function StreamTransformer(){}StreamTransformer.prototype["@@transducer/init"]=function(){};StreamTransformer.prototype["@@transducer/result"]=function(){};StreamTransformer.prototype["@@transducer/step"]=function(s,v){return v};module.exports=flyd},{"ramda/src/curryN":3}],3:[function(require,module,exports){var _arity=require("./internal/_arity");var _curry1=require("./internal/_curry1");var _curry2=require("./internal/_curry2");var _curryN=require("./internal/_curryN");module.exports=_curry2(function curryN(length,fn){if(length===1){return _curry1(fn)}return _arity(length,_curryN(length,[],fn))})},{"./internal/_arity":4,"./internal/_curry1":5,"./internal/_curry2":6,"./internal/_curryN":7}],4:[function(require,module,exports){module.exports=function _arity(n,fn){switch(n){case 0:return function(){return fn.apply(this,arguments)};case 1:return function(a0){return fn.apply(this,arguments)};case 2:return function(a0,a1){return fn.apply(this,arguments)};case 3:return function(a0,a1,a2){return fn.apply(this,arguments)};case 4:return function(a0,a1,a2,a3){return fn.apply(this,arguments)};case 5:return function(a0,a1,a2,a3,a4){return fn.apply(this,arguments)};case 6:return function(a0,a1,a2,a3,a4,a5){return fn.apply(this,arguments)};case 7:return function(a0,a1,a2,a3,a4,a5,a6){return fn.apply(this,arguments)};case 8:return function(a0,a1,a2,a3,a4,a5,a6,a7){return fn.apply(this,arguments)};case 9:return function(a0,a1,a2,a3,a4,a5,a6,a7,a8){return fn.apply(this,arguments)};case 10:return function(a0,a1,a2,a3,a4,a5,a6,a7,a8,a9){return fn.apply(this,arguments)};default:throw new Error("First argument to _arity must be a non-negative integer no greater than ten")}}},{}],5:[function(require,module,exports){var _isPlaceholder=require("./_isPlaceholder");module.exports=function _curry1(fn){return function f1(a){if(arguments.length===0||_isPlaceholder(a)){return f1}else{return fn.apply(this,arguments)}}}},{"./_isPlaceholder":8}],6:[function(require,module,exports){var _curry1=require("./_curry1");var _isPlaceholder=require("./_isPlaceholder");module.exports=function _curry2(fn){return function f2(a,b){switch(arguments.length){case 0:return f2;case 1:return _isPlaceholder(a)?f2:_curry1(function(_b){return fn(a,_b)});default:return _isPlaceholder(a)&&_isPlaceholder(b)?f2:_isPlaceholder(a)?_curry1(function(_a){return fn(_a,b)}):_isPlaceholder(b)?_curry1(function(_b){return fn(a,_b)}):fn(a,b)}}}},{"./_curry1":5,"./_isPlaceholder":8}],7:[function(require,module,exports){var _arity=require("./_arity");var _isPlaceholder=require("./_isPlaceholder");module.exports=function _curryN(length,received,fn){return function(){var combined=[];var argsIdx=0;var left=length;var combinedIdx=0;while(combinedIdx<received.length||argsIdx<arguments.length){var result;if(combinedIdx<received.length&&(!_isPlaceholder(received[combinedIdx])||argsIdx>=arguments.length)){result=received[combinedIdx]}else{result=arguments[argsIdx];argsIdx+=1}combined[combinedIdx]=result;if(!_isPlaceholder(result)){left-=1}combinedIdx+=1}return left<=0?fn.apply(this,combined):_arity(left,_curryN(length,combined,fn))}}},{"./_arity":4,"./_isPlaceholder":8}],8:[function(require,module,exports){module.exports=function _isPlaceholder(a){return a!=null&&typeof a==="object"&&a["@@functional/placeholder"]===true}},{}],9:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});var vnode_1=require("./vnode");var is=require("./is");function addNS(data,children,sel){data.ns="http://www.w3.org/2000/svg";if(sel!=="foreignObject"&&children!==undefined){for(var i=0;i<children.length;++i){var childData=children[i].data;if(childData!==undefined){addNS(childData,children[i].children,children[i].sel)}}}}function h(sel,b,c){var data={},children,text,i;if(c!==undefined){data=b;if(is.array(c)){children=c}else if(is.primitive(c)){text=c}else if(c&&c.sel){children=[c]}}else if(b!==undefined){if(is.array(b)){children=b}else if(is.primitive(b)){text=b}else if(b&&b.sel){children=[b]}else{data=b}}if(is.array(children)){for(i=0;i<children.length;++i){if(is.primitive(children[i]))children[i]=vnode_1.vnode(undefined,undefined,undefined,children[i])}}if(sel[0]==="s"&&sel[1]==="v"&&sel[2]==="g"&&(sel.length===3||sel[3]==="."||sel[3]==="#")){addNS(data,children,sel)}return vnode_1.vnode(sel,data,children,text,undefined)}exports.h=h;exports.default=h},{"./is":11,"./vnode":15}],10:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});function createElement(tagName){return document.createElement(tagName)}function createElementNS(namespaceURI,qualifiedName){return document.createElementNS(namespaceURI,qualifiedName)}function createTextNode(text){return document.createTextNode(text)}function createComment(text){return document.createComment(text)}function insertBefore(parentNode,newNode,referenceNode){parentNode.insertBefore(newNode,referenceNode)}function removeChild(node,child){node.removeChild(child)}function appendChild(node,child){node.appendChild(child)}function parentNode(node){return node.parentNode}function nextSibling(node){return node.nextSibling}function tagName(elm){return elm.tagName}function setTextContent(node,text){node.textContent=text}function getTextContent(node){return node.textContent}function isElement(node){return node.nodeType===1}function isText(node){return node.nodeType===3}function isComment(node){return node.nodeType===8}exports.htmlDomApi={createElement:createElement,createElementNS:createElementNS,createTextNode:createTextNode,createComment:createComment,insertBefore:insertBefore,removeChild:removeChild,appendChild:appendChild,parentNode:parentNode,nextSibling:nextSibling,tagName:tagName,setTextContent:setTextContent,getTextContent:getTextContent,isElement:isElement,isText:isText,isComment:isComment};exports.default=exports.htmlDomApi},{}],11:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.array=Array.isArray;function primitive(s){return typeof s==="string"||typeof s==="number"}exports.primitive=primitive},{}],12:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});var xlinkNS="http://www.w3.org/1999/xlink";var xmlNS="http://www.w3.org/XML/1998/namespace";var colonChar=58;var xChar=120;function updateAttrs(oldVnode,vnode){var key,elm=vnode.elm,oldAttrs=oldVnode.data.attrs,attrs=vnode.data.attrs;if(!oldAttrs&&!attrs)return;if(oldAttrs===attrs)return;oldAttrs=oldAttrs||{};attrs=attrs||{};for(key in attrs){var cur=attrs[key];var old=oldAttrs[key];if(old!==cur){if(cur===true){elm.setAttribute(key,"")}else if(cur===false){elm.removeAttribute(key)}else{if(key.charCodeAt(0)!==xChar){elm.setAttribute(key,cur)}else if(key.charCodeAt(3)===colonChar){elm.setAttributeNS(xmlNS,key,cur)}else if(key.charCodeAt(5)===colonChar){elm.setAttributeNS(xlinkNS,key,cur)}else{elm.setAttribute(key,cur)}}}}for(key in oldAttrs){if(!(key in attrs)){elm.removeAttribute(key)}}}exports.attributesModule={create:updateAttrs,update:updateAttrs};exports.default=exports.attributesModule},{}],13:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});var vnode_1=require("./vnode");var is=require("./is");var htmldomapi_1=require("./htmldomapi");function isUndef(s){return s===undefined}function isDef(s){return s!==undefined}var emptyNode=vnode_1.default("",{},[],undefined,undefined);function sameVnode(vnode1,vnode2){return vnode1.key===vnode2.key&&vnode1.sel===vnode2.sel}function isVnode(vnode){return vnode.sel!==undefined}function createKeyToOldIdx(children,beginIdx,endIdx){var i,map={},key,ch;for(i=beginIdx;i<=endIdx;++i){ch=children[i];if(ch!=null){key=ch.key;if(key!==undefined)map[key]=i}}return map}var hooks=["create","update","remove","destroy","pre","post"];var h_1=require("./h");exports.h=h_1.h;var thunk_1=require("./thunk");exports.thunk=thunk_1.thunk;function init(modules,domApi){var i,j,cbs={};var api=domApi!==undefined?domApi:htmldomapi_1.default;for(i=0;i<hooks.length;++i){cbs[hooks[i]]=[];for(j=0;j<modules.length;++j){var hook=modules[j][hooks[i]];if(hook!==undefined){cbs[hooks[i]].push(hook)}}}function emptyNodeAt(elm){var id=elm.id?"#"+elm.id:"";var c=elm.className?"."+elm.className.split(" ").join("."):"";return vnode_1.default(api.tagName(elm).toLowerCase()+id+c,{},[],undefined,elm)}function createRmCb(childElm,listeners){return function rmCb(){if(--listeners===0){var parent_1=api.parentNode(childElm);api.removeChild(parent_1,childElm)}}}function createElm(vnode,insertedVnodeQueue){var i,data=vnode.data;if(data!==undefined){if(isDef(i=data.hook)&&isDef(i=i.init)){i(vnode);data=vnode.data}}var children=vnode.children,sel=vnode.sel;if(sel==="!"){if(isUndef(vnode.text)){vnode.text=""}vnode.elm=api.createComment(vnode.text)}else if(sel!==undefined){var hashIdx=sel.indexOf("#");var dotIdx=sel.indexOf(".",hashIdx);var hash=hashIdx>0?hashIdx:sel.length;var dot=dotIdx>0?dotIdx:sel.length;var tag=hashIdx!==-1||dotIdx!==-1?sel.slice(0,Math.min(hash,dot)):sel;var elm=vnode.elm=isDef(data)&&isDef(i=data.ns)?api.createElementNS(i,tag):api.createElement(tag);if(hash<dot)elm.setAttribute("id",sel.slice(hash+1,dot));if(dotIdx>0)elm.setAttribute("class",sel.slice(dot+1).replace(/\./g," "));for(i=0;i<cbs.create.length;++i)cbs.create[i](emptyNode,vnode);if(is.array(children)){for(i=0;i<children.length;++i){var ch=children[i];if(ch!=null){api.appendChild(elm,createElm(ch,insertedVnodeQueue))}}}else if(is.primitive(vnode.text)){api.appendChild(elm,api.createTextNode(vnode.text))}i=vnode.data.hook;if(isDef(i)){if(i.create)i.create(emptyNode,vnode);if(i.insert)insertedVnodeQueue.push(vnode)}}else{vnode.elm=api.createTextNode(vnode.text)}return vnode.elm}function addVnodes(parentElm,before,vnodes,startIdx,endIdx,insertedVnodeQueue){for(;startIdx<=endIdx;++startIdx){var ch=vnodes[startIdx];if(ch!=null){api.insertBefore(parentElm,createElm(ch,insertedVnodeQueue),before)}}}function invokeDestroyHook(vnode){var i,j,data=vnode.data;if(data!==undefined){if(isDef(i=data.hook)&&isDef(i=i.destroy))i(vnode);for(i=0;i<cbs.destroy.length;++i)cbs.destroy[i](vnode);if(vnode.children!==undefined){for(j=0;j<vnode.children.length;++j){i=vnode.children[j];if(i!=null&&typeof i!=="string"){invokeDestroyHook(i)}}}}}function removeVnodes(parentElm,vnodes,startIdx,endIdx){for(;startIdx<=endIdx;++startIdx){var i_1=void 0,listeners=void 0,rm=void 0,ch=vnodes[startIdx];if(ch!=null){if(isDef(ch.sel)){invokeDestroyHook(ch);listeners=cbs.remove.length+1;rm=createRmCb(ch.elm,listeners);for(i_1=0;i_1<cbs.remove.length;++i_1)cbs.remove[i_1](ch,rm);if(isDef(i_1=ch.data)&&isDef(i_1=i_1.hook)&&isDef(i_1=i_1.remove)){i_1(ch,rm)}else{rm()}}else{api.removeChild(parentElm,ch.elm)}}}}function updateChildren(parentElm,oldCh,newCh,insertedVnodeQueue){var oldStartIdx=0,newStartIdx=0;var oldEndIdx=oldCh.length-1;var oldStartVnode=oldCh[0];var oldEndVnode=oldCh[oldEndIdx];var newEndIdx=newCh.length-1;var newStartVnode=newCh[0];var newEndVnode=newCh[newEndIdx];var oldKeyToIdx;var idxInOld;var elmToMove;var before;while(oldStartIdx<=oldEndIdx&&newStartIdx<=newEndIdx){if(oldStartVnode==null){oldStartVnode=oldCh[++oldStartIdx]}else if(oldEndVnode==null){oldEndVnode=oldCh[--oldEndIdx]}else if(newStartVnode==null){newStartVnode=newCh[++newStartIdx]}else if(newEndVnode==null){newEndVnode=newCh[--newEndIdx]}else if(sameVnode(oldStartVnode,newStartVnode)){patchVnode(oldStartVnode,newStartVnode,insertedVnodeQueue);oldStartVnode=oldCh[++oldStartIdx];newStartVnode=newCh[++newStartIdx]}else if(sameVnode(oldEndVnode,newEndVnode)){patchVnode(oldEndVnode,newEndVnode,insertedVnodeQueue);oldEndVnode=oldCh[--oldEndIdx];newEndVnode=newCh[--newEndIdx]}else if(sameVnode(oldStartVnode,newEndVnode)){patchVnode(oldStartVnode,newEndVnode,insertedVnodeQueue);api.insertBefore(parentElm,oldStartVnode.elm,api.nextSibling(oldEndVnode.elm));oldStartVnode=oldCh[++oldStartIdx];newEndVnode=newCh[--newEndIdx]}else if(sameVnode(oldEndVnode,newStartVnode)){patchVnode(oldEndVnode,newStartVnode,insertedVnodeQueue);api.insertBefore(parentElm,oldEndVnode.elm,oldStartVnode.elm);oldEndVnode=oldCh[--oldEndIdx];newStartVnode=newCh[++newStartIdx]}else{if(oldKeyToIdx===undefined){oldKeyToIdx=createKeyToOldIdx(oldCh,oldStartIdx,oldEndIdx)}idxInOld=oldKeyToIdx[newStartVnode.key];if(isUndef(idxInOld)){api.insertBefore(parentElm,createElm(newStartVnode,insertedVnodeQueue),oldStartVnode.elm);newStartVnode=newCh[++newStartIdx]}else{elmToMove=oldCh[idxInOld];if(elmToMove.sel!==newStartVnode.sel){api.insertBefore(parentElm,createElm(newStartVnode,insertedVnodeQueue),oldStartVnode.elm)}else{patchVnode(elmToMove,newStartVnode,insertedVnodeQueue);oldCh[idxInOld]=undefined;api.insertBefore(parentElm,elmToMove.elm,oldStartVnode.elm)}newStartVnode=newCh[++newStartIdx]}}}if(oldStartIdx>oldEndIdx){before=newCh[newEndIdx+1]==null?null:newCh[newEndIdx+1].elm;addVnodes(parentElm,before,newCh,newStartIdx,newEndIdx,insertedVnodeQueue)}else if(newStartIdx>newEndIdx){removeVnodes(parentElm,oldCh,oldStartIdx,oldEndIdx)}}function patchVnode(oldVnode,vnode,insertedVnodeQueue){var i,hook;if(isDef(i=vnode.data)&&isDef(hook=i.hook)&&isDef(i=hook.prepatch)){i(oldVnode,vnode)}var elm=vnode.elm=oldVnode.elm;var oldCh=oldVnode.children;var ch=vnode.children;if(oldVnode===vnode)return;if(vnode.data!==undefined){for(i=0;i<cbs.update.length;++i)cbs.update[i](oldVnode,vnode);i=vnode.data.hook;if(isDef(i)&&isDef(i=i.update))i(oldVnode,vnode)}if(isUndef(vnode.text)){if(isDef(oldCh)&&isDef(ch)){if(oldCh!==ch)updateChildren(elm,oldCh,ch,insertedVnodeQueue)}else if(isDef(ch)){if(isDef(oldVnode.text))api.setTextContent(elm,"");addVnodes(elm,null,ch,0,ch.length-1,insertedVnodeQueue)}else if(isDef(oldCh)){removeVnodes(elm,oldCh,0,oldCh.length-1)}else if(isDef(oldVnode.text)){api.setTextContent(elm,"")}}else if(oldVnode.text!==vnode.text){api.setTextContent(elm,vnode.text)}if(isDef(hook)&&isDef(i=hook.postpatch)){i(oldVnode,vnode)}}return function patch(oldVnode,vnode){var i,elm,parent;var insertedVnodeQueue=[];for(i=0;i<cbs.pre.length;++i)cbs.pre[i]();if(!isVnode(oldVnode)){oldVnode=emptyNodeAt(oldVnode)}if(sameVnode(oldVnode,vnode)){patchVnode(oldVnode,vnode,insertedVnodeQueue)}else{elm=oldVnode.elm;parent=api.parentNode(elm);createElm(vnode,insertedVnodeQueue);if(parent!==null){api.insertBefore(parent,vnode.elm,api.nextSibling(elm));removeVnodes(parent,[oldVnode],0,0)}}for(i=0;i<insertedVnodeQueue.length;++i){insertedVnodeQueue[i].data.hook.insert(insertedVnodeQueue[i])}for(i=0;i<cbs.post.length;++i)cbs.post[i]();return vnode}}exports.init=init},{"./h":9,"./htmldomapi":10,"./is":11,"./thunk":14,"./vnode":15}],14:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});var h_1=require("./h");function copyToThunk(vnode,thunk){thunk.elm=vnode.elm;vnode.data.fn=thunk.data.fn;vnode.data.args=thunk.data.args;thunk.data=vnode.data;thunk.children=vnode.children;thunk.text=vnode.text;thunk.elm=vnode.elm}function init(thunk){var cur=thunk.data;var vnode=cur.fn.apply(undefined,cur.args);copyToThunk(vnode,thunk)}function prepatch(oldVnode,thunk){var i,old=oldVnode.data,cur=thunk.data;var oldArgs=old.args,args=cur.args;if(old.fn!==cur.fn||oldArgs.length!==args.length){copyToThunk(cur.fn.apply(undefined,args),thunk);return}for(i=0;i<args.length;++i){if(oldArgs[i]!==args[i]){copyToThunk(cur.fn.apply(undefined,args),thunk);return}}copyToThunk(oldVnode,thunk)}exports.thunk=function thunk(sel,key,fn,args){if(args===undefined){args=fn;fn=key;key=undefined}return h_1.h(sel,{key:key,hook:{init:init,prepatch:prepatch},fn:fn,args:args})};exports.default=exports.thunk},{"./h":9}],15:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});function vnode(sel,data,children,text,elm){var key=data===undefined?undefined:data.key;return{sel:sel,data:data,children:children,text:text,elm:elm,key:key}}exports.vnode=vnode;exports.default=vnode},{}]},{},[1]);
