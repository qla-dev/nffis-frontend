(function(){function H(t,e,n){try{return window.URL.createObjectURL(new Blob([Uint8Array.from(t.split("").map(function(i){return i.charCodeAt(0)}))],{type:e}))}catch{return"data:"+e+","+t}}(function(t){if(t.fetch)return;var e={searchParams:"URLSearchParams"in t,iterable:"Symbol"in t&&"iterator"in Symbol,blob:"FileReader"in t&&"Blob"in t&&(function(){try{return new Blob,!0}catch{return!1}})(),formData:"FormData"in t,arrayBuffer:"ArrayBuffer"in t};if(e.arrayBuffer)var n=["[object Int8Array]","[object Uint8Array]","[object Uint8ClampedArray]","[object Int16Array]","[object Uint16Array]","[object Int32Array]","[object Uint32Array]","[object Float32Array]","[object Float64Array]"],i=function(o){return o&&DataView.prototype.isPrototypeOf(o)},r=ArrayBuffer.isView||function(o){return o&&n.indexOf(Object.prototype.toString.call(o))>-1};function a(o){if(typeof o!="string"&&(o=String(o)),/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(o))throw new TypeError("Invalid character in header field name");return o.toLowerCase()}function s(o){return typeof o!="string"&&(o=String(o)),o}function u(o){var l={next:function(){var c=o.shift();return{done:c===void 0,value:c}}};return e.iterable&&(l[Symbol.iterator]=function(){return l}),l}function f(o){this.map={},o instanceof f?o.forEach(function(l,c){this.append(c,l)},this):Array.isArray(o)?o.forEach(function(l){this.append(l[0],l[1])},this):o&&Object.getOwnPropertyNames(o).forEach(function(l){this.append(l,o[l])},this)}f.prototype.append=function(o,l){o=a(o),l=s(l);var c=this.map[o];this.map[o]=c?c+","+l:l},f.prototype.delete=function(o){delete this.map[a(o)]},f.prototype.get=function(o){return o=a(o),this.has(o)?this.map[o]:null},f.prototype.has=function(o){return this.map.hasOwnProperty(a(o))},f.prototype.set=function(o,l){this.map[a(o)]=s(l)},f.prototype.forEach=function(o,l){var c=this;for(var v in this.map)c.map.hasOwnProperty(v)&&o.call(l,c.map[v],v,c)},f.prototype.keys=function(){var o=[];return this.forEach(function(l,c){o.push(c)}),u(o)},f.prototype.values=function(){var o=[];return this.forEach(function(l){o.push(l)}),u(o)},f.prototype.entries=function(){var o=[];return this.forEach(function(l,c){o.push([c,l])}),u(o)},e.iterable&&(f.prototype[Symbol.iterator]=f.prototype.entries);function h(o){if(o.bodyUsed)return Promise.reject(new TypeError("Already read"));o.bodyUsed=!0}function p(o){return new Promise(function(l,c){o.onload=function(){l(o.result)},o.onerror=function(){c(o.error)}})}function x(o){var l=new FileReader,c=p(l);return l.readAsArrayBuffer(o),c}function w(o){var l=new FileReader,c=p(l);return l.readAsText(o),c}function m(o){for(var l=new Uint8Array(o),c=new Array(l.length),v=0;v<l.length;v++)c[v]=String.fromCharCode(l[v]);return c.join("")}function _(o){if(o.slice)return o.slice(0);var l=new Uint8Array(o.byteLength);return l.set(new Uint8Array(o)),l.buffer}function g(){return this.bodyUsed=!1,this._initBody=function(o){if(this._bodyInit=o,!o)this._bodyText="";else if(typeof o=="string")this._bodyText=o;else if(e.blob&&Blob.prototype.isPrototypeOf(o))this._bodyBlob=o;else if(e.formData&&FormData.prototype.isPrototypeOf(o))this._bodyFormData=o;else if(e.searchParams&&URLSearchParams.prototype.isPrototypeOf(o))this._bodyText=o.toString();else if(e.arrayBuffer&&e.blob&&i(o))this._bodyArrayBuffer=_(o.buffer),this._bodyInit=new Blob([this._bodyArrayBuffer]);else if(e.arrayBuffer&&(ArrayBuffer.prototype.isPrototypeOf(o)||r(o)))this._bodyArrayBuffer=_(o);else throw new Error("unsupported BodyInit type");this.headers.get("content-type")||(typeof o=="string"?this.headers.set("content-type","text/plain;charset=UTF-8"):this._bodyBlob&&this._bodyBlob.type?this.headers.set("content-type",this._bodyBlob.type):e.searchParams&&URLSearchParams.prototype.isPrototypeOf(o)&&this.headers.set("content-type","application/x-www-form-urlencoded;charset=UTF-8"))},e.blob&&(this.blob=function(){var o=h(this);if(o)return o;if(this._bodyBlob)return Promise.resolve(this._bodyBlob);if(this._bodyArrayBuffer)return Promise.resolve(new Blob([this._bodyArrayBuffer]));if(this._bodyFormData)throw new Error("could not read FormData body as blob");return Promise.resolve(new Blob([this._bodyText]))},this.arrayBuffer=function(){return this._bodyArrayBuffer?h(this)||Promise.resolve(this._bodyArrayBuffer):this.blob().then(x)}),this.text=function(){var o=h(this);if(o)return o;if(this._bodyBlob)return w(this._bodyBlob);if(this._bodyArrayBuffer)return Promise.resolve(m(this._bodyArrayBuffer));if(this._bodyFormData)throw new Error("could not read FormData body as text");return Promise.resolve(this._bodyText)},e.formData&&(this.formData=function(){return this.text().then(G)}),this.json=function(){return this.text().then(JSON.parse)},this}var P=["DELETE","GET","HEAD","OPTIONS","POST","PUT"];function j(o){var l=o.toUpperCase();return P.indexOf(l)>-1?l:o}function k(o,l){l=l||{};var c=l.body;if(o instanceof k){if(o.bodyUsed)throw new TypeError("Already read");this.url=o.url,this.credentials=o.credentials,l.headers||(this.headers=new f(o.headers)),this.method=o.method,this.mode=o.mode,!c&&o._bodyInit!=null&&(c=o._bodyInit,o.bodyUsed=!0)}else this.url=String(o);if(this.credentials=l.credentials||this.credentials||"omit",(l.headers||!this.headers)&&(this.headers=new f(l.headers)),this.method=j(l.method||this.method||"GET"),this.mode=l.mode||this.mode||null,this.referrer=null,(this.method==="GET"||this.method==="HEAD")&&c)throw new TypeError("Body not allowed for GET or HEAD requests");this._initBody(c)}k.prototype.clone=function(){return new k(this,{body:this._bodyInit})};function G(o){var l=new FormData;return o.trim().split("&").forEach(function(c){if(c){var v=c.split("="),b=v.shift().replace(/\+/g," "),y=v.join("=").replace(/\+/g," ");l.append(decodeURIComponent(b),decodeURIComponent(y))}}),l}function Mt(o){var l=new f;return o.split(/\r?\n/).forEach(function(c){var v=c.split(":"),b=v.shift().trim();if(b){var y=v.join(":").trim();l.append(b,y)}}),l}g.call(k.prototype);function S(o,l){l||(l={}),this.type="default",this.status="status"in l?l.status:200,this.ok=this.status>=200&&this.status<300,this.statusText="statusText"in l?l.statusText:"OK",this.headers=new f(l.headers),this.url=l.url||"",this._initBody(o)}g.call(S.prototype),S.prototype.clone=function(){return new S(this._bodyInit,{status:this.status,statusText:this.statusText,headers:new f(this.headers),url:this.url})},S.error=function(){var o=new S(null,{status:0,statusText:""});return o.type="error",o};var Vt=[301,302,303,307,308];S.redirect=function(o,l){if(Vt.indexOf(l)===-1)throw new RangeError("Invalid status code");return new S(null,{status:l,headers:{location:o}})},t.Headers=f,t.Request=k,t.Response=S,t.fetch=function(o,l){return new Promise(function(c,v){var b=new k(o,l),y=new XMLHttpRequest;y.onload=function(){var A={status:y.status,statusText:y.statusText,headers:Mt(y.getAllResponseHeaders()||"")};A.url="responseURL"in y?y.responseURL:A.headers.get("X-Request-URL");var I="response"in y?y.response:y.responseText;c(new S(I,A))},y.onerror=function(){v(new TypeError("Network request failed"))},y.ontimeout=function(){v(new TypeError("Network request failed"))},y.open(b.method,b.url,!0),b.credentials==="include"&&(y.withCredentials=!0),"responseType"in y&&e.blob&&(y.responseType="blob"),b.headers.forEach(function(A,I){y.setRequestHeader(I,A)}),y.send(typeof b._bodyInit>"u"?null:b._bodyInit)})},t.fetch.polyfill=!0})(typeof self<"u"?self:void 0);var J=function(t,e,n,i,r){var a,s,u=r*8-i-1,f=(1<<u)-1,h=f>>1,p=-7,x=n?r-1:0,w=n?-1:1,m=t[e+x];for(x+=w,a=m&(1<<-p)-1,m>>=-p,p+=u;p>0;a=a*256+t[e+x],x+=w,p-=8);for(s=a&(1<<-p)-1,a>>=-p,p+=i;p>0;s=s*256+t[e+x],x+=w,p-=8);if(a===0)a=1-h;else{if(a===f)return s?NaN:(m?-1:1)*(1/0);s=s+Math.pow(2,i),a=a-h}return(m?-1:1)*s*Math.pow(2,a-i)},Z=function(t,e,n,i,r,a){var s,u,f,h=a*8-r-1,p=(1<<h)-1,x=p>>1,w=r===23?Math.pow(2,-24)-Math.pow(2,-77):0,m=i?0:a-1,_=i?1:-1,g=e<0||e===0&&1/e<0?1:0;for(e=Math.abs(e),isNaN(e)||e===1/0?(u=isNaN(e)?1:0,s=p):(s=Math.floor(Math.log(e)/Math.LN2),e*(f=Math.pow(2,-s))<1&&(s--,f*=2),s+x>=1?e+=w/f:e+=w*Math.pow(2,1-x),e*f>=2&&(s++,f/=2),s+x>=p?(u=0,s=p):s+x>=1?(u=(e*f-1)*Math.pow(2,r),s=s+x):(u=e*Math.pow(2,x-1)*Math.pow(2,r),s=0));r>=8;t[n+m]=u&255,m+=_,u/=256,r-=8);for(s=s<<r|u,h+=r;h>0;t[n+m]=s&255,m+=_,s/=256,h-=8);t[n+m-_]|=g*128},X={read:J,write:Z},W=d,E=X;function d(t){this.buf=ArrayBuffer.isView&&ArrayBuffer.isView(t)?t:new Uint8Array(t||0),this.pos=0,this.type=0,this.length=this.buf.length}d.Varint=0,d.Fixed64=1,d.Bytes=2,d.Fixed32=5;var $=65536*65536,R=1/$;d.prototype={destroy:function(){this.buf=null},readFields:function(t,e,n){var i=this;for(n=n||this.length;this.pos<n;){var r=i.readVarint(),a=r>>3,s=i.pos;i.type=r&7,t(a,e,i),i.pos===s&&i.skip(r)}return e},readMessage:function(t,e){return this.readFields(t,e,this.readVarint()+this.pos)},readFixed32:function(){var t=C(this.buf,this.pos);return this.pos+=4,t},readSFixed32:function(){var t=q(this.buf,this.pos);return this.pos+=4,t},readFixed64:function(){var t=C(this.buf,this.pos)+C(this.buf,this.pos+4)*$;return this.pos+=8,t},readSFixed64:function(){var t=C(this.buf,this.pos)+q(this.buf,this.pos+4)*$;return this.pos+=8,t},readFloat:function(){var t=E.read(this.buf,this.pos,!0,23,4);return this.pos+=4,t},readDouble:function(){var t=E.read(this.buf,this.pos,!0,52,8);return this.pos+=8,t},readVarint:function(t){var e=this.buf,n,i;return i=e[this.pos++],n=i&127,i<128||(i=e[this.pos++],n|=(i&127)<<7,i<128)||(i=e[this.pos++],n|=(i&127)<<14,i<128)||(i=e[this.pos++],n|=(i&127)<<21,i<128)?n:(i=e[this.pos],n|=(i&15)<<28,Y(n,t,this))},readVarint64:function(){return this.readVarint(!0)},readSVarint:function(){var t=this.readVarint();return t%2===1?(t+1)/-2:t/2},readBoolean:function(){return!!this.readVarint()},readString:function(){var t=this.readVarint()+this.pos,e=ut(this.buf,this.pos,t);return this.pos=t,e},readBytes:function(){var t=this.readVarint()+this.pos,e=this.buf.subarray(this.pos,t);return this.pos=t,e},readPackedVarint:function(t,e){var n=this,i=F(this);for(t=t||[];this.pos<i;)t.push(n.readVarint(e));return t},readPackedSVarint:function(t){var e=this,n=F(this);for(t=t||[];this.pos<n;)t.push(e.readSVarint());return t},readPackedBoolean:function(t){var e=this,n=F(this);for(t=t||[];this.pos<n;)t.push(e.readBoolean());return t},readPackedFloat:function(t){var e=this,n=F(this);for(t=t||[];this.pos<n;)t.push(e.readFloat());return t},readPackedDouble:function(t){var e=this,n=F(this);for(t=t||[];this.pos<n;)t.push(e.readDouble());return t},readPackedFixed32:function(t){var e=this,n=F(this);for(t=t||[];this.pos<n;)t.push(e.readFixed32());return t},readPackedSFixed32:function(t){var e=this,n=F(this);for(t=t||[];this.pos<n;)t.push(e.readSFixed32());return t},readPackedFixed64:function(t){var e=this,n=F(this);for(t=t||[];this.pos<n;)t.push(e.readFixed64());return t},readPackedSFixed64:function(t){var e=this,n=F(this);for(t=t||[];this.pos<n;)t.push(e.readSFixed64());return t},skip:function(t){var e=t&7;if(e===d.Varint)for(;this.buf[this.pos++]>127;);else if(e===d.Bytes)this.pos=this.readVarint()+this.pos;else if(e===d.Fixed32)this.pos+=4;else if(e===d.Fixed64)this.pos+=8;else throw new Error("Unimplemented type: "+e)},writeTag:function(t,e){this.writeVarint(t<<3|e)},realloc:function(t){for(var e=this.length||16;e<this.pos+t;)e*=2;if(e!==this.length){var n=new Uint8Array(e);n.set(this.buf),this.buf=n,this.length=e}},finish:function(){return this.length=this.pos,this.pos=0,this.buf.subarray(0,this.length)},writeFixed32:function(t){this.realloc(4),z(this.buf,t,this.pos),this.pos+=4},writeSFixed32:function(t){this.realloc(4),z(this.buf,t,this.pos),this.pos+=4},writeFixed64:function(t){this.realloc(8),z(this.buf,t&-1,this.pos),z(this.buf,Math.floor(t*R),this.pos+4),this.pos+=8},writeSFixed64:function(t){this.realloc(8),z(this.buf,t&-1,this.pos),z(this.buf,Math.floor(t*R),this.pos+4),this.pos+=8},writeVarint:function(t){if(t=+t||0,t>268435455||t<0){K(t,this);return}this.realloc(4),this.buf[this.pos++]=t&127|(t>127?128:0),!(t<=127)&&(this.buf[this.pos++]=(t>>>=7)&127|(t>127?128:0),!(t<=127)&&(this.buf[this.pos++]=(t>>>=7)&127|(t>127?128:0),!(t<=127)&&(this.buf[this.pos++]=t>>>7&127)))},writeSVarint:function(t){this.writeVarint(t<0?-t*2-1:t*2)},writeBoolean:function(t){this.writeVarint(!!t)},writeString:function(t){t=String(t),this.realloc(t.length*4),this.pos++;var e=this.pos;this.pos=ct(this.buf,t,this.pos);var n=this.pos-e;n>=128&&U(e,n,this),this.pos=e-1,this.writeVarint(n),this.pos+=n},writeFloat:function(t){this.realloc(4),E.write(this.buf,t,this.pos,!0,23,4),this.pos+=4},writeDouble:function(t){this.realloc(8),E.write(this.buf,t,this.pos,!0,52,8),this.pos+=8},writeBytes:function(t){var e=this,n=t.length;this.writeVarint(n),this.realloc(n);for(var i=0;i<n;i++)e.buf[e.pos++]=t[i]},writeRawMessage:function(t,e){this.pos++;var n=this.pos;t(e,this);var i=this.pos-n;i>=128&&U(n,i,this),this.pos=n-1,this.writeVarint(i),this.pos+=i},writeMessage:function(t,e,n){this.writeTag(t,d.Bytes),this.writeRawMessage(e,n)},writePackedVarint:function(t,e){this.writeMessage(t,et,e)},writePackedSVarint:function(t,e){this.writeMessage(t,nt,e)},writePackedBoolean:function(t,e){this.writeMessage(t,ot,e)},writePackedFloat:function(t,e){this.writeMessage(t,it,e)},writePackedDouble:function(t,e){this.writeMessage(t,rt,e)},writePackedFixed32:function(t,e){this.writeMessage(t,st,e)},writePackedSFixed32:function(t,e){this.writeMessage(t,at,e)},writePackedFixed64:function(t,e){this.writeMessage(t,ft,e)},writePackedSFixed64:function(t,e){this.writeMessage(t,lt,e)},writeBytesField:function(t,e){this.writeTag(t,d.Bytes),this.writeBytes(e)},writeFixed32Field:function(t,e){this.writeTag(t,d.Fixed32),this.writeFixed32(e)},writeSFixed32Field:function(t,e){this.writeTag(t,d.Fixed32),this.writeSFixed32(e)},writeFixed64Field:function(t,e){this.writeTag(t,d.Fixed64),this.writeFixed64(e)},writeSFixed64Field:function(t,e){this.writeTag(t,d.Fixed64),this.writeSFixed64(e)},writeVarintField:function(t,e){this.writeTag(t,d.Varint),this.writeVarint(e)},writeSVarintField:function(t,e){this.writeTag(t,d.Varint),this.writeSVarint(e)},writeStringField:function(t,e){this.writeTag(t,d.Bytes),this.writeString(e)},writeFloatField:function(t,e){this.writeTag(t,d.Fixed32),this.writeFloat(e)},writeDoubleField:function(t,e){this.writeTag(t,d.Fixed64),this.writeDouble(e)},writeBooleanField:function(t,e){this.writeVarintField(t,!!e)}};function Y(t,e,n){var i=n.buf,r,a;if(a=i[n.pos++],r=(a&112)>>4,a<128||(a=i[n.pos++],r|=(a&127)<<3,a<128)||(a=i[n.pos++],r|=(a&127)<<10,a<128)||(a=i[n.pos++],r|=(a&127)<<17,a<128)||(a=i[n.pos++],r|=(a&127)<<24,a<128)||(a=i[n.pos++],r|=(a&1)<<31,a<128))return T(t,r,e);throw new Error("Expected varint not more than 10 bytes")}function F(t){return t.type===d.Bytes?t.readVarint()+t.pos:t.pos+1}function T(t,e,n){return n?e*4294967296+(t>>>0):(e>>>0)*4294967296+(t>>>0)}function K(t,e){var n,i;if(t>=0?(n=t%4294967296|0,i=t/4294967296|0):(n=~(-t%4294967296),i=~(-t/4294967296),n^4294967295?n=n+1|0:(n=0,i=i+1|0)),t>=18446744073709552e3||t<-18446744073709552e3)throw new Error("Given varint doesn't fit into 10 bytes");e.realloc(10),Q(n,i,e),tt(i,e)}function Q(t,e,n){n.buf[n.pos++]=t&127|128,t>>>=7,n.buf[n.pos++]=t&127|128,t>>>=7,n.buf[n.pos++]=t&127|128,t>>>=7,n.buf[n.pos++]=t&127|128,t>>>=7,n.buf[n.pos]=t&127}function tt(t,e){var n=(t&7)<<4;e.buf[e.pos++]|=n|((t>>>=3)?128:0),t&&(e.buf[e.pos++]=t&127|((t>>>=7)?128:0),t&&(e.buf[e.pos++]=t&127|((t>>>=7)?128:0),t&&(e.buf[e.pos++]=t&127|((t>>>=7)?128:0),t&&(e.buf[e.pos++]=t&127|((t>>>=7)?128:0),t&&(e.buf[e.pos++]=t&127)))))}function U(t,e,n){var i=e<=16383?1:e<=2097151?2:e<=268435455?3:Math.ceil(Math.log(e)/(Math.LN2*7));n.realloc(i);for(var r=n.pos-1;r>=t;r--)n.buf[r+i]=n.buf[r]}function et(t,e){for(var n=0;n<t.length;n++)e.writeVarint(t[n])}function nt(t,e){for(var n=0;n<t.length;n++)e.writeSVarint(t[n])}function it(t,e){for(var n=0;n<t.length;n++)e.writeFloat(t[n])}function rt(t,e){for(var n=0;n<t.length;n++)e.writeDouble(t[n])}function ot(t,e){for(var n=0;n<t.length;n++)e.writeBoolean(t[n])}function st(t,e){for(var n=0;n<t.length;n++)e.writeFixed32(t[n])}function at(t,e){for(var n=0;n<t.length;n++)e.writeSFixed32(t[n])}function ft(t,e){for(var n=0;n<t.length;n++)e.writeFixed64(t[n])}function lt(t,e){for(var n=0;n<t.length;n++)e.writeSFixed64(t[n])}function C(t,e){return(t[e]|t[e+1]<<8|t[e+2]<<16)+t[e+3]*16777216}function z(t,e,n){t[n]=e,t[n+1]=e>>>8,t[n+2]=e>>>16,t[n+3]=e>>>24}function q(t,e){return(t[e]|t[e+1]<<8|t[e+2]<<16)+(t[e+3]<<24)}function ut(t,e,n){for(var i="",r=e;r<n;){var a=t[r],s=null,u=a>239?4:a>223?3:a>191?2:1;if(r+u>n)break;var f,h,p;u===1?a<128&&(s=a):u===2?(f=t[r+1],(f&192)===128&&(s=(a&31)<<6|f&63,s<=127&&(s=null))):u===3?(f=t[r+1],h=t[r+2],(f&192)===128&&(h&192)===128&&(s=(a&15)<<12|(f&63)<<6|h&63,(s<=2047||s>=55296&&s<=57343)&&(s=null))):u===4&&(f=t[r+1],h=t[r+2],p=t[r+3],(f&192)===128&&(h&192)===128&&(p&192)===128&&(s=(a&15)<<18|(f&63)<<12|(h&63)<<6|p&63,(s<=65535||s>=1114112)&&(s=null))),s===null?(s=65533,u=1):s>65535&&(s-=65536,i+=String.fromCharCode(s>>>10&1023|55296),s=56320|s&1023),i+=String.fromCharCode(s),r+=u}return i}function ct(t,e,n){for(var i=0,r,a;i<e.length;i++){if(r=e.charCodeAt(i),r>55295&&r<57344)if(a)if(r<56320){t[n++]=239,t[n++]=191,t[n++]=189,a=r;continue}else r=a-55296<<10|r-56320|65536,a=null;else{r>56319||i+1===e.length?(t[n++]=239,t[n++]=191,t[n++]=189):a=r;continue}else a&&(t[n++]=239,t[n++]=191,t[n++]=189,a=null);r<128?t[n++]=r:(r<2048?t[n++]=r>>6|192:(r<65536?t[n++]=r>>12|224:(t[n++]=r>>18|240,t[n++]=r>>12&63|128),t[n++]=r>>6&63|128),t[n++]=r&63|128)}return n}var ht=M;function M(t,e){this.x=t,this.y=e}M.prototype={clone:function(){return new M(this.x,this.y)},add:function(t){return this.clone()._add(t)},sub:function(t){return this.clone()._sub(t)},mult:function(t){return this.clone()._mult(t)},div:function(t){return this.clone()._div(t)},rotate:function(t){return this.clone()._rotate(t)},matMult:function(t){return this.clone()._matMult(t)},unit:function(){return this.clone()._unit()},perp:function(){return this.clone()._perp()},round:function(){return this.clone()._round()},mag:function(){return Math.sqrt(this.x*this.x+this.y*this.y)},equals:function(t){return this.x===t.x&&this.y===t.y},dist:function(t){return Math.sqrt(this.distSqr(t))},distSqr:function(t){var e=t.x-this.x,n=t.y-this.y;return e*e+n*n},angle:function(){return Math.atan2(this.y,this.x)},angleTo:function(t){return Math.atan2(this.y-t.y,this.x-t.x)},angleWith:function(t){return this.angleWithSep(t.x,t.y)},angleWithSep:function(t,e){return Math.atan2(this.x*e-this.y*t,this.x*t+this.y*e)},_matMult:function(t){var e=t[0]*this.x+t[1]*this.y,n=t[2]*this.x+t[3]*this.y;return this.x=e,this.y=n,this},_add:function(t){return this.x+=t.x,this.y+=t.y,this},_sub:function(t){return this.x-=t.x,this.y-=t.y,this},_mult:function(t){return this.x*=t,this.y*=t,this},_div:function(t){return this.x/=t,this.y/=t,this},_unit:function(){return this._div(this.mag()),this},_perp:function(){var t=this.y;return this.y=this.x,this.x=-t,this},_rotate:function(t){var e=Math.cos(t),n=Math.sin(t),i=e*this.x-n*this.y,r=n*this.x+e*this.y;return this.x=i,this.y=r,this},_round:function(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}},M.convert=function(t){return t instanceof M?t:Array.isArray(t)?new M(t[0],t[1]):t};var pt=ht,dt=V;function V(t,e,n,i,r){this.properties={},this.extent=n,this.type=0,this._pbf=t,this._geometry=-1,this._keys=i,this._values=r,t.readFields(yt,this,e)}function yt(t,e,n){t==1?e.id=n.readVarint():t==2?xt(n,e):t==3?e.type=n.readVarint():t==4&&(e._geometry=n.pos)}function xt(t,e){for(var n=t.readVarint()+t.pos;t.pos<n;){var i=e._keys[t.readVarint()],r=e._values[t.readVarint()];e.properties[i]=r}}V.types=["Unknown","Point","LineString","Polygon"],V.prototype.loadGeometry=function(){var t=this._pbf;t.pos=this._geometry;for(var e=t.readVarint()+t.pos,n=1,i=0,r=0,a=0,s=[],u;t.pos<e;){if(!i){var f=t.readVarint();n=f&7,i=f>>3}if(i--,n===1||n===2)r+=t.readSVarint(),a+=t.readSVarint(),n===1&&(u&&s.push(u),u=[]),u.push(new pt(r,a));else if(n===7)u&&u.push(u[0].clone());else throw new Error("unknown command "+n)}return u&&s.push(u),s},V.prototype.bbox=function(){var t=this._pbf;t.pos=this._geometry;for(var e=t.readVarint()+t.pos,n=1,i=0,r=0,a=0,s=1/0,u=-1/0,f=1/0,h=-1/0;t.pos<e;){if(!i){var p=t.readVarint();n=p&7,i=p>>3}if(i--,n===1||n===2)r+=t.readSVarint(),a+=t.readSVarint(),r<s&&(s=r),r>u&&(u=r),a<f&&(f=a),a>h&&(h=a);else if(n!==7)throw new Error("unknown command "+n)}return[s,f,u,h]},V.prototype.toGeoJSON=function(t,e,n){var i=this.extent*Math.pow(2,n),r=this.extent*t,a=this.extent*e,s=this.loadGeometry(),u=V.types[this.type],f,h;function p(m){for(var _=0;_<m.length;_++){var g=m[_],P=180-(g.y+a)*360/i;m[_]=[(g.x+r)*360/i-180,360/Math.PI*Math.atan(Math.exp(P*Math.PI/180))-90]}}switch(this.type){case 1:var x=[];for(f=0;f<s.length;f++)x[f]=s[f][0];s=x,p(s);break;case 2:for(f=0;f<s.length;f++)p(s[f]);break;case 3:for(s=mt(s),f=0;f<s.length;f++)for(h=0;h<s[f].length;h++)p(s[f][h]);break}s.length===1?s=s[0]:u="Multi"+u;var w={type:"Feature",geometry:{type:u,coordinates:s},properties:this.properties};return"id"in this&&(w.id=this.id),w};function mt(t){var e=t.length;if(e<=1)return[t];for(var n=[],i,r,a=0;a<e;a++){var s=gt(t[a]);s!==0&&(r===void 0&&(r=s<0),r===s<0?(i&&n.push(i),i=[t[a]]):i.push(t[a]))}return i&&n.push(i),n}function gt(t){for(var e=0,n=0,i=t.length,r=i-1,a,s;n<i;r=n++)a=t[n],s=t[r],e+=(s.x-a.x)*(a.y+s.y);return e}var vt=dt,wt=N;function N(t,e){this.version=1,this.name=null,this.extent=4096,this.length=0,this._pbf=t,this._keys=[],this._values=[],this._features=[],t.readFields(_t,this,e),this.length=this._features.length}function _t(t,e,n){t===15?e.version=n.readVarint():t===1?e.name=n.readString():t===5?e.extent=n.readVarint():t===2?e._features.push(n.pos):t===3?e._keys.push(n.readString()):t===4&&e._values.push(bt(n))}function bt(t){for(var e=null,n=t.readVarint()+t.pos;t.pos<n;){var i=t.readVarint()>>3;e=i===1?t.readString():i===2?t.readFloat():i===3?t.readDouble():i===4?t.readVarint64():i===5?t.readVarint():i===6?t.readSVarint():i===7?t.readBoolean():null}return e}N.prototype.feature=function(t){if(t<0||t>=this._features.length)throw new Error("feature index out of bounds");this._pbf.pos=this._features[t];var e=this._pbf.readVarint()+this._pbf.pos;return new vt(this._pbf,e,this.extent,this._keys,this._values)};var kt=wt,Ft=St;function St(t,e){this.layers=t.readFields(Bt,{},e)}function Bt(t,e,n){if(t===3){var i=new kt(n,n.readVarint()+n.pos);i.length&&(e[i.name]=i)}}var Pt=Ft;L.SVG.Tile=L.SVG.extend({initialize:function(t,e,n){L.SVG.prototype.initialize.call(this,n),this._tileCoord=t,this._size=e,this._initContainer(),this._container.setAttribute("width",this._size.x),this._container.setAttribute("height",this._size.y),this._container.setAttribute("viewBox",[0,0,this._size.x,this._size.y].join(" ")),this._layers={}},getCoord:function(){return this._tileCoord},getContainer:function(){return this._container},onAdd:L.Util.falseFn,addTo:function(t){if(this._map=t,this.options.interactive)for(var e in this._layers){var n=this._layers[e];n._path.style.pointerEvents="auto",this._map._targets[L.stamp(n._path)]=n}},removeFrom:function(t){if(this.options.interactive)for(var e in this._layers){var n=this._layers[e];delete this._map._targets[L.stamp(n._path)]}delete this._map},_initContainer:function(){L.SVG.prototype._initContainer.call(this),L.SVG.create("rect")},_addPath:function(t){this._rootGroup.appendChild(t._path),this._layers[L.stamp(t)]=t},_updateIcon:function(t){var e=t._path=L.SVG.create("image"),n=t.options.icon,i=n.options,r=L.point(i.iconSize),a=i.iconAnchor||r&&r.divideBy(2,!0),s=t._point.subtract(a);e.setAttribute("x",s.x),e.setAttribute("y",s.y),e.setAttribute("width",r.x+"px"),e.setAttribute("height",r.y+"px"),e.setAttribute("href",i.iconUrl)}}),L.svg.tile=function(t,e,n){return new L.SVG.Tile(t,e,n)};var B=L.Class.extend({render:function(t,e){this._renderer=t,this.options=e,t._initPath(this),t._updateStyle(this)},updateStyle:function(t,e){this.options=e,t._updateStyle(this)},_getPixelBounds:function(){for(var t=this._parts,e=L.bounds([]),n=0;n<t.length;n++)for(var i=t[n],r=0;r<i.length;r++)e.extend(i[r]);var a=this._clickTolerance(),s=new L.Point(a,a);return e.min._subtract(s),e.max._add(s),e},_clickTolerance:L.Path.prototype._clickTolerance}),O={_makeFeatureParts:function(t,e){var n=t.geometry,i;this._parts=[];for(var r=0;r<n.length;r++){for(var a=n[r],s=[],u=0;u<a.length;u++)i=a[u],s.push(L.point(i).scaleBy(e));this._parts.push(s)}},makeInteractive:function(){this._pxBounds=this._getPixelBounds()}},D=L.CircleMarker.extend({includes:B.prototype,statics:{iconCache:{}},initialize:function(t,e){this.properties=t.properties,this._makeFeatureParts(t,e)},render:function(t,e){B.prototype.render.call(this,t,e),this._radius=e.radius||L.CircleMarker.prototype.options.radius,this._updatePath()},_makeFeatureParts:function(t,e){var n=t.geometry[0];typeof n[0]=="object"&&"x"in n[0]?(this._point=L.point(n[0]).scaleBy(e),this._empty=L.Util.falseFn):(this._point=L.point(n).scaleBy(e),this._empty=L.Util.falseFn)},makeInteractive:function(){this._updateBounds()},updateStyle:function(t,e){return this._radius=e.radius||this._radius,this._updateBounds(),B.prototype.updateStyle.call(this,t,e)},_updateBounds:function(){var t=this.options.icon;if(t){var e=L.point(t.options.iconSize),n=t.options.iconAnchor||e&&e.divideBy(2,!0),i=this._point.subtract(n);this._pxBounds=new L.Bounds(i,i.add(t.options.iconSize))}else L.CircleMarker.prototype._updateBounds.call(this)},_updatePath:function(){this.options.icon?this._renderer._updateIcon(this):L.CircleMarker.prototype._updatePath.call(this)},_getImage:function(){if(this.options.icon){var t=this.options.icon.options.iconUrl,e=D.iconCache[t];if(!e){var n=this.options.icon;e=D.iconCache[t]=n.createIcon()}return e}else return null},_containsPoint:function(t){var e=this.options.icon;return e?this._pxBounds.contains(t):L.CircleMarker.prototype._containsPoint.call(this,t)}}),Tt=L.Polyline.extend({includes:[B.prototype,O],initialize:function(t,e){this.properties=t.properties,this._makeFeatureParts(t,e)},render:function(t,e){e.fill=!1,B.prototype.render.call(this,t,e),this._updatePath()},updateStyle:function(t,e){e.fill=!1,B.prototype.updateStyle.call(this,t,e)}}),zt=L.Polygon.extend({includes:[B.prototype,O],initialize:function(t,e){this.properties=t.properties,this._makeFeatureParts(t,e)},render:function(t,e){B.prototype.render.call(this,t,e),this._updatePath()}});L.VectorGrid=L.GridLayer.extend({options:{rendererFactory:L.svg.tile,vectorTileLayerStyles:{},interactive:!1},initialize:function(t){L.setOptions(this,t),L.GridLayer.prototype.initialize.apply(this,arguments),this.options.getFeatureId&&(this._vectorTiles={},this._overriddenStyles={},this.on("tileunload",function(e){var n=this._tileCoordsToKey(e.coords),i=this._vectorTiles[n];i&&this._map&&i.removeFrom(this._map),delete this._vectorTiles[n]},this)),this._dataLayerNames={}},createTile:function(t,e){var n=this.options.getFeatureId,i=this.getTileSize(),r=this.options.rendererFactory(t,i,this.options),a=this._getVectorTilePromise(t);return n&&(this._vectorTiles[this._tileCoordsToKey(t)]=r,r._features={}),a.then((function(u){for(var f in u.layers){this._dataLayerNames[f]=!0;for(var h=u.layers[f],p=this.getTileSize().divideBy(h.extent),x=this.options.vectorTileLayerStyles[f]||L.Path.prototype.options,w=0;w<h.features.length;w++){var m=h.features[w],_,g=x;if(n){_=this.options.getFeatureId(m);var P=this._overriddenStyles[_];P&&(P[f]?g=P[f]:g=P)}if(g instanceof Function&&(g=g(m.properties,t.z)),g instanceof Array||(g=[g]),!!g.length){for(var j=this._createLayer(m,p),k=0;k<g.length;k++){var G=L.extend({},L.Path.prototype.options,g[k]);j.render(r,G),r._addPath(j)}this.options.interactive&&j.makeInteractive(),n&&(r._features[_]={layerName:f,feature:j})}}}this._map!=null&&r.addTo(this._map),L.Util.requestAnimFrame(e.bind(t,null,null))}).bind(this)),r.getContainer()},setFeatureStyle:function(t,e){this._overriddenStyles[t]=e;for(var n in this._vectorTiles){var i=this._vectorTiles[n],r=i._features,a=r[t];if(a){var s=a.feature,u=e;e[a.layerName]&&(u=e[a.layerName]),this._updateStyles(s,i,u)}}return this},resetFeatureStyle:function(t){delete this._overriddenStyles[t];for(var e in this._vectorTiles){var n=this._vectorTiles[e],i=n._features,r=i[t];if(r){var a=r.feature,s=this.options.vectorTileLayerStyles[r.layerName]||L.Path.prototype.options;this._updateStyles(a,n,s)}}return this},getDataLayerNames:function(){return Object.keys(this._dataLayerNames)},_updateStyles:function(t,e,n){n=n instanceof Function?n(t.properties,e.getCoord().z):n,n instanceof Array||(n=[n]);for(var i=0;i<n.length;i++){var r=L.extend({},L.Path.prototype.options,n[i]);t.updateStyle(e,r)}},_createLayer:function(t,e,n){var i;switch(t.type){case 1:i=new D(t,e);break;case 2:i=new Tt(t,e);break;case 3:i=new zt(t,e);break}return this.options.interactive&&i.addEventParent(this),i}}),L.vectorGrid=function(t){return new L.VectorGrid(t)},L.VectorGrid.Protobuf=L.VectorGrid.extend({options:{subdomains:"abc",fetchOptions:{}},initialize:function(t,e){this._url=t,L.VectorGrid.prototype.initialize.call(this,e)},setUrl:function(t,e){return this._url=t,e||this.redraw(),this},_getSubdomain:L.TileLayer.prototype._getSubdomain,_getVectorTilePromise:function(t){var e={s:this._getSubdomain(t),x:t.x,y:t.y,z:t.z};if(this._map&&!this._map.options.crs.infinite){var n=this._globalTileRange.max.y-t.y;this.options.tms&&(e.y=n),e["-y"]=n}var i=L.Util.template(this._url,L.extend(e,this.options));return fetch(i,this.options.fetchOptions).then(function(r){return r.ok?r.blob().then(function(a){var s=new FileReader;return new Promise(function(u){s.addEventListener("loadend",function(){var f=new W(s.result);return u(new Pt(f))}),s.readAsArrayBuffer(a)})}):{layers:[]}}).then(function(r){for(var a in r.layers){for(var s=[],u=0;u<r.layers[a].length;u++){var f=r.layers[a].feature(u);f.geometry=f.loadGeometry(),s.push(f)}r.layers[a].features=s}return r})}}),L.vectorGrid.protobuf=function(t,e){return new L.VectorGrid.Protobuf(t,e)};var Lt=H(`'use strict';

var simplify_1 = simplify$1;

// calculate simplification data using optimized Douglas-Peucker algorithm

function simplify$1(points, tolerance) {

    var sqTolerance = tolerance * tolerance,
        len = points.length,
        first = 0,
        last = len - 1,
        stack = [],
        i, maxSqDist, sqDist, index;

    // always retain the endpoints (1 is the max value)
    points[first][2] = 1;
    points[last][2] = 1;

    // avoid recursion by using a stack
    while (last) {

        maxSqDist = 0;

        for (i = first + 1; i < last; i++) {
            sqDist = getSqSegDist(points[i], points[first], points[last]);

            if (sqDist > maxSqDist) {
                index = i;
                maxSqDist = sqDist;
            }
        }

        if (maxSqDist > sqTolerance) {
            points[index][2] = maxSqDist; // save the point importance in squared pixels as a z coordinate
            stack.push(first);
            stack.push(index);
            first = index;

        } else {
            last = stack.pop();
            first = stack.pop();
        }
    }
}

// square distance from a point to a segment
function getSqSegDist(p, a, b) {

    var x = a[0], y = a[1],
        bx = b[0], by = b[1],
        px = p[0], py = p[1],
        dx = bx - x,
        dy = by - y;

    if (dx !== 0 || dy !== 0) {

        var t = ((px - x) * dx + (py - y) * dy) / (dx * dx + dy * dy);

        if (t > 1) {
            x = bx;
            y = by;

        } else if (t > 0) {
            x += dx * t;
            y += dy * t;
        }
    }

    dx = px - x;
    dy = py - y;

    return dx * dx + dy * dy;
}

var convert_1 = convert$1;

var simplify = simplify_1;

// converts GeoJSON feature into an intermediate projected JSON vector format with simplification data

function convert$1(data, tolerance) {
    var features = [];

    if (data.type === 'FeatureCollection') {
        for (var i = 0; i < data.features.length; i++) {
            convertFeature(features, data.features[i], tolerance);
        }
    } else if (data.type === 'Feature') {
        convertFeature(features, data, tolerance);

    } else {
        // single geometry or a geometry collection
        convertFeature(features, {geometry: data}, tolerance);
    }
    return features;
}

function convertFeature(features, feature, tolerance) {
    if (feature.geometry === null) {
        // ignore features with null geometry
        return;
    }

    var geom = feature.geometry,
        type = geom.type,
        coords = geom.coordinates,
        tags = feature.properties,
        i, j, rings, projectedRing;

    if (type === 'Point') {
        features.push(create(tags, 1, [projectPoint(coords)]));

    } else if (type === 'MultiPoint') {
        features.push(create(tags, 1, project(coords)));

    } else if (type === 'LineString') {
        features.push(create(tags, 2, [project(coords, tolerance)]));

    } else if (type === 'MultiLineString' || type === 'Polygon') {
        rings = [];
        for (i = 0; i < coords.length; i++) {
            projectedRing = project(coords[i], tolerance);
            if (type === 'Polygon') { projectedRing.outer = (i === 0); }
            rings.push(projectedRing);
        }
        features.push(create(tags, type === 'Polygon' ? 3 : 2, rings));

    } else if (type === 'MultiPolygon') {
        rings = [];
        for (i = 0; i < coords.length; i++) {
            for (j = 0; j < coords[i].length; j++) {
                projectedRing = project(coords[i][j], tolerance);
                projectedRing.outer = (j === 0);
                rings.push(projectedRing);
            }
        }
        features.push(create(tags, 3, rings));

    } else if (type === 'GeometryCollection') {
        for (i = 0; i < geom.geometries.length; i++) {
            convertFeature(features, {
                geometry: geom.geometries[i],
                properties: tags
            }, tolerance);
        }

    } else {
        throw new Error('Input data is not a valid GeoJSON object.');
    }
}

function create(tags, type, geometry) {
    var feature = {
        geometry: geometry,
        type: type,
        tags: tags || null,
        min: [2, 1], // initial bbox values;
        max: [-1, 0]  // note that coords are usually in [0..1] range
    };
    calcBBox(feature);
    return feature;
}

function project(lonlats, tolerance) {
    var projected = [];
    for (var i = 0; i < lonlats.length; i++) {
        projected.push(projectPoint(lonlats[i]));
    }
    if (tolerance) {
        simplify(projected, tolerance);
        calcSize(projected);
    }
    return projected;
}

function projectPoint(p) {
    var sin = Math.sin(p[1] * Math.PI / 180),
        x = (p[0] / 360 + 0.5),
        y = (0.5 - 0.25 * Math.log((1 + sin) / (1 - sin)) / Math.PI);

    y = y < 0 ? 0 :
        y > 1 ? 1 : y;

    return [x, y, 0];
}

// calculate area and length of the poly
function calcSize(points) {
    var area = 0,
        dist = 0;

    for (var i = 0, a, b; i < points.length - 1; i++) {
        a = b || points[i];
        b = points[i + 1];

        area += a[0] * b[1] - b[0] * a[1];

        // use Manhattan distance instead of Euclidian one to avoid expensive square root computation
        dist += Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
    }
    points.area = Math.abs(area / 2);
    points.dist = dist;
}

// calculate the feature bounding box for faster clipping later
function calcBBox(feature) {
    var geometry = feature.geometry,
        min = feature.min,
        max = feature.max;

    if (feature.type === 1) { calcRingBBox(min, max, geometry); }
    else { for (var i = 0; i < geometry.length; i++) { calcRingBBox(min, max, geometry[i]); } }

    return feature;
}

function calcRingBBox(min, max, points) {
    for (var i = 0, p; i < points.length; i++) {
        p = points[i];
        min[0] = Math.min(p[0], min[0]);
        max[0] = Math.max(p[0], max[0]);
        min[1] = Math.min(p[1], min[1]);
        max[1] = Math.max(p[1], max[1]);
    }
}

var tile = transformTile;
var point = transformPoint;

// Transforms the coordinates of each feature in the given tile from
// mercator-projected space into (extent x extent) tile space.
function transformTile(tile, extent) {
    if (tile.transformed) { return tile; }

    var z2 = tile.z2,
        tx = tile.x,
        ty = tile.y,
        i, j, k;

    for (i = 0; i < tile.features.length; i++) {
        var feature = tile.features[i],
            geom = feature.geometry,
            type = feature.type;

        if (type === 1) {
            for (j = 0; j < geom.length; j++) { geom[j] = transformPoint(geom[j], extent, z2, tx, ty); }

        } else {
            for (j = 0; j < geom.length; j++) {
                var ring = geom[j];
                for (k = 0; k < ring.length; k++) { ring[k] = transformPoint(ring[k], extent, z2, tx, ty); }
            }
        }
    }

    tile.transformed = true;

    return tile;
}

function transformPoint(p, extent, z2, tx, ty) {
    var x = Math.round(extent * (p[0] * z2 - tx)),
        y = Math.round(extent * (p[1] * z2 - ty));
    return [x, y];
}

var transform$1 = {
	tile: tile,
	point: point
};

var clip_1 = clip$1;

/* clip features between two axis-parallel lines:
 *     |        |
 *  ___|___     |     /
 * /   |   ____|____/
 *     |        |
 */

function clip$1(features, scale, k1, k2, axis, intersect, minAll, maxAll) {

    k1 /= scale;
    k2 /= scale;

    if (minAll >= k1 && maxAll <= k2) { return features; } // trivial accept
    else if (minAll > k2 || maxAll < k1) { return null; } // trivial reject

    var clipped = [];

    for (var i = 0; i < features.length; i++) {

        var feature = features[i],
            geometry = feature.geometry,
            type = feature.type,
            min, max;

        min = feature.min[axis];
        max = feature.max[axis];

        if (min >= k1 && max <= k2) { // trivial accept
            clipped.push(feature);
            continue;
        } else if (min > k2 || max < k1) { continue; } // trivial reject

        var slices = type === 1 ?
                clipPoints(geometry, k1, k2, axis) :
                clipGeometry(geometry, k1, k2, axis, intersect, type === 3);

        if (slices.length) {
            // if a feature got clipped, it will likely get clipped on the next zoom level as well,
            // so there's no need to recalculate bboxes
            clipped.push({
                geometry: slices,
                type: type,
                tags: features[i].tags || null,
                min: feature.min,
                max: feature.max
            });
        }
    }

    return clipped.length ? clipped : null;
}

function clipPoints(geometry, k1, k2, axis) {
    var slice = [];

    for (var i = 0; i < geometry.length; i++) {
        var a = geometry[i],
            ak = a[axis];

        if (ak >= k1 && ak <= k2) { slice.push(a); }
    }
    return slice;
}

function clipGeometry(geometry, k1, k2, axis, intersect, closed) {

    var slices = [];

    for (var i = 0; i < geometry.length; i++) {

        var ak = 0,
            bk = 0,
            b = null,
            points = geometry[i],
            area = points.area,
            dist = points.dist,
            outer = points.outer,
            len = points.length,
            a, j, last;

        var slice = [];

        for (j = 0; j < len - 1; j++) {
            a = b || points[j];
            b = points[j + 1];
            ak = bk || a[axis];
            bk = b[axis];

            if (ak < k1) {

                if ((bk > k2)) { // ---|-----|-->
                    slice.push(intersect(a, b, k1), intersect(a, b, k2));
                    if (!closed) { slice = newSlice(slices, slice, area, dist, outer); }

                } else if (bk >= k1) { slice.push(intersect(a, b, k1)); } // ---|-->  |

            } else if (ak > k2) {

                if ((bk < k1)) { // <--|-----|---
                    slice.push(intersect(a, b, k2), intersect(a, b, k1));
                    if (!closed) { slice = newSlice(slices, slice, area, dist, outer); }

                } else if (bk <= k2) { slice.push(intersect(a, b, k2)); } // |  <--|---

            } else {

                slice.push(a);

                if (bk < k1) { // <--|---  |
                    slice.push(intersect(a, b, k1));
                    if (!closed) { slice = newSlice(slices, slice, area, dist, outer); }

                } else if (bk > k2) { // |  ---|-->
                    slice.push(intersect(a, b, k2));
                    if (!closed) { slice = newSlice(slices, slice, area, dist, outer); }
                }
                // | --> |
            }
        }

        // add the last point
        a = points[len - 1];
        ak = a[axis];
        if (ak >= k1 && ak <= k2) { slice.push(a); }

        // close the polygon if its endpoints are not the same after clipping

        last = slice[slice.length - 1];
        if (closed && last && (slice[0][0] !== last[0] || slice[0][1] !== last[1])) { slice.push(slice[0]); }

        // add the final slice
        newSlice(slices, slice, area, dist, outer);
    }

    return slices;
}

function newSlice(slices, slice, area, dist, outer) {
    if (slice.length) {
        // we don't recalculate the area/length of the unclipped geometry because the case where it goes
        // below the visibility threshold as a result of clipping is rare, so we avoid doing unnecessary work
        slice.area = area;
        slice.dist = dist;
        if (outer !== undefined) { slice.outer = outer; }

        slices.push(slice);
    }
    return [];
}

var clip$2 = clip_1;

var wrap_1 = wrap$1;

function wrap$1(features, buffer, intersectX) {
    var merged = features,
        left  = clip$2(features, 1, -1 - buffer, buffer,     0, intersectX, -1, 2), // left world copy
        right = clip$2(features, 1,  1 - buffer, 2 + buffer, 0, intersectX, -1, 2); // right world copy

    if (left || right) {
        merged = clip$2(features, 1, -buffer, 1 + buffer, 0, intersectX, -1, 2); // center world copy

        if (left) { merged = shiftFeatureCoords(left, 1).concat(merged); } // merge left into center
        if (right) { merged = merged.concat(shiftFeatureCoords(right, -1)); } // merge right into center
    }

    return merged;
}

function shiftFeatureCoords(features, offset) {
    var newFeatures = [];

    for (var i = 0; i < features.length; i++) {
        var feature = features[i],
            type = feature.type;

        var newGeometry;

        if (type === 1) {
            newGeometry = shiftCoords(feature.geometry, offset);
        } else {
            newGeometry = [];
            for (var j = 0; j < feature.geometry.length; j++) {
                newGeometry.push(shiftCoords(feature.geometry[j], offset));
            }
        }

        newFeatures.push({
            geometry: newGeometry,
            type: type,
            tags: feature.tags,
            min: [feature.min[0] + offset, feature.min[1]],
            max: [feature.max[0] + offset, feature.max[1]]
        });
    }

    return newFeatures;
}

function shiftCoords(points, offset) {
    var newPoints = [];
    newPoints.area = points.area;
    newPoints.dist = points.dist;

    for (var i = 0; i < points.length; i++) {
        newPoints.push([points[i][0] + offset, points[i][1], points[i][2]]);
    }
    return newPoints;
}

var tile$1 = createTile$1;

function createTile$1(features, z2, tx, ty, tolerance, noSimplify) {
    var tile = {
        features: [],
        numPoints: 0,
        numSimplified: 0,
        numFeatures: 0,
        source: null,
        x: tx,
        y: ty,
        z2: z2,
        transformed: false,
        min: [2, 1],
        max: [-1, 0]
    };
    for (var i = 0; i < features.length; i++) {
        tile.numFeatures++;
        addFeature(tile, features[i], tolerance, noSimplify);

        var min = features[i].min,
            max = features[i].max;

        if (min[0] < tile.min[0]) { tile.min[0] = min[0]; }
        if (min[1] < tile.min[1]) { tile.min[1] = min[1]; }
        if (max[0] > tile.max[0]) { tile.max[0] = max[0]; }
        if (max[1] > tile.max[1]) { tile.max[1] = max[1]; }
    }
    return tile;
}

function addFeature(tile, feature, tolerance, noSimplify) {

    var geom = feature.geometry,
        type = feature.type,
        simplified = [],
        sqTolerance = tolerance * tolerance,
        i, j, ring, p;

    if (type === 1) {
        for (i = 0; i < geom.length; i++) {
            simplified.push(geom[i]);
            tile.numPoints++;
            tile.numSimplified++;
        }

    } else {

        // simplify and transform projected coordinates for tile geometry
        for (i = 0; i < geom.length; i++) {
            ring = geom[i];

            // filter out tiny polylines & polygons
            if (!noSimplify && ((type === 2 && ring.dist < tolerance) ||
                                (type === 3 && ring.area < sqTolerance))) {
                tile.numPoints += ring.length;
                continue;
            }

            var simplifiedRing = [];

            for (j = 0; j < ring.length; j++) {
                p = ring[j];
                // keep points with importance > tolerance
                if (noSimplify || p[2] > sqTolerance) {
                    simplifiedRing.push(p);
                    tile.numSimplified++;
                }
                tile.numPoints++;
            }

            if (type === 3) { rewind(simplifiedRing, ring.outer); }

            simplified.push(simplifiedRing);
        }
    }

    if (simplified.length) {
        tile.features.push({
            geometry: simplified,
            type: type,
            tags: feature.tags || null
        });
    }
}

function rewind(ring, clockwise) {
    var area = signedArea(ring);
    if (area < 0 === clockwise) { ring.reverse(); }
}

function signedArea(ring) {
    var sum = 0;
    for (var i = 0, len = ring.length, j = len - 1, p1, p2; i < len; j = i++) {
        p1 = ring[i];
        p2 = ring[j];
        sum += (p2[0] - p1[0]) * (p1[1] + p2[1]);
    }
    return sum;
}

var index = geojsonvt;

var convert = convert_1;
var transform = transform$1;
var clip = clip_1;
var wrap = wrap_1;
var createTile = tile$1;     // final simplified tile generation


function geojsonvt(data, options) {
    return new GeoJSONVT(data, options);
}

function GeoJSONVT(data, options) {
    options = this.options = extend(Object.create(this.options), options);

    var debug = options.debug;

    if (debug) { console.time('preprocess data'); }

    var z2 = 1 << options.maxZoom, // 2^z
        features = convert(data, options.tolerance / (z2 * options.extent));

    this.tiles = {};
    this.tileCoords = [];

    if (debug) {
        console.timeEnd('preprocess data');
        console.log('index: maxZoom: %d, maxPoints: %d', options.indexMaxZoom, options.indexMaxPoints);
        console.time('generate tiles');
        this.stats = {};
        this.total = 0;
    }

    features = wrap(features, options.buffer / options.extent, intersectX);

    // start slicing from the top tile down
    if (features.length) { this.splitTile(features, 0, 0, 0); }

    if (debug) {
        if (features.length) { console.log('features: %d, points: %d', this.tiles[0].numFeatures, this.tiles[0].numPoints); }
        console.timeEnd('generate tiles');
        console.log('tiles generated:', this.total, JSON.stringify(this.stats));
    }
}

GeoJSONVT.prototype.options = {
    maxZoom: 14,            // max zoom to preserve detail on
    indexMaxZoom: 5,        // max zoom in the tile index
    indexMaxPoints: 100000, // max number of points per tile in the tile index
    solidChildren: false,   // whether to tile solid square tiles further
    tolerance: 3,           // simplification tolerance (higher means simpler)
    extent: 4096,           // tile extent
    buffer: 64,             // tile buffer on each side
    debug: 0                // logging level (0, 1 or 2)
};

GeoJSONVT.prototype.splitTile = function (features, z, x, y, cz, cx, cy) {
    var this$1 = this;


    var stack = [features, z, x, y],
        options = this.options,
        debug = options.debug,
        solid = null;

    // avoid recursion by using a processing queue
    while (stack.length) {
        y = stack.pop();
        x = stack.pop();
        z = stack.pop();
        features = stack.pop();

        var z2 = 1 << z,
            id = toID(z, x, y),
            tile = this$1.tiles[id],
            tileTolerance = z === options.maxZoom ? 0 : options.tolerance / (z2 * options.extent);

        if (!tile) {
            if (debug > 1) { console.time('creation'); }

            tile = this$1.tiles[id] = createTile(features, z2, x, y, tileTolerance, z === options.maxZoom);
            this$1.tileCoords.push({z: z, x: x, y: y});

            if (debug) {
                if (debug > 1) {
                    console.log('tile z%d-%d-%d (features: %d, points: %d, simplified: %d)',
                        z, x, y, tile.numFeatures, tile.numPoints, tile.numSimplified);
                    console.timeEnd('creation');
                }
                var key = 'z' + z;
                this$1.stats[key] = (this$1.stats[key] || 0) + 1;
                this$1.total++;
            }
        }

        // save reference to original geometry in tile so that we can drill down later if we stop now
        tile.source = features;

        // if it's the first-pass tiling
        if (!cz) {
            // stop tiling if we reached max zoom, or if the tile is too simple
            if (z === options.indexMaxZoom || tile.numPoints <= options.indexMaxPoints) { continue; }

        // if a drilldown to a specific tile
        } else {
            // stop tiling if we reached base zoom or our target tile zoom
            if (z === options.maxZoom || z === cz) { continue; }

            // stop tiling if it's not an ancestor of the target tile
            var m = 1 << (cz - z);
            if (x !== Math.floor(cx / m) || y !== Math.floor(cy / m)) { continue; }
        }

        // stop tiling if the tile is solid clipped square
        if (!options.solidChildren && isClippedSquare(tile, options.extent, options.buffer)) {
            if (cz) { solid = z; } // and remember the zoom if we're drilling down
            continue;
        }

        // if we slice further down, no need to keep source geometry
        tile.source = null;

        if (debug > 1) { console.time('clipping'); }

        // values we'll use for clipping
        var k1 = 0.5 * options.buffer / options.extent,
            k2 = 0.5 - k1,
            k3 = 0.5 + k1,
            k4 = 1 + k1,
            tl, bl, tr, br, left, right;

        tl = bl = tr = br = null;

        left  = clip(features, z2, x - k1, x + k3, 0, intersectX, tile.min[0], tile.max[0]);
        right = clip(features, z2, x + k2, x + k4, 0, intersectX, tile.min[0], tile.max[0]);

        if (left) {
            tl = clip(left, z2, y - k1, y + k3, 1, intersectY, tile.min[1], tile.max[1]);
            bl = clip(left, z2, y + k2, y + k4, 1, intersectY, tile.min[1], tile.max[1]);
        }

        if (right) {
            tr = clip(right, z2, y - k1, y + k3, 1, intersectY, tile.min[1], tile.max[1]);
            br = clip(right, z2, y + k2, y + k4, 1, intersectY, tile.min[1], tile.max[1]);
        }

        if (debug > 1) { console.timeEnd('clipping'); }

        if (tl) { stack.push(tl, z + 1, x * 2,     y * 2); }
        if (bl) { stack.push(bl, z + 1, x * 2,     y * 2 + 1); }
        if (tr) { stack.push(tr, z + 1, x * 2 + 1, y * 2); }
        if (br) { stack.push(br, z + 1, x * 2 + 1, y * 2 + 1); }
    }

    return solid;
};

GeoJSONVT.prototype.getTile = function (z, x, y) {
    var this$1 = this;

    var options = this.options,
        extent = options.extent,
        debug = options.debug;

    var z2 = 1 << z;
    x = ((x % z2) + z2) % z2; // wrap tile x coordinate

    var id = toID(z, x, y);
    if (this.tiles[id]) { return transform.tile(this.tiles[id], extent); }

    if (debug > 1) { console.log('drilling down to z%d-%d-%d', z, x, y); }

    var z0 = z,
        x0 = x,
        y0 = y,
        parent;

    while (!parent && z0 > 0) {
        z0--;
        x0 = Math.floor(x0 / 2);
        y0 = Math.floor(y0 / 2);
        parent = this$1.tiles[toID(z0, x0, y0)];
    }

    if (!parent || !parent.source) { return null; }

    // if we found a parent tile containing the original geometry, we can drill down from it
    if (debug > 1) { console.log('found parent tile z%d-%d-%d', z0, x0, y0); }

    // it parent tile is a solid clipped square, return it instead since it's identical
    if (isClippedSquare(parent, extent, options.buffer)) { return transform.tile(parent, extent); }

    if (debug > 1) { console.time('drilling down'); }
    var solid = this.splitTile(parent.source, z0, x0, y0, z, x, y);
    if (debug > 1) { console.timeEnd('drilling down'); }

    // one of the parent tiles was a solid clipped square
    if (solid !== null) {
        var m = 1 << (z - solid);
        id = toID(solid, Math.floor(x / m), Math.floor(y / m));
    }

    return this.tiles[id] ? transform.tile(this.tiles[id], extent) : null;
};

function toID(z, x, y) {
    return (((1 << z) * y + x) * 32) + z;
}

function intersectX(a, b, x) {
    return [x, (x - a[0]) * (b[1] - a[1]) / (b[0] - a[0]) + a[1], 1];
}
function intersectY(a, b, y) {
    return [(y - a[1]) * (b[0] - a[0]) / (b[1] - a[1]) + a[0], y, 1];
}

function extend(dest, src) {
    for (var i in src) { dest[i] = src[i]; }
    return dest;
}

// checks whether a tile is a whole-area fill after clipping; if it is, there's no sense slicing it further
function isClippedSquare(tile, extent, buffer) {

    var features = tile.source;
    if (features.length !== 1) { return false; }

    var feature = features[0];
    if (feature.type !== 3 || feature.geometry.length > 1) { return false; }

    var len = feature.geometry[0].length;
    if (len !== 5) { return false; }

    for (var i = 0; i < len; i++) {
        var p = transform.point(feature.geometry[0][i], extent, tile.z2, tile.x, tile.y);
        if ((p[0] !== -buffer && p[0] !== extent + buffer) ||
            (p[1] !== -buffer && p[1] !== extent + buffer)) { return false; }
    }

    return true;
}

var identity = function(x) {
  return x;
};

var transform$3 = function(topology) {
  if ((transform = topology.transform) == null) { return identity; }
  var transform,
      x0,
      y0,
      kx = transform.scale[0],
      ky = transform.scale[1],
      dx = transform.translate[0],
      dy = transform.translate[1];
  return function(point, i) {
    if (!i) { x0 = y0 = 0; }
    point[0] = (x0 += point[0]) * kx + dx;
    point[1] = (y0 += point[1]) * ky + dy;
    return point;
  };
};

var bbox = function(topology) {
  var bbox = topology.bbox;

  function bboxPoint(p0) {
    p1[0] = p0[0], p1[1] = p0[1], t(p1);
    if (p1[0] < x0) { x0 = p1[0]; }
    if (p1[0] > x1) { x1 = p1[0]; }
    if (p1[1] < y0) { y0 = p1[1]; }
    if (p1[1] > y1) { y1 = p1[1]; }
  }

  function bboxGeometry(o) {
    switch (o.type) {
      case "GeometryCollection": o.geometries.forEach(bboxGeometry); break;
      case "Point": bboxPoint(o.coordinates); break;
      case "MultiPoint": o.coordinates.forEach(bboxPoint); break;
    }
  }

  if (!bbox) {
    var t = transform$3(topology), p0, p1 = new Array(2), name,
        x0 = Infinity, y0 = x0, x1 = -x0, y1 = -x0;

    topology.arcs.forEach(function(arc) {
      var i = -1, n = arc.length;
      while (++i < n) {
        p0 = arc[i], p1[0] = p0[0], p1[1] = p0[1], t(p1, i);
        if (p1[0] < x0) { x0 = p1[0]; }
        if (p1[0] > x1) { x1 = p1[0]; }
        if (p1[1] < y0) { y0 = p1[1]; }
        if (p1[1] > y1) { y1 = p1[1]; }
      }
    });

    for (name in topology.objects) {
      bboxGeometry(topology.objects[name]);
    }

    bbox = topology.bbox = [x0, y0, x1, y1];
  }

  return bbox;
};

var reverse = function(array, n) {
  var t, j = array.length, i = j - n;
  while (i < --j) { t = array[i], array[i++] = array[j], array[j] = t; }
};

var feature = function(topology, o) {
  return o.type === "GeometryCollection"
      ? {type: "FeatureCollection", features: o.geometries.map(function(o) { return feature$1(topology, o); })}
      : feature$1(topology, o);
};

function feature$1(topology, o) {
  var id = o.id,
      bbox = o.bbox,
      properties = o.properties == null ? {} : o.properties,
      geometry = object(topology, o);
  return id == null && bbox == null ? {type: "Feature", properties: properties, geometry: geometry}
      : bbox == null ? {type: "Feature", id: id, properties: properties, geometry: geometry}
      : {type: "Feature", id: id, bbox: bbox, properties: properties, geometry: geometry};
}

function object(topology, o) {
  var transformPoint = transform$3(topology),
      arcs = topology.arcs;

  function arc(i, points) {
    if (points.length) { points.pop(); }
    for (var a = arcs[i < 0 ? ~i : i], k = 0, n = a.length; k < n; ++k) {
      points.push(transformPoint(a[k].slice(), k));
    }
    if (i < 0) { reverse(points, n); }
  }

  function point(p) {
    return transformPoint(p.slice());
  }

  function line(arcs) {
    var points = [];
    for (var i = 0, n = arcs.length; i < n; ++i) { arc(arcs[i], points); }
    if (points.length < 2) { points.push(points[0].slice()); }
    return points;
  }

  function ring(arcs) {
    var points = line(arcs);
    while (points.length < 4) { points.push(points[0].slice()); }
    return points;
  }

  function polygon(arcs) {
    return arcs.map(ring);
  }

  function geometry(o) {
    var type = o.type, coordinates;
    switch (type) {
      case "GeometryCollection": return {type: type, geometries: o.geometries.map(geometry)};
      case "Point": coordinates = point(o.coordinates); break;
      case "MultiPoint": coordinates = o.coordinates.map(point); break;
      case "LineString": coordinates = line(o.arcs); break;
      case "MultiLineString": coordinates = o.arcs.map(line); break;
      case "Polygon": coordinates = polygon(o.arcs); break;
      case "MultiPolygon": coordinates = o.arcs.map(polygon); break;
      default: return null;
    }
    return {type: type, coordinates: coordinates};
  }

  return geometry(o);
}

var stitch = function(topology, arcs) {
  var stitchedArcs = {},
      fragmentByStart = {},
      fragmentByEnd = {},
      fragments = [],
      emptyIndex = -1;

  // Stitch empty arcs first, since they may be subsumed by other arcs.
  arcs.forEach(function(i, j) {
    var arc = topology.arcs[i < 0 ? ~i : i], t;
    if (arc.length < 3 && !arc[1][0] && !arc[1][1]) {
      t = arcs[++emptyIndex], arcs[emptyIndex] = i, arcs[j] = t;
    }
  });

  arcs.forEach(function(i) {
    var e = ends(i),
        start = e[0],
        end = e[1],
        f, g;

    if (f = fragmentByEnd[start]) {
      delete fragmentByEnd[f.end];
      f.push(i);
      f.end = end;
      if (g = fragmentByStart[end]) {
        delete fragmentByStart[g.start];
        var fg = g === f ? f : f.concat(g);
        fragmentByStart[fg.start = f.start] = fragmentByEnd[fg.end = g.end] = fg;
      } else {
        fragmentByStart[f.start] = fragmentByEnd[f.end] = f;
      }
    } else if (f = fragmentByStart[end]) {
      delete fragmentByStart[f.start];
      f.unshift(i);
      f.start = start;
      if (g = fragmentByEnd[start]) {
        delete fragmentByEnd[g.end];
        var gf = g === f ? f : g.concat(f);
        fragmentByStart[gf.start = g.start] = fragmentByEnd[gf.end = f.end] = gf;
      } else {
        fragmentByStart[f.start] = fragmentByEnd[f.end] = f;
      }
    } else {
      f = [i];
      fragmentByStart[f.start = start] = fragmentByEnd[f.end = end] = f;
    }
  });

  function ends(i) {
    var arc = topology.arcs[i < 0 ? ~i : i], p0 = arc[0], p1;
    if (topology.transform) { p1 = [0, 0], arc.forEach(function(dp) { p1[0] += dp[0], p1[1] += dp[1]; }); }
    else { p1 = arc[arc.length - 1]; }
    return i < 0 ? [p1, p0] : [p0, p1];
  }

  function flush(fragmentByEnd, fragmentByStart) {
    for (var k in fragmentByEnd) {
      var f = fragmentByEnd[k];
      delete fragmentByStart[f.start];
      delete f.start;
      delete f.end;
      f.forEach(function(i) { stitchedArcs[i < 0 ? ~i : i] = 1; });
      fragments.push(f);
    }
  }

  flush(fragmentByEnd, fragmentByStart);
  flush(fragmentByStart, fragmentByEnd);
  arcs.forEach(function(i) { if (!stitchedArcs[i < 0 ? ~i : i]) { fragments.push([i]); } });

  return fragments;
};

function extractArcs(topology, object$$1, filter) {
  var arcs = [],
      geomsByArc = [],
      geom;

  function extract0(i) {
    var j = i < 0 ? ~i : i;
    (geomsByArc[j] || (geomsByArc[j] = [])).push({i: i, g: geom});
  }

  function extract1(arcs) {
    arcs.forEach(extract0);
  }

  function extract2(arcs) {
    arcs.forEach(extract1);
  }

  function extract3(arcs) {
    arcs.forEach(extract2);
  }

  function geometry(o) {
    switch (geom = o, o.type) {
      case "GeometryCollection": o.geometries.forEach(geometry); break;
      case "LineString": extract1(o.arcs); break;
      case "MultiLineString": case "Polygon": extract2(o.arcs); break;
      case "MultiPolygon": extract3(o.arcs); break;
    }
  }

  geometry(object$$1);

  geomsByArc.forEach(filter == null
      ? function(geoms) { arcs.push(geoms[0].i); }
      : function(geoms) { if (filter(geoms[0].g, geoms[geoms.length - 1].g)) { arcs.push(geoms[0].i); } });

  return arcs;
}

function planarRingArea(ring) {
  var i = -1, n = ring.length, a, b = ring[n - 1], area = 0;
  while (++i < n) { a = b, b = ring[i], area += a[0] * b[1] - a[1] * b[0]; }
  return Math.abs(area); // Note: doubled area!
}

var bisect = function(a, x) {
  var lo = 0, hi = a.length;
  while (lo < hi) {
    var mid = lo + hi >>> 1;
    if (a[mid] < x) { lo = mid + 1; }
    else { hi = mid; }
  }
  return lo;
};

var slicers = {};
var options;

onmessage = function (e) {
	if (e.data[0] === 'slice') {
		// Given a blob of GeoJSON and some topojson/geojson-vt options, do the slicing.
		var geojson = e.data[1];
		options     = e.data[2];

		if (geojson.type && geojson.type === 'Topology') {
			for (var layerName in geojson.objects) {
				slicers[layerName] = index(
					feature(geojson, geojson.objects[layerName])
				, options);
			}
		} else {
			slicers[options.vectorTileLayerName] = index(geojson, options);
		}

	} else if (e.data[0] === 'get') {
		// Gets the vector tile for the given coordinates, sends it back as a message
		var coords = e.data[1];

		var tileLayers = {};
		for (var layerName in slicers) {
			var slicedTileLayer = slicers[layerName].getTile(coords.z, coords.x, coords.y);

			if (slicedTileLayer) {
				var vectorTileLayer = {
					features: [],
					extent: options.extent,
					name: options.vectorTileLayerName,
					length: slicedTileLayer.features.length
				};

				for (var i in slicedTileLayer.features) {
					var feat = {
						geometry: slicedTileLayer.features[i].geometry,
						properties: slicedTileLayer.features[i].tags,
						type: slicedTileLayer.features[i].type	// 1 = point, 2 = line, 3 = polygon
					};
					vectorTileLayer.features.push(feat);
				}
				tileLayers[layerName] = vectorTileLayer;
			}
		}
		postMessage({ layers: tileLayers, coords: coords });
	}
};
//# sourceMappingURL=slicerWebWorker.js.worker.map
`,"text/plain; charset=us-ascii");L.VectorGrid.Slicer=L.VectorGrid.extend({options:{vectorTileLayerName:"sliced",extent:4096,maxZoom:14},initialize:function(t,n){L.VectorGrid.prototype.initialize.call(this,n);var n={};for(var i in this.options)i!=="rendererFactory"&&i!=="vectorTileLayerStyles"&&typeof this.options[i]!="function"&&(n[i]=this.options[i]);this._worker=new Worker(Lt),this._worker.postMessage(["slice",t,n])},_getVectorTilePromise:function(t){var e=this,n=new Promise(function(r){e._worker.addEventListener("message",function a(s){s.data.coords&&s.data.coords.x===t.x&&s.data.coords.y===t.y&&s.data.coords.z===t.z&&(r(s.data),e._worker.removeEventListener("message",a))})});return this._worker.postMessage(["get",t]),n}}),L.vectorGrid.slicer=function(t,e){return new L.VectorGrid.Slicer(t,e)},L.Canvas.Tile=L.Canvas.extend({initialize:function(t,e,n){L.Canvas.prototype.initialize.call(this,n),this._tileCoord=t,this._size=e,this._initContainer(),this._container.setAttribute("width",this._size.x),this._container.setAttribute("height",this._size.y),this._layers={},this._drawnLayers={},this._drawing=!0,n.interactive&&(this._container.style.pointerEvents="auto")},getCoord:function(){return this._tileCoord},getContainer:function(){return this._container},getOffset:function(){return this._tileCoord.scaleBy(this._size).subtract(this._map.getPixelOrigin())},onAdd:L.Util.falseFn,addTo:function(t){this._map=t},removeFrom:function(t){delete this._map},_onClick:function(t){var e=this._map.mouseEventToLayerPoint(t).subtract(this.getOffset()),n,i;for(var r in this._layers)n=this._layers[r],n.options.interactive&&n._containsPoint(e)&&!this._map._draggableMoved(n)&&(i=n);i&&(L.DomEvent.fakeStop(t),this._fireEvent([i],t))},_onMouseMove:function(t){if(!(!this._map||this._map.dragging.moving()||this._map._animatingZoom)){var e=this._map.mouseEventToLayerPoint(t).subtract(this.getOffset());this._handleMouseHover(t,e)}},_updateIcon:function(t){if(this._drawing){var e=t.options.icon,n=e.options,i=L.point(n.iconSize),r=n.iconAnchor||i&&i.divideBy(2,!0),a=t._point.subtract(r),s=this._ctx,u=t._getImage();u.complete?s.drawImage(u,a.x,a.y,i.x,i.y):L.DomEvent.on(u,"load",function(){s.drawImage(u,a.x,a.y,i.x,i.y)}),this._drawnLayers[t._leaflet_id]=t}}}),L.canvas.tile=function(t,e,n){return new L.Canvas.Tile(t,e,n)}})();
