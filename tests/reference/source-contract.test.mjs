// Source-contract smoke tests for the unchanged HTML. NOT browser interaction tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../../prototypes/3.6/index.html',import.meta.url),'utf8');
const has=(fragment)=>assert.ok(html.includes(fragment),'missing source contract: '+fragment);
test('original HTML retains state defaults and storage key',()=>{
  has('const initial=()=>({layer:1,tool:"maybe"');
  has('localStorage.getItem("gezeitenkarten-fall5-v1")');
  has('localStorage.setItem("gezeitenkarten-fall5-v1"');
  has('history.length>100');
});
test('marks keyed by hour and cell; all-hour erase',()=>{
  has('const key=(layer,id)=>layer+":"+id');
  has('state.tool==="clearAll"');
  has('k.endsWith(":"+id)');
  has('state.tool==="erase"?undefined:state.tool');
});
test('route validation and backstep remain present',()=>{
  has('state.route.length>=7||state.route.includes(id)||!neighbor(state.route.at(-1),id)');
  has('state.route.pop()');
  has('state.route.join("|")===solution.join("|")');
});
test('distance mode, hidden hours, route labels retained',()=>{
  has('state.distanceMode=!state.distanceMode;state.distanceOrigin=null');
  has('state.distanceOrigin=id');
  has('state.hiddenHours=[...h]');
  has('state.showRouteNumbers=!state.showRouteNumbers');
});
test('penalty and reset actions retained',()=>{
  has('state.penalty+=5');
  has('state.penalty+=10');
  has('state=initial();history=[];render()');
});
