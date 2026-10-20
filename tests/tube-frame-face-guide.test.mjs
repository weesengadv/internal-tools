import test from 'node:test';
import assert from 'node:assert/strict';
import {faceDefinition,guideFaceState,roundDirection} from '../src/tube-frame/face-guide.mjs';
test('face names and normals follow generated geometry conventions',()=>{
 assert.deepEqual(faceDefinition('A').normal,[0,1,0]);
 assert.deepEqual(faceDefinition('B').normal,[1,0,0]);
 assert.equal(faceDefinition('B',true).name,'Inside');
 assert.equal(faceDefinition('D',true).name,'Outside');
 assert.equal(faceDefinition('C').opposite,'A');
});
test('round tube angular guide matches the FreeCAD entry direction',()=>{
 assert.deepEqual(roundDirection(0),[0,1,0]);
 const n=roundDirection(90);assert.ok(Math.abs(n[0]+1)<1e-10);assert.ok(Math.abs(n[1])<1e-10);
});
test('through cuts highlight only the selected wall and its opposite',()=>{
 assert.deepEqual(guideFaceState('B','single'),{B:'entry'});
 assert.deepEqual(guideFaceState('B','through'),{B:'entry',D:'exit'});
 assert.deepEqual(guideFaceState('A','through'),{A:'entry',C:'exit'});
});
