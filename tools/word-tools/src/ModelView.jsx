import { usePreferences } from './preferences.jsx';
import React,{useEffect,useRef} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
export default function ModelView({model}) {
 const { t, theme } = usePreferences();
 const host=useRef(null);
 useEffect(()=>{
  if(!model||!host.current)return;
  const node=host.current,scene=new THREE.Scene();scene.background=new THREE.Color(theme === 'dark' ? '#152328' : '#f5f8f9');
  const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));node.appendChild(renderer.domElement);
  const camera=new THREE.PerspectiveCamera(35,1,.1,100000);camera.up.set(0,0,1);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(model.vertices.flat(),3));geometry.setIndex(model.faces.flat());geometry.computeVertexNormals();
  const material=new THREE.MeshStandardMaterial({color:0xe1e9eb,roughness:.8,flatShading:true,side:THREE.DoubleSide});scene.add(new THREE.Mesh(geometry,material));
  geometry.computeBoundingBox();const center=geometry.boundingBox.getCenter(new THREE.Vector3()),size=geometry.boundingBox.getSize(new THREE.Vector3()),span=Math.max(size.x,size.y,size.z);
  scene.add(new THREE.HemisphereLight(0xffffff,0x7b8994,2));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(-size.x,-size.y,size.z*5);scene.add(light);
  const controls=new OrbitControls(camera,renderer.domElement);controls.target.copy(center);controls.enableDamping=true;camera.position.set(center.x+span*.85,center.y-span*1.15,center.z+span*1.6);camera.far=span*100+100;camera.updateProjectionMatrix();controls.update();
  const resize=()=>{renderer.setSize(node.clientWidth,node.clientHeight);camera.aspect=node.clientWidth/node.clientHeight;camera.updateProjectionMatrix();};const ro=new ResizeObserver(resize);ro.observe(node);resize();let raf;
  const tick=()=>{raf=requestAnimationFrame(tick);controls.update();renderer.render(scene,camera);};tick();
  return()=>{cancelAnimationFrame(raf);ro.disconnect();controls.dispose();geometry.dispose();material.dispose();renderer.dispose();renderer.domElement.remove();};
 },[model,theme]);
 return <div ref={host} className="model-host" aria-label={t("Interactive 3D letter: drag to orbit, scroll to zoom")}/>;
}
