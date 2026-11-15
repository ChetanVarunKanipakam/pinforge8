const fs=require('fs'),path=require('path');
const html=fs.readFileSync(process.env.PF_HTML||path.join(__dirname,'../public/simulator.html'),'utf8');
const src=html.slice(html.indexOf('/*SSD1306-BEGIN*/'),html.indexOf('/*SSD1306-END*/'));   // the model lives in index.html
const {oledNew,oledWrite,oledStart,oledFrame}=new Function(src+';return{oledNew,oledWrite,oledStart,oledFrame}')();
let fails=0;const ck=(n,c,x)=>{console.log((c?'PASS ':'FAIL ')+n+(c?'':'   got '+x));if(!c)fails++};
const tx=(L,bytes)=>{oledStart(L);bytes.forEach(b=>oledWrite(L,b,0))};
const cmd=(L,...c)=>tx(L,[0x00,...c]);const UP=[0x8D,0x14,0xAF,0xA1,0xC8];const dat=(L,d)=>tx(L,[0x40,...d]);
const on=(L,F)=>{let n=0;for(let i=0;i<F.length;i++)n+=F[i];return n};
{const L=oledNew({attrs:{}});
 ck('reset state: display off, page mode',L.on==0&&L.mode==2);
 cmd(L,...UP);ck('charge pump + display on',L.pump==1&&L.on==1);
 dat(L,[0xFF]);let F=oledFrame(L,0);ck('page mode: byte 0xFF at (0,0) lights column 0 rows 0-7',on(L,F)==8&&F[0]==1&&F[7*128]==1&&F[8*128]==0,on(L,F));
 cmd(L,0xB3,0x05,0x12);dat(L,[0x01]);F=oledFrame(L,0);ck('page 3, column 0x25 (0x05|0x20) addresses pixel x=37,y=24',F[24*128+37]==1,F[24*128+37]);
 // horizontal mode with window
 const M=oledNew({attrs:{}});cmd(M,...UP,0x20,0x00,0x21,10,13,0x22,1,2);
 dat(M,[1,1,1,1,2,2,2,2]);F=oledFrame(M,0);
 ck('horizontal mode: 4 columns, then next page',F[8*128+10]==1&&F[8*128+13]==1&&F[17*128+10]==1&&F[17*128+13]==1&&F[17*128+14]==0&&F[8*128+14]==0,[F[8*128+10],F[17*128+13],F[17*128+14]]);
 dat(M,[4,4]);F=oledFrame(M,0);
 ck('horizontal mode: after the last page the pointer wraps to the window start',F[10*128+10]==1&&F[10*128+11]==1&&F[8*128+10]==0&&F[8*128+12]==1,[F[10*128+10],F[8*128+10],F[8*128+12]]);
 // wrap: after page end, goes back to start page and column
 const W=oledNew({attrs:{}});cmd(W,...UP,0x20,0x00,0x21,0,1,0x22,0,0);dat(W,[1,1,1,1]);ck('window wraps at end (page 0, col 0 rewritten)',W.col==0+2%2&&W.page==0,W.col+','+W.page);
 // vertical mode
 const V=oledNew({attrs:{}});cmd(V,...UP,0x20,0x01,0x21,5,6,0x22,0,1);dat(V,[0x01,0x01,0x01]);F=oledFrame(V,0);
 ck('vertical mode: second byte goes to next page, third to next column',F[0*128+5]==1&&F[8*128+5]==1&&F[0*128+6]==1,[F[5],F[8*128+5],F[6]]);
 // flags
 cmd(L,0xA7);F=oledFrame(L,0);ck('invert lights the rest of the screen',on(L,F)==128*64-9,on(L,F));cmd(L,0xA6);
 cmd(L,0xA5);F=oledFrame(L,0);ck('entire display on',on(L,F)==128*64);cmd(L,0xA4);
 cmd(L,0xAE);ck('display off is black',on(L,oledFrame(L,0))==0);cmd(L,0xAF);
 const R=oledNew({attrs:{}});cmd(R,0x8D,0x14,0xAF);dat(R,[0x01]);F=oledFrame(R,0);ck('power-on orientation (A0,C0) is rotated 180 deg like the real glass',F[63*128+127]==1&&on(R,F)==1,F[63*128+127]);
 cmd(R,0xA1);F=oledFrame(R,0);ck('A1 mirrors x',F[63*128]==1,F[63*128]);cmd(R,0xC8);F=oledFrame(R,0);ck('C8 flips y: A1+C8 is upright (0,0)',F[0]==1&&on(R,F)==1,F[0]);
 const Z=oledNew({attrs:{}});cmd(Z,...UP);dat(Z,[0x01]);cmd(Z,0x40|8);F=oledFrame(Z,0);ck('start line 8 shifts content up by 8 rows (wraps)',F[56*128]==1&&F[0]==0,F[56*128]);
 const P=oledNew({attrs:{}});cmd(P,0xAF);dat(P,[0xFF]);ck('no charge pump -> dark',on(P,oledFrame(P,0))==0);
 // control byte semantics: 0x80 single command, then another control byte
 const S=oledNew({attrs:{}});tx(S,[0x80,0x8D,0x80,0x14,0x80,0xAF,0x40,0xAA,0xAA]);ck('Co=1 control bytes: 3 commands, 2 data',S.on==1&&S.pump==1&&S.wr==2&&S.col==2,[S.on,S.pump,S.wr,S.col]);
 const H=oledNew({attrs:{height:'32'}});cmd(H,...UP,0xA8,31);dat(H,[0xFF]);F=oledFrame(H,0);ck('128x32 variant has 32 rows, upright',F.length==128*32&&on(H,F)==8&&F[0]==1,F.length);
 // scrolling
 const X=oledNew({attrs:{}});cmd(X,...UP);dat(X,[0x01]);cmd(X,0x26,0,0,0,7,0,0xFF,0x2F);
 X.sc.t0=0;F=oledFrame(X,0.25);ck('horizontal scroll right: 5 frames/step = 50 ms -> 5 columns after 250 ms',F[5]==1&&F[0]==0,[F[0],F[5]]);
 cmd(X,0x2E);F=oledFrame(X,0.25);ck('scroll deactivated returns to RAM',F[0]==1);
}
process.exit(fails?1:0);
