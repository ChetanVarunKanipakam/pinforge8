#include <stdint.h>
#include "lpc17xx.h"
volatile uint32_t res[32];
int main(void) {
    pll_100mhz();
    PINSEL_FN(1, 18, 2);                       /* PWM1.1 */
    PINSEL_FN(2, 1, 1);                        /* PWM1.2 on P2.1 */
    LPC_PWM1->PR = 24;                         /* 1 MHz */
    LPC_PWM1->MR0 = 1000;                      /* 1 kHz */
    LPC_PWM1->MR1 = 250; LPC_PWM1->MR2 = 750;
    LPC_PWM1->MCR = 2;                         /* reset on MR0 */
    LPC_PWM1->PCR = (1u << 9) | (1u << 10);
    LPC_PWM1->LER = 7;
    LPC_PWM1->TCR = 2; LPC_PWM1->TCR = 9;
    res[0] = 1;
    while (res[1] == 0);                       /* host sets res[1] after measuring the first duty */
    LPC_PWM1->MR1 = 750; LPC_PWM1->LER = 2;    /* new duty latched at the next period */
    res[2] = 1;
    for (;;);
}
