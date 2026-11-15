# PinForge — Wokwi-style STM32 (Blue Pill) and NXP LPC1768 simulator with an in-browser C workflow

Web app + small compile server. You write C in the browser, the server builds it with `arm-none-eabi-gcc`,
and the page runs the result on an emulated Cortex-M3 / STM32F103 wired to a virtual circuit.

```
public/index.html       board selection page (STM32 / LPC1768)
public/simulator.html   the simulator (emulator, circuit canvas, editor) — one self-contained file
server.js           zero-dependency Node server: static files + POST /api/compile + GET /api/health
toolchain/          startup code, linker script and the stm32f1.h register header used for every build
examples-src/       C sources + circuits of the shipped examples (tools/build-examples.js compiles them into simulator.html)
tests/              headless test suite (see Tests)
Dockerfile          node:20-slim + gcc-arm-none-eabi
render.yaml         one-click blueprint for Render (free plan)
```

## Pages
* `public/index.html` is the **board selection page** (STM32 Blue Pill or NXP LPC1768). Each card opens the simulator with the board in the URL.
* `public/simulator.html` is the **simulator**. `simulator.html?mcu=lpc1768` opens a board with its first example, `simulator.html?example=lpc_oled` opens an example on its own board, and **‹ Boards** in the toolbar goes back.
Page changes fade (CSS view transitions where the browser supports them, a fade-out/in fallback elsewhere; both respect reduced-motion).

## Two microcontrollers
The LPC1768 board is a hand-drawn illustration (sketch outline, handwriting labels); every one of the 100 package pins is wireable. Opening a `diagram.json` whose board is `board-lpc1768` switches the board automatically.

| | STM32F103C8 (Blue Pill) | NXP LPC1768 |
|---|---|---|
| Board | Blue Pill board, pins `PA0`... | hand-drawn board, pins `P0.0`... `P4.29` (70 GPIO), real package pin numbers 1-100 in the tooltips, 8 `GND` and 9 `3V3` supply pins |
| Header | `"stm32f1.h"` | `"lpc17xx.h"` (CMSIS-style names: `LPC_GPIO1->FIOSET`, `LPC_UART0`, `LPC_PWM1`, `LPC_I2C0`, ...) |
| Memory | 64 KB Flash at `0x08000000`, 20 KB RAM | 512 KB Flash at `0x0`, 32 KB RAM at `0x10000000`, 2 x 16 KB AHB RAM; the server fills in the boot-ROM vector checksum |
| Clock | 8 MHz HSI, PLL to 72 MHz | 4 MHz IRC at reset; `pll_100mhz()` (in the header) runs the same sequence as CMSIS `SystemInit` for 100 MHz |

**LPC1768 emulator coverage:** system control (`PCONP` with the real reset value, per-peripheral `PCLKSEL` dividers, PLL0 with the `0xAA/0x55` feed sequence and lock delay,
`CCLKCFG`, `SCS`, `EXTINT/EXTMODE/EXTPOLAR`), pin connect (`PINSEL0-9`, `PINMODE` pull-up/pull-down/none with pull-up as reset default, `PINMODE_OD`),
fast GPIO ports 0-4 (`FIODIR/FIOMASK/FIOPIN/FIOSET/FIOCLR`, byte and half-word access, only the pins that exist on the package), GPIO edge interrupts on P0/P2 (`IOxIntEnR/F`, status, clear),
EINT0-3, TIMER0-3 (prescaler, 4 match registers with interrupt/reset/stop, external match toggle/set/clear on `MATn.m` pins), PWM1 (single-edge channels 1-6 with shadow registers and `LER`),
UART0-3 (16550: FIFOs, `DLL/DLM`, fractional divider `FDR`, RBR/THRE interrupts, `LSR` flags, real frame timing), 12-bit ADC (`AD0.0-7`, burst, per-channel results, `DONE/OVERRUN`, interrupt),
I2C0-2 master state machine (`I2CONSET/CLR`, `I2STAT` codes 0x08/0x10/0x18/0x20/0x28/0x30/0x40/0x48/0x50/0x58, `I2SCLH/L` timing) on the same SSD1306/bus layer as the STM32,
and NVIC with the LPC's 5-bit priorities and preemption. Peripherals whose `PCONP` bit is 0 read as 0 and ignore writes, like the chip.
Not modelled yet: SPI/SSP, DMA, DAC, CAN, USB, Ethernet, RTC, watchdog, RIT, motor-control PWM, QEI, timer capture, I2C slave mode.

