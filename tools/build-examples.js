'use strict';
/* Compiles examples-src/*.c through a running PinForge server and embeds them in public/simulator.html (const EXS=[...]).
   Usage: node server.js &   then   node tools/build-examples.js [http://localhost:3000] */
const fs = require('fs'), path = require('path'), http = require('http');
const root = path.join(__dirname, '..'), htmlPath = path.join(root, 'public', 'simulator.html');
const base = process.argv[2] || 'http://localhost:3000';
const post = (url, body) => new Promise((res, rej) => { const u = new URL(url), r = http.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: 'POST', headers: { 'Content-Type': 'application/json' } }, x => { let d = ''; x.on('data', c => d += c); x.on('end', () => res(JSON.parse(d))); }); r.on('error', rej); r.end(JSON.stringify(body)); });
(async () => {
  const meta = JSON.parse(fs.readFileSync(path.join(root, 'examples-src', 'examples.json'), 'utf8'));
  let html = fs.readFileSync(htmlPath, 'utf8');
  const m = html.match(/^const EXS=(\[.*\]);$/m); if (!m) throw new Error('EXS array not found');
  const exs = JSON.parse(m[1]);
  for (const e of meta) {
    const src = fs.readFileSync(path.join(root, 'examples-src', e.file), 'utf8');
    const j = await post(base + '/api/compile', { code: src, opt: 'Os', mcu: e.mcu || 'stm32' });
    if (!j.ok) { console.error('FAILED', e.id, '\n' + j.log); process.exit(1); }
    console.log('built', e.id, j.size, 'bytes' + (j.log ? '\n' + j.log : ''));
    const entry = Object.assign({ id: e.id, title: e.title, src, b64: j.bin, circuit: e.circuit }, e.mcu ? { mcu: e.mcu } : {}), i = exs.findIndex(x => x.id === e.id);
    if (i >= 0) exs[i] = entry; else { const at = exs.findIndex(x => x.id === 'servo_sweep'); exs.splice(at >= 0 ? at + 1 + meta.indexOf(e) : exs.length, 0, entry); }
  }
  html = html.replace(m[0], () => 'const EXS=' + JSON.stringify(exs) + ';');
  fs.writeFileSync(htmlPath, html); console.log('index.html updated:', exs.length, 'examples');
})().catch(e => { console.error(e.message); process.exit(1); });
