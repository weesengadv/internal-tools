import {profileSize} from './model.mjs';
const faces={A:{normal:[0,1,0],opposite:'C',name:'Front',cn:'前面',material:2},B:{normal:[1,0,0],opposite:'D',name:'Right',cn:'右面',material:0},C:{normal:[0,-1,0],opposite:'A',name:'Back',cn:'后面',material:3},D:{normal:[-1,0,0],opposite:'B',name:'Left',cn:'左面',material:1}};
export function faceDefinition(face,perimeter=false){const result={...faces[face]};if(perimeter&&face==='B'){result.name='Inside';result.cn='朝框内';}if(perimeter&&face==='D'){result.name='Outside';result.cn='朝框外';}return result;}
export function guideFaceState(face,cut){return cut==='through'?{[face]:'entry',[faces[face].opposite]:'exit'}:{[face]:'entry'};}
export function roundDirection(angle){return [-Math.sin(angle*Math.PI/180),Math.cos(angle*Math.PI/180),0].map(n=>Math.abs(n)<1e-12?0:n);}

// Dimension-based orientation aid, deliberately separate from the exact generated mesh.
export async function createFaceGuide(container,{member,members,assembly=false,face='A',angle=0,cut='single',language='en',onFace=()=>{},onAngle=()=>{}}){
 const THREE=await import('three');const {OrbitControls}=await import('three/addons/controls/OrbitControls.js');
 if(!container.isConnected)return ()=>{};
 const cn=language==='cn',scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.01,100000);
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));
 container.replaceChildren(renderer.domElement);renderer.domElement.setAttribute('aria-label',cn?'可旋转 3D 管壁选择':'Rotatable 3D face selection');
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;
 scene.add(new THREE.HemisphereLight(0xffffff,0x40545a,2.5));const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(2,3,4);scene.add(light);
 const group=new THREE.Group();scene.add(group);const state=guideFaceState(face,cut),pickable=[];let selectedMesh;
 const perim=['bottom','top','left','right'].includes(member.key),labels=[],isRound=member.profile.shape==='round';
 function cylinder(radius,length,start=0,extent=Math.PI*2){const g=new THREE.CylinderGeometry(radius,radius,length,64,1,true,start,extent);g.rotateX(Math.PI/2);g.translate(0,0,length/2);return g;}
 for(const m of assembly?members:[member]){
  const isSelected=m.id===member.id,{w,d}=profileSize(m.profile),length=assembly?m.length:Math.min(m.length,Math.max(w,d)*3);
  const materials=Array.from({length:6},()=>new THREE.MeshStandardMaterial({color:isSelected?0x526c70:0x34494d,metalness:.1,roughness:.8,transparent:!isSelected,opacity:isSelected?1:.35,side:THREE.DoubleSide}));
  if(isSelected&&m.profile.shape!=='round')for(const [f,kind] of Object.entries(state)){materials[faces[f].material].color.set(kind==='entry'?0x62d8bd:0xf3b96a);materials[faces[f].material].emissive.set(kind==='entry'?0x0b3328:0x39240b);}
  const round=m.profile.shape==='round',geometry=round?cylinder(w/2,length):new THREE.BoxGeometry(w,d,length);if(!round)geometry.translate(0,0,length/2);const mesh=new THREE.Mesh(geometry,materials);
  if(round&&isSelected)for(const [theta,color] of [[angle,0x62d8bd],...(cut==='through'?[[angle+180,0xf3b96a]]:[])]){const patch=new THREE.Mesh(cylinder(w/2+.05,length,theta*Math.PI/180+Math.PI-.13,.26),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide}));mesh.add(patch);}
  // Exact local face identity is maintained even if the assembly transform mirrors an axis.
  const p=m.placement;const sx=assembly?p.start[0]:0,sy=assembly?p.start[1]:0;
  const axisX=assembly?p.xAxis:[1,0],axisZ=assembly?p.direction:[0,1];
  mesh.matrix.set(axisX[0],0,axisZ[0],sx,axisX[1],0,axisZ[1],sy,0,1,0,0,0,0,0,1);mesh.matrixAutoUpdate=false;
  mesh.userData.isSelected=isSelected;group.add(mesh);if(isSelected){selectedMesh=mesh;pickable.push(mesh);
   const definitions=round?[0,90,180,270,...(angle%90?[angle]:[])].map(theta=>({normal:roundDirection(theta),text:`${Math.round(theta*10)/10}°`,state:Math.abs((theta-angle+360)%360)<.1?'entry':cut==='through'&&Math.abs((theta-angle+180+360)%360)<.1?'exit':''})):['A','B','C','D'].map(f=>{const def=faceDefinition(f,perim);return {...def,text:`${f} · ${cn?def.cn:def.name}`,state:state[f]||''};});
   for(const def of definitions){
    const label=document.createElement('span');label.className='tf-face-label '+def.state;label.textContent=def.text;container.append(label);
    const n=new THREE.Vector3(...def.normal),point=new THREE.Vector3(n.x*w/2,n.y*d/2,length/2).applyMatrix4(mesh.matrix);
    labels.push({label,point,normal:n.transformDirection(mesh.matrix)});
   }
  }
 }
 const box=new THREE.Box3().setFromObject(group),centre=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3()),span=Math.max(size.x,size.y,size.z,1);
 const def=faceDefinition(face),normal=new THREE.Vector3(...(isRound?roundDirection(angle):def.normal)).transformDirection(selectedMesh.matrix);
 const tangent=new THREE.Vector3(0,0,1).transformDirection(selectedMesh.matrix);
 const side=new THREE.Vector3().crossVectors(normal,tangent).normalize();
 controls.target.copy(centre);camera.position.copy(centre);
 if(assembly)camera.position.addScaledVector(normal,span*.9).addScaledVector(tangent,span*.3).addScaledVector(side,span*.4).add(new THREE.Vector3(0,0,span*2.2*(normal.z<-.1?-1:1)));
 else camera.position.addScaledVector(normal,span*2.4).addScaledVector(tangent,span*.35).addScaledVector(side,span*.8);
 camera.up.set(0,1,0);camera.lookAt(centre);camera.far=span*50;camera.updateProjectionMatrix();
 let alive=true,frame,down=null;const ray=new THREE.Raycaster();
 const pointerDown=e=>{down={x:e.clientX,y:e.clientY};};
 const pointerUp=e=>{if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>5){down=null;return;}down=null;const r=renderer.domElement.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);const hit=ray.intersectObjects(pickable,false)[0];if(hit){if(isRound){const p=selectedMesh.worldToLocal(hit.point.clone());onAngle(Math.round(((Math.atan2(-p.x,p.y)*180/Math.PI+360)%360)*10)/10);}else {const f=Object.keys(faces).find(f=>faces[f].material===hit.face.materialIndex);if(f)onFace(f);}}};
 renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointerup',pointerUp);
 const resize=()=>{if(!alive)return;const w=Math.max(container.clientWidth,100),h=Math.max(container.clientHeight,180);renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};
 const observer=new ResizeObserver(resize);observer.observe(container);resize();
 const tick=()=>{if(!alive)return;controls.update();renderer.render(scene,camera);for(const item of labels){const toCamera=new THREE.Vector3().subVectors(camera.position,item.point);const pt=item.point.clone().project(camera);item.label.hidden=item.normal.dot(toCamera)<=0||pt.z>1;item.label.style.left=`${(pt.x+1)*container.clientWidth/2}px`;item.label.style.top=`${(-pt.y+1)*container.clientHeight/2}px`;}frame=requestAnimationFrame(tick);};tick();
 return ()=>{alive=false;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointerup',pointerUp);group.traverse(o=>{o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();});renderer.dispose();};
}
