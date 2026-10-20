export async function createTubeViewer(container,parts,assembly=true){
 const THREE=await import('three');const {OrbitControls}=await import('three/addons/controls/OrbitControls.js');
 const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(40,1,.1,200000);
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));container.replaceChildren(renderer.domElement);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;
 scene.add(new THREE.HemisphereLight(0xffffff,0x334455,2.5));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(1,2,3);scene.add(light);
 const group=new THREE.Group();scene.add(group);
 for(const m of parts){const positions=[];for(const tri of m.triangles)for(const i of tri){let [x,y,z]=m.vertices[i];if(assembly&&!m.fold){const p=m.placement;positions.push(p.start[0]+p.xAxis[0]*x+p.direction[0]*z,p.start[1]+p.xAxis[1]*x+p.direction[1]*z,y);}else positions.push(z,x,y);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.computeVertexNormals();const material=new THREE.MeshStandardMaterial({color:0x62bcae,metalness:.25,roughness:.65,side:THREE.DoubleSide});group.add(new THREE.Mesh(geo,material));
 }
 const box=new THREE.Box3().setFromObject(group),centre=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3()),span=Math.max(size.x,size.y,size.z,10);
 controls.target.copy(centre);camera.position.copy(centre).add(new THREE.Vector3(span*.3,span*.25,span*1.8));camera.near=Math.max(.01,span/10000);camera.far=span*50;camera.updateProjectionMatrix();
 let alive=true,frame;const resize=()=>{if(!alive)return;const w=Math.max(container.clientWidth,100),h=Math.max(container.clientHeight,350);renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(container);resize();
 const tick=()=>{if(!alive)return;controls.update();renderer.render(scene,camera);frame=requestAnimationFrame(tick);};tick();
 return ()=>{alive=false;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});renderer.dispose();};
}