**Zoom and pan** (both chips): mouse wheel, pinch, drag on empty canvas, or the + / - / fit buttons at the bottom left of the circuit. The LPC package is 560 x 560 units, so zoom in to wire it.

## Run locally
```
docker build -t pinforge . && docker run -p 3000:3000 pinforge     # then open http://localhost:3000
# or, without Docker: install arm-none-eabi-gcc, then
node server.js
```

## Deploy for free (Render)
1. Create a GitHub repository and push this folder to it.
2. On render.com: **New → Blueprint** (uses `render.yaml`) or **New → Web Service → Docker**, choose the **Free** plan.
3. Wait for the build. Your URL looks like `https://pinforge-xxxx.onrender.com`.

Free-tier notes (check current terms; they change): Render's free web service has 512 MB RAM and a small CPU share,
sleeps after about 15 minutes without traffic and takes roughly a minute to wake. Hugging Face Docker Spaces and
Fly.io no longer have a free option as of the sources checked in late 2026. If you only need the simulator
without the compile button, the whole `public/` folder (both pages) also works on any static host (GitHub Pages, Netlify, Cloudflare Pages);
users then load firmware files built on their own machine.

## Rebuilding after changes
`node tools/embed-lpc.js` copies `src/lpc1768.js` into `public/simulator.html`; `node server.js &` then `node tools/build-examples.js` recompiles all examples (both chips) into the page.

## Using it
* **Layout:** Code / Circuit / Split tabs at the top; a dock with **Serial Monitor**, **CPU Registers**, **Logic Analyzer**, **I²C Monitor** and **Build Log** tabs at the bottom. The round **+** button inside the circuit area adds parts.
* **Build and Run are separate.** Build (Ctrl+B) compiles `main.c` only. Run (Ctrl+Enter) starts the last successful build and refuses a stale one. Prebuilt examples run immediately.
* **The circuit is locked while running:** no wiring, moving, adding, deleting or rotating, and `diagram.json` becomes read-only. Pressing buttons and turning potentiometers still works. Press Stop to edit again.
* **Wires** are right-angle lines on a 20 px grid (select a wire and drag its square handle to move the bend). Every pin sits on the grid.
* Without a compile server the editor is read-only; use **Load…** with a `.bin`, `.elf` or `.hex`.
* Build flags: `-mcpu=cortex-m3 -mthumb -Os -Wall -Wextra -nostdlib -ffreestanding`, linked with `toolchain/startup.c` and `link.ld` (64 KB Flash at 0x08000000, 20 KB RAM at 0x20000000).
* Allowed includes: `<stdint.h>`, `<stdbool.h>`, `<stddef.h>`, and the chip's own header: `"stm32f1.h"` / `"stm32f10x.h"` (alias) for the STM32, `"lpc17xx.h"` / `"LPC17xx.h"` for the LPC1768. The request carries `mcu` (`stm32` or `lpc1768`); the LPC build links with `startup_lpc.c` and `link_lpc.ld`.

