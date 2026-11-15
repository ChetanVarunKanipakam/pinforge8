/* LPC1768: UART0 on P0.2 (TXD0) / P0.3 (RXD0), 9600 baud. Type in the Serial Monitor: every character is echoed back. */
#include <stdint.h>
#include "lpc17xx.h"

static volatile uint32_t ms;
void SysTick_Handler(void) { ms++; }

static void uart0_init(uint32_t baud) {
    PINSEL_FN(0, 2, 1); PINSEL_FN(0, 3, 1);            /* TXD0, RXD0 */
    uint32_t dl = 25000000u / (16u * baud);            /* PCLK = CCLK / 4 = 25 MHz */
    LPC_UART0->LCR = 0x83;                             /* 8N1, DLAB = 1 */
    LPC_UART0->DLL = dl & 255; LPC_UART0->DLM = dl >> 8;
    LPC_UART0->LCR = 0x03;
    LPC_UART0->FCR = 0x07;                             /* enable and clear the FIFOs */
}
static void putc_(char c) { while (!(LPC_UART0->LSR & 0x20)); LPC_UART0->THR = (uint8_t)c; }
static void puts_(const char *s) { while (*s) putc_(*s++); }
static void putu(uint32_t v) { char d[11]; int k = 0; do { d[k++] = (char)('0' + v % 10); v /= 10; } while (v); while (k) putc_(d[--k]); }

int main(void) {
    pll_100mhz();
    SysTick->LOAD = 100000 - 1; SysTick->CTRL = 7;
    uart0_init(9600);
    puts_("Hello from the LPC1768 (UART0, 9600 baud)\r\n");
    uint32_t last = 0;
    for (;;) {
        if (LPC_UART0->LSR & 1) { char c = (char)LPC_UART0->RBR; puts_("you typed: "); putc_(c); puts_("\r\n"); }
        if (ms - last >= 2000) { last = ms; puts_("uptime "); putu(ms / 1000); puts_(" s\r\n"); }
    }
}
