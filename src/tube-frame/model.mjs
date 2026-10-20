export const FORMAT='weeseng-tube-frame';
const round=n=>Math.round(n*1e8)/1e8;
const positive=(n,label,max=20000)=>{if(!Number.isFinite(n)||n<=0||n>max)throw Error(`${label}: enter a value above 0 and at most ${max}.`);return n;};
export function newObject(kind,index=1){return {id:`${kind==='frame'?'F':'T'}${index}`,kind,name:`${kind==='frame'?'Frame':'Tube'} ${index}`,profile:{shape:'square',width:38.1,depth:38.1,wall:1.2,radius:1.2},length:1000,width:600,height:600,widthRef:'outside',heightRef:'outside',quantity:1,joint:'mitre',overrides:{},supports:[],holeSets:{},ends:{start:0,end:0},bendRadius:1.2,kFactor:0.4};}
export function newProject(){return {format:FORMAT,version:1,name:'Untitled project',objects:[newObject('tube')],magnet:true,grid:5};}
export function toReference(outer,w,ref){return round(outer-(ref==='inside'?2*w:ref==='centre'?w:0));}
export function fromReference(value,w,ref){return round(value+(ref==='inside'?2*w:ref==='centre'?w:0));}
export function profileSize(p){return {w:p.width,d:p.shape==='square'||p.shape==='round'?p.width:p.depth};}
export function validateProfile(p){
 if(!p||!['square','rectangle','round'].includes(p.shape))throw Error('Choose a tube profile.');
 const {w,d}=profileSize(p);positive(w,'Section width',500);positive(d,'Section depth',500);positive(p.wall,'Wall',100);
 if(p.wall*2>=Math.min(w,d))throw Error('Wall thickness must leave a hollow interior.');
 if(p.shape!=='round'&&(!Number.isFinite(p.radius)||p.radius<0||p.radius>Math.min(w,d)/2))throw Error('Outside radius must fit the section.');
}
export function expandHoles(set,length){
 if(Array.isArray(set)){if(set.length>20)throw Error('Maximum 20 opening groups per member.');return set.flatMap((group,index)=>expandHoles(group,length).map(h=>({...h,id:`G${index+1}-${h.id}`,group:index})));}
 if(!set||set.mode==='none')return [];
 const size={shape:set.shape||'circle',diameter:Number(set.diameter??19.05),width:Number(set.width??19.05),height:Number(set.height??30),face:set.face||'A',cut:set.cut||'single',angle:Number(set.angle||0)};
 if(!['single','pattern','custom'].includes(set.mode))throw Error('Invalid opening placement mode.');
 const count=set.mode==='pattern'?Number(set.count):1;if(!Number.isInteger(count)||count<1||count>200)throw Error('Hole count must be 1–200.');
 const physical=z=>set.reference==='end'?length-z:set.reference==='centre'?length/2+z:z;
 const stored=z=>set.reference==='end'?length-z:set.reference==='centre'?z-length/2:z;
 const first=Number(set.start??40);
 const entries=set.mode==='custom'?(set.items||[]):Array.from({length:count},(_,i)=>({z:set.spacing==='even'&&count>1?stored(physical(first)+i*(length-Number(set.last??40)-physical(first))/(count-1)):first+i*Number(set.pitch??100),x:Number(set.offset||0)}));
 if(entries.length>200)throw Error('Maximum 200 custom openings per member.');
 return entries.map((pos,i)=>{let z=Number(pos.z);if(set.reference==='end')z=length-z;else if(set.reference==='centre')z=length/2+z;return {...size,id:`H${i+1}`,z,x:Number(pos.x??0)};});
}
export function holeExtents(h){return {x:(h.shape==='circle'?h.diameter:h.width)/2,z:(h.shape==='circle'?h.diameter:h.height)/2};}
export function validateHoles(member){
 const {w,d}=profileSize(member.profile);
 for(const h of member.holes){
  if(!['A','B','C','D'].includes(h.face)||!['single','through'].includes(h.cut)||!['circle','rectangle','slot'].includes(h.shape))throw Error(`${member.id}: invalid opening settings.`);
  const e=holeExtents(h),faceWidth=['A','C'].includes(h.face)?w:d;
  if(![h.z,h.x,e.x,e.z,h.angle].every(Number.isFinite)||e.x<=0||e.z<=0)throw Error(`${member.id}: invalid hole dimensions.`);
  let xmin=-w/2,xmax=w/2;
  if(member.profile.shape!=='round'){
   if(h.face==='A'||h.face==='C'){const x=h.face==='A'?-h.x:h.x;xmin=x-e.x;xmax=x+e.x;}
   else if(h.face==='B'){xmin=w/2-member.profile.wall;xmax=w/2;}
   else{xmin=-w/2;xmax=-w/2+member.profile.wall;}
   if(h.cut==='through'&&(h.face==='B'||h.face==='D')){xmin=-w/2;xmax=w/2;}
  }
  const endInset=angle=>Math.abs(Math.tan((angle||0)*Math.PI/180))*((angle||0)>=0?xmax+w/2:w/2-xmin);
  if(h.z-e.z<endInset(member.cuts?.start)||h.z+e.z>member.length-endInset(member.cuts?.end)|| (member.profile.shape!=='round'&&Math.abs(h.x)+e.x>faceWidth/2-member.profile.radius))throw Error(`${member.id}: hole ${h.id} crosses an end or rounded edge. Move it inside the flat wall.`);
  if(member.profile.shape==='round'&&h.x!==0)throw Error(`${member.id}: round tube holes use angle, not across-face offset.`);
  if(h.shape==='slot'&&h.height<h.width)throw Error(`${member.id}: slot length must be at least its width.`);
 }
}
export function snapHole(pos,magnet,grid=5,threshold=2,others=[]){
 if(!magnet)return {...pos,guide:''};
 let {z,x}=pos,guide='';
 const candidates=[{x:0,guide:'Centreline'},...others.map(h=>({x:h.x,z:h.z,guide:'Hole alignment'}))];
 for(const axis of ['x','z']){let best=threshold;for(const c of candidates)if(c[axis]!==undefined&&Math.abs(c[axis]-pos[axis])<best){best=Math.abs(c[axis]-pos[axis]);if(axis==='x')x=c.x;else z=c.z;guide=c.guide;}}
 if(grid>0&&Number.isFinite(grid)){for(const axis of ['x','z']){const value=axis==='x'?x:z,snapped=Math.round(value/grid)*grid;if(Math.abs(value-snapped)<threshold&&value===pos[axis]){if(axis==='x')x=snapped;else z=snapped;guide=guide||`Grid ${grid} mm`;}}}
 return {x,z,guide};
}
export function readProject(data){
 if(data?.format!==FORMAT||data.version!==1||!Array.isArray(data.objects)||data.objects.length>50||data.objects.length<1)throw Error('This is not a supported Tube & Frame project.');
 const copy=JSON.parse(JSON.stringify(data));
 for(const o of copy.objects){
  if(!o||!['tube','frame'].includes(o.kind)||typeof o.id!=='string'||!/^[-\w]{1,40}$/.test(o.id)||!o.profile||!o.holeSets||!Array.isArray(o.supports)||!o.ends)throw Error('Project has an invalid object structure.');
  o.overrides||={};
 }
 if(new Set(copy.objects.map(o=>o.id)).size!==copy.objects.length)throw Error('Project has duplicate object IDs.');
 return copy;
}
export function resolveObject(o){
 validateProfile(o.profile);const {w,d}=profileSize(o.profile);
 if(!Number.isInteger(o.quantity)||o.quantity<1||o.quantity>1000)throw Error(`${o.id}: quantity must be 1–1000.`);
 const members=[];
 const finish=()=>{const keys=new Set(members.map(m=>m.key)),unassigned=Object.keys(o.holeSets||{}).filter(key=>!keys.has(key));if(unassigned.length)throw Error(`${o.id}: unassigned openings on ${unassigned.join(', ')}. Undo the topology change or remove unassigned openings.`);return members;};
 function add(key,length,start=[0,0],direction=[1,0],xAxis=[0,1],cuts={},extra={}){
  positive(length,`${o.id}/${key} length`);const m={id:`${o.id}-${key}`,objectId:o.id,key,profile:{...o.profile},length,quantity:o.quantity,placement:{start,direction,xAxis},cuts:{start:0,end:0,...cuts},...extra};
  for(const angle of [m.cuts.start,m.cuts.end])if(!Number.isFinite(angle)||Math.abs(angle)>75)throw Error('End angles must be between -75 and 75 degrees from square.');
  m.holes=expandHoles(o.holeSets?.[key],length);validateHoles(m);members.push(m);return m;
 }
 if(o.kind==='tube'){add('main',Number(o.length),[0,0],[1,0],[0,1],o.ends);return finish();}
 if(o.kind!=='frame')throw Error('Unsupported object type.');
 positive(o.width,'Frame width');positive(o.height,'Frame height');
 if(o.width<=w*2||o.height<=w*2)throw Error('Frame must have a positive clear opening.');
 if(o.profile.shape==='round')throw Error('Flat frame preset uses square or rectangular tube. Use Single Tube for round profiles.');
 if(!['mitre','butt','fold'].includes(o.joint))throw Error('Choose a frame corner joint.');
 const W=o.width,H=o.height;
 if(o.joint==='fold'){
  if((o.supports||[]).length)throw Error('Trial fold perimeter currently has no internal supports.');
  const ri=Number(o.bendRadius),k=Number(o.kFactor);if(!Number.isFinite(ri)||ri<0||!Number.isFinite(k)||k<=0||k>1)throw Error('Enter a bend radius and K factor above 0 and at most 1.');
  const ba=Math.PI/2*(ri+k*o.profile.wall),bd=2*(ri+o.profile.wall)-ba;
  const L=2*W+2*H-3*bd,centres=[W-bd/2,W+H-1.5*bd,2*W+H-2.5*bd];
  add('fold',L,[0,0],[1,0],[0,1],{start:-45,end:-45},{fold:{centres,allowance:ba,bendRadius:ri,kFactor:k},trial:true});return finish();
 }
 // Every corner can independently choose mitre or butt. A butt corner's continuing member is explicit.
 const corners=['BL','BR','TR','TL'].map(key=>({key,type:o.overrides?.[key]?.type||o.joint,continuous:o.overrides?.[key]?.continuous||'horizontal'}));
 if(corners.some(c=>!['mitre','butt'].includes(c.type)||!['horizontal','vertical'].includes(c.continuous)))throw Error('Invalid corner override.');
 const by=Object.fromEntries(corners.map(c=>[c.key,c]));
 for(const [key,L,start,dir,xaxis,ends,orientation] of [
 ['bottom',W,[0,w/2],[1,0],[0,1],['BL','BR'],'horizontal'],
 ['top',W,[0,H-w/2],[1,0],[0,-1],['TL','TR'],'horizontal'],
 ['left',H,[w/2,0],[0,1],[1,0],['BL','TL'],'vertical'],
 ['right',H,[W-w/2,0],[0,1],[-1,0],['BR','TR'],'vertical']]){
  const inset=ends.map(c=>by[c].type==='butt'&&by[c].continuous!==orientation?w:0);
  add(key,L-inset[0]-inset[1],[start[0]+dir[0]*inset[0],start[1]+dir[1]*inset[0]],dir,xaxis,{start:by[ends[0]].type==='mitre'?45:0,end:by[ends[1]].type==='mitre'?45:0});
 }
 const supports=o.supports||[];if(supports.length>30)throw Error('Maximum 30 supports per frame.');
 const horiz=supports.filter(s=>s.type==='horizontal'),vertical=supports.filter(s=>s.type==='vertical');
 for(const s of supports){
  const sp=s.profile||o.profile;validateProfile(sp);const {w:sw,d:sd}=profileSize(sp);
  const supportExtra={profile:{...sp}};
  const gap=Number(s.gap||0);if(gap<0||!Number.isFinite(gap)||gap>20)throw Error('Joint gap must be 0–20 mm.');
  if(s.type==='horizontal'||s.type==='vertical'){
   const v=s.type==='vertical',offset=Number(s.offset),limit=v?W:H;
   if(!Number.isFinite(offset)||offset-sw/2<w||offset+sw/2>limit-w)throw Error(`Support ${s.id}: position must fit inside the frame.`);
   const receiving=v?['bottom','top']:['left','right'];
   if(s.joint==='pass'){
    if(vertical.length&&horiz.length)throw Error('Pass-through supports with crossing supports require explicit custom joints; use butt supports here.');
    const holeSize=Number(s.opening||sw);if(holeSize<sw)throw Error('Pass-through opening must fit the passing tube.');
    for(const key of receiving){const m=members.find(m=>m.key===key);const origin=v?m.placement.start[0]:m.placement.start[1];m.holes.push({id:`pass-${s.id}`,shape:sp.shape==='round'?'circle':'rectangle',diameter:holeSize,width:sd,height:holeSize,x:0,z:offset-origin,face:'B',cut:'through',angle:0});validateHoles(m);}
    add(s.id,limit-2*gap,v?[offset,gap]:[gap,offset],v?[0,1]:[1,0],v?[1,0]:[0,1],{},supportExtra);
   }else{
    const spans=v?[w+gap,...horiz.flatMap(h=>[Number(h.offset)-(h.profile||o.profile).width/2-gap,Number(h.offset)+(h.profile||o.profile).width/2+gap]).sort((a,b)=>a-b),H-w-gap]:[w+gap,W-w-gap];
    for(let i=0;i<spans.length;i+=2)add(`${s.id}${spans.length>2?`-${i/2+1}`:''}`,spans[i+1]-spans[i],v?[offset,spans[i]]:[spans[i],offset],v?[0,1]:[1,0],v?[1,0]:[0,1],{},supportExtra);
   }
  }else if(s.type==='diagonal'||s.type==='cross'){
   if(supports.length!==1)throw Error('Diagonal/cross preset currently stands alone; remove other supports.');
   const iw=W-2*w,ih=H-2*w,L=Math.hypot(iw,ih),a=iw/L,b=ih/L;
   const clip={minX:w+gap,maxX:W-w-gap,minY:w+gap,maxY:H-w-gap};
   add(s.id,L,[w,w],[a,b],[-b,a],{},{clip,...supportExtra});
   if(s.type==='cross'){
    const half=sw/(4*a*b)+gap; // width of the continuous diagonal measured along the crossing member
    if(half>=L/2)throw Error('Frame is too narrow for an X support.');
    add(`${s.id}-2a`,L/2-half,[w,H-w],[a,-b],[b,a],{},{clip,...supportExtra});
    add(`${s.id}-2b`,L/2-half,[w+a*(L/2+half),H-w-b*(L/2+half)],[a,-b],[b,a],{},{clip,...supportExtra});
   }
  }else throw Error('Unknown support type.');
 }
 return finish();
}
export function resolveProject(p){
 if(!p||!Array.isArray(p.objects)||p.objects.length<1||p.objects.length>50)throw Error('Project needs 1–50 objects.');
 const ids=p.objects.map(o=>o.id);if(ids.some(id=>typeof id!=='string'||!/^[-\w]{1,40}$/.test(id))||new Set(ids).size!==ids.length)throw Error('Object IDs must be unique simple identifiers.');
 const result=p.objects.flatMap(resolveObject);if(result.length>300)throw Error('Maximum 300 generated parts per job.');return result;
}
