const {boot,run}=require('./lpc_core');
let fails=0;const ck=(n,c,x)=>{console.log((c?'PASS ':'FAIL ')+n+(c?'':'   got '+x));if(!c)fails++};
const hex=v=>'0x'+(v>>>0).toString(16);
// ---- clocks and PLL
{const {M,B}=boot('l_clk');ck('CPU runs from the 4 MHz IRC at reset',M.sysclk()===4e6,M.sysclk());run(M,5e7,()=>M.res()[31]==0xD0D0);const r=M.res();
 ck('firmware finished',r[31]==0xD0D0,M.halted+' '+hex(r[31]));
 ck('PCONP reset value 0x042887DE',r[0]==0x042887DE,hex(r[0]));
 ck('PLL0 stays off without the 0xAA/0x55 feed sequence',(r[1]&0x1000000)==0&&r[2]!=(49|(2<<16)),hex(r[1])+' '+hex(r[2]));
 ck('PLL0STAT after setup: enabled, connected, locked, M=50 N=3',(r[3]>>24)==7&&(r[3]&0x7FFF)==49&&((r[3]>>16)&0xFF)==2,hex(r[3]));
 ck('CCLK = 12 MHz x 2 x 50 / 3 / 4 = 100 MHz',M.sysclk()===100e6,M.sysclk());}
// ---- GPIO
{const B=require('./lpc_core').mockBoard();B.ext.set('2.6',0);const {M}=boot('l_gpio',B);run(M,1e6,()=>M.res()[31]==0xD0D0);const r=M.res(),b18=1<<18,b20=1<<20;
 ck('GPIO firmware finished',r[31]==0xD0D0,M.halted);
 ck('FIOSET sets P1.18',r[0]==b18,hex(r[0]));ck('FIOCLR clears P1.18',r[1]==0,hex(r[1]));ck('FIOPIN write replaces the whole port: P1.20 high, P1.18 (was high) low',r[2]==b20,hex(r[2]));
 ck('FIOMASK hides the bit on reads',r[3]==0,r[3]);ck('...and blocks FIOCLR; bit still high when unmasked',r[4]==1,r[4]);
 ck('input with the default pull-up reads 1',r[5]==1,r[5]);ck('input driven low externally reads 0',r[6]==0,r[6]);
 ck('PINMODE pull-down reads 0',r[7]==0,r[7]);ck('PINMODE none = floating reads 0',r[8]==0,r[8]);
 ck('P3.25 exists and works',r[9]==1,r[9]);ck('byte access to FIO0DIR1 changes bits 8-15 only',r[10]==0x0FFF,hex(r[10]));
 const g=B.gp.filter(x=>x.p==1&&x.i==18&&x.s.m=='OUTPUT');ck('board is told P1.18 is an output, with its level',g.length>=2&&g.some(x=>x.s.o==1)&&g.some(x=>x.s.o==0),JSON.stringify(g.map(x=>x.s)));
 const pu=B.pins['P2.5'];ck('board sees P2.5 as pulled-up input',pu&&pu.m=='INPUT_PULLUP',JSON.stringify(pu));
 ck('P0.1 pull-down reported',B.gp.some(x=>x.p==0&&x.i==1&&x.s.pd),'');}
// ---- timers
{const {M,B}=boot('l_tmr');run(M,1.5e6,null);const r=M.res();
 ck('timer firmware finished',r[31]==0xD0D0,M.halted+' '+hex(r[31]));
 const e=B.gp.filter(x=>x.p==1&&x.i==18&&x.s.m=='OUTPUT'&&B.gp.indexOf(x)>3),tt=e.map(x=>x.t);
 const per=[];for(let i=2;i<tt.length;i++)per.push(tt[i]-tt[i-1]);
 ck('TIMER0 interrupt every 1.000 ms (100000 cycles +-1%)',per.length>3&&per.every(p=>Math.abs(p-100000)<1000),per.slice(0,6));
 ck('TIMER0 ISR count matches elapsed time',Math.abs(r[0]-Math.floor(M.cy/100000))<=1,r[0]+' vs '+M.cy/100000);
 const mt=B.gp.filter(x=>x.p==1&&x.i==22&&x.s.af);ck('MAT1.0 on P1.22 is an alternate-function output',mt.length>0,mt.length);
 const mt2=mt.map(x=>x.t),mp=[];for(let i=2;i<mt2.length;i++)mp.push(mt2[i]-mt2[i-1]);
 ck('MAT1.0 toggles every 100000 PCLK=CCLK cycles (match period MR0+1)',mp.length>3&&mp.every(p=>Math.abs(p-100000)<50),mp.slice(0,5));
 ck('TIMER1 MR1 interrupts occur',r[5]>=((M.cy/100000)|0)-1,r[5]);
 ck('MCR stop bit halts timer 2 (TCR.0 cleared, TC = MR0)',(r[7]&1)==0&&r[8]==100,hex(r[7])+' '+r[8]);}
