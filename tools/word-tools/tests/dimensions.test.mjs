import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dimensionLabel} from '../src/dimensions.mjs';
import {totalHeight} from '../src/project.js';
test('dimensions use bounds differences, convert inches and can be hidden without changing geometry',()=>{
 const bounds=[-10,50,40.8,151.6],original=[...bounds];
 assert.equal(dimensionLabel(bounds),'50.8 × 101.6 mm');
 assert.equal(dimensionLabel(bounds,'inch'),'2.00 × 4.00 in');
 assert.equal(dimensionLabel(bounds,'hidden'),'');
 assert.deepEqual(bounds,original);
});
test('wall-only height never includes stored base thickness',()=>{
 for(const heightMode of ['total','wall'])assert.equal(totalHeight({bodyMode:'wall-only',height:30,baseThickness:5,heightMode}),30);
});
