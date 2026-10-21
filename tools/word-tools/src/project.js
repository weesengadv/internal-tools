export const clone = p => JSON.parse(JSON.stringify(p));
export function pathOf(shape) {
  return (shape || []).flatMap(p => [p.outer, ...(p.holes || [])]).map(r => 'M' + r.map(v=>v.join(',')).join('L') + 'Z').join(' ');
}
export function linkedMove(project, partId, holeId, x, y) {
  const next=clone(project), source=next.parts.find(p=>p.id===partId), h=source.holes.find(h=>h.id===holeId);
  const changed=new Set();
  const index=source.holes.indexOf(h), local=[x-source.bounds[0],y-source.bounds[1]], original=clone(source.holes);
  next.parts.forEach(p=>{
    if(p.id===partId || (next.parameters.linkMatching && p.group===source.group)) {
      let target=p.id===partId?p.holes[index]:null;
      if(p.id!==partId)target=holeMatches({...source,holes:original},p)?.[index];
      if(!target&&p.id!==partId){next.warnings=next.warnings||[];const message=`${p.name||p.id}: imported hole pattern differs; edits are not linked until compatible positions are generated.`;if(!next.warnings.includes(message))next.warnings.push(message);}
      if(target) { target.x=local[0]+p.bounds[0]; target.y=local[1]+p.bounds[1]; target.manual=true; changed.add(p.id); }
    }
  });
  next.parts.forEach(p=>{if(changed.has(p.id)&&p.opening){const base=(p.issues||[]).filter(e=>!/^Holes? \d/.test(e));p.holes.forEach((h,i)=>{if(!holeValid(h,p,next.parameters))base.push(`Hole ${i+1}: too close to a wall or another hole.`);});p.issues=base;}});
  next.parts=next.parts.map(p=>changed.has(p.id)?p:project.parts.find(old=>old.id===p.id));next.modelReady=false;return next;
}
export function changeParameter(project,key,value) {
  const next=clone(project);next.parameters[key]=value;next.modelReady=false;
  if(!['baseThickness','height','heightMode','linkMatching'].includes(key))next.stage='dirty';
  return next;
}
export function totalHeight(params) { return params.bodyMode==='wall-only'?Number(params.height):params.bodyMode==='flat'?Number(params.baseThickness):params.heightMode==='wall'?Number(params.height)+Number(params.baseThickness):Number(params.height); }
function holeMatches(source,target) {
  if(source.holes.length!==target.holes.length)return null;
  const used=new Set(),matches=[];
  for(const h of source.holes){
    const candidate=target.holes.map((v,i)=>({v,i,d:Math.hypot(v.x-target.bounds[0]-(h.x-source.bounds[0]),v.y-target.bounds[1]-(h.y-source.bounds[1]))}))
      .filter(c=>!used.has(c.i)&&Math.abs((c.v.diameter||0)-(h.diameter||0))<.01).sort((a,b)=>a.d-b.d)[0];
    if(!candidate||candidate.d>.6)return null;
    used.add(candidate.i);matches.push(candidate.v);
  }
  return matches;
}
function refreshHoleIssues(part,params) {
  part.issues=(part.issues||[]).filter(e=>!/^Holes? \d/.test(e)&&!e.startsWith('Not enough stroke area'));
  if(part.opening)[...part.holes,...(params.wireEnabled&&!part.wireOmit?part.wireHoles||[]:[])].forEach((h,i)=>{if(!holeValid(h,part,params))part.issues.push(`Hole ${i+1}: too close to a wall or another hole.`);});
}
export function deleteHole(project,partId,holeId) {
  const next=clone(project),source=next.parts.find(p=>p.id===partId),index=source?.holes.findIndex(h=>h.id===holeId);
  if(index==null||index<0)return project;
  const removals=next.parts.map(p=>({part:p,hole:p.id===partId?source.holes[index]:(next.parameters.linkMatching&&p.group===source.group?holeMatches(source,p)?.[index]:null)}));
  for(const {part,hole} of removals){
    if(!hole){if(next.parameters.linkMatching&&part.group===source.group){next.warnings||=[];next.warnings.push(`${part.name}: deletion skipped because its hole pattern differs. Apply holes to matching letters to replace its layout.`);}continue;}
    part.holes=part.holes.filter(h=>h.id!==hole.id);part.manualHoleLayout=true;part.placementUnresolved=false;part.allowHoleless=!part.holes.length;
    if(hole.sourceContour)part.deletedHoleContours=[...new Set([...(part.deletedHoleContours||[]),hole.sourceContour])];
    refreshHoleIssues(part,next.parameters);
  }
  next.modelReady=false;return next;
}
export function syncHoleLayout(project,partId) {
  const next=clone(project),source=next.parts.find(p=>p.id===partId);
  if(!source)return project;
  for(const part of next.parts){
    if(part.id===partId||part.group!==source.group)continue;
    part.holes=source.holes.map(h=>{const copy={...h,x:h.x-source.bounds[0]+part.bounds[0],y:h.y-source.bounds[1]+part.bounds[1],manual:true};delete copy.sourceContour;return copy;});
    part.deletedHoleContours=(part.roundContours||[]).filter(c=>c.role==='screw').map(c=>c.id);
    part.manualHoleLayout=true;part.placementUnresolved=false;part.allowHoleless=!part.holes.length;
    refreshHoleIssues(part,next.parameters);
    next.warnings=(next.warnings||[]).filter(w=>!w.startsWith(`${part.name}: imported hole pattern differs`)&&!w.startsWith(`${part.name}: deletion skipped`));
  }
  next.modelReady=false;return next;
}
export function inRing(point,ring) {
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const [xi,yi]=ring[i],[xj,yj]=ring[j];
    if(((yi>point[1])!==(yj>point[1])) && point[0]<(xj-xi)*(point[1]-yi)/(yj-yi)+xi)inside=!inside;
  }
  return inside;
}
export function inside(point,shape) { return shape.some(p=>inRing(point,p.outer) && !p.holes.some(r=>inRing(point,r))); }
const validityCache=new WeakMap();
export function holeValid(h,part,params) {
  const key=`${params.holeClearance}/${params.wallThickness}/${params.wireEnabled}`;
  let cached=validityCache.get(part);
  if(!cached||cached.key!==key){cached={key,values:new Map()};validityCache.set(part,cached);}
  if(cached.values.has(h.id))return cached.values.get(h.id);
  const opening=part.opening||part.shape,rad=h.diameter/2+params.holeClearance;
  let result=true;
  for(let i=0;i<32;i++)if(!inside([h.x+rad*Math.cos(i*Math.PI/16),h.y+rad*Math.sin(i*Math.PI/16)],opening)){result=false;break;}
  if([...part.holes,...(params.wireEnabled&&!part.wireOmit?part.wireHoles||[]:[])].some(other=>other.id!==h.id&&Math.hypot(other.x-h.x,other.y-h.y)<(other.diameter+h.diameter)/2+params.holeClearance))result=false;
  cached.values.set(h.id,result);return result;
}

