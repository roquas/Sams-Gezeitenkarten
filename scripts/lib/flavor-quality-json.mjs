// JSON.parse accepts duplicate object keys. A transport envelope must be unambiguous.
import assert from 'node:assert/strict';
import {TextDecoder} from 'node:util';
export function parseQualityResponse(bytes){
 assert.ok(Buffer.isBuffer(bytes)&&bytes.length<=16*1024*1024,'flavor quality: response must be exact UTF-8 bytes, at most 16 MiB');
 const source=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
 // Let the native parser own JSON grammar, numeric validity and escape decoding.
 const parsed=JSON.parse(source);let at=0;
 const space=()=>{while(/\s/.test(source[at]??'')&&at<source.length)at++;};
 const string=()=>{const start=at++;while(at<source.length){const c=source[at++];if(c==='\\')at++;else if(c==='"')break;}return JSON.parse(source.slice(start,at));};
 function value(depth){
  assert.ok(depth<=64,'flavor quality: response nesting exceeds 64');space();const c=source[at];
  if(c==='"'){string();return;}
  if(c==='{'){
   at++;space();const keys=new Set();
   if(source[at]==='}'){at++;return;}
   while(at<source.length){space();const key=string();assert.ok(!keys.has(key),'flavor quality: duplicate JSON key '+key);keys.add(key);space();at++;value(depth+1);space();if(source[at++]==='}')return;}
  }else if(c==='['){
   at++;space();if(source[at]===']'){at++;return;}
   while(at<source.length){value(depth+1);space();if(source[at++]===']')return;}
  }else{while(at<source.length&&!/[\s,\]}]/.test(source[at]))at++;}
 }
 value(0);return parsed;
}
