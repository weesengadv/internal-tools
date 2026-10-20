import {createCrops, createGridCrops, createManualCrop, clampCrop, moveCrop, resizeCrop, buildExportNames, safeStem} from './geometry.mjs';
import {detectViewCrops} from './detection.mjs';
import {createStoreZip} from '../signage/zip-store.mjs';

const messages = {
  en: {
    eyebrow:'3D SCULPTING / CHARACTER SHEET', title:'One sheet. Every angle.', subtitle:'Detect views or add your own crop boxes. Export each angle separately.',
    uploadStep:'1. Upload sheet', cropStep:'2. Adjust crops', exportStep:'3. Export images', source:'Original sheet', upload:'Upload image', replace:'Replace image',
    empty:'Drop your character sheet here', types:'PNG, JPG or WebP · processed on this computer', preset:'Starting layout', reference:'Reference sheet · top row', row:'Four across · full sheet', grid:'2 × 2 grid · full sheet', reset:'Reset crops',
    hint:'Drag a box to move it. Drag its handles to resize. Arrow keys move the selected box; Shift moves 10 px.', previews:'Export previews', views:'{count} views', noImage:'No image loaded',
    edit:'Selected crop', name:'View name', x:'Left (px)', y:'Top (px)', width:'Width (px)', height:'Height (px)', prefix:'Character name', filenames:'File names',
    original:'Original resolution', format:'Export format', zip:'Export all as ZIP', single:'Download image', exportSelected:'Download selected', local:'Images stay on this computer. Export preserves source pixels.',
    ready:'Upload a character sheet to begin.', loaded:'Image loaded. Add boxes or detect more views, then adjust before exporting.', loading:'Loading image…', exporting:'Preparing images…', exported:'Export downloaded.',
    invalid:'Choose a PNG, JPG or WebP image.', decode:'This image could not be opened. Try another PNG, JPG or WebP.', tooLarge:'Image is too large. Use an image under 100 MB, 64 megapixels and 32,767 pixels per side.', failed:'Export failed. Try a smaller crop or image.', presetApplied:'Starting layout applied. You can adjust every crop.',
    select:'Select view', drop:'Drop image to replace sheet', saveName:'Export filename', newName:'character',
    add:'Add box', remove:'Remove selected', auto:'Auto detect views', detecting:'Detecting separate views…', detected:'Detected {count} views. Review the boxes before exporting.', notDetected:'No separate views found. Add boxes manually or choose a custom grid.', detectionFailed:'Could not detect views in this image. Add boxes manually or choose a custom grid.', autoHint:'Auto detection works best with a plain background and clear gaps. Results may include detail views; adjust or remove boxes as needed.', added:'Crop box added. Move or resize it to fit your view.', removed:'Selected crop removed.', undo:'Undo layout', undone:'Previous crop layout restored.', custom:'Custom grid · any view count', columns:'Columns', rows:'Rows', invalidGrid:'Enter whole numbers from 1 to 24 for rows and columns.', noCrops:'No crop boxes. Add a box or detect views to begin.',
  },
  cn: {
    eyebrow:'3D 雕刻 / 角色设定图', title:'一张设定图，多角度导出。', subtitle:'自动识别视图或手动添加裁剪框，将每个角度分别导出。',
    uploadStep:'1. 上传图片', cropStep:'2. 调整裁剪', exportStep:'3. 导出图片', source:'原始设定图', upload:'上传图片', replace:'更换图片',
    empty:'将角色设定图拖到这里', types:'PNG、JPG 或 WebP · 在本机处理', preset:'起始布局', reference:'参考设定图 · 顶部四视图', row:'横向四等分 · 整张图片', grid:'2 × 2 网格 · 整张图片', reset:'重置裁剪',
    hint:'拖动方框可移动，拖动控制点可调整大小。方向键移动选中区域，按住 Shift 每次移动 10 像素。', previews:'导出预览', views:'{count} 个视图', noImage:'尚未载入图片',
    edit:'选中区域', name:'视图名称', x:'左边距（像素）', y:'上边距（像素）', width:'宽度（像素）', height:'高度（像素）', prefix:'角色名称', filenames:'文件名称',
    original:'保留原始分辨率', format:'导出格式', zip:'全部导出为 ZIP', single:'下载图片', exportSelected:'下载选中视图', local:'图片仅在本机处理，导出保留原始像素。',
    ready:'上传角色设定图以开始。', loaded:'图片已载入，可添加裁剪框或自动识别更多视图，请检查后导出。', loading:'正在载入图片…', exporting:'正在准备图片…', exported:'已下载导出文件。',
    invalid:'请选择 PNG、JPG 或 WebP 图片。', decode:'无法打开此图片，请尝试另一张 PNG、JPG 或 WebP 图片。', tooLarge:'图片过大，请使用小于 100 MB、6400 万像素且单边不超过 32767 像素的图片。', failed:'导出失败，请尝试缩小裁剪区域或图片。', presetApplied:'已应用起始布局，您可以继续调整每个区域。',
    select:'选择视图', drop:'松开以更换图片', saveName:'导出文件名', newName:'character',
    add:'添加裁剪框', remove:'删除选中框', auto:'自动识别视图', detecting:'正在识别独立视图…', detected:'已识别 {count} 个视图，请检查裁剪框后导出。', notDetected:'未找到独立视图，请手动添加裁剪框或选择自定义网格。', detectionFailed:'无法识别此图片的视图，请手动添加裁剪框或选择自定义网格。', autoHint:'自动识别适合纯色背景且各视图有明显间隔的设定图。结果可能包含细节图，请按需调整或删除。', added:'已添加裁剪框，移动或调整大小以框选视图。', removed:'已删除选中框。', undo:'撤销布局', undone:'已恢复之前的裁剪布局。', custom:'自定义网格 · 多视图', columns:'列数', rows:'行数', invalidGrid:'行数和列数请输入 1 到 24 的整数。', noCrops:'暂无裁剪框，请添加裁剪框或自动识别视图。',
  },
};

