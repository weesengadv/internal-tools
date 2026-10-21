import {test} from 'node:test';
import assert from 'node:assert/strict';
import {deleteParts} from '../src/project.js';
const project={parameters:{linkMatching:true},stage:'2d',modelReady:true,parts:[{id:'a',group:'same',holes:[{id:'h'}]},{id:'b',group:'same',holes:[]},{id:'c',group:'other',holes:[]}]};
test('delete selected parts without deleting linked copies or changing the original project',()=>{
 const next=deleteParts(project,['a']);assert.deepEqual(next.parts.map(p=>p.id),['b','c']);
 assert.equal(next.modelReady,false);assert.equal(next.stage,'2d');assert.equal(project.parts.length,3);
});
test('delete multiple parts, including all parts, and ignore missing selections',()=>{
 assert.deepEqual(deleteParts(project,['a','c']).parts.map(p=>p.id),['b']);
 assert.deepEqual(deleteParts(project,['a','b','c']).parts,[]);
 assert.equal(deleteParts(project,['missing']),project);
});
