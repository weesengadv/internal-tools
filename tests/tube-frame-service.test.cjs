const {test}=require('node:test');const assert=require('node:assert/strict');
const {createTubeFrameService}=require('../src/server/tube-frame-service.cjs');
test('detects real FreeCAD and rejects malformed geometry jobs',async()=>{
 const service=createTubeFrameService({configDir:require('node:os').tmpdir()});
 const status=await service.detect();assert.equal(status.available,true);assert.match(status.version,/1\./);
 await assert.rejects(service.generate({format:'wrong',objects:[]}),/Project|supported|needs/i);
});
test('real worker makes IGS and mesh for a one-wall hole',async()=>{
 const {newProject}=await import('../src/tube-frame/model.mjs');const p=newProject();p.objects[0].length=200;
 p.objects[0].holeSets.main={mode:'single',start:40,diameter:19.05,face:'A',cut:'single',shape:'circle',offset:0};
 const r=await createTubeFrameService({configDir:require('node:os').tmpdir()}).generate(p);
 assert.equal(r.parts.length,1);assert.ok(r.parts[0].igs.length>1000);assert.ok(r.parts[0].vertices.length>10);
 assert.equal(r.parts[0].checks.valid,true);assert.equal(r.parts[0].checks.solids,1);
 assert.equal(r.parts[0].checks.holes[0].entryRemoved,true);assert.equal(r.parts[0].checks.holes[0].oppositeRemoved,false);
});
test('rectangular thin-face single cuts do not reach opposite wall; through cuts do',async()=>{
 const {newProject}=await import('../src/tube-frame/model.mjs');const p=newProject(),o=p.objects[0];
 o.profile={shape:'rectangle',width:80,depth:20,wall:1.2,radius:1.2};o.length=150;
 o.holeSets.main={mode:'single',start:60,diameter:6,face:'A',cut:'single',shape:'circle',offset:5};
 const service=createTubeFrameService({configDir:require('node:os').tmpdir()});
 const a=await service.generate(p);assert.equal(a.parts[0].checks.holes[0].oppositeRemoved,false);
 o.holeSets.main.cut='through';const b=await service.generate(p);assert.equal(b.parts[0].checks.holes[0].oppositeRemoved,true);
});
test('frame, X supports, slots and trial fold produce valid real solids',async()=>{
 const {newProject,newObject}=await import('../src/tube-frame/model.mjs');const service=createTubeFrameService({configDir:require('node:os').tmpdir()});
 const p=newProject(),f=newObject('frame',1);p.objects=[f];f.supports=[{id:'S1',type:'cross',gap:0}];
 let r=await service.generate(p);assert.equal(r.parts.length,7);assert.ok(r.parts.every(m=>m.checks.valid));
 f.supports=[];f.joint='fold';r=await service.generate(p);assert.equal(r.parts[0].trial,true);assert.equal(r.parts[0].checks.solids,1);
 const o=newObject('tube');p.objects=[o];o.profile.shape='round';o.holeSets.main={mode:'single',shape:'slot',width:8,height:20,face:'A',cut:'through',angle:90,start:60,offset:0};
 r=await service.generate(p);assert.equal(r.parts[0].checks.holes[0].oppositeRemoved,true);
});
test('pass through support outputs receiving openings and separate support',async()=>{
 const {newProject,newObject}=await import('../src/tube-frame/model.mjs');const p=newProject(),f=newObject('frame');p.objects=[f];
 f.supports=[{id:'S1',type:'vertical',offset:300,joint:'pass',opening:20,profile:{shape:'square',width:19.05,depth:19.05,wall:1.2,radius:1.2}}];
 const r=await createTubeFrameService({configDir:require('node:os').tmpdir()}).generate(p);assert.equal(r.parts.length,5);assert.equal(r.parts[0].checks.holes[0].oppositeRemoved,true);
});
