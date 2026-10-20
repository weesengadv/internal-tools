// Use the local publisher API so CLI and browser actions share one operation lock.
const fs = require('node:fs');
const [action, argument] = process.argv.slice(2);
(async () => {
  if (!['status','receiver','pair','build','send'].includes(action)) throw new Error('Usage: node scripts/publish-office-update.cjs status|receiver|pair <private-pairing.json>|build|send --staff-saved');
  let body;
  if (action === 'pair') body = JSON.parse(fs.readFileSync(argument,'utf8').replace(/^\uFEFF/,''));
  if (action === 'build') body = {};
  if (action === 'send') { if (argument !== '--staff-saved') throw new Error('Ask staff to save their work, then use send --staff-saved.'); body = {staffSaved:true}; }
  const response = await fetch('http://127.0.0.1:4174/api/office-publisher/' + action, body === undefined ? {} : {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  const value = await response.json(); if (!response.ok) throw new Error(value.error);
  console.log(JSON.stringify(value,null,2));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
