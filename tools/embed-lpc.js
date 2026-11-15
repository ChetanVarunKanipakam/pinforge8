'use strict';
/* Embeds src/lpc1768.js into public/simulator.html (first script, after makeI2C) between LPC1768-BEGIN and LPC1768-END markers. Run after editing src/lpc1768.js. */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), hp = path.join(root, 'public', 'simulator.html');
let html = fs.readFileSync(hp, 'utf8');
const src = fs.readFileSync(path.join(root, 'src', 'lpc1768.js'), 'utf8').replace(/\nif\(typeof module[^\n]*\n?$/, '\n');
const block = '/*LPC1768-BEGIN*/\n' + src.trim() + '\n/*LPC1768-END*/';
const re = /\/\*LPC1768-BEGIN\*\/[\s\S]*?\/\*LPC1768-END\*\//;
if (re.test(html)) html = html.replace(re, () => block);
else { const i = html.indexOf('I.init();return I}'); if (i < 0) throw new Error('makeI2C end not found'); const j = html.indexOf('\n', i); html = html.slice(0, j + 1) + block + '\n' + html.slice(j + 1); }
fs.writeFileSync(hp, html); console.log('embedded LPC1768 model:', src.length, 'bytes');
