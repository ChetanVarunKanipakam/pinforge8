const {boot,decode,ck}=require('./e2e_i2c');const {load}=require('./harness');
const wires=(s,c)=>['GND','VCC','SCL','SDA'].map((p,i)=>['oled1:'+p,['bluepill:GND.3','bluepill:3V3.2',s,c][i],'green']);
(async()=>{
 // ---- remap + GPIO-mode behaviour
 {const T=await boot(null,0.3,{bin:require('path').join(__dirname,'fw/out/t_remap.bin'),circuit:{parts:[{id:'oled1',type:'oled',x:340,y:200,attrs:{'i2c-address':'0x3C'}}],wires:wires('bluepill:PB8','bluepill:PB9')}});
  const o=T.ev('$("con").textContent');ck('pins as GPIO -> NACK; AF without remap -> NACK; remapped -> ACK; SDA released -> NACK',/A:nack B:nack C:ack D:nack/.test(o),o);}
 // ---- logic analyzer part probing SCL/SDA
 {const T=await boot('oled_hello',0.05,{mutate:ev=>ev(`parts.push({id:'la1',type:'la',x:520,y:100,rot:0,attrs:{},val:2048,kdown:[]});wires.push(['la1:D0','bluepill:PB10','green'],['la1:D1','bluepill:PB11','blue'])`)});
  T.ev('draw()');const ch=JSON.parse(T.ev('JSON.stringify(laChannels().map(c=>({n:c.name,len:c.ser().length})))'));
  ck('LA probe channels follow the I2C waveform',ch.length==2&&ch[0].len>100&&ch[1].len>20,JSON.stringify(ch));}
 // ---- every shipped example still boots and runs
 {const T0=await load();const ids=JSON.parse(T0.ev('JSON.stringify(EXS.map(e=>e.id))'));let bad=[];
  for(const id of ids){const T=await boot(id,0.15);const h=T.ev('M.halted'),e=T.errs;const st=T.ev('simT');if(h||e.length||st<0.1)bad.push(id+': '+(h||e.join('|')||'simT '+st));}
  ck('all '+ids.length+' examples run 150 ms without CPU fault or page error',bad.length==0,bad.join('; '));}
 // ---- animation example: frame rate and content
 {const T=await boot('oled_anim',3.2),{ev}=T;
  const info=JSON.parse(ev('JSON.stringify((()=>{const L=devOf(parts.find(p=>p.type=="oled")),F=oledFrame(L,simNow());let n=0;for(const v of F)n+=v;return{n,on:L.on,mode:L.mode}})())'));
  ck('animation draws pixels in horizontal addressing mode',info.n>300&&info.mode==0,JSON.stringify(info));
  const t=JSON.parse(ev('JSON.stringify(I2CLOG.slice(-3).map(e=>e.t))'));const full=JSON.parse(ev('JSON.stringify(I2CLOG.filter(e=>e.bytes.length>1000).length)'));
  ck('full 1024-byte frames are streamed (monitor shows >=60 of them in 3.2 s)',full>=60,full);
  const ts=JSON.parse(ev('JSON.stringify(I2CLOG.filter(e=>e.bytes.length>1000).map(e=>e.t))'));const d=ts.slice(1).map((x,i)=>x-ts[i]);const med=d.sort((a,b)=>a-b)[d.length>>1];
  ck('frame interval is 40 ms (25 fps) as the firmware asks',Math.abs(med-0.04)<0.002,(med*1000).toFixed(2)+' ms');
  const scl=JSON.parse(ev('JSON.stringify(LA.PB10.slice(-400))'));const r=[];for(let i=1;i<scl.length;i++)if(scl[i][1]==1&&scl[i-1][1]==0)r.push(scl[i][0]);const per=[];for(let i=1;i<r.length;i++)per.push(r[i]-r[i-1]);per.sort((a,b)=>a-b);
  ck('fast mode SCL period = 21 cycles / 8 MHz = 2.625 us',Math.abs(per[per.length>>1]-2.625e-6)<0.1e-6,(per[per.length>>1]*1e6).toFixed(3)+' us');}
 // ---- 128x32 variant and diagram round trip
 {const T=await boot('oled_hello',0.0,{}),{ev}=T;
  ev(`parts.find(p=>p.type=="oled").attrs.height="32";delete DV.oled1;`);
  const j=JSON.parse(ev('JSON.stringify(toDiagram())'));const o=j.parts.find(p=>p.type=='board-ssd1306');
  ck('diagram.json uses Wokwi part type board-ssd1306 with i2c-address',o&&o.attrs['i2c-address']=='0x3C'&&o.attrs.height=='32',JSON.stringify(o));
  ev(`applyDiagram(${JSON.stringify(j)})`);const p=JSON.parse(ev('JSON.stringify(parts.find(p=>p.type=="oled"))'));
  ck('diagram.json imports back into an OLED part and keeps its wires',p&&p.attrs.height=='32'&&JSON.parse(ev('wires.length'))>=4,JSON.stringify(p));
  ck('part menu lists the OLED',JSON.parse(ev('CAT.some(c=>c[0]=="oled")')));
  ev('stopSim()');ev(`$('plus').disabled=false;$('plus').onclick({stopPropagation(){}});`);const menuHas=ev(`$('pl').textContent.includes('OLED')`);ck('OLED shown in the + menu',menuHas);
  ev(`document.querySelector('#pl [data-add=oled]').click();`);const n=JSON.parse(ev('parts.filter(p=>p.type=="oled").length'));ck('adding an OLED from the menu works and selects it',n==2&&/I²C address/.test(ev(`$('insp').textContent`)),n+' '+ev(`$('insp').textContent`));}
 process.exit(require('./e2e_i2c').fails?1:0)})();
