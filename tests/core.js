// Runs compiled firmware on the emulator extracted from index.html, with a mock I2C bus.
const fs=require('fs'),cp=require('child_process'),path=require('path');
const HTML=process.env.PF_HTML||path.join(__dirname,'../public/simulator.html');
const src=fs.readFileSync(HTML,'utf8').match(/<script>\n([\s\S]*?)<\/script>/)[1];
const {CM3}=new Function(src+';return {CM3}')();
function sym(name,elf){const o=cp.execSync('arm-none-eabi-nm '+elf).toString();const m=o.match(new RegExp('^([0-9a-f]+) \\w '+name+'$','m'));return m?parseInt(m[1],16):null}
function boot(name,host){const bin=fs.readFileSync(path.join(__dirname,'fw/out/'+name+'.bin'));const M=new CM3(host||{});M.load(bin);M.reset();
  M.res=()=>{const a=sym('res',path.join(__dirname,'fw/out/'+name+'.elf'))-0x20000000;return Array.from({length:32},(_,i)=>(M.ram[a+4*i]|M.ram[a+4*i+1]<<8|M.ram[a+4*i+2]<<16|M.ram[a+4*i+3]<<24)>>>0)};return M}
function run(M,maxCycles,stopFn){while(M.cy<maxCycles&&!M.halted){M.step();if(stopFn&&stopFn())break}return M}
// mock bus with a 256-byte EEPROM-like slave at 0x50
function mockBus(){const B={log:[],ev:[],mem:new Uint8Array(256),ptr:0,sel:false,first:false,wrote:[]};for(let i=0;i<256;i++)B.mem[i]=i^0x5A;
 B.host={i2c(k,op,x){B.log.push(op+(x!==undefined?':'+x.toString(16):''));
   if(op=='addr'){const ok=(x>>1)==0x50;B.sel=ok;B.first=ok&&!(x&1);return ok}
   if(op=='write'){if(!B.sel)return false;if(B.first){B.ptr=x;B.first=false}else{B.mem[B.ptr++&255]=x;B.wrote.push(x)}return true}
   if(op=='read'){return B.mem[B.ptr++&255]}
   if(op=='stop'){B.sel=false}},
  i2cEv(o){B.ev.push(o)}};return B}
module.exports={boot,run,mockBus,CM3,sym};
