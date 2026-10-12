import test from 'node:test';
import assert from 'node:assert/strict';
import {nextClue,swipeDirection} from '../../src/ui/bordbook.mjs';
test('book cycles through all clues forward and backward',()=>{
 assert.equal(nextClue(0,-1,7),6);assert.equal(nextClue(6,1,7),0);
 let i=0;const visited=[];for(let n=0;n<7;n++){visited.push(i);i=nextClue(i,1,7);}
 assert.deepEqual(visited,[0,1,2,3,4,5,6]);assert.equal(i,0);
});
test('book swipe ignores short, vertical and diagonal scroll gestures',()=>{
 assert.equal(swipeDirection(-100,5),1);assert.equal(swipeDirection(100,-5),-1);
 assert.equal(swipeDirection(-35,0),0);assert.equal(swipeDirection(-100,100),0);
 assert.equal(swipeDirection(2,130),0);
});
