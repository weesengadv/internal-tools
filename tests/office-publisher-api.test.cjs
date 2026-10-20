const test = require('node:test');const assert = require('node:assert/strict');const http = require('node:http');
const path = require('node:path');const {createPublisherApi}=require('../src/server/office-publisher-api.cjs');
test('publishing controls are local only, origin protected, and absent on office host',async t=>{
  for(const office of [null,{address:'192.168.0.234'}]){
    const api=createPublisherApi(path.resolve(__dirname,'..'),office);
    const server=http.createServer(async(req,res)=>{if(!await api(req,res,new URL(req.url,'http://localhost').pathname)){res.writeHead(404);res.end()}});
    await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
    const base=`http://127.0.0.1:${server.address().port}`;
    assert.equal((await fetch(base+'/api/office-publisher/status')).status,office?404:200);
    assert.equal((await fetch(base+'/office-updates.html')).status,office?404:200);
    assert.equal((await fetch(base+'/api/office-publisher/build',{method:'POST',headers:{origin:'http://evil.test','content-type':'application/json'},body:'{}'})).status,office?404:403);
    const hostStatus=await new Promise((resolve,reject)=>{http.get(base+'/api/office-publisher/status',{headers:{host:'evil.test'}},r=>{r.resume();resolve(r.statusCode)}).on('error',reject)});
    assert.equal(hostStatus,404);
  }
});
