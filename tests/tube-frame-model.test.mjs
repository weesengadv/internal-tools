import test from 'node:test';
import assert from 'node:assert/strict';
import {newProject,newObject,resolveProject,toReference,fromReference,expandHoles,snapHole,readProject} from '../src/tube-frame/model.mjs';
test('frame reference conversion preserves 600 outside',()=>{
 assert.equal(toReference(600,38.1,'centre'),561.9);
 assert.equal(toReference(600,38.1,'inside'),523.8);
 assert.equal(fromReference(523.8,38.1,'inside'),600);
});
test('mitre vs butt changes cut lengths, not frame outside dimensions',()=>{
 const p=newProject();const f=newObject('frame',1);p.objects=[f];
 let parts=resolveProject(p);assert.deepEqual(parts.map(m=>m.length),[600,600,600,600]);
 f.joint='butt';parts=resolveProject(p);assert.deepEqual(parts.map(m=>Math.round(m.length*10)/10),[600,600,523.8,523.8]);
});
test('hole face, through mode and pattern expanded independently',()=>{
 const holes=expandHoles({mode:'pattern',count:3,pitch:100,start:40,diameter:19.05,face:'B',cut:'through',shape:'circle',offset:0},300);
 assert.deepEqual(holes.map(h=>h.z),[40,140,240]);assert.ok(holes.every(h=>h.face==='B'&&h.cut==='through'));
});
test('invalid holes block geometry rather than silently move',()=>{
 const p=newProject();p.objects[0].holeSets.main={mode:'single',start:2,diameter:19.05,face:'A',cut:'single',shape:'circle',offset:0};
 assert.throws(()=>resolveProject(p),/hole|opening/i);
});
test('hole attached to named end updates after member resizing',()=>{
 const p=newProject();p.objects[0].holeSets.main={mode:'single',start:40,reference:'end',diameter:10,face:'C',cut:'single',shape:'circle',offset:0};
 assert.equal(resolveProject(p)[0].holes[0].z,960);p.objects[0].length=800;assert.equal(resolveProject(p)[0].holes[0].z,760);
});
test('magnet off keeps exact position and on snaps to centreline',()=>{
 assert.deepEqual(snapHole({z:42.3,x:1},false,5,3,[]),{z:42.3,x:1,guide:''});
 assert.equal(snapHole({z:42.3,x:1},true,5,3,[]).x,0);
});
test('fold is one trial blank with three reliefs',()=>{
 const p=newProject(),f=newObject('frame',1);f.joint='fold';p.objects=[f];const parts=resolveProject(p);
 assert.equal(parts.length,1);assert.equal(parts[0].fold.centres.length,3);assert.equal(parts[0].trial,true);
 assert.ok(Math.abs(parts[0].length-2393.516813487)<1e-6);
});
test('pass-through support uses its smaller section and opens the receiving walls',()=>{
 const p=newProject(),f=newObject('frame',1);f.supports=[{id:'S1',type:'vertical',offset:300,joint:'pass',opening:20,profile:{shape:'square',width:19.05,depth:19.05,wall:1.2,radius:1.2}}];p.objects=[f];
 const parts=resolveProject(p);assert.equal(parts.at(-1).profile.width,19.05);assert.equal(parts[0].holes[0].cut,'through');assert.equal(parts[0].holes[0].width,19.05);
});
test('invalid geometry draft can be reopened for correction',()=>{
 const p=newProject();p.objects[0].length=0;assert.equal(readProject(JSON.parse(JSON.stringify(p))).objects[0].length,0);
 assert.throws(()=>resolveProject(p),/length/i);
});
test('even positions use named start reference and fixed last end distance',()=>{
 const holes=expandHoles({mode:'pattern',spacing:'even',count:3,start:960,last:40,reference:'end',diameter:10},1000);
 assert.deepEqual(holes.map(h=>h.z),[40,500,960]);
});
test('one member can retain independent opening groups on different faces',()=>{
 const p=newProject();p.objects[0].holeSets.main=[{mode:'single',start:40,diameter:10,face:'A',cut:'single'},{mode:'single',start:90,diameter:8,face:'B',cut:'through'}];
 const holes=resolveProject(p)[0].holes;assert.equal(holes.length,2);assert.deepEqual(holes.map(h=>h.face),['A','B']);
});
test('mitred frame front-wall opening is checked at its actual wall position',()=>{
 const p=newProject(),f=newObject('frame');p.objects=[f];f.holeSets.left={mode:'single',start:40,diameter:19.05,face:'A',cut:'single',offset:0};
 assert.equal(resolveProject(p).find(m=>m.key==='left').holes.length,1);
 f.holeSets.left.face='B';assert.throws(()=>resolveProject(p),/hole/i);
});
test('changed support topology cannot silently discard a member opening',()=>{
 const p=newProject(),f=newObject('frame');p.objects=[f];f.holeSets.oldSupport={mode:'single',start:50,diameter:10,face:'A',cut:'single'};
 assert.throws(()=>resolveProject(p),/unassigned/i);
});
