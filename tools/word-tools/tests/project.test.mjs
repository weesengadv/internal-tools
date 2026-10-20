import {test} from 'node:test';
import assert from 'node:assert/strict';
import {linkedMove,moveWireHole,deleteWireHole,addHole,deleteHole,syncHoleLayout,changeParameter,totalHeight} from '../src/project.js';
const p={parameters:{linkMatching:true,baseThickness:1,height:30,heightMode:'total'},stage:'2d',modelReady:true,parts:[{id:'a',group:'g',bounds:[0,0,10,10],holes:[{id:'h',x:5,y:5}]},{id:'b',group:'g',bounds:[20,10,30,20],holes:[{id:'h',x:25,y:15}]}]};
test('linked drag preserves exact relative positions and marks model stale',()=>{const n=linkedMove(p,'a','h',6,7);assert.deepEqual([n.parts[1].holes[0].x,n.parts[1].holes[0].y],[26,17]);assert.equal(n.modelReady,false);assert.equal(p.parts[0].holes[0].x,5);});
test('single instance move leaves matching copy untouched',()=>{const n=linkedMove({...p,parameters:{...p.parameters,linkMatching:false}},'a','h',6,7);assert.equal(n.parts[1].holes[0].x,25);});
test('height-only edit does not invalidate reviewed 2d',()=>{const n=changeParameter(p,'height',31);assert.equal(n.stage,'2d');assert.equal(n.modelReady,false);assert.equal(totalHeight(n.parameters),31);assert.equal(totalHeight({...n.parameters,heightMode:'wall'}),32);});
test('wall changes invalidate derived outlines',()=>assert.equal(changeParameter(p,'wallThickness',1).stage,'dirty'));
test('linked edits follow geometric correspondence rather than hole array order',()=>{
 const q={...p,parts:[{id:'a',group:'g',bounds:[0,0,10,10],holes:[{id:'h1',x:3,y:3},{id:'h2',x:7,y:7}]},{id:'b',group:'g',bounds:[20,10,30,20],holes:[{id:'other2',x:27,y:17},{id:'other1',x:23,y:13}]}]};
 const result=linkedMove(q,'a','h1',4,3);assert.equal(result.parts[1].holes[0].x,27);assert.equal(result.parts[1].holes[1].x,24);
});
test('different imported hole patterns are not silently linked by index',()=>{
 const q={...p,parts:[p.parts[0],{...p.parts[1],holes:[{id:'other',x:28,y:18}]}]};
 const result=linkedMove(q,'a','h',6,7);assert.equal(result.parts[1].holes[0].x,28);
});

test('deleting a linked screw matches positions, retains other holes and preserves source',()=>{
 const q={...p,parts:[{id:'a',group:'g',bounds:[0,0,10,10],holes:[{id:'h1',x:3,y:3},{id:'h2',x:7,y:7}]},{id:'b',group:'g',bounds:[20,10,30,20],holes:[{id:'other2',x:27,y:17},{id:'other1',x:23,y:13}]}]};
 const n=deleteHole(q,'a','h1');assert.deepEqual(n.parts.map(v=>v.holes.map(h=>h.id)),[['h2'],['other2']]);assert.equal(n.modelReady,false);assert.equal(q.parts[0].holes.length,2);
});
test('unlink deletion affects only selected instance and records deliberate holeless layout',()=>{
 const n=deleteHole({...p,parameters:{...p.parameters,linkMatching:false}},'a','h');assert.equal(n.parts[1].holes.length,1);assert.equal(n.parts[0].manualHoleLayout,true);assert.equal(n.parts[0].allowHoleless,true);
});
test('explicit template application replaces mismatched copies at relative coordinates',()=>{
 const q={...p,parts:[p.parts[0],{...p.parts[1],holes:[{id:'different',x:28,y:18}]},{id:'c',group:'other',bounds:[0,0,10,10],holes:[]}]};
 const n=syncHoleLayout(q,'a');assert.deepEqual(n.parts[1].holes.map(h=>[h.x,h.y]),[[25,15]]);assert.equal(n.parts[2].holes.length,0);assert.equal(q.parts[1].holes[0].x,28);
});

test('different hole diameters require explicit sync rather than linked movement',()=>{
 const q={...p,parts:[{...p.parts[0],holes:[{...p.parts[0].holes[0],diameter:4}]},{...p.parts[1],holes:[{...p.parts[1].holes[0],diameter:5}]}]};
 const n=linkedMove(q,'a','h',6,7);assert.equal(n.parts[1].holes[0].x,25);
});

test('manual add appends a unique screw and links compatible copies',()=>{
 const q={...p,parameters:{...p.parameters,screwDiameter:4},parts:p.parts.map(v=>({...v,holes:v.holes.map(h=>({...h,diameter:4}))}))};
 const n=addHole(q,'a',3,3);assert.equal(n.parts[0].holes.length,2);assert.equal(n.parts[1].holes.length,2);assert.deepEqual(n.parts[1].holes.slice(-1).map(h=>[h.x,h.y,h.diameter]),[[23,13,4]]);assert.equal(q.parts[0].holes.length,1);assert.equal(n.modelReady,false);
});

test('wire move links compatible copies and deletion leaves screw layouts intact',()=>{
 const q=structuredClone(p);q.parameters.wireEnabled=true;q.parts.forEach(part=>part.wireHoles=[{id:'wire1',x:part.bounds[0]+5,y:part.bounds[1]+5,diameter:6}]);
 const n=moveWireHole(q,'a','wire1',6,7);assert.deepEqual([n.parts[1].wireHoles[0].x,n.parts[1].wireHoles[0].y],[26,17]);assert.deepEqual(n.parts[0].holes,q.parts[0].holes);
 const removed=deleteWireHole(n,'a');assert.equal(removed.parts[0].wireOmit,true);assert.equal(removed.parts[0].wireHoles.length,0);assert.equal(removed.parts[1].wireHoles.length,1);
});
