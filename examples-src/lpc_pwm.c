/* LPC1768: PWM1 channel 1 on P1.18 fades an LED (1 kHz, duty ramps up and down).
   PWM1 counts at PCLK/(PR+1); MR0 sets the period, MR1 the pulse; LER latches the new MR1 at the next period. */
#include <stdint.h>
#include "lpc17xx.h"

static volatile uint32_t ms;
void SysTick_Handler(void) { ms++; }

int main(void) {
    pll_100mhz();
    SysTick->LOAD = 100000 - 1; SysTick->CTRL = 7;
    PINSEL_FN(1, 18, 2);                       /* P1.18 = PWM1.1 */
    LPC_PWM1->PR = 24;                         /* 25 MHz / 25 = 1 MHz tick */
    LPC_PWM1->MR0 = 1000;                      /* 1 kHz */
    LPC_PWM1->MR1 = 0;
    LPC_PWM1->MCR = 2;                         /* reset the counter on MR0 */
    LPC_PWM1->PCR = 1u << 9;                   /* enable PWM1 output 1 */
    LPC_PWM1->LER = 3;
    LPC_PWM1->TCR = 2; LPC_PWM1->TCR = 9;      /* reset, then counter + PWM mode on */
    int duty = 0, step = 10;
    for (uint32_t t = 0;; t += 8) {
        while (ms < t);
        duty += step; if (duty >= 1000 || duty <= 0) step = -step;
        LPC_PWM1->MR1 = (uint32_t)duty; LPC_PWM1->LER = 2;
    }
}