// ---- UART
{const {M,B}=boot('l_uart');run(M,3e7,()=>M.res()[10]==1);let r=M.res();
 ck('UART0 LSR after reset+init: THRE|TEMT',r[0]==0x60,hex(r[0]));
 ck('LSR right after two writes: transmitter busy (TEMT=0)',(r[1]&0x40)==0,hex(r[1]));ck('LSR TEMT after the frames drained',(r[2]&0x60)==0x60,hex(r[2]));
 ck('bytes sent: H then i',B.tx.length>=2&&B.tx[0].c==72&&B.tx[1].c==105,JSON.stringify(B.tx));
 ck('cycles per bit = 4 x 16 x 163 = 10432 at PCLK=CCLK/4',B.tx[0].cpb==10432,B.tx[0].cpb);
 ck('TX pin identified as P0.2',B.tx[0].pin=='P0.2',B.tx[0].pin);
 ck('serial monitor received "Hi"',B.ser.join('')=='Hi',B.ser.join(''));
 ck('P0.2 reported as UART TX output (idle high)',B.pins['P0.2']&&B.pins['P0.2'].tx&&B.pins['P0.2'].m=='OUTPUT',JSON.stringify(B.pins['P0.2']));
 const f=B.tx[1].t-B.tx[0].t;ck('second frame starts one frame (10 bits) after the first',Math.abs(f-10*10432)<=2,f);
 M.rxByte(0,0x41);run(M,1e8,()=>M.res()[11]==1);r=M.res();ck('RX: RDR set, RBR read gives 0x41 and echo is 0x42',r[3]==0x41&&B.tx[2]&&B.tx[2].c==0x42,hex(r[3])+' '+JSON.stringify(B.tx[2]));
 M.rxByte(0,0x5A);run(M,2e8,()=>M.res()[31]==0xD0D0);r=M.res();ck('RX interrupt delivers the byte (IIR = RDA)',r[12]==0x5A&&r[13]==1,hex(r[12])+' n='+r[13]);
 ck('UART2 is unpowered after reset (reads 0), works after PCONP',r[14]==0&&r[15]==0x60,hex(r[14])+' '+hex(r[15]));}
// ---- PWM1
{const {M,B}=boot('l_pwm');run(M,3e7,()=>M.res()[0]==1);run(M,M.cy+6e6,null);
 const e1=B.pwmE.filter(x=>x.p==1&&x.i==18),up=e1.filter(x=>x.v==1).map(x=>x.t),dn=e1.filter(x=>x.v==0).map(x=>x.t);
 ck('PWM1.1 period 1 ms',up.length>=4&&Math.abs(up[3]-up[2]-100000)<=4,up.slice(0,5));
 const hi=dn.find(t=>t>up[2])-up[2];ck('PWM1.1 high time 250 us (25%)',Math.abs(hi-25000)<=8,hi);
 const e2=B.pwmE.filter(x=>x.p==2&&x.i==1),up2=e2.filter(x=>x.v==1).map(x=>x.t),dn2=e2.filter(x=>x.v==0).map(x=>x.t);
 ck('PWM1.2 on P2.1 high time 750 us (75%)',Math.abs(dn2.find(t=>t>up2[2])-up2[2]-75000)<=8,dn2.slice(0,3));
 const d=B.pwm.filter(x=>x.p==1&&x.i==18&&x.d!==null).pop();ck('board is told the duty cycle (0.25)',d&&Math.abs(d.d-0.25)<1e-9,JSON.stringify(d));
 M.setRes(1,1);run(M,M.cy+8e6,()=>M.res()[2]==1);const n0=B.pwmE.length;run(M,M.cy+3e6,null);
 const e3=B.pwmE.slice(n0).filter(x=>x.p==1&&x.i==18),u3=e3.find(x=>x.v==1),d3=e3.find(x=>x.v==0&&x.t>u3.t);
 ck('MR1 shadow register: new duty (75%) takes effect through LER',d3&&Math.abs(d3.t-u3.t-75000)<=8,d3&&d3.t-u3.t);}
