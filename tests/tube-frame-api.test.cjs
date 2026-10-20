const {test}=require('node:test');const assert=require('node:assert/strict');const http=require('node:http');
const {createTubeFrameApi}=require('../src/server/tube-frame-service.cjs');
test('tube API accepts local JSON and rejects cross-origin requests and form posts',async()=>{
 const api=createTubeFrameApi({detect:async()=>({available:true,version:'test'}),generate:async()=>({parts:[]})});
 const server=http.createServer((req,res)=>{api(req,res,new URL(req.url,'http://127.0.0.1').pathname).catch(e=>{res.statusCode=500;res.end(e.message);});});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url=`http://127.0.0.1:${server.address().port}/api/tube-frame/`;
 try{
  let r=await fetch(url+'status');assert.equal(r.status,200);assert.equal((await r.json()).available,true);
  r=await fetch(url+'generate',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://other.example'},body:'{}'});assert.equal(r.status,403);
  r=await fetch(url+'generate',{method:'POST',headers:{'Content-Type':'text/plain'},body:'{}'});assert.equal(r.status,415);
  r=await fetch(url+'generate',{method:'POST',headers:{'Content-Type':'application/json',Origin:new URL(url).origin},body:'{}'});assert.equal(r.status,200);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
