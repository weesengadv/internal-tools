import {newProject,newObject,readProject,resolveProject,resolveObject,profileSize,toReference,fromReference,expandHoles,holeExtents,snapHole} from './model.mjs';
import {wallDrawing,assemblyDrawing} from './drawing.mjs';
import {createStoreZip} from '../signage/zip-store.mjs';
import {faceDefinition} from './face-guide.mjs';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=o=>JSON.parse(JSON.stringify(o));
const number=n=>Number(Number(n).toFixed(2));
const previewHoles=(set,length)=>{try{return expandHoles(set,length);}catch{return [];}};
const defaultHole=()=>({mode:'single',shape:'circle',diameter:19.05,width:10,height:25,face:'A',cut:'single',start:40,offset:0,angle:0,reference:'start',count:3,pitch:100,last:40,spacing:'pitch',items:[{z:40,x:0}]});
export function initTubeFrame(root){
 let project=newProject();try{const saved=localStorage.getItem('weesengTubeFrameDraft');if(saved)project=readProject(JSON.parse(saved));}catch{}
 let selected=project.objects[0].id,member='',joint='',tab='design',language='en',holeIndex=0,holeGroup=0,wallView=false,view3d=false,generated=null,generatedKey='',busy=false,status='',engine=null,dispose3d=null,drag=null,drawGeometry=null;
 const undo=[],redo=[];let lastMembers=[];
 let disposeFaceGuide=null,faceGuideAssembly=false;
 const t=(en,cn)=>language==='cn'?cn:en;
 const obj=()=>project.objects.find(o=>o.id===selected)||project.objects[0];
 const key=()=>JSON.stringify(project);
 const designKey=()=>JSON.stringify(project.objects);
 const msg=(s,error=false)=>{status=s;const el=root.querySelector('.tf-status');if(el){el.textContent=s;el.classList.toggle('error',error);}};
 const remember=()=>{undo.push(key());if(undo.length>50)undo.shift();redo.length=0;};
 const persist=()=>{try{localStorage.setItem('weesengTubeFrameDraft',key());}catch{}};
 const button=(text,action,extra='')=>`<button type="button" data-action="${action}" ${extra}>${text}</button>`;
 function field(label,bind,value,type='number',options){
  const attrs=`data-bind="${bind}" aria-label="${esc(label)}"`;
  const control=options?`<select ${attrs}>${options.map(([v,text])=>`<option value="${esc(v)}" ${v===value?'selected':''}>${esc(text)}</option>`).join('')}</select>`:`<input ${attrs} type="${type}" ${type==='number'?'step="any"':''} value="${esc(value)}">`;
  return `<label class="tf-field"><span>${label}</span>${control}</label>`;
 }
 function profileFields(p,prefix='object.profile'){return field(t('Section','管型'),prefix+'.shape',p.shape,'text',[['square',t('Square hollow','方管')],['rectangle',t('Rectangular hollow','矩形管')],['round',t('Round hollow','圆管')]])+`<div class="tf-pair">`+field(t('Outside width / diameter','外宽 / 外径'),prefix+'.width',p.width)+(p.shape==='rectangle'?field(t('Outside depth','外深'),prefix+'.depth',p.depth):'')+field(t('Wall thickness','壁厚'),prefix+'.wall',p.wall)+(p.shape!=='round'?field(t('Outside corner radius','外圆角半径'),prefix+'.radius',p.radius):'')+'</div>';}
 function holeSettings(m){
  const o=obj(),stored=o.holeSets[m.key],groups=Array.isArray(stored)?stored:stored?[stored]:[];holeGroup=Math.min(holeGroup,Math.max(0,groups.length-1));const set=groups[holeGroup];
  let s=`<h4>${t('Openings','开孔')} · ${esc(m.key)}</h4>`;
  if(!set||set.mode==='none')return s+button(t('+ Add opening','+ 添加开孔'),'add-hole');
  holeIndex=Math.max(0,Math.min(holeIndex,(set.mode==='custom'?set.items.length:set.mode==='pattern'?set.count:1)-1));
  s+=field(t('Opening group','开孔组'),'ui.holeGroup',String(holeGroup),'text',groups.map((g,i)=>[String(i),`${i+1} · ${g.face} · ${g.shape}`]))+button(t('+ Another opening group','+ 添加另一组开孔'),'add-hole');
  s+=field(t('Placement mode','孔位模式'),'hole.mode',set.mode,'text',[['single',t('Single — drag freely','单孔 — 可拖动')],['pattern',t('Pattern — linked positions','阵列 — 联动孔位')],['custom',t('Custom — independent holes','自定义 — 独立孔位')]]);
  s+=field(t('Opening shape','开孔形状'),'hole.shape',set.shape,'text',[['circle',t('Round hole','圆孔')],['rectangle',t('Rectangle','矩形孔')],['slot',t('Rounded slot','长圆孔')]]);
  s+=set.shape==='circle'?field(t('Finished diameter','成品孔径'),'hole.diameter',set.diameter):`<div class="tf-pair">${field(t('Across-face width','横向宽度'),'hole.width',set.width)}${field(t('Along-tube length','沿管长度'),'hole.height',set.height)}</div>`;
  if(m.profile.shape==='round')s+=field(t('Angle around tube (degrees)','圆周角度（度）'),'hole.angle',set.angle||0)+`<div class="tf-face-guide" role="group" aria-label="${t('3D angular guide','3D 角度指引')}"></div><p class="tf-hint">${t('Drag to rotate · click the round wall to set its angle. Mint = entry; amber = opposite exit.','拖动旋转 · 点击圆管壁设置角度。薄荷绿为入口，橙色为相对出口。')}</p>`+(o.kind==='frame'?`<div class="tf-row">${button(t('Member guide','管件指引'),'guide-member',`class="${!faceGuideAssembly?'active':''}"`)}${button(t('Frame guide','框架指引'),'guide-frame',`class="${faceGuideAssembly?'active':''}"`)}</div>`:'');
  else {
   const perim=o.kind==='frame'&&['bottom','top','left','right'].includes(m.key);
   s+=`<label class="tf-field">${t('Selected wall — 3D guide','所选管壁 — 3D 指引')}</label><div class="tf-face-guide" role="group" aria-label="${t('3D face guide','3D 管壁指引')}"></div><p class="tf-hint">${t('Drag to rotate · click a wall to select. Mint = entry; amber = opposite exit.','拖动旋转 · 点击管壁选择。薄荷绿为入口，橙色为相对出口。')}</p>`;
   if(o.kind==='frame')s+=`<div class="tf-row">${button(t('Member guide','管件指引'),'guide-member',`class="${!faceGuideAssembly?'active':''}"`)}${button(t('Frame guide','框架指引'),'guide-frame',`class="${faceGuideAssembly?'active':''}"`)}</div>`;
   s+=`<div class="tf-face-picker">${['A','B','C','D'].map(face=>{const def=faceDefinition(face,perim);return button(`${face}<small>${t(def.name,def.cn)}</small>`,'face',`data-face="${face}" aria-pressed="${set.face===face}" class="${set.face===face?'active':''}"`);}).join('')}</div><p class="tf-hint">${t('Orientation guide only; generate geometry for the exact openings and end cuts.','此为方向指引；精确开孔及端部切角请生成模型查看。')}</p>`;
  }
  s+=field(t('Cut mode','切孔方式'),'hole.cut',set.cut,'text',[['single',t('Selected wall only','仅选中一面')],['through',t('Through opposite walls','贯穿相对两面')]]);
  s+=field(t('Position reference','定位参考'),'hole.reference',set.reference||'start','text',[['start',t('From start','从起点')],['end',t('From end','从末端')],['centre',t('From tube centre','从管中心')]]);
  if(set.mode==='custom'){
   s+=field(t('Selected opening','所选孔'),'ui.holeIndex',String(holeIndex),'text',set.items.map((_,i)=>[String(i),`H${i+1}`]));
   const item=set.items[holeIndex]||set.items[0];s+=field(t('Centre position','孔心位置'),'custom.z',item?.z??40)+field(t('Across-face offset','横向偏移'),'custom.x',item?.x??0);
   s+=`<div class="tf-row">${button(t('+ Hole','+ 孔'),'custom-add')}${button(t('Remove selected','删除所选'),'custom-remove')}</div>`;
  }else s+=`<div class="tf-pair">${field(t('First centre position','首孔中心位置'),'hole.start',set.start)}${field(t('Across-face offset','横向偏移'),'hole.offset',set.offset||0)}</div>`;
  if(set.mode==='pattern')s+=field(t('Hole count','孔数量'),'hole.count',set.count)+field(t('Spacing rule','间距规则'),'hole.spacing',set.spacing||'pitch','text',[['pitch',t('Fixed centre pitch','固定中心距')],['even',t('Between first and last','首末孔均分')]])+(set.spacing==='even'?field(t('Last centre from end','末孔距末端'),'hole.last',set.last):field(t('Centre pitch','孔中心距'),'hole.pitch',set.pitch));
  const groupHoles=previewHoles(set,m.length),h=groupHoles[holeIndex]||groupHoles[0];if(h){const e=holeExtents(h),fw=['A','C'].includes(h.face)?profileSize(m.profile).w:profileSize(m.profile).d;
   s+=`<div class="tf-readouts">${t('Start edge → centre','起点边 → 孔心')}: ${number(h.z)}<br>${t('Start clear → opening','起点净距 → 孔边')}: ${number(h.z-e.z)}<br>${t('End clear → opening','末端净距 → 孔边')}: ${number(m.length-h.z-e.z)}${m.profile.shape!=='round'?`<br>${t('Lower edge → centre','下边 → 孔心')}: ${number(fw/2+h.x)}`:''}</div>`;
   if(m.profile.shape!=='round')s+=field(t('Set lower edge to centre','输入下边至孔心'),'edge.lower',number(fw/2+h.x));
   if(!m.cuts.start&&!m.cuts.end)s+=field(t('Set start clear to hole edge','输入起点边至孔边净距'),'edge.clear',number(h.z-e.z));
  }
  return s+`<p class="tf-hint">${t('Wall view edits the selected opening group. 3D includes all groups. Through cuts affect the selected wall and its opposite.','管壁图编辑所选开孔组，3D 显示所有组。贯穿开孔影响所选面及其相对面。')}</p>`+button(t('Remove opening group','删除此开孔组'),'remove-holes');
 }
 function settings(){
  const o=obj();if(joint){const c=o.overrides[joint]||{type:o.joint,continuous:'horizontal'};return `<h3>${t('Corner joint','角部接头')} ${joint}</h3>`+field(t('Joint pattern','接头形式'),'joint.type',c.type,'text',[['mitre',t('Mitred corner','斜接')],['butt',t('Butt joint','对接')]])+(c.type==='butt'?field(t('Continuous member','连续管件'),'joint.continuous',c.continuous,'text',[['horizontal',t('Horizontal','横管')],['vertical',t('Vertical','竖管')]]):'')+`<p class="tf-hint">${t('Corner override changes this connection only.','仅更改这个角的连接方式。')}</p>`;}
  const m=lastMembers.find(m=>m.key===member);
  if(m&&o.kind==='frame'&&member)return `<h3>${esc(m.id)}</h3><p class="tf-hint">${t('Length','长度')}: ${number(m.length)} mm · ${t('Dimensions follow frame and joints.','尺寸由框架及接头决定。')}${['bottom','top','left','right'].includes(m.key)?'<br>'+t('A front · C back · B inside · D outside','A 前 · C 后 · B 朝框内 · D 朝框外'):''}</p>`+holeSettings(m);
  let s=`<h3>${t('Object settings','对象设置')}</h3>`+field(t('Name','名称'),'object.name',o.name,'text')+profileFields(o.profile);
  if(o.kind==='tube')s+=field(t('Tube length','管长度'),'object.length',o.length)+`<div class="tf-pair">${field(t('Start angle','起点角度'),'object.ends.start',o.ends.start)}${field(t('End angle','末端角度'),'object.ends.end',o.ends.end)}</div><p class="tf-hint">${t('Angles from a square cut. Length is the overall long-edge envelope. Positive angles shorten +X.','角度相对平切面；长度为长边总包络。正角度缩短 +X 面。')}</p>`;
  else {
   const refs=[['outside',t('Outside','外尺寸')],['centre',t('Centreline','中心线')],['inside',t('Inside clear','内净尺寸')]];
   s+=field(t('Width','宽度'),'dimension.width',toReference(o.width,o.profile.width,o.widthRef))+field(t('Width reference','宽度基准'),'object.widthRef',o.widthRef,'text',refs)+field(t('Height','高度'),'dimension.height',toReference(o.height,o.profile.width,o.heightRef))+field(t('Height reference','高度基准'),'object.heightRef',o.heightRef,'text',refs);
   s+=field(t('Default corner joint','默认角部接头'),'object.joint',o.joint,'text',[['mitre',t('Mitre 45° + 45°','45° + 45° 斜接')],['butt',t('Butt — horizontal continuous','对接 — 横管连续')],['fold',t('V-notch & fold (trial)','V 槽折弯（试制）')]]);
   if(o.joint==='fold')s+=field(t('Inside bend radius','折弯内半径'),'object.bendRadius',o.bendRadius)+field('K factor','object.kFactor',o.kFactor)+`<p class="tf-hint">${t('Trial cutting blank. Test one bend before final dimensions.','试制展开管；正式尺寸前先试折一个角。')}</p>`;
   else {
    s+=`<h4>${t('Internal supports','内部支撑')}</h4>`;
    for(const sup of o.supports)s+=`<div class="tf-support"><h4>${esc(sup.id)}</h4>`+field(t('Support type','支撑类型'),`support.${sup.id}.type`,sup.type,'text',[['vertical',t('Vertical','竖向')],['horizontal',t('Horizontal','横向')],['diagonal',t('Diagonal','斜撑')],['cross',t('X brace','X 交叉撑')]])+profileFields(sup.profile||o.profile,`support.${sup.id}.profile`)+(['vertical','horizontal'].includes(sup.type)?field(t('Centre from outer left / bottom','中心距外左边 / 外底边'),`support.${sup.id}.offset`,sup.offset)+field(t('Connection','连接'),`support.${sup.id}.joint`,sup.joint||'butt','text',[['butt',t('Butt','对接')],['pass',t('Pass through perimeter','贯穿边框')]])+(sup.joint==='pass'?field(t('Finished opening length','成品开口长度'),`support.${sup.id}.opening`,sup.opening||(sup.profile||o.profile).width):''):'')+field(t('Joint gap','接头间隙'),`support.${sup.id}.gap`,sup.gap||0)+button(t('Remove support','删除支撑'),'remove-support',`data-id="${sup.id}"`)+'</div>';
    s+=button(t('+ Add support','+ 添加支撑'),'add-support');
   }
  }
  s+=field(t('Quantity','数量'),'object.quantity',o.quantity);
  if(Object.keys(o.holeSets).some(key=>!lastMembers.some(m=>m.key===key)))s+=button(t('Remove unassigned openings','删除未分配的开孔'),'remove-unassigned');
  if(o.kind==='tube'&&lastMembers[0])s+=holeSettings(lastMembers[0]);
  return s;
 }
 function renderDrawing(){
  const canvas=root.querySelector('.tf-canvas');if(!canvas||view3d)return;
  const o=obj(),m=lastMembers.find(m=>m.key===member)||lastMembers[0];
  if(!m){canvas.innerHTML=`<p class="tf-hint">${t('Review the dimensions to draw this object.','请检查尺寸后显示对象。')}</p>`;return;}
  const result=(o.kind==='tube'||wallView)?wallDrawing(m,previewHoles(activeSet(),m.length),holeIndex,drag?.guide||'',language):assemblyDrawing(o,lastMembers,language);
  drawGeometry=result.geometry;canvas.innerHTML=result.svg;
 }
 function resolve(){
  let error='';try{lastMembers=resolveObject(obj());}catch(e){error=e.message;try{const o=clone(obj());o.holeSets={};lastMembers=resolveObject(o);for(const m of lastMembers)m.holes=previewHoles(obj().holeSets?.[m.key],m.length);}catch{lastMembers=[];}}
  return error;
 }
 function render(){
  dispose3d?.();dispose3d=null;disposeFaceGuide?.();disposeFaceGuide=null;const error=resolve();const o=obj();
  const current=generated&&generatedKey===designKey();
  const tree=project.objects.map(item=>`<button type="button" data-action="select-object" data-id="${item.id}" class="${item.id===o.id&&!member&&!joint?'active':''}">${esc(item.name)}</button>${item.id===o.id&&item.kind==='frame'?lastMembers.map(m=>`<button type="button" data-action="select-member" data-id="${m.key}" class="tf-child ${member===m.key?'active':''}">${esc(m.key)}</button>`).join(''):''}`).join('');
  root.innerHTML=`<header class="tf-toolbar"><h2>${t('Tube & Frame','管件与框架')}</h2><div class="tf-row">${button(t('Save project','保存项目'),'save')}${button(t('Undo','撤销'),'undo',undo.length?'':'disabled')}${button(t('Redo','重做'),'redo',redo.length?'':'disabled')}${button(busy?t('Generating…','正在生成…'):t('Generate geometry','生成模型'),'generate',`class="tf-primary" ${busy?'disabled':''}`)}</div></header><nav class="tf-tabs" aria-label="${t('Tube tool sections','管件工具页面')}">${[['project',t('Project','项目')],['design',t('Design','设计')],['production',t('Production','生产')]].map(([v,text])=>button(text,'tab',`data-tab="${v}" class="${tab===v?'active':''}"`)).join('')}<span class="tf-badge">mm · ${current?t('Geometry current','模型已更新'):t('Not generated / changed','未生成 / 已修改')}</span></nav>`;
  if(tab==='project'){
   root.innerHTML+=`<div class="tf-project"><div class="tf-project-grid"><div><h3>${t('Project','项目')}</h3>${field(t('Project name','项目名称'),'project.name',project.name,'text')}<div class="tf-row">${button(t('New project','新建项目'),'new')}${button(t('Open project','打开项目'),'open')}${button(t('Save project','保存项目'),'save')}</div><h4>${t('Add object','添加对象')}</h4><div class="tf-row">${button(t('+ Single tube','+ 单管'),'add-tube')}${button(t('+ Flat frame','+ 平面框架'),'add-frame')}</div><p class="tf-hint">${t('Custom Assembly and box frames are reserved for later phases.','自定义装配与立体框架留待后续阶段。')}</p></div><div><h3>FreeCAD</h3><p class="tf-hint">${engine?.available?`${t('Detected','已检测')} ${esc(engine.version)}<br>${esc(engine.python)}`:t('Install FreeCAD to generate models, then check again or select its installation location.','请安装 FreeCAD 以生成模型，然后重新检测或指定安装位置。')}</p><div class="tf-row">${button(t('Check again','重新检测'),'detect')}<a href="https://www.freecad.org/downloads.php" target="_blank" rel="noopener">${t('Download FreeCAD','下载 FreeCAD')}</a></div>${field(t('FreeCAD folder or bin/python.exe','FreeCAD 文件夹或 bin/python.exe'),'ui.python',engine?.python||'','text')}${button(t('Use this location','使用此位置'),'configure')}</div></div></div>`;
  }else if(tab==='production'){
   let all=[];let allError='';try{all=resolveProject(project);}catch(e){allError=e.message;}
   root.innerHTML+=`<section class="tf-production"><h3>${t('Parts for TubesT','TubesT 管件')}</h3><p class="tf-hint">${t('Import the IGS files into TubesT, confirm quantities, nest there and Save its .yxy project.','将 IGS 导入 TubesT，确认数量，在 TubesT 套料并保存 .yxy 项目。')}</p><div class="tf-table-wrap"><table class="tf-table"><thead><tr>${[t('Part','管件'),t('Section','规格'),t('Length','长度'),t('Qty','数量'),t('Geometry','模型')].map(s=>`<th>${s}</th>`).join('')}</tr></thead><tbody>${all.map(m=>`<tr><td>${esc(m.id)}</td><td>${m.profile.width} × ${profileSize(m.profile).d} × ${m.profile.wall}</td><td>${number(m.length)} ${m.trial?t('(trial)','（试制）'):''}</td><td>${m.quantity}</td><td>${current?t('Ready','已就绪'):t('Generate first','请先生成')}</td></tr>`).join('')}</tbody></table></div><p class="tf-hint">${esc(allError)}</p>${button(t('Prepare for TubesT · ZIP','准备 TubesT 文件 · ZIP'),'package',`class="tf-primary" ${!current||busy?'disabled':''}`)} ${button(t('Download dimension drawing','下载尺寸图'),'drawing')}</section>`;
  }else{
   root.innerHTML+=`<div class="tf-layout"><aside class="tf-tree"><small>${esc(project.name)}</small>${tree}${button(t('+ Tube','+ 管件'),'add-tube')}${button(t('+ Frame','+ 框架'),'add-frame')}${button(t('Remove object','删除对象'),'remove-object',`class="tf-danger" ${project.objects.length===1?'disabled':''}`)}</aside><section class="tf-drawing"><div class="tf-viewbar">${button(t('Assembly','装配图'),'assembly',`class="${!wallView&&!view3d?'active':''}"`)}${button(t('Member wall','管壁图'),'wall',`class="${wallView&&!view3d?'active':''}"`)}${button(t('3D preview','3D 预览'),'3d',`class="${view3d?'active':''}" ${!current?'disabled':''}`)}${button(project.magnet?t('Magnet ON','磁吸 开'):t('Magnet OFF','磁吸 关'),'magnet',`aria-pressed="${project.magnet}" class="${project.magnet?'active':''}"`)}<label>${t('Grid','网格')} <input aria-label="${t('Grid interval','网格间距')}" data-bind="project.grid" type="number" min="0" step="any" value="${project.grid}"></label></div><div class="tf-canvas ${view3d?'tf-preview3d':''}"></div></section><aside class="tf-properties">${settings()}</aside></div>`;
   if(view3d&&current){const parts=generated.parts.filter(m=>m.objectId===o.id);import('./viewer.mjs').then(async({createTubeViewer})=>{const container=root.querySelector('.tf-canvas');if(!container||!view3d)return;const dispose=await createTubeViewer(container,parts,!wallView);if(!container.isConnected||!view3d)dispose();else dispose3d=dispose;}).catch(e=>msg(e.message,true));}else renderDrawing();
  }
  root.innerHTML+=`<div class="tf-status ${error?'error':''}" role="status">${esc(error||status||t('Ready. Select a tube, frame member or joint.','就绪。请选择管件、框架管件或接头。'))}</div><input class="tf-file" type="file" accept=".json,.tframe" aria-label="Open Tube & Frame project">`;
  const guideContainer=root.querySelector('.tf-face-guide'),guideMember=activeMember(),guideSet=activeSet();
  if(guideContainer&&guideMember&&guideSet&&!root.hidden){import('./face-guide.mjs').then(async({createFaceGuide})=>{if(!guideContainer.isConnected||root.hidden)return;const dispose=await createFaceGuide(guideContainer,{member:guideMember,members:lastMembers,assembly:faceGuideAssembly&&o.kind==='frame',face:guideSet.face,angle:guideSet.angle||0,cut:guideSet.cut,language,onFace:face=>{remember();guideSet.face=face;view3d=false;status='';render();},onAngle:angle=>{remember();guideSet.angle=angle;view3d=false;status='';render();}});if(!guideContainer.isConnected||root.hidden)dispose();else disposeFaceGuide=dispose;}).catch(e=>{if(guideContainer.isConnected)guideContainer.textContent=t('3D guide unavailable. Use the labelled face buttons.','3D 指引不可用，请使用标有方向的管壁按钮。');});}
  persist();
 }
 function download(name,data,type){const url=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function safeName(){return (project.name||'tube-frame').replace(/[^\p{L}\p{N}_-]+/gu,'-').slice(0,70)||'tube-frame';}
 async function request(route,body){const r=await fetch(`/api/tube-frame/${route}`,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});let data;try{data=await r.json();}catch{throw Error(t('Restart the local company tools server to enable tube generation.','请重启本地公司工具服务以启用管件生成。'));}if(!r.ok)throw Error(data.error||`HTTP ${r.status}`);return data;}
 async function generate(){
  try{resolveProject(project);busy=true;view3d=false;const snapshot=clone(project),revision=designKey();render();msg(t('FreeCAD is building the hollow tubes…','FreeCAD 正在建立空心管件…'));const result=await request('generate',snapshot);generated=result;generatedKey=revision;status=revision===designKey()?t('Geometry generated. Inspect 3D, then prepare the TubesT package.','模型已生成。请查看 3D，再准备 TubesT 文件。'):t('Design changed during generation. Generate again before production.','生成期间设计已更改，请重新生成。');}catch(e){status=e.message;}finally{busy=false;render();}
 }
 async function pack(){
  if(!generated||generatedKey!==designKey())throw Error(t('Generate the current design first.','请先生成当前设计。'));
  const entries=generated.parts.map(m=>({name:`Parts/${m.id}.igs`,data:Uint8Array.from(atob(m.igs),c=>c.charCodeAt(0))}));
  entries.push({name:'part-list.csv',data:'Part,Section,Wall,Length_mm,Quantity,Trial\r\n'+generated.parts.map(m=>`${m.id},${m.profile.width}x${profileSize(m.profile).d},${m.profile.wall},${m.length},${m.quantity},${!!m.trial}`).join('\r\n')});
  entries.push({name:'project.tframe',data:JSON.stringify(project,null,2)});
  entries.push({name:'README.txt',data:'Weeseng Software — Tube & Frame\nUnits: mm.\nImport Parts/*.igs into TubesT. Set quantities from part-list.csv, verify recognition, nest, and Save .yxy in TubesT.\nCutting settings and clamp allowances remain in TubesT. Fold parts are trial blanks: verify a physical test bend.\nFreeCAD '+generated.version});
  download(safeName()+'-TubesT.zip',await createStoreZip(entries),'application/zip');msg(t('TubesT package prepared. Verify parts and quantities in TubesT.','TubesT 文件已准备。请在 TubesT 检查管件及数量。'));
 }
 function activeMember(){return lastMembers.find(m=>m.key===member)||lastMembers[0];}
 function activeSet(){const m=activeMember(),stored=m&&obj().holeSets[m.key];return Array.isArray(stored)?stored[Math.min(holeGroup,stored.length-1)]:stored;}
 function removeGroup(){const m=activeMember(),stored=obj().holeSets[m.key];if(Array.isArray(stored)&&stored.length>1){stored.splice(holeGroup,1);holeGroup=0;}else delete obj().holeSets[m.key];holeIndex=0;}
 function editPosition(z,x){
  const set=activeSet(),m=activeMember();if(!set||!m)return;
  let stored=z;if(set.reference==='end')stored=m.length-z;else if(set.reference==='centre')stored=z-m.length/2;
  if(set.mode==='custom'){set.items[holeIndex]={z:stored,x};}else {set.start=stored;set.offset=x;}
 }
 function editField(event,live=false){
  const el=event.target;
  if(el.matches('.tf-file')){const file=el.files[0];if(file)file.text().then(text=>{const p=readProject(JSON.parse(text));remember();project=p;selected=p.objects[0].id;member='';joint='';view3d=false;tab='design';status=t('Project opened. Generate geometry for production.','项目已打开。请生成模型以进行生产。');render();}).catch(e=>msg(e.message,true));return;}
  const bind=el.dataset.bind;if(!bind||bind==='ui.python')return;
  const value=el.type==='number'?Number(el.value):el.value;if(el.type==='number'&&(!el.value.trim()||!Number.isFinite(value))){msg(t('Enter a valid number.','请输入有效数字。'),true);return;}
  remember();view3d=false;const o=obj(),[scope,...path]=bind.split('.');
  if(scope==='ui'){if(path[0]==='holeGroup'){holeGroup=Number(value);holeIndex=0;}else holeIndex=Number(value);}
  else if(scope==='dimension'){o[path[0]]=fromReference(value,o.profile.width,o[`${path[0]}Ref`]);}
  else if(scope==='joint'){o.overrides[joint]={type:o.joint,continuous:'horizontal',...o.overrides[joint],[path[0]]:value};}
  else if(scope==='support'){const s=o.supports.find(s=>s.id===path[0]);if(path[1]==='profile'){s.profile||=clone(o.profile);s.profile[path[2]]=value;}else s[path[1]]=value;}
  else if(scope==='custom'){const set=activeSet();set.items[holeIndex][path[0]]=value;}
  else if(scope==='edge'){
   const m=activeMember(),set=activeSet(),holes=m?expandHoles(set,m.length):[],h=holes[holeIndex]||holes[0];if(h){const e=holeExtents(h),fw=['A','C'].includes(h.face)?profileSize(m.profile).w:profileSize(m.profile).d;editPosition(path[0]==='clear'?value+e.z:h.z,path[0]==='lower'?value-fw/2:h.x);}
  }else {
   let target=scope==='project'?project:scope==='hole'?activeSet():o;
   if(scope==='hole'&&path[0]==='reference'){
    const set=activeSet(),m=activeMember(),expanded=expandHoles(set,m.length);const toStored=z=>value==='end'?m.length-z:value==='centre'?z-m.length/2:z;
    if(set.mode==='custom')set.items=expanded.map(h=>({z:toStored(h.z),x:h.x}));else {set.start=toStored(expanded[0]?.z??40);if(set.mode==='pattern'&&value==='end'&&set.reference!=='end'||set.mode==='pattern'&&value!=='end'&&set.reference==='end')set.pitch=-set.pitch;}
   }
   if(scope==='hole'&&path[0]==='mode'&&value==='custom'){
    const set=activeSet(),m=activeMember();set.items=expandHoles(set,m.length).map(h=>({z:set.reference==='end'?m.length-h.z:set.reference==='centre'?h.z-m.length/2:h.z,x:h.x}));holeIndex=0;
   }
   for(let i=0;i<path.length-1;i++)target=target[path[i]];target[path.at(-1)]=value;
   if(bind==='object.joint')o.overrides={};
   if(scope==='hole'&&path[0]==='mode')holeIndex=0;
  }
  status='';
  if(live){
   const error=resolve();renderDrawing();persist();msg(error,!!error);const current=generated&&generatedKey===designKey(),badge=root.querySelector('.tf-badge');
   if(badge)badge.textContent=current?t('mm · Geometry current','mm · 模型已更新'):t('mm · Changed — generate again','mm · 已修改 — 请重新生成');
   const m=activeMember(),holes=m?expandHoles(activeSet(),m.length):[],h=holes[holeIndex]||holes[0],read=root.querySelector('.tf-readouts');
   if(h&&read){const e=holeExtents(h);read.textContent=`${t('Start edge → centre','起点边 → 孔心')}: ${number(h.z)} mm · ${t('Clear to hole edge','至孔边净距')}: ${number(h.z-e.z)} mm`;}
   for(const action of ['package','3d']){const b=root.querySelector(`[data-action="${action}"]`);if(b)b.disabled=!current;}
  }
  else render();
 }
 const guardedEdit=(event,live=false)=>{try{editField(event,live);}catch(error){msg(error.message,true);}};
 root.addEventListener('change',event=>guardedEdit(event));
 root.addEventListener('input',event=>{if(event.target.matches('input[data-bind]:not([data-bind="ui.python"])'))guardedEdit(event,true);});
 root.addEventListener('click',async event=>{
  const jointTarget=event.target.closest('[data-joint]'),memberTarget=event.target.closest('[data-member]');
  if(jointTarget){joint=jointTarget.dataset.joint;member='';wallView=false;view3d=false;render();return;}
  if(memberTarget){member=memberTarget.dataset.member;joint='';wallView=true;view3d=false;holeIndex=0;render();return;}
  const b=event.target.closest('[data-action]');if(!b||b.disabled)return;const action=b.dataset.action;
  try{
   if(action==='tab'){tab=b.dataset.tab;view3d=false;render();return;}
   if(action==='save'){download(safeName()+'.tframe',JSON.stringify(project,null,2),'application/json');msg(t('Project saved.','项目已保存。'));return;}
   if(action==='open'){root.querySelector('.tf-file').click();return;}
   if(action==='generate'){await generate();return;}
   if(action==='package'){await pack();return;}
   if(action==='detect'||action==='configure'){msg(t('Checking FreeCAD…','正在检测 FreeCAD…'));engine=await request(action==='detect'?'status':'configure',action==='detect'?undefined:{python:root.querySelector('[data-bind="ui.python"]').value});status=engine.available?t('FreeCAD is ready.','FreeCAD 已就绪。'):engine.message;render();return;}
   if(action==='select-object'){selected=b.dataset.id;member='';joint='';holeIndex=0;wallView=false;view3d=false;render();return;}
   if(action==='select-member'){member=b.dataset.id;joint='';holeIndex=0;wallView=true;view3d=false;render();return;}
   if(action==='guide-member'||action==='guide-frame'){faceGuideAssembly=action==='guide-frame';render();return;}
   if(action==='assembly'||action==='wall'||action==='3d'){wallView=action==='wall'?true:action==='assembly'?false:wallView;view3d=action==='3d';joint='';render();return;}
   if(action==='drawing'){const o=obj();const drawing=assemblyDrawing(o,lastMembers,language);download(`${o.id}-drawing.svg`,drawing.svg.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" ').replaceAll('class="tf-member"','fill="#d2e0e0" stroke="#253d3c"').replaceAll('class="tf-wall"','fill="#d2e0e0" stroke="#253d3c"').replaceAll('class="tf-inner"','fill="white" stroke="#253d3c"').replaceAll('class="tf-dimension"','stroke="#237d70"'),'image/svg+xml');return;}
   if(action==='undo'||action==='redo'){const from=action==='undo'?undo:redo,to=action==='undo'?redo:undo;if(from.length){to.push(key());project=JSON.parse(from.pop());if(!project.objects.some(o=>o.id===selected))selected=project.objects[0].id;member='';joint='';view3d=false;render();}return;}
   remember();view3d=false;status='';
   if(action==='new'){project=newProject();selected=project.objects[0].id;member='';joint='';}
   if(action==='add-tube'||action==='add-frame'){const kind=action==='add-frame'?'frame':'tube';let n=1;while(project.objects.some(o=>o.id===`${kind==='frame'?'F':'T'}${n}`))n++;const o=newObject(kind,n);project.objects.push(o);selected=o.id;member='';joint='';wallView=false;tab='design';}
   if(action==='remove-object'&&project.objects.length>1){project.objects=project.objects.filter(o=>o.id!==selected);selected=project.objects[0].id;member='';joint='';}
   if(action==='magnet')project.magnet=!project.magnet;
   if(action==='add-hole'){const m=activeMember(),set=defaultHole();set.start=Math.min(m.length/2,Math.max(40,(m.cuts.start?m.profile.width:0)+set.diameter/2+5));const previous=obj().holeSets[m.key],groups=Array.isArray(previous)?previous:previous?[previous]:[];groups.push(set);obj().holeSets[m.key]=groups;holeGroup=groups.length-1;holeIndex=0;wallView=true;}
   if(action==='remove-holes')removeGroup();
   if(action==='remove-unassigned'){const keys=new Set(lastMembers.map(m=>m.key));for(const key of Object.keys(obj().holeSets))if(!keys.has(key))delete obj().holeSets[key];}
   if(action==='face')activeSet().face=b.dataset.face;
   if(action==='custom-add'){const set=activeSet();set.items.push({z:(set.items.at(-1)?.z||0)+40,x:0});holeIndex=set.items.length-1;}
   if(action==='custom-remove'){const set=activeSet();if(set.items.length>1){set.items.splice(holeIndex,1);holeIndex=0;}else removeGroup();}
   if(action==='add-support'){const o=obj();let n=1;while(o.supports.some(s=>s.id===`S${n}`))n++;o.supports.push({id:`S${n}`,type:'vertical',offset:o.width/2,joint:'butt',gap:0,profile:clone(o.profile)});}
   if(action==='remove-support')obj().supports=obj().supports.filter(s=>s.id!==b.dataset.id);
   render();
  }catch(e){msg(e.message,true);}
 });
 root.addEventListener('pointerdown',event=>{
  const target=event.target.closest('[data-hole]');if(!target||view3d)return;
  holeIndex=Number(target.dataset.hole);const set=activeSet();if(!set)return;
  if(set.mode==='pattern'){render();return;}
  event.preventDefault();remember();drag={before:undo.at(-1),guide:''};renderDrawing();
 });
 window.addEventListener('pointermove',event=>{
  if(!drag)return;const svg=root.querySelector('.tf-canvas svg');if(!svg||!drawGeometry)return;
  const p=new DOMPoint(event.clientX,event.clientY).matrixTransform(svg.getScreenCTM().inverse()),g=drawGeometry;
  const m=activeMember();let z=(p.x-g.x0)/g.scale,x=g.width/2-(p.y-g.y0)/g.scale;
  const screenScale=Math.hypot(svg.getScreenCTM().a,svg.getScreenCTM().b);
  const snapped=snapHole({z,x},project.magnet,Number(project.grid),8/(g.scale*screenScale),previewHoles(activeSet(),m.length).filter((_,i)=>i!==holeIndex));
  if(m.profile.shape==='round'){activeSet().angle=((snapped.x*360/(Math.PI*m.profile.width))%360+360)%360;editPosition(snapped.z,0);}else editPosition(snapped.z,snapped.x);
  drag.guide=snapped.guide;resolve();renderDrawing();
  const read=root.querySelector('.tf-readouts');if(read)read.textContent=`${t('Start edge → centre','起点边 → 孔心')}: ${number(snapped.z)} mm · ${t('Offset','偏移')}: ${number(snapped.x)} mm`;
 });
 window.addEventListener('pointerup',()=>{if(!drag)return;try{resolveObject(obj());status='';}catch(e){project=JSON.parse(drag.before);status=t('Move cancelled: ','移动已取消：')+e.message;undo.pop();}drag=null;render();});
 window.addEventListener('keydown',event=>{if(event.key==='Escape'&&drag){project=JSON.parse(drag.before);undo.pop();drag=null;render();}});
 window.addEventListener('weeseng-preferences',event=>{language=event.detail.language==='cn'?'cn':'en';if(!root.hidden)render();});
 render();
 return {open(lang){language=lang==='cn'?'cn':'en';render();if(!engine)request('status').then(data=>{engine=data;if(tab==='project')render();}).catch(e=>msg(e.message,true));},close(){disposeFaceGuide?.();disposeFaceGuide=null;dispose3d?.();dispose3d=null;},get name(){return project.name;}};
}