// ---- ADC
{const B=require('./lpc_core').mockBoard();B.an[0]=2048;B.an[1]=1000;const {M}=boot('l_adc',B);run(M,3e7,()=>M.res()[31]==0xD0D0);const r=M.res();
 ck('ADC firmware finished',r[31]==0xD0D0,M.halted+' '+hex(r[31]));
 ck('ADC registers read 0 while PCONP.12 = 0',r[0]==0,hex(r[0]));
 ck('conversion of AD0.0 = 2048 (12 bit), channel number 0 in ADGDR',r[1]==2048&&r[2]==0,r[1]+' ch'+r[2]);
 ck('reading ADGDR cleared DONE in ADDR0',r[3]==0,r[3]);
 ck('conversion interrupt delivers AD0.1 = 1000',r[10]==1&&r[4]==1000,r[10]+' '+r[4]);
 const t=B.pins['P0.23'];ck('pin P0.23 reported as analog input',t&&t.an,JSON.stringify(t));}
// ---- I2C0
{const {M,B}=boot('l_i2c');run(M,1e8,()=>M.res()[31]==0xD0D0);const r=M.res();
 ck('I2C firmware finished',r[31]==0xD0D0,M.halted+' '+hex(r[31]));
 ck('idle status 0xF8',r[0]==0xF8,hex(r[0]));
 ck('write sequence statuses: 08, 18, 28, 28, 28',[16,17,18,19,20].map(i=>r[i]).join()=='8,24,40,40,40',[16,17,18,19,20].map(i=>hex(r[i])));
 ck('slave got the 2 data bytes (pointer 0x10 + 11 22)',B.wrote.slice(0,2).join()=='17,34'&&B.mem[0x10]==0x11&&B.mem[0x11]==0x22,B.wrote);
 ck('STOP returns the status to 0xF8',r[1]==0xF8,hex(r[1]));
 ck('repeated START status 0x10, SLA+R ACK 0x40',r[2]==0x10&&r[3]==0x40,hex(r[2])+' '+hex(r[3]));
 ck('master receive: 0x50 (ACKed), data 0x11, 0x22, last byte 0x58 (NACKed)',r[4]==0x50&&r[5]==0x11&&r[6]==0x22&&r[7]==0x58,[r[4],r[5],r[6],r[7]].map(hex));
 ck('third byte read from the slave (0x12 ^ 0x3C ^ ... pointer advanced)',r[8]==B.mem[0x12],hex(r[8]));
 ck('missing slave gives SLA+W NACK status 0x20',r[9]==0x20,hex(r[9]));ck('bus idle at the end',r[10]==0xF8,hex(r[10]));
 const ev=B.i2cEv.map(e=>e.ev).join(' ');ck('bus events: S addr wr wr wr P ...',ev.startsWith('S addr wr wr wr P S addr wr Sr addr rd rd rd P S addr P'),ev);
 const a=B.i2cEv.find(e=>e.ev=='addr');ck('SCL period = (SCLH+SCLL) x PCLK divider = 250 x 4 = 1000 cycles',a.tb==1000,a.tb);
 {const w=B.i2cEv.filter(e=>e.ev=='wr').slice(0,3);ck('each byte occupies 9 SCL clocks (9000 cycles apart)',w.length==3&&w[1].c0-w[0].c0>=9000&&w[1].c0-w[0].c0<9600,w.map(x=>x.c0))}}
// ---- external / GPIO interrupts and NVIC priority
{const B=require('./lpc_core').mockBoard();B.ext.set('2.13',1);B.ext.set('0.5',1);B.ext.set('2.10',1);const {M}=boot('l_irq',B);run(M,1e6,()=>M.res()[30]==1);
 M.setPin();B.ext.set('2.13',0);run(M,M.cy+2e4,null);let r=M.res();ck('EINT3 falling edge on P2.13 fires once',r[0]==1,r[0]);
 B.ext.set('2.13',1);run(M,M.cy+2e4,null);r=M.res();ck('no interrupt on the rising edge (EXTPOLAR = falling)',r[0]==1,r[0]);
 B.ext.set('0.5',0);run(M,M.cy+2e4,null);r=M.res();ck('GPIO interrupt on P0.5 falling (IO0IntStatF)',r[1]==1,r[1]);
 B.ext.set('0.5',1);run(M,M.cy+2e4,null);r=M.res();ck('GPIO interrupt on P0.5 rising (IO0IntStatR)',r[2]==1,r[2]);
 M.setRes(20,1);run(M,M.cy+2e7,()=>M.res()[31]==0xD0D0);r=M.res();
 ck('priorities finished',r[31]==0xD0D0,M.halted+' '+hex(r[31]));
 ck('TIMER1 (priority 2) preempts the running TIMER0 ISR (priority 8): TIMER1 finishes first',r[10]==1&&r[11]==0,r[10]+','+r[11]);
 ck('5-bit priority: SetPriority(8) stores 0x40',r[12]==0x40,hex(r[12]));}
process.exit(fails?1:0);
