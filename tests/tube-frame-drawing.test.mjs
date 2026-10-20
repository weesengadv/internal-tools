import test from 'node:test';
import assert from 'node:assert/strict';
import {endCutOutline,wallDrawing} from '../src/tube-frame/drawing.mjs';
const member={id:'T1-main',length:600,profile:{shape:'square',width:38.1,depth:38.1,wall:1.2,radius:1.2},cuts:{start:45,end:60}};
test('front wall outline follows both physical angled end planes',()=>{
 const p=endCutOutline(member,'A',38.1);
 assert.ok(Math.abs(p[0].z)<1e-8);
 assert.ok(Math.abs(p[1].z-38.1)<1e-8);
 assert.ok(Math.abs(p[2].z-(600-38.1*Math.tan(Math.PI/3)))<1e-8);
 assert.equal(p[3].z,600);
});
test('negative angles reverse the short edge and side faces keep their true boundaries',()=>{
 const p=endCutOutline({...member,cuts:{start:-45,end:0}},'A',38.1);
 assert.ok(Math.abs(p[0].z-38.1)<1e-8);assert.ok(Math.abs(p[1].z)<1e-8);
 const b=endCutOutline(member,'B',38.1);assert.equal(b[0].z,b[1].z);
});
test('drawing visibly labels end angles and contains cut profile details',()=>{
 const s=wallDrawing(member,[]).svg;assert.match(s,/Start 45°/);assert.match(s,/End 60°/);
 assert.match(s,/End cut detail/);assert.match(s,/<polygon[^>]*class="tf-wall"/);
 assert.match(wallDrawing(member,[],0,'','cn').svg,/起点 45°/);
});
