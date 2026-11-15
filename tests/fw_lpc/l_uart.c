#include <stdint.h>
#include "lpc17xx.h"
volatile uint32_t res[32];
static void uart0_init(uint32_t dl) {
    PINSEL_FN(0, 2, 1); PINSEL_FN(0, 3, 1);
    LPC_UART0->LCR = 0x83; LPC_UART0->DLL = dl & 255; LPC_UART0->DLM = dl >> 8; LPC_UART0->LCR = 0x03; LPC_UART0->FCR = 7;
}
static void tx(char c) { while (!(LPC_UART0->LSR & 0x20)); LPC_UART0->THR = (uint8_t)c; }
void UART0_IRQHandler(void) { uint32_t iir = LPC_UART0->IIR; if (((iir >> 1) & 7) == 2) { res[12] = LPC_UART0->RBR; res[13]++; } }
int main(void) {
    pll_100mhz();
    uart0_init(163);                           /* 25 MHz / (16 x 163) = 9585 baud */
    res[0] = LPC_UART0->LSR;                   /* THRE | TEMT = 0x60 */
    tx('H'); tx('i');
    res[1] = LPC_UART0->LSR;                   /* busy: TEMT clear */
    while (!(LPC_UART0->LSR & 0x40));
    res[2] = LPC_UART0->LSR;
    res[10] = 1;                               /* ready for input */
    while (!(LPC_UART0->LSR & 1));
    res[3] = LPC_UART0->RBR;
    tx((char)(res[3] + 1));
    LPC_UART0->IER = 1; NVIC_EnableIRQ(UART0_IRQn);
    res[11] = 1;
    while (res[13] == 0);
    /* UART2: power it on first, reset value of PCONP has UART2 off */
    res[14] = LPC_UART2->LSR;                  /* unpowered: reads 0 */
    LPC_SC->PCONP |= PCONP_UART2;
    res[15] = LPC_UART2->LSR;
    res[31] = 0xD0D0;
    for (;;);
}