## Input / output devices
Add them with the **+** button. Each one is tested against real compiled firmware, and the examples come with the wiring already done (pick one from the project list).
* **LCD 16x2 (HD44780):** 4-bit and 8-bit interface, clear/home/entry mode, cursor and blink, display shift, DDRAM address wrap, 8 custom characters, display on/off. Wire VSS to GND, VDD to 5V, RW to GND, plus RS, E and D4-D7 (or D0-D7); A/K are the backlight (unwired = on). Write-only: it ignores read cycles, so keep RW low and use delays instead of the busy flag. Characters: ASCII, degree sign, arrows and a solid block.
* **7-segment digit** and **4-digit 7-segment (multiplexed):** common cathode or anode (inspector), decimal point, any colour. Multiplexed displays are time-averaged, so brightness follows the duty cycle and slow scanning flickers like the real thing.
* **Keypad 4x4:** a real row/column matrix. Click keys (works while running) or type 0-9 * # A-D on the keyboard. A short tap is held for 45 ms so firmware polling can see it.
* **Buzzer:** the tone frequency is measured from the pin edges (PWM or GPIO) and played through the browser speaker; mute it in the inspector.
* **RGB LED:** common cathode or anode, PWM duty is averaged per colour.
* **Slide switch**, **LED bar graph (10 LEDs)** and **Servo:** the angle comes from the measured pulse width (default 1.0-2.0 ms = 0-180 degrees, adjustable) and the servo needs V+ and GND wired.
* **OLED 128x64 (SSD1306, I2C):** the common 0.96" module, drawn with its 4-pin header on the top edge. Wire GND, VCC (3V3 or 5V), SCL and SDA to a real I2C pin pair: **I2C1 = PB6/PB7** (PB8/PB9 after `AFIO->MAPR |= AFIO_MAPR_I2C1_REMAP`) or **I2C2 = PB10/PB11**; the pins must be configured as alternate-function open-drain (`GPIO_AF_OD_50MHZ`). Inspector: colour (white, blue, yellow, or the yellow-top/blue-below two-colour glass), 128x64 or 128x32, I2C address 0x3C / 0x3D. Modelled like the chip: control bytes (Co / D/C#), page, horizontal and vertical addressing with column/page windows, contrast, invert, entire-display-on, display on/off, segment remap and COM scan direction (`0xA1`+`0xC8`, what Adafruit and u8g2 send, is upright, as on real glass), start line, multiplex ratio, charge pump (the screen stays dark until `0x8D 0x14` is sent, like the real module), horizontal scroll. Not modelled: vertical scroll offset, the SH1106 variant, reads. The glass shows a short hint while it is unpowered, waiting for data, or switched off.
* Wiring and editing are locked while running, but keypad keys, slide switches, pushbuttons and potentiometers stay usable.

## Logic analyzer
* **Auto mode:** with no Logic Analyzer part in the circuit, every active pin (outputs, pulled-up inputs, wired pins) gets a channel.
* **Probe mode:** add the **Logic Analyzer** part with the `+` button and wire D0-D7 to any pin or net (a button, an LED, a potentiometer, GND, 3V3...). Then exactly those channels are shown, named after what they touch.
* **Waveforms are cycle-accurate** for GPIO edges (1 kHz toggling measured at 1.000 ms), true timer **PWM** (period and duty measured to 0.1 %), and **UART TX** frames at the programmed baud rate (decoded back to the right byte). Analog nets (potentiometer) are drawn as analog traces with a voltage readout. Undriven nets are drawn dashed.
* Windows from 1 ms to 10 s, a **Hold** checkbox to freeze the view, a hover cursor with time readout, and frequency / duty cycle shown for periodic signals.
* **I2C:** SCL and SDA are recorded as real waveforms (SCL period from the programmed CCR, START / STOP / repeated START, 9 clocks per byte, data changes after SCL falls) and named `PB10 · I2C2 SCL` etc. The **I²C Monitor** tab decodes the same traffic: time, bus, S / Sr, address, R/W, ACK/NACK, bytes (a `!` marks a NACKed byte) and P. History is the last ~90 000 edges per channel (about 0.3 s of 100 kHz traffic).
* Limits: no trigger, no SPI decoding (SPI is not modelled yet), and signals changing faster than one pixel per window merge visually - zoom in with a shorter window.

## Security notes (read before exposing publicly)
Compiling strangers' C code is risky. Protections in `server.js`: source size cap; the code is preprocessed first and the
files actually included are checked (only the toolchain headers are allowed); inline assembly is limited to a few
instructions (wfi, wfe, nop, sev, cpsid/cpsie i, dmb, dsb, isb, bkpt); `#pragma`, `##` and `.incbin`-style tricks are rejected;
the compiler runs with CPU/memory/file-size limits (`prlimit`), a timeout, in a throw-away temp directory, as a non-root user;
builds are rate-limited per IP and at most two run at once. This is defence in depth, not a full sandbox — keep secrets
out of the container and let the platform's container isolation be the final barrier.

