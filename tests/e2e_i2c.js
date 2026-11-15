const {load}=require('./harness');const fs=require('fs'),cp=require('child_process');
let fails=0;const ck=(n,c,x)=>{console.log((c?'PASS ':'FAIL ')+n+(c?'':'   got '+x));if(!c)fails++};
async function boot(id,secs,opt={}){const T=await load();const {ev}=T;
 if(opt.bin){ // custom firmware + circuit
   const b64=fs.readFileSync(opt.bin).toString('base64');
   ev(`applyCircuit(${JSON.stringify(opt.circuit)});setFw({name:'t.bin',bytes:b64('${b64}'),src:null,dirty:false,used:1})`);
 }else{const idx=ev(`EXS.findIndex(e=>e.id=="${id}")`);ev(`setMcu(EXS[${idx}].mcu||'stm32',true)`);ev(`$('ex').value=${idx};$('ex').onchange()`);
   if(opt.mutate)opt.mutate(ev)}
 ev('doRun()');ev('clearInterval(fwTimer)');
 for(let i=0;i<20000&&ev('simT')<secs&&!ev('M.halted');i++)ev('fwTick()');return T}
// independent I2C decoder working on the recorded SCL / SDA waveforms
function decode(scl,sda,tEnd){const ev=[];for(const [t,v] of scl)ev.push([t,'c',v]);for(const [t,v] of sda)ev.push([t,'d',v]);
 ev.sort((a,b)=>a[0]-b[0]||(a[1]=='c'?-1:1));let c=1,d=1,bits=[],cur=null;const out=[];
 for(const [t,k,v] of ev){
  if(k=='d'){const old=d;d=v;if(c==1){if(old==1&&v==0){if(cur)out.push(cur);cur={start:t,bytes:[]};bits=[]}
    else if(old==0&&v==1&&cur){cur.stop=true;out.push(cur);cur=null;bits=[]}}}
  else{const old=c;c=v;if(old==0&&v==1&&cur){bits.push(d);if(bits.length==9){let b=0;for(let i=0;i<8;i++)b=(b<<1)|bits[i];cur.bytes.push({b,ack:bits[8]==0});bits=[]}}}}
 return out}
module.exports={boot,decode,ck,get fails(){return fails}};
if(require.main===module)(async()=>{
 // ---- 1. waveform decode of the hello example, compared with the monitor log
 {const T=await boot('oled_hello',0.12),{ev,errs}=T;
  const la=JSON.parse(ev('JSON.stringify({a:LA.PB10,b:LA.PB11,n:LANAME})'));
  ck('no page errors',errs.length==0,errs.join('|'));
  ck('LA has SCL and SDA channels with names',la.a&&la.b&&/I2C2 SCL/.test(la.n.PB10)&&/I2C2 SDA/.test(la.n.PB11),JSON.stringify(la.n));
  const tx=decode(la.a,la.b);const first=tx[0];
  ck('waveform decodes into transactions',tx.length>=5,tx.length);
  ck('first byte on the wire is address 0x78 (0x3C<<1, write), ACKed',first.bytes[0].b==0x78&&first.bytes[0].ack,JSON.stringify(first.bytes[0]));
  ck('init sequence bytes on the wire: 00 AE D5 80',[first.bytes[1].b,first.bytes[2].b,first.bytes[3].b,first.bytes[4].b].join()=='0,174,213,128',first.bytes.slice(1,5).map(x=>x.b).join());
  ck('first transaction has 27 bytes on the wire (addr + 00 + 25 cmds) and a STOP',first.bytes.length==27&&first.stop,first.bytes.length+' stop='+first.stop);
  const mon=JSON.parse(ev('JSON.stringify(I2CLOG.map(e=>[e.addr,e.bytes.length]))'));
  ck('monitor log agrees with the waveform (transaction count and byte counts)',mon.slice(0,5).every((m,i)=>m[1]+1==tx[i].bytes.length),JSON.stringify(mon.slice(0,6))+' vs '+tx.slice(0,6).map(t=>t.bytes.length));
  // SCL frequency from the waveform
  const rises=la.a.filter((e,i)=>e[1]==1&&la.a[i-1]&&la.a[i-1][1]==0).map(e=>e[0]);const per=[];for(let i=1;i<rises.length&&per.length<30;i++)per.push(rises[i]-rises[i-1]);
  const mid=per.sort((x,y)=>x-y)[Math.floor(per.length/2)];ck('SCL runs at 100 kHz (10 us period)',Math.abs(mid-10e-6)<0.3e-6,(mid*1e6).toFixed(3)+' us');
  const ob=JSON.parse(ev('JSON.stringify((()=>{const L=devOf(parts.find(p=>p.type=="oled"));return{on:L.on,pump:L.pump,wr:L.wr}})())'));
  ck('display initialised and written',ob.on==1&&ob.pump==1&&ob.wr>1000,JSON.stringify(ob));
 }
 // ---- 2. scanner prints addresses for both buses
 {const T=await boot('i2c_scan',0.3),{ev}=T;const out=ev('$("con").textContent');console.log(out.split('\n').map(l=>'    | '+l).join('\n'));
  ck('scanner: I2C1 empty, I2C2 finds 0x3C',/I2C1[^\n]*\n\s+no devices\r?\nI2C2[^\n]*\n\s+found device at 0x3C/.test(out),out);
  ck('scanner finished',/done\./.test(out));}
 // ---- 3. failure modes
 {const T=await boot('i2c_scan',0.3,{mutate:ev=>ev(`parts.find(p=>p.type=="oled").attrs["i2c-address"]="0x3D"`)});
  ck('address attribute 0x3D is found at 0x3D',/found device at 0x3D/.test(T.ev('$("con").textContent'))&&!/0x3C/.test(T.ev('$("con").textContent')),T.ev('$("con").textContent'));}
 {const T=await boot('i2c_scan',0.3,{mutate:ev=>ev(`wires=wires.filter(w=>!/VCC/.test(w[0]))`)});
  ck('OLED without VCC does not answer',/I2C2[^\n]*\n\s+no devices/.test(T.ev('$("con").textContent')),T.ev('$("con").textContent'));}
 {const T=await boot('i2c_scan',0.3,{mutate:ev=>ev(`wires=wires.filter(w=>!/SDA/.test(w[0]))`)});
  ck('OLED with SDA unwired does not answer',/I2C2[^\n]*\n\s+no devices/.test(T.ev('$("con").textContent')),T.ev('$("con").textContent'));}
 {const T=await boot('i2c_scan',0.3,{mutate:ev=>ev(`wires=wires.map(w=>w[1]=="bluepill:PB11"?[w[0],"bluepill:PB7",w[2]]:w)`)});
  ck('SDA on PB7 while SCL on PB10: not a valid bus pair',/I2C2[^\n]*\n\s+no devices/.test(T.ev('$("con").textContent'))&&/I2C1[^\n]*\n\s+no devices/.test(T.ev('$("con").textContent')),T.ev('$("con").textContent'));}
 {const T=await boot('i2c_scan',0.3,{mutate:ev=>ev(`wires=wires.map(w=>[w[0],w[1].replace("PB10","PB6").replace("PB11","PB7"),w[2]])`)});
  const o=T.ev('$("con").textContent');ck('the same OLED wired to PB6/PB7 is found on I2C1 and not on I2C2',/I2C1[^\n]*\n\s+found device at 0x3C\r?\nI2C2[^\n]*\n\s+no devices/.test(o),o);}
 process.exit(fails?1:0)})();
