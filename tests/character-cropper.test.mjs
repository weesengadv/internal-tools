import assert from 'node:assert/strict';
import { createCrops, createGridCrops, createManualCrop, clampCrop, moveCrop, resizeCrop, buildExportNames } from '../src/character-cropper/geometry.mjs';
import { detectViewCrops } from '../src/character-cropper/detection.mjs';

const reference = createCrops(1536, 1024, 'reference');
assert.equal(reference.length, 4);
assert.deepEqual(reference.map(c => c.name), ['Front', 'Back', 'Left', 'Right']);
assert.ok(reference.every(c => c.y + c.height <= 630), 'reference preset excludes captions and detail strip');
const row = createCrops(101, 75, 'row');
assert.equal(row[0].x, 0);
assert.equal(row.at(-1).x + row.at(-1).width, 101);
assert.equal(row.reduce((sum, c) => sum + c.width, 0), 101);
const grid = createCrops(101, 75, 'grid');
assert.equal(grid[3].x + grid[3].width, 101);
assert.equal(grid[3].y + grid[3].height, 75);
assert.deepEqual(clampCrop({x: -10, y: 90, width: 999, height: -2}, 100, 100), {x: 0, y: 90, width: 100, height: 1});
const crop = {x: 10, y: 10, width: 30, height: 40, name: 'Front'};
assert.deepEqual(moveCrop(crop, 999, -999, 100, 100), {...crop, x: 70, y: 0});
assert.deepEqual(resizeCrop(crop, 'se', 999, 999, 100, 100), {...crop, width: 90, height: 90});
assert.deepEqual(resizeCrop(crop, 'nw', -999, -999, 100, 100), {...crop, x: 0, y: 0, width: 40, height: 50});
const inverted = resizeCrop(crop, 'nw', 999, 999, 100, 100);
assert.ok(inverted.width >= 1 && inverted.height >= 1);
assert.equal(inverted.x + inverted.width, 40);
assert.equal(inverted.y + inverted.height, 50);
for (const layout of ['row', 'grid', 'reference']) {
  for (const c of createCrops(1, 1, layout)) assert.ok(c.x === 0 && c.y === 0 && c.width === 1 && c.height === 1);
}
assert.deepEqual(buildExportNames('../羊: lucky', [{name:'Front'}, {name:'Front'}, {name:'../'}], 'png'), ['羊-lucky-front.png', '羊-lucky-front-2.png', '羊-lucky-view-3.png']);
assert.deepEqual(buildExportNames('CON', [{name:'A/B'}, {name:'A:B'}], 'jpg'), ['CON-a-b.jpg', 'CON-a-b-2.jpg']);
assert.throws(() => createCrops(0, 10), /dimensions/i);
assert.throws(() => buildExportNames('test', reference, 'svg'), /format/i);
const six = createGridCrops(601, 401, 3, 2);
assert.equal(six.length, 6);
assert.equal(six[5].x + six[5].width, 601);
assert.equal(six[5].y + six[5].height, 401);
assert.throws(() => createGridCrops(600,400,0,2), /grid/i);
const extra = createManualCrop(six, 601, 401);
assert.equal(extra.name, 'View 7');
assert.ok(extra.width > 0 && extra.x + extra.width <= 601);
assert.equal(createManualCrop([...six, extra], 601, 401).name, 'View 8');

function sheet(columns, rows, transparent = false) {
  const width = columns * 100, height = rows * 140;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i=0; i<data.length; i+=4) {data[i]=data[i+1]=data[i+2]=255;data[i+3]=transparent?0:255;}
  for (let row=0; row<rows; row++) for(let col=0; col<columns; col++) {
    for(let y=row*140+10;y<row*140+110;y++) for(let x=col*100+15;x<col*100+85;x++) {
      const i=(y*width+x)*4;data[i]=100;data[i+1]=30;data[i+2]=50;data[i+3]=255;
    }
    // A short caption should not become another view.
    for(let y=row*140+120;y<row*140+125;y++) for(let x=col*100+30;x<col*100+70;x++) {
      const i=(y*width+x)*4;data[i]=data[i+1]=data[i+2]=0;data[i+3]=255;
    }
  }
  return {data,width,height};
}
for (const transparent of [false,true]) {
  const detected=detectViewCrops(sheet(3,2,transparent),1200,1120);
  assert.equal(detected.length,6,'Finds six views, excludes small captions');
  assert.ok(detected[0].x<=60 && detected[0].x+detected[0].width>=340);
  assert.ok(detected[5].y>=560 && detected[5].y+detected[5].height<=1120);
}
assert.equal(detectViewCrops(sheet(8,1)).length,8);
const captioned = sheet(3,2);
for(let row=0;row<2;row++) for(let col=0;col<3;col++) for(let y=row*140+118;y<row*140+138;y++) for(let x=col*100+35;x<col*100+65;x++) {
  const i=(y*captioned.width+x)*4;captioned.data[i]=captioned.data[i+1]=captioned.data[i+2]=0;
}
assert.equal(detectViewCrops(captioned).length,6,'Compact captions below each row are not extra views');
const ruled = sheet(3,2);
for(let y=0;y<ruled.height;y++) for(const x of [99,199]) {const i=(y*ruled.width+x)*4;ruled.data[i]=ruled.data[i+1]=ruled.data[i+2]=160;}
assert.equal(detectViewCrops(ruled).length,6,'Thin separator lines do not merge views');
assert.deepEqual(detectViewCrops({width:100,height:100,data:new Uint8ClampedArray(40000).fill(255)}),[]);
console.log('character cropper geometry tests passed');
