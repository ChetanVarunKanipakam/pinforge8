/* PinForge: NXP LPC1768 chip model. Built on the shared Cortex-M3 core (CM3): it replaces the memory map, clocks and peripherals.
   Pins are addressed as (port, bit) = P<port>.<bit>. Host callbacks (all optional):
   gpio(p,i,{s}) pwm(p,i,duty|null) pwmEdge(p,i,level) uartTx(k,byte,cyclesPerBit,pin) serial(k,byte) readPin(p,i,cnf,pullup) analog(ch) i2c(k,op,x) i2cEv(o) */
function LPC1768(host){
 const T=new CM3(host||{}),H=T.host;T.chip='lpc1768';
 T.flash=new Uint8Array(0x80000);T.ram=new Uint8Array(0x8000);T.ahb=new Uint8Array(0x8000);
 const base={prd:T.prd,pwr:T.pwr,adv:T.adv};
 const rdA=(m,o,n)=>n==4?((m[o]|m[o+1]<<8|m[o+2]<<16|m[o+3]<<24)>>>0):n==2?(m[o]|m[o+1]<<8):m[o];
 const wrA=(m,o,n,v)=>{m[o]=v;if(n>1){m[o+1]=v>>8;if(n>2){m[o+2]=v>>16;m[o+3]=v>>24}}};
 // ---------------- pin function table: 'port.bit' -> [function 1, 2, 3]
 const FNS={'0.0':['RD1','TXD3','SDA1'],'0.1':['TD1','RXD3','SCL1'],'0.2':['TXD0','AD0.7',''],'0.3':['RXD0','AD0.6',''],'0.4':['I2SRX_CLK','RD2','CAP2.0'],'0.5':['I2SRX_WS','TD2','CAP2.1'],
 '0.6':['I2SRX_SDA','SSEL1','MAT2.0'],'0.7':['I2STX_CLK','SCK1','MAT2.1'],'0.8':['I2STX_WS','MISO1','MAT2.2'],'0.9':['I2STX_SDA','MOSI1','MAT2.3'],'0.10':['TXD2','SDA2','MAT3.0'],'0.11':['RXD2','SCL2','MAT3.1'],
 '0.15':['TXD1','SCK0','SCK'],'0.16':['RXD1','SSEL0','SSEL'],'0.17':['CTS1','MISO0','MISO'],'0.18':['DCD1','MOSI0','MOSI'],'0.19':['DSR1','SD_CLK','SDA1'],'0.20':['DTR1','SD_CMD','SCL1'],'0.21':['RI1','','RD1'],'0.22':['RTS1','','TD1'],
 '0.23':['AD0.0','I2SRX_CLK','CAP3.0'],'0.24':['AD0.1','I2SRX_WS','CAP3.1'],'0.25':['AD0.2','I2SRX_SDA','TXD3'],'0.26':['AD0.3','AOUT','RXD3'],'0.27':['SDA0','USB_SDA',''],'0.28':['SCL0','USB_SCL',''],'0.29':['USB_D+','',''],'0.30':['USB_D-','',''],
 '1.0':['ENET_TXD0','',''],'1.1':['ENET_TXD1','',''],'1.4':['ENET_TX_EN','',''],'1.8':['ENET_CRS','',''],'1.9':['ENET_RXD0','',''],'1.10':['ENET_RXD1','',''],'1.14':['ENET_RX_ER','',''],'1.15':['ENET_REF_CLK','',''],'1.16':['ENET_MDC','',''],'1.17':['ENET_MDIO','',''],
 '1.18':['USB_UP_LED','PWM1.1','CAP1.0'],'1.19':['MCOA0','USB_PPWR','CAP1.1'],'1.20':['MCFB0','PWM1.2','SCK0'],'1.21':['MCABORT','PWM1.3','SSEL0'],'1.22':['MCOB0','USB_PWRD','MAT1.0'],'1.23':['MCFB1','PWM1.4','MISO0'],'1.24':['MCFB2','PWM1.5','MOSI0'],
 '1.25':['MCOA1','','MAT1.1'],'1.26':['MCOB1','PWM1.6','CAP0.0'],'1.27':['CLKOUT','USB_OVRCR','CAP0.1'],'1.28':['MCOA2','PCAP1.0','MAT0.0'],'1.29':['MCOB2','PCAP1.1','MAT0.1'],'1.30':['','VBUS','AD0.4'],'1.31':['','SCK1','AD0.5'],
 '2.0':['PWM1.1','TXD1',''],'2.1':['PWM1.2','RXD1',''],'2.2':['PWM1.3','CTS1',''],'2.3':['PWM1.4','DCD1',''],'2.4':['PWM1.5','DSR1',''],'2.5':['PWM1.6','DTR1',''],'2.6':['PCAP1.0','RI1',''],'2.7':['RD2','RTS1',''],'2.8':['TD2','TXD2',''],'2.9':['USB_CONNECT','RXD2',''],
 '2.10':['EINT0','NMI',''],'2.11':['EINT1','I2STX_CLK',''],'2.12':['EINT2','I2STX_WS',''],'2.13':['EINT3','I2STX_SDA',''],'3.25':['','MAT0.0','PWM1.2'],'3.26':['STCLK','MAT0.1','PWM1.3'],'4.28':['RX_MCLK','MAT2.0','TXD3'],'4.29':['TX_MCLK','MAT2.1','RXD3']};
 const VALID=[0,1,2,3,4].map(()=>0);for(const k in FNS){const[p,b]=k.split('.').map(Number);VALID[p]|=(1<<b)}
 for(const b of [2,3,5,6,7,11,12,13])VALID[1]&=~(1<<b);  // P1.2,3,5,6,7,11-13 do not exist
 const FP={};for(const k in FNS){const[p,b]=k.split('.').map(Number);FNS[k].forEach((n,f)=>{if(n)(FP[n]=FP[n]||[]).push({p,i:b,f:f+1})})}
 T.FNS=FNS;T.FP=FP;T.VALID=VALID;
 // ---------------- state
 T.pinsel=new Uint32Array(11);T.pinmode=new Uint32Array(10);T.pinod=new Uint32Array(5);
 T.dir=new Uint32Array(5);T.lat=new Uint32Array(5);T.msk=new Uint32Array(5);
 const sc=T.sc={pconp:0x042887DE,pclk0:0,pclk1:0,cclkcfg:0,clksrc:0,scs:0,pll0con:0,pll0cfg:0,pll0stat:0,pll0pend:null,feed:0,flashcfg:0x303A,pcon:0,rsid:1,extint:0,extmode:0,extpolar:0,usbclk:0,clkout:0,pll1:[0,0,0],tags:0};
 const gi=T.gpioint={r:[0,0,0],f:[0,0,0],er:[0,0,0],ef:[0,0,0]};   // index = port (0 and 2 used)
 const sh=new Map();T.lastLv=new Map();
 const PD=[4,1,2,8];const pdiv=s=>PD[s&3];
 const pclkOf={t0:()=>pdiv(sc.pclk0>>2),t1:()=>pdiv(sc.pclk0>>4),u0:()=>pdiv(sc.pclk0>>6),u1:()=>pdiv(sc.pclk0>>8),pwm:()=>pdiv(sc.pclk0>>12),i0:()=>pdiv(sc.pclk0>>14),adc:()=>pdiv(sc.pclk0>>24),
  i1:()=>pdiv(sc.pclk1>>6),t2:()=>pdiv(sc.pclk1>>12),t3:()=>pdiv(sc.pclk1>>14),u2:()=>pdiv(sc.pclk1>>16),u3:()=>pdiv(sc.pclk1>>18),i2:()=>pdiv(sc.pclk1>>20)};
 const on=b=>(sc.pconp>>>b&1)==1;
 // ---------------- clocks
 T.sysclk=function(){const sel=sc.clksrc&3;let fin=sel==1?((sc.scs&0x40)?12e6:4e6):sel==2?32768:4e6,f=fin;
  if((sc.pll0stat&0x2000000)&&(sc.pll0stat&0x1000000)){const M=(sc.pll0stat&0x7FFF)+1,N=((sc.pll0stat>>16)&0xFF)+1;f=2*M*fin/N}
  return f/((sc.cclkcfg&255)+1)};
 // ---------------- pins
 const fnOf=(p,i)=>(T.pinsel[p*2+(i>>4)]>>>((i&15)*2))&3;
 const pmOf=(p,i)=>(T.pinmode[p*2+(i>>4)]>>>((i&15)*2))&3;
 const fnName=(p,i)=>{const f=fnOf(p,i);return f?(FNS[p+'.'+i]||[])[f-1]||'':''};
 T.fnName=fnName;
 const emLevel=n=>{const m=/^MAT(\d)\.(\d)$/.exec(n);return m?(tm[+m[1]].emr>>+m[2])&1:0};
 function pinState(p,i){const f=fnOf(p,i),pm=pmOf(p,i),od=(T.pinod[p]>>>i)&1,pu=pm==0?'INPUT_PULLUP':'INPUT';
  if(f==0){const dir=(T.dir[p]>>>i)&1,l=(T.lat[p]>>>i)&1;
   if(dir)return od?(l?{m:pu,o:0,pd:pm==3}:{m:'OUTPUT',o:0}):{m:'OUTPUT',o:l};
   return{m:pu,o:0,pd:pm==3}}
  const n=fnName(p,i);
  if(/^TXD\d$/.test(n))return{m:'OUTPUT',o:1,af:true,tx:true};
  if(/^(SDA|SCL)\d$/.test(n))return{m:'OUTPUT',o:1,af:true,od:true};
  if(/^MAT\d\.\d$/.test(n))return{m:'OUTPUT',o:emLevel(n),af:true};
  if(/^PWM1\.\d$/.test(n))return{m:'OUTPUT',o:pw.lv[+n[5]]|0,af:true};
  if(/^AD0\.\d$/.test(n))return{m:'INPUT',o:0,af:true,an:true};
  return{m:pu,o:0,af:true,pd:pm==3}}
 function pinSync(p,i){if(!H.gpio||!((VALID[p]>>>i)&1))return;const s=pinState(p,i),key=s.m+s.o+(s.af?'a':'')+(s.od?'d':'')+(s.tx?'t':'')+(s.pd?'p':'')+(s.an?'n':''),k=p*32+i;
  if(sh.get(k)!==key){sh.set(k,key);H.gpio(p,i,{s})}}
 const syncAll=()=>{for(let p=0;p<5;p++)for(let i=0;i<32;i++)if((VALID[p]>>>i)&1)pinSync(p,i)};
 const syncMask=(p,m)=>{for(let i=0;i<32;i++)if(m>>>i&1)pinSync(p,i)};
 // level on the pin as seen by the CPU
 function pinLevel(p,i){const f=fnOf(p,i);
  if(f==0&&((T.dir[p]>>>i)&1)){const l=(T.lat[p]>>>i)&1;if(!((T.pinod[p]>>>i)&1)||!l)return l}
  const pm=pmOf(p,i);return H.readPin?H.readPin(p,i,pm==3?2:pm==0?2:1,pm==0?1:0)|0:(pm==0?1:0)}
 // ---------------- GPIO (FIO)
 function gpioRd(a,n){const p=(a-0x2009C000)>>5,o=(a-0x2009C000)&0x1F,sub=o&3,r=o&~3;let v=0;
  if(p>4)return 0;
  if(r==0)v=T.dir[p];else if(r==0x10)v=T.msk[p];else if(r==0x14){const vm=VALID[p];let x=0;for(let i=0;i<32;i++)if((vm>>>i)&1&&!((T.msk[p]>>>i)&1)&&pinLevel(p,i))x|=1<<i;v=x>>>0}
  return n==4?v>>>0:((v>>>(8*sub))&(n==2?0xFFFF:0xFF))}
 function gpioWr(a,n,v){const p=(a-0x2009C000)>>5,o=(a-0x2009C000)&0x1F,sub=o&3,r=o&~3;if(p>4)return;
  const sft=8*sub,mk=n==4?0xFFFFFFFF:n==2?0xFFFF:0xFF,mg=(cur)=>n==4?v>>>0:((cur&~(mk<<sft))|((v&mk)<<sft))>>>0,wv=n==4?v>>>0:((v&mk)<<sft)>>>0;
  if(r==0){const old=T.dir[p];T.dir[p]=mg(old);syncMask(p,old^T.dir[p])}
  else if(r==0x10)T.msk[p]=mg(T.msk[p]);
  else if(r==0x14){const old=T.lat[p],bm=(n==4?0xFFFFFFFF:(mk<<sft))>>>0,sel=bm&~T.msk[p];T.lat[p]=((old&~sel)|(wv&sel&VALID[p]))>>>0;syncMask(p,old^T.lat[p])}
  else if(r==0x18){const old=T.lat[p];T.lat[p]=(old|(wv&~T.msk[p]&VALID[p]))>>>0;syncMask(p,old^T.lat[p])}
  else if(r==0x1C){const old=T.lat[p];T.lat[p]=(old&~(wv&~T.msk[p]))>>>0;syncMask(p,old^T.lat[p])}}
 // ---------------- timers 0..3 and PWM1
 const tm=T.tm=[0,1,2,3].map(i=>({i,ir:0,tcr:0,tc:0,pr:0,pc:0,mcr:0,mr:[0,0,0,0],ccr:0,emr:0,ctcr:0,acc:0,rst:false}));
 const tmDiv=i=>[pclkOf.t0,pclkOf.t1,pclkOf.t2,pclkOf.t3][i]();
 const matPins=(t,m)=>FP['MAT'+t+'.'+m]||[];
 function matAct(t,m){const a=(t.emr>>(4+2*m))&3;if(!a)return;const old=t.emr;if(a==1)t.emr&=~(1<<m);else if(a==2)t.emr|=1<<m;else t.emr^=1<<m;if(old!=t.emr)for(const q of matPins(t.i,m))if(fnOf(q.p,q.i)==q.f)pinSync(q.p,q.i)}
 function tmStep(t){if(t.rst){t.rst=false;t.tc=0;t.pc=0;tmMatch(t);return}
  if(t.pc>=t.pr){t.pc=0;t.tc=(t.tc+1)>>>0;tmMatch(t)}else t.pc++}
 function tmMatch(t){for(let m=0;m<4;m++)if(t.tc===(t.mr[m]>>>0)){const c=(t.mcr>>(3*m))&7;if(c&1){t.ir|=1<<m;T.irq(1+t.i)}if(c&2)t.rst=true;if(c&4)t.tcr&=~1;matAct(t,m)}}
 function tmAdv(t,c){if((t.tcr&3)!=1)return;const d=tmDiv(t.i);t.acc+=c;if(t.acc<d)return;let n=(t.acc/d)|0;t.acc-=n*d;while(n--&&(t.tcr&1))tmStep(t)}
 function tmRd(t,o){switch(o){case 0:return t.ir;case 4:return t.tcr;case 8:return t.tc>>>0;case 0xC:return t.pr>>>0;case 0x10:return t.pc>>>0;case 0x14:return t.mcr;
  case 0x18:case 0x1C:case 0x20:case 0x24:return t.mr[(o-0x18)>>2]>>>0;case 0x28:return t.ccr;case 0x2C:case 0x30:return 0;case 0x3C:return t.emr&0xFFF;case 0x70:return t.ctcr}return 0}
 function tmWr(t,o,v){switch(o){case 0:t.ir&=~v;break;
  case 4:{const was=t.tcr&1;t.tcr=v&3;if(v&2){t.tc=0;t.pc=0;t.acc=0;t.rst=false}break}
  case 8:t.tc=v>>>0;break;case 0xC:t.pr=v>>>0;break;case 0x10:t.pc=v>>>0;break;case 0x14:t.mcr=v&0xFFF;break;
  case 0x18:case 0x1C:case 0x20:case 0x24:t.mr[(o-0x18)>>2]=v>>>0;break;case 0x28:t.ccr=v&0x3F;break;
  case 0x3C:{const old=t.emr;t.emr=v&0xFFF;for(let m=0;m<4;m++)if(((old^t.emr)>>m)&1)for(const q of matPins(t.i,m))if(fnOf(q.p,q.i)==q.f)pinSync(q.p,q.i);break}
  case 0x70:t.ctcr=v&15;break}
  T.level()}
 const pw=T.pwm={ir:0,tcr:0,tc:0,pr:0,pc:0,mcr:0,mr:[0,0,0,0,0,0,0],shadow:[0,0,0,0,0,0,0],ler:0,pcr:0,ccr:0,ctcr:0,acc:0,rst:false,lv:[0,0,0,0,0,0,0]};
 const pwEn=()=>(pw.tcr&9)==9;
 function pwSet(n,v){if(pw.lv[n]!==v){pw.lv[n]=v;for(const q of FP['PWM1.'+n]||[])if(fnOf(q.p,q.i)==q.f){pinSync(q.p,q.i);if(H.pwmEdge)H.pwmEdge(q.p,q.i,v)}}}
 function pwPush(){for(let n=1;n<=6;n++)for(const q of FP['PWM1.'+n]||[])if(fnOf(q.p,q.i)==q.f&&H.pwm)H.pwm(q.p,q.i,(pwEn()&&((pw.pcr>>(8+n))&1))?Math.min(1,pw.mr[n]/(pw.mr[0]||1)):null)}
 function pwMatch(){const t=pw;for(let m=0;m<7;m++)if(t.tc===(t.mr[m]>>>0)){const sh_=m<3?3*m:9+3*(m-3),c=(t.mcr>>sh_)&7;if(c&1){t.ir|=m<4?1<<m:1<<(m+4);T.irq(9)}if(c&2)t.rst=true;if(c&4)t.tcr&=~1;if(m>0&&((t.pcr>>(8+m))&1))pwSet(m,0)}}
 function pwStep(){const t=pw;
  if(t.rst){t.rst=false;t.tc=0;t.pc=0;for(let m=0;m<7;m++)if((t.ler>>m)&1){t.mr[m]=t.shadow[m];t.ler&=~(1<<m)}
   for(let m=1;m<=6;m++)if((t.pcr>>(8+m))&1)pwSet(m,1);pwMatch();pwPush();return}
  if(t.pc>=t.pr){t.pc=0;t.tc=(t.tc+1)>>>0;pwMatch()}else t.pc++}
 function pwAdv(c){if(!pwEn())return;const d=pclkOf.pwm();pw.acc+=c;if(pw.acc<d)return;let n=(pw.acc/d)|0;pw.acc-=n*d;while(n--&&pwEn())pwStep()}
 const pwRd=o=>{switch(o){case 0:return pw.ir;case 4:return pw.tcr;case 8:return pw.tc>>>0;case 0xC:return pw.pr;case 0x10:return pw.pc;case 0x14:return pw.mcr;
  case 0x18:case 0x1C:case 0x20:case 0x24:return pw.mr[(o-0x18)>>2]>>>0;case 0x40:case 0x44:case 0x48:return pw.mr[4+((o-0x40)>>2)]>>>0;
  case 0x28:return pw.ccr;case 0x4C:return pw.pcr;case 0x50:return pw.ler;case 0x70:return pw.ctcr}return 0};
 const pwWr=(o,v)=>{switch(o){case 0:pw.ir&=~v;break;
  case 4:{const was=pwEn();pw.tcr=v&0x0B;if(v&2){pw.tc=0;pw.pc=0;pw.acc=0;pw.rst=false}
   if(pwEn()&&!was){pw.rst=false;for(let m=1;m<=6;m++)if((pw.pcr>>(8+m))&1)pwSet(m,1);for(let m=1;m<=6;m++)if(pw.mr[m]==0&&((pw.pcr>>(8+m))&1))pwSet(m,0)}
   if(!pwEn()&&was){for(let m=1;m<=6;m++)pwSet(m,0)}pwPush();break}
  case 8:pw.tc=v>>>0;break;case 0xC:pw.pr=v>>>0;break;case 0x10:pw.pc=v>>>0;break;case 0x14:pw.mcr=v&0x1FFFFF;break;
  case 0x18:case 0x1C:case 0x20:case 0x24:{const m=(o-0x18)>>2;pw.shadow[m]=v>>>0;if(!pwEn()||!(pw.tcr&1))pw.mr[m]=v>>>0;break}
  case 0x40:case 0x44:case 0x48:{const m=4+((o-0x40)>>2);pw.shadow[m]=v>>>0;if(!pwEn()||!(pw.tcr&1))pw.mr[m]=v>>>0;break}
  case 0x28:pw.ccr=v;break;case 0x4C:pw.pcr=v&0x7E7C;pwPush();break;
  case 0x50:pw.ler=v&0x7F;if(!pwEn()){for(let m=0;m<7;m++)if((v>>m)&1)pw.mr[m]=pw.shadow[m]}pwPush();break;case 0x70:pw.ctcr=v&15;break}
  T.level()};
 // ---------------- UART0..3 (16550)
 const U=T.uart=[0,1,2,3].map(k=>({k,dll:1,dlm:0,ier:0,lcr:0,fcr:0,fdr:0x10,scr:0,acr:0,rx:[],txq:[],busy:false,thrInt:false,thre:true,temt:true,epoch:0}));
 const uOn=k=>on([3,4,24,25][k]),uPclk=k=>[pclkOf.u0,pclkOf.u1,pclkOf.u2,pclkOf.u3][k]();
 const uCpb=u=>{const dl=Math.max(1,(u.dlm<<8)|u.dll),mul=u.fdr>>4,add=u.fdr&15,f=(mul>=1&&add<mul&&add>0)?1+add/mul:1;return uPclk(u.k)*16*dl*f};
 const uBits=u=>1+5+(u.lcr&3)+((u.lcr&4)?2:1)+((u.lcr&8)?1:0);
 T.uartTxPin=k=>{const f=FP['TXD'+k]||[];for(const q of f)if(fnOf(q.p,q.i)==q.f)return 'P'+q.p+'.'+q.i;return null};
 T.uartRxPin=k=>{const f=FP['RXD'+k]||[];for(const q of f)if(fnOf(q.p,q.i)==q.f)return 'P'+q.p+'.'+q.i;return null};
 function uStart(u){if(u.busy||!u.txq.length)return;const c=u.txq.shift(),cpb=uCpb(u),ep=u.epoch;u.busy=true;u.temt=false;u.thre=!u.txq.length;if(u.thre&&(u.ier&2))u.thrInt=true;
  const pin=T.uartTxPin(u.k);if(H.uartTx)H.uartTx(u.k,c,cpb,pin);if(H.serial)H.serial(u.k,c);
  T.sched(T.cy+Math.round(cpb*uBits(u)),()=>{if(ep!==u.epoch)return;u.busy=false;if(u.txq.length)uStart(u);else{u.temt=true;u.thre=true}T.level()});T.level()}
 const uFifoOn=u=>(u.fcr&1)==1,uTrig=u=>[1,4,8,14][(u.fcr>>6)&3];
 function uIrq(u){if((u.ier&1)&&u.rx.length>=(uFifoOn(u)?uTrig(u):1))return 4;if((u.ier&2)&&u.thrInt)return 2;return 0}
 function uRd(u,o){const dlab=(u.lcr&0x80)!=0;
  switch(o){case 0:if(dlab)return u.dll;{const v=u.rx.length?u.rx.shift():0;T.level();return v}
   case 4:return dlab?u.dlm:u.ier;
   case 8:{const id=uIrq(u);const v=(uFifoOn(u)?0xC0:0)|(id?id:1);if(id==2)u.thrInt=false;return v}
   case 0xC:return u.lcr;case 0x14:return(u.rx.length?1:0)|(u.thre?0x20:0)|(u.temt?0x40:0);case 0x1C:return u.scr;case 0x20:return u.acr;case 0x28:return u.fdr}return 0}
 function uWr(u,o,v){const dlab=(u.lcr&0x80)!=0;
  switch(o){case 0:if(dlab){u.dll=v&255;break}if(u.txq.length<(uFifoOn(u)?16:1)||!u.busy&&!u.txq.length){u.txq.push(v&255);u.thre=false;u.thrInt=false;uStart(u)}break;
   case 4:if(dlab){u.dlm=v&255}else{u.ier=v&0x307;if((u.ier&2)&&u.thre)u.thrInt=true}break;
   case 8:u.fcr=v&0xC1;if(v&2)u.rx.length=0;if(v&4){u.txq.length=0;u.thre=!u.busy||true}break;
   case 0xC:u.lcr=v&255;break;case 0x1C:u.scr=v&255;break;case 0x20:u.acr=v;break;case 0x28:u.fdr=v&255;break}
  T.level()}
 T.rxByte=(k,c)=>{const u=U[k];if(!u||!uOn(k))return;if(u.rx.length<16)u.rx.push(c&255);T.level()};
 // ---------------- ADC
 const adc=T.adc2={cr:0,gdr:0,inten:0,dr:[0,0,0,0,0,0,0,0],busy:false,burst:false,done:0,ovr:0};
 T.adcPin=ch=>{const f=FP['AD0.'+ch]||[];return f.length?'P'+f[0].p+'.'+f[0].i:null};
 const adcRaw=ch=>{const f=(FP['AD0.'+ch]||[])[0];if(!f||fnOf(f.p,f.i)!=f.f)return 0;return H.analog?(H.analog(ch)|0)&4095:0};
 function adcStart(){if(adc.busy||!(adc.cr&0x200000)||!on(12))return;const sel=adc.cr&255;if(!sel)return;let ch=0;while(!((sel>>ch)&1))ch++;
  adc.busy=true;const div=((adc.cr>>8)&255)+1,cyc=65*div*pclkOf.adc(),ep=adc.ep=(adc.ep||0)+1;
  T.sched(T.cy+cyc,()=>{if(ep!==adc.ep)return;adc.busy=false;const v=adcRaw(ch);if((adc.done>>ch)&1)adc.ovr|=1<<ch;adc.dr[ch]=(v<<4);adc.done|=1<<ch;adc.gdr=(v<<4)|(ch<<24)|((adc.ovr>>ch&1)?0x40000000:0)|0x80000000;
   T.level();if(adc.cr&0x10000)adcStart()})}
 const adcRd=o=>{if(o==0)return adc.cr;if(o==4){const v=adc.gdr;adc.done&=~(1<<((v>>24)&7));return v>>>0}if(o==0xC)return adc.inten;
  if(o>=0x10&&o<=0x2C){const ch=(o-0x10)>>2,v=adc.dr[ch]|((adc.done>>ch&1)?0x80000000:0)|((adc.ovr>>ch&1)?0x40000000:0);adc.done&=~(1<<ch);adc.ovr&=~(1<<ch);T.level();return v>>>0}
  if(o==0x30)return(adc.done&255)|((adc.ovr&255)<<8)|(adc.done?0x10000:0);return 0};
 const adcWr=(o,v)=>{if(o==0){adc.cr=v>>>0;if(((v>>24)&7)==1)adcStart();if(!(v&0x200000))adc.ep=(adc.ep||0)+1,adc.busy=false}else if(o==0xC){adc.inten=v&0x1FF}T.level()};
 const adcIrq=()=>((adc.inten&0x100)?((adc.done&255)!=0&&!!(adc.cr&0x10000)):((adc.done&adc.inten&255)!=0));
 // ---------------- I2C0..2 (master)
 const I2=T.i2c2=[0,1,2].map(k=>({k,con:0,stat:0xF8,dat:0,adr:0,sclh:4,scll:4,busy:false,ep:0,addr:0,rw:0,rep:false}));
 const iOn=k=>on([7,19,26][k]),iDiv=k=>[pclkOf.i0,pclkOf.i1,pclkOf.i2][k]();
 T.i2cPinNames=k=>{const sda=FP['SDA'+k]||[],scl=FP['SCL'+k]||[];let a=null,b=null;for(const q of scl)if(fnOf(q.p,q.i)==q.f)a='P'+q.p+'.'+q.i;for(const q of sda)if(fnOf(q.p,q.i)==q.f)b='P'+q.p+'.'+q.i;
  return[a||'P'+scl[0].p+'.'+scl[0].i,b||'P'+sda[0].p+'.'+sda[0].i]};
 const EN=0x40,STA=0x20,STO=0x10,SI=8,AA=4;
 function iTb(I){return Math.max(2,(I.sclh+I.scll))*iDiv(I.k)}
 const ihost=(I,op,x)=>H.i2c?H.i2c(I.k,op,x):(op=='read'?0xFF:false);
 const iev=(I,o)=>{o.k=I.k;if(H.i2cEv)H.i2cEv(o)};
 const iat=(I,dt,f)=>{const e=I.ep;T.sched(T.cy+Math.max(1,Math.round(dt)),()=>{if(e===I.ep)f()})};
 const iSet=(I,st)=>{I.stat=st;I.con|=SI;I.busy=false;T.level()};
 function iStart(I,rep){I.busy=true;const tb=iTb(I);iev(I,{ev:rep?'Sr':'S',c0:T.cy,tb});iat(I,rep?tb*1.5:tb/2,()=>iSet(I,rep?0x10:0x08))}
 function iStop(I){I.busy=true;const tb=iTb(I);iev(I,{ev:'P',c0:T.cy,tb});iat(I,tb,()=>{I.con&=~STO;I.stat=0xF8;I.busy=false;ihost(I,'stop');if(I.con&STA)iStart(I,false);T.level()})}
 function iProceed(I){  // firmware cleared SI: do what the current status and STA/STO/AA ask for
  if(I.busy||!(I.con&EN))return;const st=I.stat,tb=iTb(I);
  if(st==0xF8){if(I.con&STA)iStart(I,false);return}
  if(st==0x08||st==0x10){ // address byte
   const a=I.dat&255,rw=a&1;I.busy=true;I.con&=~STA;const c0=T.cy;
   iat(I,9*tb,()=>{const ack=ihost(I,'addr',a)!==false;iev(I,{ev:'addr',c0,tb,a,ack});I.rw=rw;iSet(I,rw?(ack?0x40:0x48):(ack?0x18:0x20))});return}
  if(I.con&STO){I.con&=~STA;iStop(I);return}
  if(I.con&STA){iStart(I,true);return}
  if(st==0x18||st==0x28){const b=I.dat&255,c0=T.cy;I.busy=true;iat(I,9*tb,()=>{const ack=ihost(I,'write',b)!==false;iev(I,{ev:'wr',c0,tb,b,ack});iSet(I,ack?0x28:0x30)});return}
  if(st==0x40||st==0x50){const ackBit=(I.con&AA)?1:0,c0=T.cy;I.busy=true;iat(I,9*tb,()=>{const b=ihost(I,'read',ackBit)&255;iev(I,{ev:'rd',c0,tb,b,ack:ackBit});I.dat=b;iSet(I,ackBit?0x50:0x58)});return}
  /* NACK states without STO/STA: stay, the firmware has to stop the bus */}
 function iRd(I,o){switch(o){case 0:return I.con&0x7C;case 4:return I.stat;case 8:return I.dat&255;case 0xC:return I.adr;case 0x10:return I.sclh;case 0x14:return I.scll;case 0x18:return 0}return 0}
 function iWr(I,o,v){switch(o){
  case 0:{const was=I.con;I.con|=v&0x7C;if((I.con&EN)&&!(was&EN)){I.stat=0xF8}if(!(I.con&EN))break;
   if((v&STA)&&!(I.con&SI)&&I.stat==0xF8)iProceed(I);break}
  case 0x18:{const was=I.con;I.con&=~(v&0x6C);if(v&0x40){I.ep++;I.busy=false;I.stat=0xF8;I.con=0}
   if((v&SI)&&(was&SI)){I.con&=~SI;iProceed(I)}T.level();break}
  case 8:I.dat=v&255;break;case 0xC:I.adr=v&255;break;case 0x10:I.sclh=v&0xFFFF;break;case 0x14:I.scll=v&0xFFFF;break}}
 // ---------------- external interrupts (EINT0..3 on P2.10..P2.13) and GPIO interrupts (P0, P2)
 const eintPin=n=>({p:2,i:10+n});
 function sampleInputs(){
  for(const p of [0,2]){const er=gi.er[p],ef=gi.ef[p];if(!(er|ef))continue;
   for(let i=0;i<32;i++){if(!(((er|ef)>>>i)&1))continue;const key=p*32+i,lv=pinLevel(p,i),old=T.lastLv.get(key);
    if(old!==undefined&&old!==lv){if(lv&&((er>>>i)&1))gi.r[p]|=1<<i;if(!lv&&((ef>>>i)&1))gi.f[p]|=1<<i}T.lastLv.set(key,lv)}}
  for(let n=0;n<4;n++){const{p,i}=eintPin(n);if(fnOf(p,i)!=1){T.lastLv.delete('e'+n);continue}const lv=pinLevel(p,i),old=T.lastLv.get('e'+n),edge=(sc.extmode>>n)&1,pol=(sc.extpolar>>n)&1;
   if(edge){if(old!==undefined&&old!==lv&&(lv==pol))sc.extint|=1<<n}else{if(lv==pol)sc.extint|=1<<n;else if(!edge)sc.extint&=~(1<<n)}T.lastLv.set('e'+n,lv)}
  T.level()}
 T.setPin=sampleInputs;
 const giRd=o=>{const r=o-0x80;switch(r){case 0:return((gi.r[0]|gi.f[0])?1:0)|((gi.r[2]|gi.f[2])?4:0);case 4:return gi.r[0]>>>0;case 8:return gi.f[0]>>>0;case 0x10:return gi.er[0]>>>0;case 0x14:return gi.ef[0]>>>0;
  case 0x24:return gi.r[2]>>>0;case 0x28:return gi.f[2]>>>0;case 0x30:return gi.er[2]>>>0;case 0x34:return gi.ef[2]>>>0}return 0};
 const giWr=(o,v)=>{const r=o-0x80;switch(r){case 0xC:gi.r[0]&=~v;gi.f[0]&=~v;break;case 0x10:gi.er[0]=v;break;case 0x14:gi.ef[0]=v;break;case 0x2C:gi.r[2]&=~v;gi.f[2]&=~v;break;case 0x30:gi.er[2]=v;break;case 0x34:gi.ef[2]=v;break}
  for(const p of [0,2])for(let i=0;i<32;i++)if(((gi.er[p]|gi.ef[p])>>>i)&1&&!T.lastLv.has(p*32+i))T.lastLv.set(p*32+i,pinLevel(p,i));T.level()};
 // ---------------- NVIC line collection
 T.level=function(){
  for(let k=0;k<4;k++){const u=U[k];if(uIrq(u))T.irq(5+k)}
  for(let i=0;i<4;i++)if(tm[i].ir)T.irq(1+i);
  if(pw.ir)T.irq(9);
  for(let k=0;k<3;k++)if(I2[k].con&SI)T.irq(10+k);
  for(let n=0;n<3;n++)if((sc.extint>>n)&1)T.irq(18+n);
  if((sc.extint>>3)&1||(gi.r[0]|gi.f[0]|gi.r[2]|gi.f[2]))T.irq(21);
  if(adcIrq())T.irq(22)};
 T.i2cLevel=()=>{};
 T.prio=function(e){if(e==1)return-3;if(e==2)return-2;if(e==3)return-1;return e<16?T.shp[e-4]&0xF8:T.ipr[e-16]&0xF8};
 // ---------------- bus
 T.rd=function(a,n){a>>>=0;
  if(a<0x80000)return rdA(T.flash,a,n);
  if(a>=0x10000000&&a<0x10008000)return rdA(T.ram,a-0x10000000,n);
  if(a>=0x2007C000&&a<0x20084000)return rdA(T.ahb,a-0x2007C000,n);
  if(a>=0x2009C000&&a<0x2009C0A0)return gpioRd(a,n);
  if(a>=0x40000000)return T.prd(a,n);
  T.fault('Bus fault: read from 0x'+a.toString(16));return 0};
 T.wr=function(a,n,v){a>>>=0;
  if(a>=0x10000000&&a<0x10008000){wrA(T.ram,a-0x10000000,n,v);return}
  if(a>=0x2007C000&&a<0x20084000){wrA(T.ahb,a-0x2007C000,n,v);return}
  if(a>=0x2009C000&&a<0x2009C0A0){gpioWr(a,n,v);return}
  if(a>=0x40000000){T.pwr(a,n,v>>>0);return}
  if(a<0x80000)return;
  T.fault('Bus fault: write to 0x'+a.toString(16))};
 const blk=(a,b)=>a>=b&&a<b+0x4000;
 T.prd=function(a,n){
  if(a>=0xE0000000)return base.prd(a,n);
  const r=a&~3,o=r&0x3FFF,sub=a&3;let v=0;
  if(blk(r,0x40004000)){if(on(1))v=tmRd(tm[0],o)}else if(blk(r,0x40008000)){if(on(2))v=tmRd(tm[1],o)}else if(blk(r,0x40090000)){if(on(22))v=tmRd(tm[2],o)}else if(blk(r,0x40094000)){if(on(23))v=tmRd(tm[3],o)}
  else if(blk(r,0x4000C000)){if(uOn(0))v=uRd(U[0],o)}else if(blk(r,0x40010000)){if(uOn(1))v=uRd(U[1],o)}else if(blk(r,0x40098000)){if(uOn(2))v=uRd(U[2],o)}else if(blk(r,0x4009C000)){if(uOn(3))v=uRd(U[3],o)}
  else if(blk(r,0x40018000)){if(on(6))v=pwRd(o)}
  else if(blk(r,0x4001C000)){if(iOn(0))v=iRd(I2[0],o)}else if(blk(r,0x4005C000)){if(iOn(1))v=iRd(I2[1],o)}else if(blk(r,0x400A0000)){if(iOn(2))v=iRd(I2[2],o)}
  else if(blk(r,0x40034000)){if(on(12))v=adcRd(o)}
  else if(blk(r,0x40028000)){if(on(15))v=giRd(o)}
  else if(blk(r,0x4002C000)){if(o<0x2C)v=T.pinsel[o>>2];else if(o>=0x40&&o<0x68)v=T.pinmode[(o-0x40)>>2];else if(o>=0x68&&o<0x7C)v=T.pinod[(o-0x68)>>2]}
  else if(r>=0x400FC000&&r<0x40100000)v=scRd(r-0x400FC000);
  return n==4?v>>>0:((v>>>(8*sub))&(n==2?0xFFFF:0xFF))};
 T.pwr=function(a,n,v){
  if(a>=0xE0000000){base.pwr(a,n,v);return}
  const r=a&~3,o=r&0x3FFF,sub=a&3;if(n<4)v=((v&(n==2?0xFFFF:0xFF))<<(8*sub))>>>0;
  if(blk(r,0x40004000)){if(on(1))tmWr(tm[0],o,v)}else if(blk(r,0x40008000)){if(on(2))tmWr(tm[1],o,v)}else if(blk(r,0x40090000)){if(on(22))tmWr(tm[2],o,v)}else if(blk(r,0x40094000)){if(on(23))tmWr(tm[3],o,v)}
  else if(blk(r,0x4000C000)){if(uOn(0))uWr(U[0],o,v)}else if(blk(r,0x40010000)){if(uOn(1))uWr(U[1],o,v)}else if(blk(r,0x40098000)){if(uOn(2))uWr(U[2],o,v)}else if(blk(r,0x4009C000)){if(uOn(3))uWr(U[3],o,v)}
  else if(blk(r,0x40018000)){if(on(6))pwWr(o,v)}
  else if(blk(r,0x4001C000)){if(iOn(0))iWr(I2[0],o,v)}else if(blk(r,0x4005C000)){if(iOn(1))iWr(I2[1],o,v)}else if(blk(r,0x400A0000)){if(iOn(2))iWr(I2[2],o,v)}
  else if(blk(r,0x40034000)){if(on(12))adcWr(o,v)}
  else if(blk(r,0x40028000)){if(on(15))giWr(o,v)}
  else if(blk(r,0x4002C000)){
   const mergeW=(arr,idx)=>{arr[idx]=n==4?v:((arr[idx]&~((n==2?0xFFFF:0xFF)<<(8*sub)))|v)>>>0};
   if(o<0x2C){mergeW(T.pinsel,o>>2);const p=(o>>2)>>1;if(p<5){syncMask(p,0xFFFFFFFF);}pwPush()}
   else if(o>=0x40&&o<0x68){mergeW(T.pinmode,(o-0x40)>>2);const p=((o-0x40)>>2)>>1;if(p<5)syncMask(p,0xFFFFFFFF)}
   else if(o>=0x68&&o<0x7C){mergeW(T.pinod,(o-0x68)>>2);syncMask((o-0x68)>>2,0xFFFFFFFF)}}
  else if(r>=0x400FC000&&r<0x40100000)scWr(r-0x400FC000,v)};
 // ---------------- system control block
 function scRd(o){switch(o){case 0:return sc.flashcfg;case 0x80:return sc.pll0con&3;case 0x84:return sc.pll0cfg;case 0x88:return sc.pll0stat;case 0xC0:return sc.pcon;case 0xC4:return sc.pconp;
  case 0x104:return sc.cclkcfg;case 0x108:return sc.usbclk;case 0x10C:return sc.clksrc;case 0x140:return sc.extint;case 0x148:return sc.extmode;case 0x14C:return sc.extpolar;case 0x180:return sc.rsid;
  case 0x1A0:return sc.scs;case 0x1A8:return sc.pclk0;case 0x1AC:return sc.pclk1;case 0x1C8:return sc.clkout}return 0}
 function scWr(o,v){switch(o){case 0:sc.flashcfg=v&0xF03F|0x3A;break;
  case 0x80:sc.pll0pend=Object.assign(sc.pll0pend||{},{con:v&3});break;case 0x84:sc.pll0pend=Object.assign(sc.pll0pend||{},{cfg:v&0xFF7FFF});break;
  case 0x8C:{v&=255;if(sc.feed==0xAA&&v==0x55&&sc.pll0pend){pllFeed()}sc.feed=v==0xAA?0xAA:0;break}
  case 0xC0:sc.pcon=v;break;case 0xC4:sc.pconp=v>>>0;break;case 0x104:sc.cclkcfg=v&255;break;case 0x108:sc.usbclk=v&15;break;case 0x10C:sc.clksrc=v&3;break;
  case 0x140:{const m=v&15;sc.extint&=~m;if(m&8){}T.level();break}case 0x148:sc.extmode=v&15;break;case 0x14C:sc.extpolar=v&15;break;case 0x180:sc.rsid&=~v;break;
  case 0x1A0:sc.scs=(v&0x30)|(v&0x20?0x40:0);break;case 0x1A8:sc.pclk0=v>>>0;break;case 0x1AC:sc.pclk1=v>>>0;break;case 0x1C8:sc.clkout=v;break}}
 function pllFeed(){const p=sc.pll0pend;sc.pll0pend=null;if(p.cfg!==undefined){sc.pll0cfg=p.cfg;if(sc.pll0stat&0x1000000)sc.pll0stat=(sc.pll0stat&~0x00FF7FFF)|(p.cfg&0x7FFF)|(((p.cfg>>16)&0xFF)<<16)}
  if(p.con!==undefined){const en=p.con&1,conn=(p.con>>1)&1,wasEn=(sc.pll0stat>>24)&1;sc.pll0con=p.con;
   if(en&&!wasEn){sc.pll0stat=(sc.pll0stat&~0x07FFFFFF)|0x1000000|(sc.pll0cfg&0x7FFF)|(((sc.pll0cfg>>16)&0xFF)<<16);const ep=sc.ep=(sc.ep||0)+1;
    T.sched(T.cy+Math.max(10,Math.round(T.sysclk()*50e-6)),()=>{if(ep===sc.ep)sc.pll0stat|=0x4000000})}
   if(!en){sc.pll0stat&=~0x7000000;sc.ep=(sc.ep||0)+1}
   if(en&&conn&&(sc.pll0stat&0x4000000))sc.pll0stat|=0x2000000;else if(!conn)sc.pll0stat&=~0x2000000}}
 // ---------------- time
 T.adv=function(c){base.adv(c);
  for(let i=0;i<4;i++){const t=tm[i];if((t.tcr&3)==1)tmAdv(t,c)}if(pw.tcr&1)pwAdv(c)};
 // ---------------- reset / load
 T.load=function(bytes,addr){T.flash.fill(0xFF);const b=addr||0;for(let i=0;i<bytes.length;i++){const a=b+i;if(a>=0&&a<0x80000)T.flash[a]=bytes[i]}};
 T.reset=function(){T.r.fill(0);T.N=T.Z=T.C=T.V=0;T.it=0;T.ipsr=0;T.halted=null;T.cy=0;T.pend=[];T.act=[];T.ipr.fill(0);T.shp.fill(0);T.primask=0;T.st={ctrl:0,load:0,val:0,flag:0,acc:0};
  T.nvEn=[0,0,0];T.nvPend=[0,0,0];T.evq=[];T.ram.fill(0);T.ahb.fill(0);
  T.pinsel.fill(0);T.pinmode.fill(0);T.pinod.fill(0);T.dir.fill(0);T.lat.fill(0);T.msk.fill(0);sh.clear();T.lastLv.clear();
  Object.assign(sc,{pconp:0x042887DE,pclk0:0,pclk1:0,cclkcfg:0,clksrc:0,scs:0,pll0con:0,pll0cfg:0,pll0stat:0,pll0pend:null,feed:0,flashcfg:0x303A,pcon:0,extint:0,extmode:0,extpolar:0,ep:(sc.ep||0)+1});
  for(const p of [0,2]){gi.r[p]=gi.f[p]=gi.er[p]=gi.ef[p]=0}
  tm.forEach(t=>Object.assign(t,{ir:0,tcr:0,tc:0,pr:0,pc:0,mcr:0,mr:[0,0,0,0],ccr:0,emr:0,ctcr:0,acc:0,rst:false}));
  Object.assign(pw,{ir:0,tcr:0,tc:0,pr:0,pc:0,mcr:0,mr:[0,0,0,0,0,0,0],shadow:[0,0,0,0,0,0,0],ler:0,pcr:0,ccr:0,ctcr:0,acc:0,rst:false,lv:[0,0,0,0,0,0,0]});
  U.forEach(u=>{Object.assign(u,{dll:1,dlm:0,ier:0,lcr:0,fcr:0,fdr:0x10,scr:0,acr:0,rx:[],txq:[],busy:false,thrInt:false,thre:true,temt:true});u.epoch++});
  Object.assign(adc,{cr:0,gdr:0,inten:0,dr:[0,0,0,0,0,0,0,0],busy:false,done:0,ovr:0,ep:(adc.ep||0)+1});
  I2.forEach(I=>{Object.assign(I,{con:0,stat:0xF8,dat:0,adr:0,sclh:4,scll:4,busy:false,rw:0});I.ep++});
  T.r[13]=T.rd32(0)|0;T.r[15]=T.rd32(4)&~1;T.r[14]=-1;syncAll()};

 T.lpcRegs=function(){const h=v=>'0x'+(v>>>0).toString(16).padStart(8,'0');let t='PCONP '+h(sc.pconp)+'  PCLKSEL0 '+h(sc.pclk0)+'  PCLKSEL1 '+h(sc.pclk1)+'\n';
  t+='PLL0 '+(((sc.pll0stat>>>24)&1)?(((sc.pll0stat>>>25)&1)?'connected':'enabled')+(((sc.pll0stat>>>26)&1)?', locked':''):'off')+'   CCLKCFG '+sc.cclkcfg+'   CLKSRCSEL '+sc.clksrc+'\n\n';
  for(let p=0;p<5;p++){if(!VALID[p])continue;t+='GPIO'+p+'  FIODIR '+h(T.dir[p])+'  FIOPIN '+h(gpioRd(0x2009C000+p*32+0x14,4))+'\n'}
  t+='\n';tm.forEach(x=>{t+='TIMER'+x.i+'  TCR '+x.tcr+'  TC '+(x.tc>>>0)+'  PR '+x.pr+'  MR0 '+(x.mr[0]>>>0)+'  IR '+x.ir+'\n'});
  t+='PWM1   TCR '+pw.tcr+'  TC '+(pw.tc>>>0)+'  MR0 '+(pw.mr[0]>>>0)+'  PCR '+h(pw.pcr).slice(6)+'\n';
  U.forEach(u=>{t+='UART'+u.k+'   '+(uOn(u.k)?'DL '+((u.dlm<<8)|u.dll)+'  LCR '+u.lcr+'  LSR '+h(u.rx.length?1|(u.thre?0x20:0)|(u.temt?0x40:0):(u.thre?0x20:0)|(u.temt?0x40:0)).slice(6):'(power off)')+'\n'});
  I2.forEach(i=>{t+='I2C'+i.k+'    '+(iOn(i.k)?'CONSET '+h(i.con).slice(6)+'  STAT '+h(i.stat).slice(6):'(power off)')+'\n'});return t};
 T.pinState=pinState;
 return T}
if(typeof module!=='undefined')module.exports={LPC1768};
