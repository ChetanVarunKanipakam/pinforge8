/* LPC1768: external interrupt EINT1 on P2.11 (falling edge). Each press toggles the LED on P1.18 and counts to UART0. */
#include <stdint.h>
#include "lpc17xx.h"

static volatile uint32_t presses;
static void putc_(char c) { while (!(LPC_UART0->LSR & 0x20)); LPC_UART0->THR = (uint8_t)c; }
static void puts_(const char *s) { while (*s) putc_(*s++); }

void EINT1_IRQHandler(void) {
    LPC_SC->EXTINT = 1u << 1;                  /* acknowledge */
    LPC_GPIO1->FIOPIN ^= 1u << 18;
    presses++;
}

int main(void) {
    pll_100mhz();
    PINSEL_FN(0, 2, 1);
    LPC_UART0->LCR = 0x83; LPC_UART0->DLL = 163; LPC_UART0->DLM = 0; LPC_UART0->LCR = 3; LPC_UART0->FCR = 7;
    LPC_GPIO1->FIODIR |= 1u << 18;
    PINSEL_FN(2, 11, 1);                       /* P2.11 = EINT1 */
    LPC_SC->EXTMODE |= 1u << 1;                /* edge sensitive */
    LPC_SC->EXTPOLAR &= ~(1u << 1);            /* falling edge */
    LPC_SC->EXTINT = 1u << 1;
    NVIC_EnableIRQ(EINT1_IRQn);
    uint32_t shown = 0;
    puts_("Press the button on P2.11\r\n");
    for (;;) {
        if (presses != shown) {
            shown = presses;
            puts_("presses: "); { char d[11]; int k = 0; uint32_t v = shown; do { d[k++] = (char)('0' + v % 10); v /= 10; } while (v); while (k) putc_(d[--k]); } puts_("\r\n");
        }
    }
}
