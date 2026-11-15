const {load}=require('./harness');
let fails=0;const ck=(n,c,x)=>{console.log((c?'PASS ':'FAIL ')+n+(c?'':'   got '+x));if(!c)fails++};
async function boot(id,secs,mut){const T=await load();const {ev}=T;ev("setMcu('lpc1768')");const idx=ev(`EXS.findIndex(e=>e.id=="${id}")`);ev(`$('ex').value=${idx};$('ex').onchange()`);if(mut)mut(ev);ev('doRun()');ev('clearInterval(fwTimer)');run(T,secs);return T}
const run=(T,secs)=>{const t=T.ev('simT')+secs;for(let i=0;i<20000&&T.ev('simT')<t&&!T.ev('M.halted');i++)T.ev('fwTick()')};
const con=T=>T.ev('$("con").textContent');
(async()=>{
 // ---- MCU selector and the 100-pin board
 {const T=await load(),{ev}=T;
  ck('the toolbar has no MCU dropdown, a back link to the board page and the board name',!ev("!!$('mcu')")&&ev("$('back').getAttribute('href')")=='./'&&/Blue Pill/.test(ev("$('mcuName').textContent")),ev("$('mcuName').textContent"));
  ck('starts as the Blue Pill with its own examples',ev('MCU.id')=='stm32'&&ev("$('ex').options.length")==22,ev("$('ex').options.length"));
  ev("setMcu('lpc1768')");ck('board name label follows the chip',/LPC1768/.test(ev("$('mcuName').textContent")),ev("$('mcuName').textContent"));
  ck('switching to the LPC1768 swaps the board: 100 pins, 70 GPIO',ev('MCU.id')=='lpc1768'&&ev('BN.length')==100&&ev('Object.keys(S).length')==70,ev('BN.length')+' '+ev('Object.keys(S).length'));
  ck('pin ids are unique',ev('new Set(BN.map(b=>b.id)).size')==100,ev('new Set(BN.map(b=>b.id)).size'));
  ck('example list now holds only LPC1768 examples (6), first one loaded',ev("$('ex').options.length")==6&&ev('FW.name')=='lpc_blink.bin',ev("$('ex').options.length")+' '+ev('FW.name'));
  ck('canvas view widened for the big package',ev("cv.getAttribute('viewBox')")=='0 0 1300 1000',ev("cv.getAttribute('viewBox')"));
  ck('flash size shown for 512 KB',/ \/ 524288 B/.test(ev("$('stFlash').textContent")),ev("$('stFlash').textContent"));
  ck('P0.5 keeps its name (no .digit stripping) and power pins collapse to GND/3V3',ev("base('P0.5')")=='P0.5'&&ev("base('GND.3')")=='GND'&&ev("base('P1.18')")=='P1.18',ev("base('P0.5')"));
  const svg=ev('boardSvg()');ck('board is a hand-drawn illustration (sketch strokes, handwriting font, no silicon-package markings)',/Segoe Print/.test(svg)&&/hand-drawn board/.test(svg)&&!/FBD100/.test(svg)&&(svg.match(/<path /g)||[]).length>150,(svg.match(/<path /g)||[]).length);
  ck('supply pins: VSS (n=31) is GND.3, VDD (n=28) is 3V3.4',ev("BN.find(b=>b.num==31).id")=='GND.3'&&ev("BN.find(b=>b.num==28).id")=='3V3.4',ev("BN.find(b=>b.num==31).id"));
  ck('pin 1 is on the left edge top, pin 26 bottom-left, pin 51 right-bottom, pin 76 top-right',JSON.stringify([1,26,51,76].map(n=>ev(`BN.find(b=>b.num==${n}).side`)))=='["l","b","r","t"]',[1,26,51,76].map(n=>ev(`BN.find(b=>b.num==${n}).side`)));
  const d=JSON.parse(ev('JSON.stringify(toDiagram())'));ck('diagram.json names the board part board-lpc1768',d.parts[0].type=='board-lpc1768'&&d.parts[0].id=='lpc1768',JSON.stringify(d.parts[0]));
  ev("setMcu('stm32')");ck('switching back restores the Blue Pill',ev('MCU.id')=='stm32'&&ev('BN.length')==40&&ev("$('ex').options.length")==22,ev('BN.length'));
  ev(`applyDiagram(${JSON.stringify(d)})`);ck('opening an LPC diagram.json switches the MCU automatically',ev('MCU.id')=='lpc1768'&&ev('BID')=='lpc1768',ev('MCU.id'));
  ck('no page errors',T.errs.length==0,T.errs.join('|'));}
 // ---- the selection page hands the board over in the URL
 {const T=await load('?mcu=lpc1768'),{ev}=T;ck('?mcu=lpc1768 opens the LPC1768 board with its first example',ev('MCU.id')=='lpc1768'&&ev('FW.name')=='lpc_blink.bin'&&/LPC1768/.test(ev("$('mcuName').textContent")),ev('MCU.id')+' '+ev('FW.name'));
  const U=await load('?example=lpc_oled');ck('?example=lpc_oled opens that example on its own board',U.ev('MCU.id')=='lpc1768'&&U.ev('FW.name')=='lpc_oled.bin',U.ev('MCU.id')+' '+U.ev('FW.name'));
  const H1=await load('#lpc1768'),H2=await load('#lpc-oled');ck('#lpc1768 and #lpc-oled (hash form, for hosts that drop query strings) work too',H1.ev('MCU.id')=='lpc1768'&&H2.ev('FW.name')=='lpc_oled.bin',H1.ev('MCU.id')+' '+H2.ev('FW.name'));
  const V=await load('?mcu=nonsense');ck('unknown board name falls back to the Blue Pill',V.ev('MCU.id')=='stm32'&&V.errs.length==0,V.ev('MCU.id'));
  ck('no page errors',T.errs.length==0&&U.errs.length==0,T.errs.join('|')+U.errs.join('|'));}
 // ---- every wire of every LPC example resolves to real pins
 {const T=await load(),{ev}=T;ev("setMcu('lpc1768',true)");const r=JSON.parse(ev(`JSON.stringify(EXS.filter(e=>e.mcu=='lpc1768').map(e=>{applyCircuit(e.circuit);return[e.id,wires.filter(w=>!pinGeo(w[0])||!pinGeo(w[1])).length,wires.filter((w,i)=>!wireRoute(w,i)).length]}))`));
  ck('all example wires land on existing pins and route',r.every(x=>x[1]==0&&x[2]==0),JSON.stringify(r));}
 // ---- blink + button
 {const T=await boot('lpc_blink',0.05),{ev}=T;let hi=0,lo=0;for(let i=0;i<120;i++){run(T,0.01);ev('S["P1.18"].o')?hi++:lo++}
  ck('LED on P1.18 blinks (500 ms period)',hi>30&&lo>30&&ev('S["P1.18"].m')=='OUTPUT',hi+'/'+lo);
  ev('parts.find(p=>p.id=="btn1").down=true;draw()');run(T,0.1);let h2=0;for(let i=0;i<60;i++){run(T,0.01);if(ev('S["P1.18"].o'))h2++}
  ck('holding the button on P2.10 keeps the LED on',h2==60,h2);
  ck('P2.10 reported as pull-up input, wires drive it low when pressed',ev('S["P2.10"].m')=='INPUT_PULLUP'&&!ev('M.halted'),ev('S["P2.10"].m'));
  ck('CPU runs at 100 MHz after the PLL set-up',ev('M.sysclk()')==100e6,ev('M.sysclk()'));
  ck('no page errors',T.errs.length==0,T.errs.join('|'));}
 // ---- UART
 {const T=await boot('lpc_uart',0.5),{ev}=T;ck('UART0 hello reaches the Serial Monitor',/Hello from the LPC1768 \(UART0, 9600 baud\)/.test(con(T)),con(T));
  ev("$('si').value='x';sendSerial()");run(T,0.2);ck('typing in the monitor is received by UART0 and echoed',/you typed: x/.test(con(T)),con(T));
  ck('TX pin P0.2 is marked as a UART output, waveform recorded',ev('UARTON["P0.2"]')==1&&ev('(LA["P0.2"]||[]).length')>20,ev('(LA["P0.2"]||[]).length'));
  run(T,2.2);ck('uptime lines appear every 2 s',/uptime 2 s/.test(con(T)),con(T).slice(-80));}
 // ---- PWM
 {const T=await boot('lpc_pwm',0.1),{ev}=T;const d=new Set();for(let i=0;i<100;i++){run(T,0.01);d.add(Math.round(ev('S["P1.18"].pw')*20))}
  ck('PWM1.1 duty on P1.18 sweeps through many values',d.size>8,[...d].join());ck('PWM pin flagged alternate-function output',ev('S["P1.18"].af')==true&&ev('PWMON["P1.18"]')!=null,ev('S["P1.18"].af'));}
 // ---- ADC
 {const T=await boot('lpc_adc',0.6),{ev}=T;const m=con(T).match(/ADC0 = +(\d+)/g)||[];ck('ADC reads the mid-position potentiometer (2048 +-2)',m.length>=2&&Math.abs(+m[m.length-1].match(/\d+$/)[0]-2048)<=2,m.slice(-2));
  ev('parts.find(p=>p.id=="pot1").val=4095;draw()');run(T,0.5);const m2=con(T).match(/ADC0 = +(\d+)/g);ck('turning the pot to the end reads 4095',+m2[m2.length-1].match(/\d+$/)[0]==4095,m2.slice(-2));
  ck('voltage text printed (3.300 V)',/ 3\.300 V/.test(con(T)),con(T).slice(-60));}
 // ---- EINT
 {const T=await boot('lpc_eint',0.1),{ev}=T;ck('banner printed',/Press the button on P2\.11/.test(con(T)),con(T));
  ev('parts.find(p=>p.id=="btn1").down=true;draw()');run(T,0.05);ev('parts.find(p=>p.id=="btn1").down=false;draw()');run(T,0.05);
  ck('one press = one EINT1 interrupt, LED toggled',/presses: 1\b/.test(con(T))&&ev('S["P1.18"].o')==1,con(T));
  ev('parts.find(p=>p.id=="btn1").down=true;draw()');run(T,0.05);ev('parts.find(p=>p.id=="btn1").down=false;draw()');run(T,0.05);
  ck('second press counted, LED off again',/presses: 2\b/.test(con(T))&&ev('S["P1.18"].o')==0,con(T));}
 // ---- OLED on I2C2
 {const T=await boot('lpc_oled',1.3),{ev}=T;
  const info=JSON.parse(ev('JSON.stringify((()=>{const L=devOf(parts.find(p=>p.type=="oled")),F=oledFrame(L,simNow());let n=0;for(const v of F)n+=v;return{n,on:L.on}})())'));
  ck('SSD1306 on LPC I2C2 shows an image (display on, pixels drawn)',info.on&&info.n>300,JSON.stringify(info));
  ck('I2C monitor decodes traffic to 0x3C labelled I2C2',/I2C2/.test(ev('i2cMonText()'))&&/3C/.test(ev('i2cMonText()')),ev('i2cMonText()').slice(0,120));
  ck('bus pins resolved from PINSEL: SCL=P0.11, SDA=P0.10',JSON.stringify(ev('i2cPins(2)'))==JSON.stringify(['P0.11','P0.10']),JSON.stringify(ev('i2cPins(2)')));
  ck('SDA/SCL waveforms recorded for the logic analyzer',ev('(LA["P0.11"]||[]).length')>200&&ev('(LA["P0.10"]||[]).length')>200,ev('(LA["P0.11"]||[]).length'));
  ev("setDock('regs')");ev('regsDraw()');const rg=ev('$("regs").textContent');ck('CPU Registers tab shows LPC state (PLL0, GPIO, UART, I2C)',/PLL0 connected, locked/.test(rg)&&/GPIO1/.test(rg)&&/I2C2/.test(rg),rg.slice(-300));
  ck('no page errors',T.errs.length==0,T.errs.join('|'));}
 // ---- build request carries the MCU
 {const T=await load(),{ev}=T;ev("setMcu('lpc1768')");let body=null;T.w.fetch=(u,o)=>{body=JSON.parse(o.body);return Promise.resolve({json:()=>Promise.resolve({ok:false,log:'stub'})})};
  ev('CAN=true;FW.src="int main(){}"');await ev('doBuild()');await new Promise(r=>setTimeout(r,30));ck('Build sends mcu:"lpc1768" to the compile server',body&&body.mcu=='lpc1768',JSON.stringify(body&&body.mcu));}
 // ---- zoom / pan
 {const T=await load(),{ev}=T;ev("setMcu('lpc1768')");const v0=ev("cv.getAttribute('viewBox')");ev("zoomAt(2,650,450)");const v1=ev("cv.getAttribute('viewBox')").split(' ').map(Number);
  ck('zoom in halves the visible area around the point',Math.abs(v1[2]-650)<1&&Math.abs(v1[0]-325)<1,v1.join());ev("$('zfit').onclick()");ck('fit button restores the full view',ev("cv.getAttribute('viewBox')")==v0,ev("cv.getAttribute('viewBox')"));
  ev("zoomAt(100,650,450)");ck('zoom is limited (max 10x)',+ev("cv.getAttribute('viewBox')").split(' ')[2]>=129,ev("cv.getAttribute('viewBox')"));}
 // ---- Blue Pill examples are untouched
 {const T=await load(),{ev}=T;const idx=ev('EXS.findIndex(e=>e.id=="blink")');ev(`$('ex').value=${idx};$('ex').onchange()`);ev('doRun()');ev('clearInterval(fwTimer)');run(T,0.3);
  ck('Blue Pill blink example still runs on the same page',ev('MCU.id')=='stm32'&&!ev('M.halted')&&ev('M.sysclk()')==8e6,ev('M.sysclk()'));}
 process.exit(fails?1:0)})();
