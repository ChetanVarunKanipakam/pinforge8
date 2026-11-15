const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');const path=require('path');
const HTML=process.env.PF_HTML||path.join(__dirname,'../public/simulator.html');
async function load(query){
  const vc=new VirtualConsole();const errs=[];
  vc.on('jsdomError',e=>errs.push('jsdomError: '+(e.detail&&e.detail.stack||e.message)));vc.on('error',e=>errs.push('console.error: '+e));
  const dom=new JSDOM(fs.readFileSync(HTML,'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,url:'http://localhost/simulator.html'+(query||''),
    beforeParse(w){
      const noop=()=>{};const ctx=new Proxy({}, {get:(t,k)=>k==='measureText'?(()=>({width:10})):noop,set:()=>true});
      w.HTMLCanvasElement.prototype.getContext=()=>ctx;
      w.AudioContext=function(){return{state:'running',resume:noop,createOscillator:()=>({connect:noop,start:noop,stop:noop,disconnect:noop,frequency:{setTargetAtTime:noop},type:''}),createGain:()=>({connect:noop,gain:{value:0}}),destination:{},currentTime:0}};
      w.fetch=()=>Promise.reject(new Error('no net'));
      w.SVGElement.prototype.getScreenCTM=()=>null;
      w.matchMedia=()=>({matches:false,addEventListener:noop});
    }});
  const w=dom.window;await new Promise(r=>setTimeout(r,50));
  return{w,errs,ev:s=>w.eval(s)};
}
module.exports={load};
