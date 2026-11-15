// Runs compiled LPC1768 firmware on the emulator (CM3 core from index.html + LPC1768 model) with a mock board.
const fs=require('fs'),cp=require('child_process'),path=require('path');
const HTML=process.env.PF_HTML||path.join(__dirname,'../public/simulator.html');
const html=fs.readFileSync(HTML,'utf8'),s1=html.match(/<script>\n([\s\S]*?)<\/script>/)[1];
const extra=s1.includes('function LPC1768(')?'':fs.readFileSync(path.join(__dirname,'../src/lpc1768.js'),'utf8');
const {CM3,LPC1768}=new Function(s1+'\n'+extra+';return {CM3,LPC1768}')();
function sym(name,elf){const o=cp.execSync('arm-none-eabi-nm '+elf).toString();const m=o.match(new RegExp('^([0-9a-f]+) \\w '+name+'$','m'));return m?parseInt(m[1],16):null}
function mockBoard(){const B={gp:[],pwm:[],tx:[],ser:[],ext:new Map(),an:{},i2cLog:[],i2cEv:[],mem:new Uint8Array(256),ptr:0,sel:false,first:false,M:null,wrote:[],pins:{}};
 const t=()=>B.M?B.M.cy:0;
 B.host={gpio(p,i,q){B.gp.push({t:t(),p,i,s:q.s});B.pins['P'+p+'.'+i]=q.s},pwm(p,i,d){B.pwm.push({t:t(),p,i,d})},pwmEdge(p,i,v){B.pwmE=B.pwmE||[];B.pwmE.push({t:t(),p,i,v})},
  uartTx(k,c,cpb,pin){B.tx.push({t:t(),k,c,cpb,pin})},serial(k,c){B.ser.push(String.fromCharCode(c))},
  readPin(p,i,cnf,pu){const k=p+'.'+i;return B.ext.has(k)?B.ext.get(k):(cnf==2?pu:0)},analog(ch){return B.an[ch]||0},
  i2c(k,op,x){B.i2cLog.push(k+':'+op+(x!==undefined?':'+x.toString(16):''));
   if(op=='addr'){const ok=(x>>1)==0x50;B.sel=ok;B.first=ok&&!(x&1);return ok}
   if(op=='write'){if(!B.sel)return false;if(B.first){B.ptr=x;B.first=false}else{B.mem[B.ptr++&255]=x;B.wrote.push(x)}return true}
   if(op=='read')return B.mem[B.ptr++&255];if(op=='stop')B.sel=false},
  i2cEv(o){B.i2cEv.push(o)}};
 for(let i=0;i<256;i++)B.mem[i]=i^0x3C;return B}
function boot(name,B){B=B||mockBoard();const bin=fs.readFileSync(path.join(__dirname,'fw_lpc/out/'+name+'.bin'));const M=new LPC1768(B.host);B.M=M;M.load(bin);M.reset();
 const elf=path.join(__dirname,'fw_lpc/out/'+name+'.elf'),ra=sym('res',elf)-0x10000000;M.res=()=>{const a=ra;return Array.from({length:32},(_,i)=>(M.ram[a+4*i]|M.ram[a+4*i+1]<<8|M.ram[a+4*i+2]<<16|M.ram[a+4*i+3]<<24)>>>0)};
 M.setRes=(i,v)=>{const a=ra+4*i;M.ram[a]=v;M.ram[a+1]=v>>8;M.ram[a+2]=v>>16;M.ram[a+3]=v>>24};
 return{M,B}}
function run(M,maxCycles,stopFn){let n=0;while(M.cy<maxCycles&&!M.halted){M.step();if(!(++n&255)){M.setPin();}if(stopFn&&stopFn())break}return M}
module.exports={boot,run,mockBoard,LPC1768,CM3};
