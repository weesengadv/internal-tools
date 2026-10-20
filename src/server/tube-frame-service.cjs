const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const {spawn}=require('node:child_process');
const {pathToFileURL}=require('node:url');

function createTubeFrameService({configDir=process.cwd(),worker=path.join(__dirname,'../tube-frame/freecad_worker.py').replace(/([\\/])app\.asar([\\/])/,'$1app.asar.unpacked$2')}={}){
 let detected=null,busy=false;
 const settingFile=path.join(configDir,'data','tube-frame-settings.json');
 async function candidates(){
  let configured='';try{configured=JSON.parse(await fs.readFile(settingFile,'utf8')).python||'';}catch{}
  const all=[configured,process.env.WEESENG_FREECAD_PYTHON];
  for(const root of ['D:\\Program Files','C:\\Program Files',process.env.LOCALAPPDATA&&path.join(process.env.LOCALAPPDATA,'Programs')].filter(Boolean)){
   try{for(const entry of await fs.readdir(root))if(/^FreeCAD/i.test(entry))all.push(path.join(root,entry,'bin','python.exe'));}catch{}
  }
  return [...new Set(all.filter(Boolean))];
 }
 async function launch(python,job,timeout=120000){
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'weeseng-tube-'));const input=path.join(dir,'input.json'),output=path.join(dir,'result.json');
  try{
   await fs.writeFile(input,JSON.stringify(job));
   await new Promise((resolve,reject)=>{
    const child=spawn(python,[worker,input,output],{windowsHide:true,stdio:['ignore','ignore','pipe'],cwd:path.dirname(python)});
    let stderr='',settled=false;const done=error=>{if(settled)return;settled=true;clearTimeout(timer);error?reject(error):resolve();};
    const timer=setTimeout(()=>{child.kill();done(Error('FreeCAD generation timed out. Reduce the job size and retry.'));},timeout);
    child.stderr.on('data',s=>{stderr=(stderr+s).slice(-3000);});child.on('error',done);
    child.on('exit',code=>done(code===0?null:Error(`FreeCAD could not generate this job. ${stderr.slice(-1200)}`)));
   });
   const stat=await fs.stat(output);if(stat.size>100*1024*1024)throw Error('Generated job is too large. Split it into smaller projects.');
   const result=JSON.parse(await fs.readFile(output,'utf8'));if(result.error)throw Error(result.error);return result;
  }finally{await fs.rm(dir,{recursive:true,force:true});}
 }
 async function detect(custom,refresh=false){
  if(refresh)detected=null;
  if(custom!==undefined){
   if(typeof custom!=='string'||!path.isAbsolute(custom)||custom.length>600)throw Error('Select an absolute FreeCAD installation or its bin/python.exe path.');
   let p=custom;const stat=await fs.stat(p).catch(()=>null);if(stat?.isDirectory())p=path.join(p,'bin','python.exe');
   if(!/^python(?:\.exe)?$/i.test(path.basename(p)))throw Error('Choose FreeCAD’s bundled bin/python.exe, or its installation folder.');
   const result=await launch(p,{probe:true},20000);await fs.mkdir(path.dirname(settingFile),{recursive:true});await fs.writeFile(settingFile,JSON.stringify({python:p}));detected={...result,python:p};return detected;
  }
  if(detected)return detected;
  for(const p of await candidates())try{detected={...await launch(p,{probe:true},20000),python:p};return detected;}catch{}
  return {available:false,version:'',python:'',message:'Install FreeCAD, then check again or select its installation folder.'};
 }
 return {detect,async generate(project){
  const {readProject,resolveProject}=await import(pathToFileURL(path.join(__dirname,'../tube-frame/model.mjs')));
  readProject(project);const members=resolveProject(project);
  if(busy)throw Error('FreeCAD is already generating a job. Wait for it to finish.');
  busy=true;try{const status=await detect();if(!status.available)throw Error(status.message);return await launch(status.python,{members});}finally{busy=false;}
 }};
}

function createTubeFrameApi(service,{officeAddress=process.env.WEESENG_OFFICE_ADDRESS||''}={}){
 return async function(request,response,pathname){
  if(!pathname.startsWith('/api/tube-frame/'))return false;
  const send=(status,value)=>{response.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});response.end(JSON.stringify(value));};
  const host=request.headers.host||'';const origin=request.headers.origin;
  let hostName='';try{hostName=new URL(`http://${host}`).hostname;}catch{}
  const allowedHost=/^(127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/.test(host)||(officeAddress&&hostName===officeAddress);
  if(!allowedHost||origin&&origin!==`http://${host}`){send(403,{error:'Tube generation is available only from this application.'});return true;}
  const client=(request.socket.remoteAddress||'').replace(/^::ffff:/,'');
  if(officeAddress&&pathname==='/api/tube-frame/configure'&&!['127.0.0.1','::1',officeAddress].includes(client)){send(403,{error:'Configure FreeCAD directly on the office host PC.'});return true;}
  try{
   if(pathname==='/api/tube-frame/status'&&request.method==='GET'){send(200,await service.detect(undefined,true));return true;}
   if(request.method!=='POST'||!['/api/tube-frame/configure','/api/tube-frame/generate'].includes(pathname)){send(404,{error:'Unknown Tube & Frame action.'});return true;}
   if(!String(request.headers['content-type']||'').startsWith('application/json')){send(415,{error:'JSON request required.'});return true;}
   let size=0,chunks=[];for await(const chunk of request){size+=chunk.length;if(size>2*1024*1024){send(413,{error:'Project exceeds 2 MB.'});return true;}chunks.push(chunk);}
   const body=JSON.parse(Buffer.concat(chunks).toString('utf8'));
   const result=pathname.endsWith('configure')?await service.detect(body.python):await service.generate(body);
   send(200,result);
  }catch(error){send(400,{error:error.message});}return true;
 };
}
module.exports={createTubeFrameService,createTubeFrameApi};
