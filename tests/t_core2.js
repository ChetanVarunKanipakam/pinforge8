const {boot,run,mockBus}=require('./core');
let fails=0;const ck=(n,c,x)=>{console.log((c?'PASS ':'FAIL ')+n+(c?'':'   got '+x));if(!c)fails++};
{const B=mockBus(),M=boot('t_irq',B.host);run(M,2e7,()=>M.res()[31]==0xD0D0);const r=M.res();
 ck('interrupt driver finished',r[31]==0xD0D0,'halted='+M.halted+' '+r[31].toString(16));
 ck('ACKed transfer: no error',r[0]==0,r[0]);
 ck('event interrupts fired (SB, ADDR, TXE x4, BTF >= 7)',r[1]>=7,r[1]);
 ck('data delivered 60 11 22 33 (ptr=0x60, then 3 bytes)',B.mem[0x60]==0x11&&B.mem[0x61]==0x22&&B.mem[0x62]==0x33,[B.mem[0x60],B.mem[0x61],B.mem[0x62]].map(x=>x.toString(16)));
 ck('NACKed transfer: error flag set via ER interrupt',r[2]==1&&r[3]>=1,r[2]+','+r[3]);
 ck('bus idle after both',r[4]==0,r[4]);
}
{const B=mockBus(),M=boot('t_fast',B.host);run(M,5e6,()=>M.res()[31]==0xD0D0);const r=M.res();
 ck('fast mode firmware finished',r[31]==0xD0D0,r[31].toString(16));
 const w=B.ev.filter(e=>e.ev=='wr'||e.ev=='addr');
 ck('Fm DUTY=0 CCR=7: SCL period 21 cycles',w[0].tb==21,w[0].tb);
 ck('Fm DUTY=1 CCR=2: SCL period 50 cycles',w[w.length-1].tb==50,w[w.length-1].tb);
 ck('PE=0 clears all flags',r[0]==0,r[0]);
 ck('SWRST bit sets then clears',r[1]==0x8000&&r[2]==0,r[1].toString(16)+','+r[2].toString(16));
}
process.exit(fails?1:0);