export function addHole(project,partId,x,y){
 const next=clone(project),source=next.parts.find(p=>p.id===partId);if(!source)return project;
 const targets=next.parts.filter(p=>p.id===partId||(next.parameters.linkMatching&&p.group===source.group&&holeMatches(source,p)));
 if(targets.some(p=>p.holes.length>=100))throw new Error('Each letter supports up to 100 holes.');
 for(const p of targets){let index=1;while(p.holes.some(h=>h.id==='manual'+index))index++;
 p.holes.push({id:'manual'+index,x:x-source.bounds[0]+p.bounds[0],y:y-source.bounds[1]+p.bounds[1],diameter:next.parameters.screwDiameter,manual:true});
 p.manualHoleLayout=true;p.allowHoleless=false;p.placementUnresolved=false;refreshHoleIssues(p,next.parameters);
 }
 next.modelReady=false;return next;
}

export function moveWireHole(project,partId,holeId,x,y){
 const next=clone(project),source=next.parts.find(p=>p.id===partId),original=source?.wireHoles?.find(h=>h.id===holeId);if(!original)return project;
 const ox=original.x-source.bounds[0],oy=original.y-source.bounds[1];
 for(const p of next.parts){const h=p.wireHoles?.[0];if(!h||p.wireOmit)continue;
 if(p.id===partId||(next.parameters.linkMatching&&p.group===source.group&&Math.hypot(h.x-p.bounds[0]-ox,h.y-p.bounds[1]-oy)<.6)){
 h.x=x-source.bounds[0]+p.bounds[0];h.y=y-source.bounds[1]+p.bounds[1];h.manual=true;refreshHoleIssues(p,next.parameters);
 }}next.modelReady=false;return next;
}
export function deleteWireHole(project,partId){const next=clone(project),p=next.parts.find(p=>p.id===partId);p.wireHoles=[];p.wireOmit=true;p.wirePlacementUnresolved=false;p.issues=(p.issues||[]).filter(e=>!e.startsWith('Wire outlet'));refreshHoleIssues(p,next.parameters);next.modelReady=false;return next;}
