import {test} from 'node:test';
import assert from 'node:assert/strict';
import {zoomAt,panBy,fitViewport,partsInBox} from '../src/viewport.js';
test('pointer zoom keeps the drawing point underneath cursor fixed',()=>{
 const v={x:10,y:20,width:100,height:60};const z=zoomAt(v,2,.25,.75);assert.equal(z.x+z.width*.25,35);assert.equal(z.y+z.height*.75,65);assert.equal(z.width,50);
});
test('pan follows drag without moving drawing geometry',()=>{assert.deepEqual(panBy({x:0,y:0,width:100,height:60},10,-5),{x:-10,y:5,width:100,height:60});});
test('fit all includes negative and positive coordinates with margins',()=>{const v=fitViewport([-20,-30,80,40]);assert(v.x<-20&&v.y<-30&&v.x+v.width>80&&v.y+v.height>40);});

test('marquee selects intersecting letters independent of drag direction',()=>{
 const parts=[{id:'a',bounds:[0,0,10,10]},{id:'b',bounds:[20,0,30,10]},{id:'c',bounds:[50,0,60,10]}];
 assert.deepEqual(partsInBox(parts,[-2,-2],[32,12]),['a','b']);assert.deepEqual(partsInBox(parts,[32,12],[-2,-2]),['a','b']);
});
