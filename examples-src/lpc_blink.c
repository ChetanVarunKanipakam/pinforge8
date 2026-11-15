/* LPC1768: blink an LED on P1.18, hold the button on P2.10 to keep it on.
   The chip starts on its 4 MHz internal oscillator; pll_100mhz() switches to the 12 MHz crystal and the PLL (100 MHz). */
#include <stdint.h>
#include "lpc17xx.h"

static volatile uint32_t ms;
void SysTick_Handler(void) { ms++; }
static void delay_ms(uint32_t n) { uint32_t t = ms; while (ms - t < n); }

int main(void) {
    pll_100mhz();
    SysTick->LOAD = 100000 - 1;               /* 1 ms at 100 MHz */
    SysTick->CTRL = 7;                        /* CCLK, interrupt, enable */
    LPC_GPIO1->FIODIR |= 1u << 18;            /* P1.18 = output (LED) */
    for (;;) {                                /* P2.10 is an input with the default pull-up: low = pressed */
        if (!(LPC_GPIO2->FIOPIN & (1u << 10))) { LPC_GPIO1->FIOSET = 1u << 18; continue; }
        LPC_GPIO1->FIOSET = 1u << 18; delay_ms(250);
        LPC_GPIO1->FIOCLR = 1u << 18; delay_ms(250);
    }
}
