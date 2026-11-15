#include <stdint.h>
#include "lpc17xx.h"
volatile uint32_t res[32];
void TIMER0_IRQHandler(void) { LPC_TIM0->IR = 1; res[0]++; LPC_GPIO1->FIOPIN ^= 1u << 18; }
void TIMER1_IRQHandler(void) { LPC_TIM1->IR = 2; res[5]++; }
int main(void) {
    pll_100mhz();                                  /* CCLK 100 MHz, PCLK = CCLK/4 = 25 MHz */
    LPC_GPIO1->FIODIR = 1u << 18;
    LPC_TIM0->PR = 24;                             /* 1 MHz tick */
    LPC_TIM0->MR0 = 999;                           /* 1 ms period */
    LPC_TIM0->MCR = 3;                             /* interrupt + reset on MR0 */
    NVIC_EnableIRQ(TIMER0_IRQn);
    LPC_TIM0->TCR = 1;
    /* Timer1: no prescale, PCLK = CCLK (PCLKSEL0 = 01), match output MAT1.0 on P1.22 toggles */
    LPC_SC->PCLKSEL0 |= 1u << 4;
    PINSEL_FN(1, 22, 3);
    LPC_TIM1->MR0 = 99999; LPC_TIM1->MR1 = 49999;
    LPC_TIM1->MCR = (1u << 1) | (1u << 3);         /* reset on MR0, interrupt on MR1 */
    LPC_TIM1->EMR = 3u << 4;                       /* MR0 match toggles MAT1.0 */
    NVIC_EnableIRQ(TIMER1_IRQn);
    LPC_TIM1->TCR = 1;
    /* Timer2: stop on match */
    LPC_SC->PCONP |= PCONP_TIM2;
    LPC_TIM2->PR = 0; LPC_TIM2->MR0 = 100; LPC_TIM2->MCR = 4;   /* stop on MR0 */
    LPC_TIM2->TCR = 1;
    for (volatile int i = 0; i < 2000; i++);
    res[7] = LPC_TIM2->TCR; res[8] = LPC_TIM2->TC;
    res[31] = 0xD0D0;
    for (;;);
}
