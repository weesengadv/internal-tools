// Run with Electron: electron tests/character-cropper-ui.cjs [reference-image-path]
const {app, BrowserWindow, nativeImage} = require('electron');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {startServer} = require('../server.js');

app.disableHardwareAcceleration();
const out = path.resolve(__dirname, '../output/character-cropper-check');
let window, runtime;
const errors = [];
const evaluate = code => window.webContents.executeJavaScript(code, true);
async function until(expression) {
  for (let n=0;n<100;n++) {
    if (await evaluate(expression)) return;
    await new Promise(resolve=>setTimeout(resolve,50));
  }
  throw new Error(`Timed out waiting for ${expression}`);
}
async function click(selector) { return evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`); }
async function download(selector) {
  const completed = new Promise((resolve,reject)=>{
    window.webContents.session.once('will-download', (_event,item)=>{
      const destination = path.join(out,item.getFilename()); item.setSavePath(destination);
      item.once('done',(_e,state)=>state==='completed'?resolve(destination):reject(new Error(state)));
    });
  });
  await click(selector);
  return Promise.race([completed,new Promise((_,reject)=>setTimeout(()=>reject(new Error('Download timed out')),15000))]);
}
async function main() {
  fs.mkdirSync(out,{recursive:true});
  runtime = await startServer({port:0});
  window = new BrowserWindow({show:false,width:1440,height:1100,webPreferences:{contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,offscreen:true}});
  window.webContents.on('console-message',event=>{if(event.level==='error')errors.push(event.message);});
  window.webContents.on('render-process-gone',(_e,details)=>errors.push(JSON.stringify(details)));
  await window.loadURL(runtime.url);
  await until(`!!document.querySelector('.cc-export-all')`);
  await click('[data-tool="character-cropper"]');
  assert.equal(await evaluate(`document.querySelector('#characterCropperWorkspace').hidden`),false);
  assert.equal(await evaluate(`document.querySelector('#resumePrintPanel').hidden`),true);
  assert.equal(await evaluate(`document.querySelector('.cc-export-all').disabled`),true);
  await evaluate(`(async()=>{
    const canvas=document.createElement('canvas');canvas.width=400;canvas.height=300;
    const ctx=canvas.getContext('2d'); ['#ff0000','#00ff00','#0000ff','#ffcc00'].forEach((c,i)=>{ctx.fillStyle=c;ctx.fillRect(i*100,0,100,100);});
    const blob=await new Promise(r=>canvas.toBlob(r));const transfer=new DataTransfer();transfer.items.add(new File([blob],'four-views.png',{type:'image/png'}));
    const input=document.querySelector('.cc-file');input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));
  })()`);
  await until(`!document.querySelector('.cc-export-all').disabled`);
  await evaluate(`const layout=document.querySelector('.cc-layout');layout.value='row';layout.dispatchEvent(new Event('change',{bubbles:true}));`);
  assert.deepEqual(await evaluate(`[...document.querySelectorAll('.cc-bound')].map(i=>+i.value)`),[0,0,100,300]);
  const pngPath = await download('.cc-export-one');
  const png = nativeImage.createFromPath(pngPath);
  assert.deepEqual(png.getSize(),{width:100,height:300});
  const pixels=png.toBitmap();
  assert.equal(pixels[(200*100+20)*4+3],0,'PNG preserves source transparency');
  assert.deepEqual([...pixels.slice((20*100+20)*4,(20*100+20)*4+4)],[0,0,255,255],'Front PNG has the expected source pixels');
  await until(`!document.querySelector('.cc-export-all').disabled`);
  const zipPath = await download('.cc-export-all');
  const zip=fs.readFileSync(zipPath),entries=[];let offset=0;
  while(zip.readUInt32LE(offset)===0x04034b50){
    const size=zip.readUInt32LE(offset+18),nameSize=zip.readUInt16LE(offset+26),extraSize=zip.readUInt16LE(offset+28);
    const name=zip.subarray(offset+30,offset+30+nameSize).toString();
    const start=offset+30+nameSize+extraSize,bytes=zip.subarray(start,start+size);
    entries.push(name);assert.deepEqual(nativeImage.createFromBuffer(bytes).getSize(),{width:100,height:300});offset=start+size;
  }
  assert.deepEqual(entries,['four-views-front.png','four-views-back.png','four-views-left.png','four-views-right.png']);
  await until(`!document.querySelector('.cc-export-all').disabled`);
  await evaluate(`const f=document.querySelector('.cc-format');f.value='jpg';f.dispatchEvent(new Event('change',{bubbles:true}));`);
  const jpgPath=await download('.cc-export-one');
  const jpeg=nativeImage.createFromPath(jpgPath);assert.deepEqual(jpeg.getSize(),{width:100,height:300});
  const white=jpeg.toBitmap().subarray((200*100+20)*4,(200*100+20)*4+4);
  assert.ok(white[0]>245&&white[1]>245&&white[2]>245&&white[3]===255,'JPG transparency is flattened onto white');
  await until(`!document.querySelector('.cc-export-all').disabled`);
  await evaluate(`const w=document.querySelector('[data-bound="width"]');w.value=999;w.dispatchEvent(new Event('change',{bubbles:true}));`);
  assert.equal(await evaluate(`+document.querySelector('[data-bound="width"]').value`),400,'Numeric edit clamps at source boundary');
  await click('.cc-reset');
  await evaluate(`document.querySelector('.cc-name').focus();document.querySelector('.cc-name').select();`);
  await window.webContents.insertText('Hero Front');
  let target = await evaluate(`(()=>{const el=document.querySelectorAll('.cc-crop')[1];el.scrollIntoView({block:'center'});const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  window.webContents.sendInputEvent({type:'mouseDown',x:Math.round(target.x),y:Math.round(target.y),button:'left',clickCount:1});
  window.webContents.sendInputEvent({type:'mouseUp',x:Math.round(target.x),y:Math.round(target.y),button:'left',clickCount:1});
  await until(`document.querySelectorAll('.cc-preview-select')[1].getAttribute('aria-pressed')==='true'`);
  assert.deepEqual(await evaluate(`[...document.querySelectorAll('.cc-preview-select strong')].map(n=>n.textContent)`),['Hero Front','Back','Left','Right'],'Switching crop must commit pending edit to the previous view');
  await click('.cc-preview-select');
  await evaluate(`document.querySelector('.cc-name').value='Front';document.querySelector('.cc-name').dispatchEvent(new Event('change',{bubbles:true}));`);
  // Exercise actual pointer movement and corner resize through Chromium input.
  let rect=await evaluate(`(()=>{const r=document.querySelector('.cc-crop').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};})()`);
  window.webContents.sendInputEvent({type:'mouseDown',x:Math.round(rect.x+rect.width/2),y:Math.round(rect.y+rect.height/2),button:'left',clickCount:1});
  window.webContents.sendInputEvent({type:'mouseMove',x:Math.round(rect.x+rect.width/2+20),y:Math.round(rect.y+rect.height/2),button:'left'});
  window.webContents.sendInputEvent({type:'mouseUp',x:Math.round(rect.x+rect.width/2+20),y:Math.round(rect.y+rect.height/2),button:'left',clickCount:1});
  await until(`+document.querySelector('[data-bound="x"]').value>0`);
  rect=await evaluate(`(()=>{const el=document.querySelector('.cc-crop .cc-se');el.scrollIntoView({block:'center'});const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  window.webContents.sendInputEvent({type:'mouseDown',x:Math.round(rect.x),y:Math.round(rect.y),button:'left',clickCount:1});
  window.webContents.sendInputEvent({type:'mouseMove',x:Math.round(rect.x+25),y:Math.round(rect.y-20),button:'left'});
  window.webContents.sendInputEvent({type:'mouseUp',x:Math.round(rect.x+25),y:Math.round(rect.y-20),button:'left',clickCount:1});
  await until(`+document.querySelector('[data-bound="width"]').value>100 && +document.querySelector('[data-bound="height"]').value<300`);
  await evaluate(`(()=>{const transfer=new DataTransfer();transfer.items.add(new File(['invalid'],'broken.png',{type:'image/png'}));const input=document.querySelector('.cc-file');input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  await until(`document.querySelector('.cc-status').classList.contains('cc-error')`);
  assert.equal(await evaluate(`document.querySelector('.cc-export-all').disabled`),false,'Invalid replacement keeps previous image usable');
  await click('.cc-add'); await click('.cc-add');
  assert.equal(await evaluate(`document.querySelectorAll('.cc-crop').length`),6,'Manually add more than four crop boxes');
  assert.equal(await evaluate(`document.querySelector('.cc-name').value`),'View 6');
  assert.equal(await evaluate(`document.querySelectorAll('.cc-preview-select').length`),6);
  await evaluate(`document.querySelector('.cc-name').value='Extra angle';document.querySelector('.cc-name').dispatchEvent(new Event('change',{bubbles:true}));`);
  await click('.cc-remove');
  assert.equal(await evaluate(`document.querySelectorAll('.cc-crop').length`),5);
  await click('.cc-undo');
  assert.equal(await evaluate(`document.querySelectorAll('.cc-crop').length`),6);
  assert.equal(await evaluate(`document.querySelector('.cc-name').value`),'Extra angle','Undo restores names and selection');
  for(let i=0;i<6;i++) await click('.cc-remove');
  assert.equal(await evaluate(`document.querySelector('.cc-export-all').disabled`),true,'Export disabled with no crop boxes');
  assert.equal(await evaluate(`document.querySelector('.cc-editor').disabled`),true);
  assert.equal(await evaluate(`document.querySelector('.cc-add').disabled`),false,'Can add a box after deleting every crop');
  await click('.cc-add');
  assert.equal(await evaluate(`document.querySelectorAll('.cc-crop').length`),1);
  await click('.cc-undo');
  assert.equal(await evaluate(`document.querySelectorAll('.cc-crop').length`),0,'Undo can restore an empty layout');
  await evaluate(`const grid=document.querySelector('.cc-layout');grid.value='custom';document.querySelector('.cc-columns').value=3;document.querySelector('.cc-rows').value=2;grid.dispatchEvent(new Event('change',{bubbles:true}));`);
  assert.equal(await evaluate(`document.querySelectorAll('.cc-crop').length`),6,'Custom 3 by 2 grid creates six views');
  await evaluate(`const columns=document.querySelector('.cc-columns');columns.value=0;columns.dispatchEvent(new Event('change',{bubbles:true}));`);
  assert.equal(await evaluate(`document.querySelectorAll('.cc-crop').length`),6,'Invalid grid keeps existing crop boxes');
  await evaluate(`document.querySelector('.cc-columns').value=3;document.querySelector('.cc-columns').dispatchEvent(new Event('change',{bubbles:true}));`);
  await evaluate(`(async()=>{
    const canvas=document.createElement('canvas');canvas.width=600;canvas.height=420;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,600,420);
    for(let row=0;row<2;row++)for(let col=0;col<3;col++){
      ctx.fillStyle=['#a04030','#287444','#224477'][col];ctx.fillRect(col*200+45,row*210+20,110,150);
      ctx.fillStyle='#222';ctx.fillRect(col*200+70,row*210+183,60,6);
    }
    const blob=await new Promise(r=>canvas.toBlob(r));const transfer=new DataTransfer();transfer.items.add(new File([blob],'six-angles.png',{type:'image/png'}));const input=document.querySelector('.cc-file');input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));
  })()`);
  await until(`!document.querySelector('.cc-export-all').disabled`);
  await click('.cc-detect');
  await until(`!document.querySelector('.cc-detect').disabled`);
  assert.equal(await evaluate(`document.querySelectorAll('.cc-crop').length`),6,'Automatic detection finds six views and excludes short captions');
  assert.equal(await evaluate(`document.querySelector('.cc-count').textContent`),'6 views');
  await evaluate(`document.querySelector('.cc-format').value='png';document.querySelector('.cc-format').dispatchEvent(new Event('change',{bubbles:true}));`);
  const sixZip=fs.readFileSync(await download('.cc-export-all'));
  let sixOffset=0;const sixNames=[];
  while(sixZip.readUInt32LE(sixOffset)===0x04034b50){
    const size=sixZip.readUInt32LE(sixOffset+18),n=sixZip.readUInt16LE(sixOffset+26),extra=sixZip.readUInt16LE(sixOffset+28),start=sixOffset+30+n+extra;
    sixNames.push(sixZip.subarray(sixOffset+30,sixOffset+30+n).toString());
    const dimensions=nativeImage.createFromBuffer(sixZip.subarray(start,start+size)).getSize();assert.ok(dimensions.width>100&&dimensions.height>150);
    sixOffset=start+size;
  }
  assert.deepEqual(sixNames,Array.from({length:6},(_,i)=>`six-angles-view-${i+1}.png`),'ZIP contains all automatically detected views');
  await until(`!document.querySelector('.cc-export-all').disabled`);
  await evaluate(`document.querySelector('#languageSelect').value='cn';document.querySelector('#languageSelect').dispatchEvent(new Event('change',{bubbles:true}));`);
  assert.equal(await evaluate(`document.querySelector('.cc-export-all').textContent`),'全部导出为 ZIP');
  await click('[data-tool="resume-print"]');
  assert.equal(await evaluate(`document.querySelector('#resumePrintPanel').hidden`),false);
  await click('[data-tool="character-cropper"]');
  await window.loadURL(runtime.url);
  await until(`document.body.dataset.activeTool==='character-cropper'`);
  assert.equal(await evaluate(`document.querySelector('#characterCropperWorkspace').hidden`),false);
  if(process.argv[2]) {
    const bytes=fs.readFileSync(process.argv[2]).toString('base64');
    await evaluate(`(()=>{const bytes=Uint8Array.from(atob(${JSON.stringify(bytes)}),c=>c.charCodeAt(0));const transfer=new DataTransfer();transfer.items.add(new File([bytes],'lucky-sheep.png',{type:'image/png'}));const input=document.querySelector('.cc-file');input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await until(`!document.querySelector('.cc-export-all').disabled`);
    await evaluate(`document.querySelector('#languageSelect').value='en';document.querySelector('#languageSelect').dispatchEvent(new Event('change',{bubbles:true}));`);
    await evaluate(`window.scrollTo(0,0)`);
    await new Promise(resolve=>setTimeout(resolve,300));
    fs.writeFileSync(path.join(out,'character-cropper-desktop.png'),(await window.webContents.capturePage()).toPNG());
    const realPath=await download('.cc-export-all');
    assert.ok(fs.statSync(realPath).size>10000);
    await until(`!document.querySelector('.cc-detect').disabled`);
    await click('.cc-detect');
    await until(`!document.querySelector('.cc-detect').disabled`);
    const realCount=await evaluate(`document.querySelectorAll('.cc-crop').length`);
    assert.ok(realCount>=4,`Finds multiple views in supplied sheet; found ${realCount}`);
    console.log(`Supplied reference sheet: ${realCount} detected regions (including detail views).`);
    await evaluate(`window.scrollTo(0,0)`);
    await new Promise(resolve=>setTimeout(resolve,200));
    fs.writeFileSync(path.join(out,'character-cropper-auto.png'),(await window.webContents.capturePage()).toPNG());
  }
  window.setSize(390,1000);
  await new Promise(resolve=>setTimeout(resolve,100));
  const overflow=await evaluate(`({page:document.documentElement.scrollWidth,width:innerWidth,root:document.querySelector('#characterCropperWorkspace').getBoundingClientRect().width})`);
  assert.ok(overflow.page<=overflow.width,`Mobile layout overflows: ${JSON.stringify(overflow)}`);
  fs.writeFileSync(path.join(out,'character-cropper-mobile.png'),(await window.webContents.capturePage()).toPNG());
  assert.deepEqual(errors,[],'No browser errors');
  console.log('Character cropper UI checks passed: upload, PNG/JPG fidelity, four/six-entry ZIP, bounds, pointer move/resize, pending edits, invalid replacement, manual add/remove/undo, empty layout, custom grid, six-view automatic detection, EN/CN, navigation, reload, mobile layout.');
}
app.whenReady().then(main).then(()=>app.exit(0)).catch(async error=>{console.error(error);if(window){console.error(await evaluate(`[...document.querySelectorAll('.cc-bound')].map(i=>i.value)`));fs.writeFileSync(path.join(out,'failure.png'),(await window.webContents.capturePage()).toPNG());}app.exit(1);});