export function initCharacterCropper(root, {onFileChange = () => {}} = {}) {
  let language = 'en', image = null, sourceUrl = null, fileName = '', crops = [], selected = 0;
  let loading = false, exporting = false, detecting = false, loadToken = 0, drag = null, frame = 0, statusKey = 'ready', undoState = null;
  const t = key => messages[language][key] || messages.en[key] || key;
  root.innerHTML = `
    <header class="cc-heading"><p class="cc-eyebrow" data-cc="eyebrow"></p><h2 data-cc="title"></h2><p data-cc="subtitle"></p></header>
    <ol class="cc-steps"><li data-cc="uploadStep"></li><li data-cc="cropStep"></li><li data-cc="exportStep"></li></ol>
    <div class="cc-work">
      <section class="cc-source" aria-labelledby="cc-source-title">
        <div class="cc-bar"><h3 id="cc-source-title" data-cc="source"></h3><button class="secondary-button cc-upload" type="button" data-cc="upload"></button></div>
        <input class="cc-file" type="file" accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp" hidden>
        <p class="cc-file-info"></p>
        <div class="cc-dropzone"><div class="cc-empty"><span class="cc-empty-icon" aria-hidden="true">▧</span><strong data-cc="empty"></strong><span data-cc="types"></span><button type="button" class="primary-button cc-upload" data-cc="upload"></button></div>
          <div class="cc-sheet" hidden><img class="cc-image" alt="Character sheet"><div class="cc-overlays"></div></div>
        </div>
        <div class="cc-box-actions"><button class="primary-button cc-add" type="button" data-cc="add"></button><button class="secondary-button cc-detect" type="button" data-cc="auto"></button><button class="secondary-button cc-remove" type="button" data-cc="remove"></button><button class="secondary-button cc-undo" type="button" data-cc="undo"></button></div>
        <p class="cc-hint" data-cc="autoHint"></p>
        <div class="cc-preset"><label><span data-cc="preset"></span><select class="cc-layout"><option value="reference" data-cc="reference"></option><option value="row" data-cc="row"></option><option value="grid" data-cc="grid"></option><option value="custom" data-cc="custom"></option></select></label><button class="secondary-button cc-reset" type="button" data-cc="reset"></button></div>
        <div class="cc-grid-options" hidden><label><span data-cc="columns"></span><input class="cc-columns" type="number" min="1" max="24" step="1" value="4"></label><label><span data-cc="rows"></span><input class="cc-rows" type="number" min="1" max="24" step="1" value="1"></label></div>
        <p class="cc-hint" data-cc="hint"></p>
        <fieldset class="cc-editor"><legend data-cc="edit"></legend><div class="cc-bar"><strong class="cc-selection"></strong><span class="cc-muted" data-cc="original"></span></div>
          <div class="cc-fields"><label class="cc-name-field"><span data-cc="name"></span><input class="cc-name" maxlength="80" autocomplete="off"></label>
            ${['x','y','width','height'].map(key=>`<label><span data-cc="${key}"></span><input type="number" class="cc-bound" data-bound="${key}" step="1" min="${key==='x'||key==='y'?0:1}"></label>`).join('')}
          </div>
        </fieldset>
      </section>
      <aside class="cc-outputs" aria-labelledby="cc-preview-title"><div class="cc-bar"><h3 id="cc-preview-title" data-cc="previews"></h3><span class="cc-muted cc-count"></span></div>
        <p class="cc-no-crops cc-hint" data-cc="noCrops"></p><div class="cc-previews"></div><div class="cc-filenames"><h3 data-cc="filenames"></h3><label><span data-cc="prefix"></span><input class="cc-prefix" maxlength="80" value="character" autocomplete="off"></label><ul class="cc-file-list"></ul></div>
      </aside>
    </div>
    <footer class="cc-export"><label><span data-cc="format"></span><select class="cc-format"><option value="png">PNG</option><option value="jpg">JPG</option></select></label><div class="cc-export-actions"><button class="secondary-button cc-export-one" type="button" data-cc="exportSelected"></button><button class="primary-button cc-export-all" type="button" data-cc="zip"></button></div></footer>
    <output class="cc-status" aria-live="polite"></output><p class="cc-local" data-cc="local"></p>`;
  const $ = selector => root.querySelector(selector);
  const $$ = selector => [...root.querySelectorAll(selector)];
  const sheet = $('.cc-sheet'), previewGrid = $('.cc-previews'), overlays = $('.cc-overlays');
  const previewCards = [], boxes = [];
  function syncViews() {
    if (previewCards.length === crops.length) return;
    previewGrid.replaceChildren(); overlays.replaceChildren(); previewCards.length = 0; boxes.length = 0;
    for (let i = 0; i < crops.length; i++) {
    const card = document.createElement('div');
    card.className = 'cc-preview-card';
    card.innerHTML = '<button type="button" class="cc-preview-select"><canvas width="120" height="150"></canvas><strong></strong><span class="cc-dimensions"></span></button><button class="cc-download" type="button"></button>';
    card.querySelector('.cc-preview-select').addEventListener('click', () => select(i));
    card.querySelector('.cc-download').addEventListener('click', () => runExport(i));
    previewGrid.appendChild(card); previewCards.push(card);
    const box = document.createElement('button');
    box.type = 'button'; box.className = 'cc-crop'; box.dataset.crop = i;
    box.innerHTML = '<span class="cc-crop-label"></span>' + ['nw','n','ne','e','se','s','sw','w'].map(handle=>`<span class="cc-handle cc-${handle}" data-handle="${handle}" aria-hidden="true"></span>`).join('');
    box.addEventListener('click', () => select(i));
    box.addEventListener('keydown', event => {
      if (!image || loading || exporting || detecting || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
      event.preventDefault(); selected = i;
      const step = event.shiftKey ? 10 : 1;
      crops[i] = moveCrop(crops[i], event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0, event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0, image.naturalWidth, image.naturalHeight);
      render();
    });
    overlays.appendChild(box); boxes.push(box);
    }
  }

  function status(key, error = false) {
    statusKey = key; $('.cc-status').textContent = t(key).replace('{count}', crops.length); $('.cc-status').classList.toggle('cc-error', error);
  }
  function commitEditor() {
    const focused = document.activeElement;
    if (root.contains(focused) && focused.matches('.cc-name, .cc-bound')) focused.blur();
  }
  function select(i) { if (image && !loading && !exporting && !detecting) { commitEditor(); selected = i; render(); } }
  function names() { return buildExportNames($('.cc-prefix').value, crops, $('.cc-format').value); }
  function renderNames() {
    const list = $('.cc-file-list'); list.replaceChildren();
    if (!image) return;
    names().forEach(name => { const item = document.createElement('li'); item.textContent = name; list.appendChild(item); });
  }
  function render() {
    const busy = loading || exporting || detecting;
    syncViews();
    previewGrid.classList.toggle('cc-many-views', crops.length > 4);
    $('.cc-count').textContent = t('views').replace('{count}', crops.length);
    $('.cc-no-crops').hidden = crops.length > 0;
    $('.cc-grid-options').hidden = $('.cc-layout').value !== 'custom';
    $$('.cc-upload').forEach(button => { button.disabled = busy; button.textContent = t(image ? 'replace' : 'upload'); });
    $('.cc-file-info').textContent = image ? `${fileName} · ${image.naturalWidth} × ${image.naturalHeight} px` : t('noImage');
    $('.cc-empty').hidden = Boolean(image); sheet.hidden = !image;
    $$('.cc-layout, .cc-reset, .cc-prefix, .cc-format, .cc-add, .cc-detect, .cc-columns, .cc-rows').forEach(control=>{ control.disabled = !image || busy; });
    $$('.cc-editor, .cc-remove, .cc-export-one, .cc-export-all').forEach(control=>{ control.disabled = !image || !crops.length || busy; });
    $('.cc-undo').disabled = !undoState || busy;
    previewCards.forEach((card, i) => {
      const selectButton = card.querySelector('.cc-preview-select');
      selectButton.disabled = !image || busy;
      selectButton.setAttribute('aria-pressed', String(Boolean(image) && selected === i));
      const name = crops[i]?.name || ['Front','Back','Left','Right'][i];
      selectButton.setAttribute('aria-label', `${t('select')}: ${name}`);
      card.querySelector('strong').textContent = name;
      card.querySelector('.cc-dimensions').textContent = image ? `${crops[i].width} × ${crops[i].height} px` : '—';
      const download = card.querySelector('.cc-download'); download.disabled = !image || busy; download.textContent = t('single'); download.setAttribute('aria-label', `${t('single')}: ${name}`);
      const canvas = card.querySelector('canvas');
      if (!image) return;
      const crop = crops[i], scale = Math.min(1, 240/crop.width, 280/crop.height);
      canvas.width = Math.max(1, Math.round(crop.width*scale)); canvas.height = Math.max(1, Math.round(crop.height*scale));
      const ctx = canvas.getContext('2d');
      if ($('.cc-format').value === 'jpg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,canvas.width,canvas.height); }
      ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0,0,canvas.width,canvas.height);
      const box = boxes[i];
      Object.assign(box.style, {left: `${crop.x/image.naturalWidth*100}%`, top: `${crop.y/image.naturalHeight*100}%`, width: `${crop.width/image.naturalWidth*100}%`, height: `${crop.height/image.naturalHeight*100}%`});
      box.classList.toggle('cc-selected', i===selected); box.disabled = busy;
      box.setAttribute('aria-label', `${t('select')}: ${crop.name}`); box.setAttribute('aria-pressed', String(i===selected)); box.querySelector('.cc-crop-label').textContent = crop.name;
    });
    $('.cc-selection').textContent = crops[selected]?.name || '—';
    if (image && crops[selected]) {
      $('.cc-name').value = crops[selected].name;
      $$('.cc-bound').forEach(input => { const key = input.dataset.bound; input.value = crops[selected][key]; input.max = key==='x' ? image.naturalWidth-1 : key==='y' ? image.naturalHeight-1 : key==='width' ? image.naturalWidth-crops[selected].x : image.naturalHeight-crops[selected].y; });
    } else { $('.cc-name').value = ''; $$('.cc-bound').forEach(input=>{input.value='';}); }
    renderNames();
  }
  function queueRender() { if (!frame) frame = requestAnimationFrame(() => { frame = 0; render(); }); }
  async function loadFile(file) {
    if (!file || exporting || detecting) return;
    const token = ++loadToken;
    if (!/\.(png|jpe?g|webp)$/i.test(file.name) && !['image/png','image/jpeg','image/webp'].includes(file.type)) { loading = false; status('invalid', true); render(); return; }
    if (file.size > 100*1024*1024) { loading = false; status('tooLarge', true); render(); return; }
    loading = true; drag = null; status('loading'); render();
    const candidateUrl = URL.createObjectURL(file);
    let accepted = false;
    try {
      const candidate = new Image(); candidate.src = candidateUrl;
      await candidate.decode();
      if (token !== loadToken) return;
      const {naturalWidth: width, naturalHeight: height} = candidate;
      if (!width || !height) throw new Error('decode');
      if (width > 32767 || height > 32767 || width*height > 64_000_000) throw new Error('tooLarge');
      let nextCrops;
      try { nextCrops = presetCrops(width,height); } catch { throw new Error('invalidGrid'); }
      const previous = sourceUrl; image = candidate; sourceUrl = candidateUrl; accepted = true; fileName = file.name;
      $('.cc-image').src = sourceUrl; $('.cc-image').alt = fileName;
      $('.cc-prefix').value = safeStem(file.name.replace(/\.[^.]+$/, ''));
      crops = nextCrops; selected = 0; undoState = null;
      if (previous) URL.revokeObjectURL(previous);
      status('loaded'); onFileChange(fileName);
    } catch (error) { if (token === loadToken) status(['tooLarge','invalidGrid'].includes(error.message) ? error.message : 'decode', true); }
    finally { if (!accepted) URL.revokeObjectURL(candidateUrl); if (token === loadToken) { loading = false; render(); } }
  }
  $$('.cc-upload').forEach(button=>button.addEventListener('click', ()=>$('.cc-file').click()));
  $('.cc-file').addEventListener('change', event => { loadFile(event.target.files[0]); event.target.value = ''; });
  const dropzone = $('.cc-dropzone');
  ['dragenter','dragover'].forEach(type=>dropzone.addEventListener(type, event=>{ event.preventDefault(); if (!exporting) dropzone.classList.add('cc-drag-over'); }));
  dropzone.addEventListener('dragleave', event=>{ if (!dropzone.contains(event.relatedTarget)) dropzone.classList.remove('cc-drag-over'); });
  dropzone.addEventListener('drop', event=>{ event.preventDefault(); dropzone.classList.remove('cc-drag-over'); loadFile(event.dataTransfer.files[0]); });
  // Prevent dropping an image elsewhere from navigating away from the application.
  root.addEventListener('dragover', event=>event.preventDefault());
  root.addEventListener('drop', event=>event.preventDefault());
  function rememberLayout() { undoState = {crops:crops.map(c=>({...c})), selected}; }
  function presetCrops(width, height) {
    return $('.cc-layout').value === 'custom' ? createGridCrops(width,height,Number($('.cc-columns').value),Number($('.cc-rows').value)) : createCrops(width,height,$('.cc-layout').value);
  }
  function resetCrops() {
    if (!image || exporting || loading || detecting) return;
    commitEditor();
    try { const next = presetCrops(image.naturalWidth,image.naturalHeight).map((crop,i)=>({...crop,name:crops[i]?.name || crop.name})); rememberLayout(); crops = next; selected = 0; status('presetApplied'); }
    catch { status('invalidGrid',true); }
    render();
  }
  $('.cc-layout').addEventListener('change', resetCrops); $('.cc-reset').addEventListener('click', resetCrops);
  $('.cc-columns').addEventListener('change',resetCrops); $('.cc-rows').addEventListener('change',resetCrops);
  $('.cc-add').addEventListener('click',()=>{
    if (!image || loading || exporting || detecting) return;
    commitEditor(); rememberLayout(); crops.push(createManualCrop(crops,image.naturalWidth,image.naturalHeight)); selected = crops.length-1; drag = null; status('added'); render();
  });
  $('.cc-remove').addEventListener('click',()=>{
    if (!crops.length || loading || exporting || detecting) return;
    commitEditor(); rememberLayout(); crops.splice(selected,1); selected = Math.max(0,Math.min(selected,crops.length-1)); drag = null; status('removed'); render();
  });
  $('.cc-undo').addEventListener('click',()=>{
    if (!undoState || loading || exporting || detecting) return;
    commitEditor(); crops = undoState.crops; selected = undoState.selected; undoState = null; drag = null; status('undone'); render();
  });
  $('.cc-detect').addEventListener('click',async()=>{
    if (!image || loading || exporting || detecting) return;
    commitEditor(); detecting = true; drag = null; status('detecting'); render();
    try {
      await new Promise(resolve=>setTimeout(resolve,20));
      const scale = Math.min(1,1200/Math.max(image.naturalWidth,image.naturalHeight));
      const canvas = document.createElement('canvas'); canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
      const context = canvas.getContext('2d',{willReadFrequently:true});
      context.drawImage(image,0,0,canvas.width,canvas.height);
      const detected = detectViewCrops(context.getImageData(0,0,canvas.width,canvas.height),image.naturalWidth,image.naturalHeight);
      if (detected.length) { rememberLayout(); crops=detected; selected=0; status('detected'); }
      else status('notDetected',true);
    } catch (error) { console.error('View detection failed',error);status('detectionFailed',true); }
    finally { detecting=false;render(); }
  });
  $('.cc-name').addEventListener('change', event=>{ if (!image || !crops[selected]) return; crops[selected].name = event.target.value.trim() || `View ${selected+1}`; render(); });
  $$('.cc-bound').forEach(input=>input.addEventListener('change', ()=>{ if (!image || !crops[selected]) return; const value = Number(input.value); if (input.value.trim() && Number.isFinite(value)) crops[selected] = clampCrop({...crops[selected], [input.dataset.bound]:value}, image.naturalWidth, image.naturalHeight); render(); }));
  $('.cc-prefix').addEventListener('input', renderNames); $('.cc-format').addEventListener('change', render);
  sheet.addEventListener('pointerdown', event=>{
    const box = event.target.closest('[data-crop]');
    if (!box || !image || exporting || loading || detecting || event.button !== 0) return;
    event.preventDefault(); commitEditor(); selected = Number(box.dataset.crop);
    const rect = sheet.getBoundingClientRect();
    drag = {pointer: event.pointerId, x:event.clientX, y:event.clientY, scaleX:image.naturalWidth/rect.width, scaleY:image.naturalHeight/rect.height, crop:{...crops[selected]}, handle:event.target.dataset.handle || ''};
    sheet.setPointerCapture(event.pointerId); box.focus({preventScroll:true}); render();
  });
  sheet.addEventListener('pointermove', event=>{
    if (!drag || event.pointerId !== drag.pointer) return;
    const dx = (event.clientX-drag.x)*drag.scaleX, dy = (event.clientY-drag.y)*drag.scaleY;
    crops[selected] = drag.handle ? resizeCrop(drag.crop, drag.handle, dx, dy, image.naturalWidth, image.naturalHeight) : moveCrop(drag.crop, dx, dy, image.naturalWidth, image.naturalHeight);
    queueRender();
  });
  const endDrag = event=>{ if (drag && event.pointerId === drag.pointer) { drag = null; if (sheet.hasPointerCapture(event.pointerId)) sheet.releasePointerCapture(event.pointerId); render(); } };
  sheet.addEventListener('pointerup', endDrag); sheet.addEventListener('pointercancel', endDrag); sheet.addEventListener('lostpointercapture', ()=>{drag = null;});

  function makeBlob(crop, format) {
    return new Promise((resolve, reject)=>{
      const canvas = document.createElement('canvas'); canvas.width = crop.width; canvas.height = crop.height;
      const context = canvas.getContext('2d');
      if (!context) { reject(new Error('canvas')); return; }
      if (format === 'jpg') { context.fillStyle = '#ffffff'; context.fillRect(0,0,canvas.width,canvas.height); }
      context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0,0,crop.width,crop.height);
      canvas.toBlob(blob=>{ canvas.width = canvas.height = 1; blob ? resolve(blob) : reject(new Error('encode')); }, format === 'jpg' ? 'image/jpeg' : 'image/png', 0.95);
    });
  }
  function download(blob, name) {
    const url = URL.createObjectURL(blob), anchor = document.createElement('a');
    anchor.href = url; anchor.download = name; document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 60_000);
  }
  async function runExport(index = null) {
    if (!image || !crops.length || loading || exporting || detecting) return;
    exporting = true; drag = null; status('exporting'); render();
    try {
      const format = $('.cc-format').value, exportNames = names();
      if (index !== null) download(await makeBlob(crops[index],format), exportNames[index]);
      else {
        const entries = [];
        for (let i=0; i<crops.length; i++) entries.push({name:exportNames[i],data:await makeBlob(crops[i],format)});
        download(await createStoreZip(entries), `${safeStem($('.cc-prefix').value)}-views.zip`);
      }
      status('exported');
    } catch (error) { console.error('Character crop export failed', error); status('failed', true); }
    finally { exporting = false; render(); }
  }
  $('.cc-export-one').addEventListener('click', ()=>runExport(selected));
  $('.cc-export-all').addEventListener('click', ()=>runExport());
  window.addEventListener('beforeunload', ()=>{ if (sourceUrl) URL.revokeObjectURL(sourceUrl); });
  const api = {
    get fileName() { return fileName; },
    setLanguage(value) {
      language = value === 'cn' ? 'cn' : 'en';
      $$('[data-cc]').forEach(element=>{ element.textContent = t(element.dataset.cc); });
      status(statusKey, $('.cc-status').classList.contains('cc-error')); render();
    },
  };
  api.setLanguage('en');
  return api;
}
