// Board-selection page: renders, links point at the simulator with the right board, illustrations drawn, no errors.
const fs=require('fs'),path=require('path'),{JSDOM,VirtualConsole}=require('jsdom');
let fails=0;const ck=(n,c,x)=>{console.log((c?'PASS ':'FAIL ')+n+(c?'':'   got '+x));if(!c)fails++};
const pub=path.join(__dirname,'../public'),errs=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(e.message));
const dom=new JSDOM(fs.readFileSync(path.join(pub,'index.html'),'utf8'),{runScripts:'dangerously',virtualConsole:vc,url:'http://localhost/'});const d=dom.window.document;
const hrefs=[...d.querySelectorAll('a')].map(a=>a.getAttribute('href'));
ck('two board cards',d.querySelectorAll('.card').length==2,d.querySelectorAll('.card').length);
ck('open-simulator buttons carry the board',hrefs.includes('simulator.html?mcu=stm32')&&hrefs.includes('simulator.html?mcu=lpc1768'),hrefs.join());
ck('both illustrations are drawn (sketch paths)',['artStm','artLpc'].every(i=>(d.getElementById(i).innerHTML.match(/<path /g)||[]).length>60),'');
ck('page has the transition hooks (view transition + fade fallback)',/@view-transition\{navigation:auto\}/.test(d.documentElement.innerHTML)&&d.querySelectorAll('a.go').length>=6,d.querySelectorAll('a.go').length);
ck('no script errors',errs.length==0,errs.join('|'));
// every link to the simulator resolves: file exists and the example / board it names exists
const sim=fs.readFileSync(path.join(pub,'simulator.html'),'utf8'),exs=JSON.parse(sim.match(/const EXS=(\[.*?\]);\n/s)[1]).map(e=>e.id);
const bad=hrefs.filter(h=>/^simulator\.html\?/.test(h)).filter(h=>{const q=new URLSearchParams(h.split('?')[1]);return(q.get('example')&&!exs.includes(q.get('example')))||(q.get('mcu')&&!['stm32','lpc1768'].includes(q.get('mcu')))});
ck('every simulator link names an existing board or example',bad.length==0,bad.join());
ck('simulator page exists and links back to the boards page',fs.existsSync(path.join(pub,'simulator.html'))&&/id="back" class="go" href=".\/"/.test(sim),'');
process.exit(fails?1:0);
