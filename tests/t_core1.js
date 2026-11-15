const {boot,run,mockBus}=require('./core');
let fails=0;const ck=(n,c,x)=>{console.log((c?'PASS ':'FAIL ')+n+(c?'':'   got '+x));if(!c)fails++};
// ---- write / NACK
{const B=mockBus(),M=boot('t_write',B.host);M.rcc.apb2|=0;run(M,3e6,()=>M.res()[31]==0xD0D0);const r=M.res();
 ck('firmware finished',r[31]==0xD0D0,r[31].toString(16));
 ck('SR2 after START = MSL|BUSY',r[0]==3,r[0]);
 ck('address 0x50 ACKed',r[1]==1,r[1]);
 ck('SR1 had ADDR|TXE',(r[2]&0x82)==0x82,r[2].toString(16));
 ck('SR2 write mode = MSL|BUSY|TRA',r[3]==7,r[3]);
 ck('idle after STOP',r[4]==0,r[4]);
 ck('slave received DE AD BE EF',JSON.stringify(B.wrote)==JSON.stringify([0xDE,0xAD,0xBE,0xEF]),JSON.stringify(B.wrote));
 ck('eeprom contents written at 0x10',B.mem[0x10]==0xDE&&B.mem[0x13]==0xEF);
 ck('absent address NACKed (AF)',r[5]==0&&r[6]==1,r[5]+','+r[6]);
 ck('AF cleared by software',r[7]==0,r[7]);
 const tb=B.ev.filter(e=>e.ev=='wr')[0].tb;ck('SCL period = 80 cycles @100 kHz / 8 MHz',tb==80,tb);
 const evs=B.ev.map(e=>e.ev).join(' ');ck('event order S addr wr wr wr wr P S addr P',evs=='S addr wr wr wr wr wr P S addr P',evs);
 // timing: five wr events back to back, spaced by 9 bit times
 const w=B.ev.filter(e=>e.ev=='wr');const gaps=w.slice(1).map((e,i)=>e.c0-w[i].c0);ck('bytes are back-to-back (720 cycles apart)',gaps.every(g=>g>=720&&g<=760),gaps.join(','));
}
// ---- read
{const B=mockBus(),M=boot('t_read',B.host);run(M,2e7,()=>M.res()[31]==0xD0D0);const r=M.res();
 ck('firmware finished',r[31]==0xD0D0,r[31].toString(16)+' halted='+M.halted+' cy='+M.cy);
 ck('N=1 read',r[0]==(0x20^0x5A),r[0].toString(16));
 ck('N=1 read after repeated START',r[1]==(0x30^0x5A),r[1].toString(16));
 ck('N=2 read (POS)',r[2]==((0x40^0x5A)|((0x41^0x5A)<<8)),r[2].toString(16));
 const exp=[0,1,2,3,4].map(i=>(0x50+i)^0x5A);ck('N=5 read',JSON.stringify(r.slice(3,8))==JSON.stringify(exp),JSON.stringify(r.slice(3,8)));
 const rd=B.ev.filter(e=>e.ev=='rd');
 ck('last byte of each read NACKed, others ACKed',JSON.stringify(rd.map(e=>e.ack))==JSON.stringify([0, 0, 1,0, 1,1,1,1,0].slice(0,rd.length)),JSON.stringify(rd.map(e=>e.ack)));
 ck('slave got a stop after each transaction',B.log.filter(x=>x=='stop').length>=6,B.log.filter(x=>x=='stop').length);
}
process.exit(fails?1:0);