## Emulator coverage
Cortex-M3 (Thumb/Thumb-2 incl. IT blocks, UDIV/SDIV, 64-bit multiply, LDRD/STRD, TBB/TBH, bitfields), GPIO A/B/C,
RCC clocks (HSI, HSE, PLL -> up to 72 MHz), TIM2-4 (update + compare interrupts, PWM), USART1-3 (TX/RX), ADC1 (software-triggered).

**Interrupts:** NVIC enable/disable/set-pending/clear-pending, 4-bit priorities with preemption (a more urgent interrupt
interrupts a running ISR; equal priority waits), tail-chaining, PRIMASK (`__disable_irq`), SysTick, SVC, PendSV,
EXTI0-15 with AFIO line selection (rising/falling edge, software trigger), TIM2-4 update and compare interrupts,
USART1-3 RXNE/TXE/TC interrupts, ADC end-of-conversion. Sources are level-sensitive like the real chip: forgetting to clear a
flag (EXTI->PR, TIMx->SR, ...) makes the ISR re-enter endlessly. Exception entry/return costs 12 cycles each.
Header helpers: `NVIC_EnableIRQ/DisableIRQ/SetPriority/SetPendingIRQ/ClearPendingIRQ`, `__disable_irq`, `__enable_irq`, `__WFI`, `__SVC0`.

**I2C1 / I2C2 (master):** register-accurate for RM0008 `CR1/CR2/OAR/DR/SR1/SR2/CCR/TRISE`: START, repeated START, STOP, 7-bit
addressing, master transmitter (TXE / BTF, DR double buffering), master receiver with the three official sequences (N=1, N=2 with POS, N>2),
ACK/NACK control, `ADDR` cleared by SR1+SR2 read, `AF` on a NACK (write-0-to-clear), `SWRST`, `PE=0`, event and error interrupts
(`I2Cx_EV_IRQn`, `I2Cx_ER_IRQn`, level-sensitive). Timing is cycle-based: standard mode `2 x CCR` and fast mode `3 x CCR` / `25 x CCR` (DUTY)
PCLK1 cycles per SCL period, 9 clocks per byte, so 100 kHz / 400 kHz firmware runs at the right speed (APB1 prescaler is honoured).
The bus is only visible to slave devices when SCL/SDA are configured as alternate-function outputs and wired to the matching pin pair.
Not modelled: slave mode, 10-bit addressing, general call, SMBus/PEC, DMA requests, BERR/ARLO/timeout errors, clock stretching by slaves, multi-master.
`stm32f1.h` has the `I2C_TypeDef`, bit names (`I2C_CR1_START`, `I2C_SR1_TXE`, ...), `RCC_APB1ENR_I2C1EN`, IRQ numbers and `GPIO_AF_OD_*MHZ`.

Not modelled yet: BASEPRI and priority sub-grouping (PRIGROUP), USART error flags/idle line, DMA, SPI, watchdogs, RTC,
flash/power control registers (so ST's HAL start-up code may hang), timer input capture, USB, CAN. `WFI` behaves like `NOP`.

## Tests
`tests/` runs real compiled firmware against the emulator and drives the real page headlessly (jsdom). Needs `arm-none-eabi-gcc` and `npm i --no-save jsdom`.
```
sh tests/run-all.sh
```
The LPC1768 has its own suites: `t_lpc` runs eight compiled firmwares (clock/PLL, GPIO, timers, UART, PWM, ADC, I2C master, interrupts and priorities) against the chip model with a mock board and checks the results against the user manual, `e2e_lpc` drives the page (MCU switching, board geometry, every example, serial, buttons, OLED, build request, zoom), and the register offsets of `lpc17xx.h` are checked by static asserts.
It covers the I2C master against a mock slave (write, NACK, N=1/2/5-byte reads, interrupt-driven transfers, fast mode timing, `PE`/`SWRST`), the SSD1306 model,
the complete page (OLED contents read back as pixels, SCL/SDA waveforms decoded independently and compared with the monitor, scanner output,
wiring failure modes, I2C1 remap, logic-analyzer probes, diagram.json round trip) and boots every shipped example.
#   p i n f o r g e 8  
 