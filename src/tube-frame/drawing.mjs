import {profileSize,holeExtents,toReference} from './model.mjs';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const f=n=>Number(n.toFixed(2));
const cutInset=(angle,x,w)=>Math.tan(Math.abs(angle||0)*Math.PI/180)*((angle||0)>=0?x+w/2:w/2-x);
export function endCutOutline(member,face,width){
 const {w}=profileSize(member.profile),round=member.profile.shape==='round',steps=round?48:1;
 const xAt=u=>round?-w/2*Math.sin((180-u/width*360)*Math.PI/180):face==='A'?-w/2+u:face==='C'?w/2-u:face==='B'?w/2:-w/2;
 const points=[];
 for(let i=0;i<=steps;i++){const u=i/steps*width;points.push({z:cutInset(member.cuts?.start,xAt(u),w),u});}
 for(let i=steps;i>=0;i--){const u=i/steps*width;points.push({z:member.length-cutInset(member.cuts?.end,xAt(u),w),u});}
 return points;
}
function angleDetails(member,cn){
 const start=Number(member.cuts?.start||0),end=Number(member.cuts?.end||0);
 if(!start&&!end)return '';
 let s=`<text x="90" y="72" class="tf-svg-note">${cn?'端部切角详图 — 相对平切面':'End cut detail — degrees from square'}</text>`;
 for(const [angle,x,label,isEnd] of [[start,100,cn?'起点':'Start',false],[end,660,cn?'末端':'End',true]]){
  const h=42,y=125,L=195,delta=Math.tan(Math.abs(angle)*Math.PI/180)*h;
  const a=angle>=0?0:delta,b=angle>=0?delta:0;
  const points=isEnd?[[x,y],[x+L-a,y],[x+L-b,y+h],[x,y+h]]:[[x+a,y],[x+L,y],[x+L,y+h],[x+b,y+h]];
  const rx=isEnd?x+L:x;
  s+=`<text x="${x}" y="105" class="tf-angle-label">${label} ${f(angle)}°</text><polygon points="${points.map(p=>p.join(',')).join(' ')}" class="tf-wall"/><line x1="${rx}" y1="${y-6}" x2="${rx}" y2="${y+h+8}" class="tf-centreline"/>`;
 }
 return s;
}
export function wallDrawing(member,holes,selected=0,guide='',lang='en'){
 const cn=lang==='cn',{w,d}=profileSize(member.profile),face=holes[selected]?.face||'A';
 const width=member.profile.shape==='round'?Math.PI*w:['A','C'].includes(face)?w:d;
 const margin=90,scale=Math.min(820/member.length,270/width),L=member.length*scale,H=width*scale;
 const x0=margin,hasAngles=!!(member.cuts?.start||member.cuts?.end),y0=Math.max(hasAngles?235:170,170+(270-H)/2),viewHeight=Math.max(600,y0+H+155);
 const line=(x1,y1,x2,y2,cls='tf-dimension')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}"/>`;
 const outline=endCutOutline(member,face,width).map(p=>`${x0+p.z*scale},${y0+p.u*scale}`).join(' ');
 let s=`<svg viewBox="0 0 1000 ${viewHeight}" role="img" aria-label="${cn?'管壁与孔位':'Tube wall and hole positions'}"><text x="40" y="35" class="tf-svg-title">${esc(member.id)} · ${member.profile.shape==='round'?(cn?'展开管壁':'Unwrapped wall'):`${cn?'面':'Face'} ${face}`} · mm</text>${angleDetails(member,cn)}<polygon points="${outline}" class="tf-wall"/>`;
 s+=line(x0,y0-35,x0+L,y0-35)+`<text x="${x0+L/2}" y="${y0-45}" text-anchor="middle">${f(member.length)} mm</text>`;
 s+=line(x0,y0+H/2,x0+L,y0+H/2,'tf-centreline');
 holes.forEach((h,i)=>{
  if(member.profile.shape!=='round'&&h.face!==face)return;
  const x=x0+h.z*scale,y=y0+H/2-(member.profile.shape==='round'?((h.angle%360)*Math.PI*w/360):h.x)*scale;
  const e=holeExtents(h);const attr=`data-hole="${i}" class="tf-hole ${i===selected?'selected':''}"`;
  if(h.shape==='circle')s+=`<ellipse cx="${x}" cy="${y}" rx="${Math.max(3,e.z*scale)}" ry="${Math.max(3,e.x*scale)}" ${attr}/>`;
  else s+=`<rect x="${x-e.z*scale}" y="${y-e.x*scale}" width="${e.z*2*scale}" height="${e.x*2*scale}" rx="${h.shape==='slot'?e.x*scale:0}" ${attr}/>`;
  s+=`<ellipse cx="${x}" cy="${y}" rx="${Math.max(3,e.z*scale)}" ry="${Math.max(3,e.x*scale)}" data-hole="${i}" class="tf-hole-hit"/>`;
  if(i===selected){
   s+=line(x0,y0+H+38,x,y0+H+38)+line(x,y-12,x,y0+H+43)+`<text x="${x0}" y="${y0+H+65}">${cn?'起点边至孔心':'Start edge to centre'}: ${f(h.z)}</text>`;
   s+=`<text x="${x0}" y="${y0+H+92}">${cn?'至孔边净距':'Clear to hole edge'}: ${f(h.z-e.z)} · ${cn?'末端净距':'End clearance'}: ${f(member.length-h.z-e.z)}</text>`;
   if(member.profile.shape!=='round')s+=`<text x="${x0}" y="${y0+H+119}">${cn?'下边至孔心':'Lower edge to centre'}: ${f(width/2+h.x)} · ${cn?'上边至孔心':'Upper edge to centre'}: ${f(width/2-h.x)}</text>`;
  }
 });
 if(guide)s+=`<text x="40" y="${viewHeight-40}" class="tf-snap-label">${esc(guide)}</text>`;
 s+=`<text x="40" y="${viewHeight-10}" class="tf-svg-note">${cn?'拖动单孔 / 自定义孔；可输入尺寸精确定位':'Drag Single / Custom holes; enter dimensions for precise placement'}</text></svg>`;
 return {svg:s,geometry:{x0,y0,scale,width,L,H}};
}
export function assemblyDrawing(o,members,lang='en'){
 const cn=lang==='cn',width=o.kind==='frame'?o.width:members[0]?.length||1000,height=o.kind==='frame'?o.height:o.profile.width;
 const scale=Math.min(740/width,400/height),ox=140,oy=480;
 const point=([x,y])=>[ox+x*scale,oy-y*scale];
 let s=`<svg viewBox="0 0 1000 600" role="img" aria-label="${cn?'框架图':'Frame drawing'}"><text x="40" y="35" class="tf-svg-title">${esc(o.name)} · ${cn?'正视图':'Front view'} · mm</text>`;
 if(o.joint==='fold'){
  const w=o.profile.width;const [a,b]=point([0,height]);s+=`<rect x="${a}" y="${b}" width="${width*scale}" height="${height*scale}" class="tf-wall"/><rect x="${a+w*scale}" y="${b+w*scale}" width="${(width-2*w)*scale}" height="${(height-2*w)*scale}" class="tf-inner"/><text x="40" y="565" class="tf-snap-label">${cn?'折弯目标示意 — 切割件为直管，需试折':'Fold target only — generated cutting part is straight; test bend required'}</text>`;
 }else for(const m of members){
  const {w}=profileSize(m.profile),p=m.placement;
  const corners=[[-w/2,cutInset(m.cuts?.start,-w/2,w)],[w/2,cutInset(m.cuts?.start,w/2,w)],[w/2,m.length-cutInset(m.cuts?.end,w/2,w)],[-w/2,m.length-cutInset(m.cuts?.end,-w/2,w)]].map(([x,z])=>point([p.start[0]+p.xAxis[0]*x+p.direction[0]*z,p.start[1]+p.xAxis[1]*x+p.direction[1]*z]));
  s+=`<polygon points="${corners.map(p=>p.join(',')).join(' ')}" class="tf-member" data-member="${esc(m.key)}"/><title>${esc(m.id)}</title>`;
 }
 const top=oy-height*scale;
 const refLabel=r=>r==='inside'?(cn?'内净尺寸':'inside'):r==='centre'?(cn?'中心线':'centreline'):(cn?'外尺寸':'outside');
 const inset=r=>r==='inside'?o.profile.width:r==='centre'?o.profile.width/2:0;
 const wi=o.kind==='frame'?inset(o.widthRef):0,hi=o.kind==='frame'?inset(o.heightRef):0;
 s+=`<line x1="${ox+wi*scale}" y1="${top-30}" x2="${ox+(width-wi)*scale}" y2="${top-30}" class="tf-dimension"/><text x="${ox+width*scale/2}" y="${top-40}" text-anchor="middle">${f(toReference(width,o.profile.width,o.widthRef))} ${refLabel(o.widthRef)}</text><line x1="${ox+width*scale+12}" y1="${top+hi*scale}" x2="${ox+width*scale+12}" y2="${oy-hi*scale}" class="tf-dimension"/><text x="${ox+width*scale+22}" y="${oy-height*scale/2}">${f(toReference(height,o.profile.width,o.heightRef))}</text>`;
 if(o.kind==='frame'&&o.joint!=='fold')for(const [key,x,y] of [['BL',0,0],['BR',width,0],['TR',width,height],['TL',0,height]]){const [cx,cy]=point([x,y]);s+=`<circle cx="${cx}" cy="${cy}" r="9" class="tf-joint" data-joint="${key}"><title>${key}</title></circle>`;}
 return {svg:s+'</svg>'};
}
