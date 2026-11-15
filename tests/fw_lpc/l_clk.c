#include <stdint.h>
#include "lpc17xx.h"
volatile uint32_t res[32];
int main(void) {
    res[0] = LPC_SC->PCONP;                       /* reset value 0x042887DE */
    LPC_SC->PLL0CFG = 49u | (2u << 16);           /* no feed: must have no effect */
    LPC_SC->PLL0CON = 1;
    res[1] = LPC_SC->PLL0STAT;
    res[2] = LPC_SC->PLL0CFG;                     /* cfg register itself keeps the old value until feed */
    pll_100mhz();
    res[3] = LPC_SC->PLL0STAT;
    res[4] = LPC_SC->CCLKCFG;
    res[31] = 0xD0D0;
    for (;;);
}
