#include <stdint.h>
#include "lpc17xx.h"
volatile uint32_t res[32];
void EINT3_IRQHandler(void) {
    if (LPC_SC->EXTINT & 8) { LPC_SC->EXTINT = 8; res[0]++; }
    if (LPC_GPIOINT->IO0IntStatF & (1u << 5)) { LPC_GPIOINT->IO0IntClr = 1u << 5; res[1]++; }
    if (LPC_GPIOINT->IO0IntStatR & (1u << 5)) { LPC_GPIOINT->IO0IntClr = 1u << 5; res[2]++; }
}
void EINT0_IRQHandler(void) { LPC_SC->EXTINT = 1; res[3]++; }
volatile uint32_t order[8]; volatile int on_;
void TIMER0_IRQHandler(void) { LPC_TIM0->IR = 1; for (volatile int i = 0; i < 2000; i++); order[on_++] = 0; }
void TIMER1_IRQHandler(void) { LPC_TIM1->IR = 1; order[on_++] = 1; }
int main(void) {
    PINSEL_FN(2, 13, 1);                       /* EINT3 on P2.13 */
    LPC_SC->EXTMODE = 8; LPC_SC->EXTPOLAR = 0; /* edge, falling */
    PINSEL_FN(2, 10, 1);                       /* EINT0 on P2.10, level low */
    LPC_GPIOINT->IO0IntEnF = 1u << 5; LPC_GPIOINT->IO0IntEnR = 1u << 5;
    NVIC_EnableIRQ(EINT3_IRQn);
    res[30] = 1;
    while (res[20] == 0);                      /* host drives pins, then sets res[20] */
    /* priorities: TIMER0 (lower urgency) is interrupted by TIMER1 (more urgent) */
    NVIC_SetPriority(TIMER0_IRQn, 8); NVIC_SetPriority(TIMER1_IRQn, 2);
    NVIC_EnableIRQ(TIMER0_IRQn); NVIC_EnableIRQ(TIMER1_IRQn);
    LPC_TIM0->PR = 0; LPC_TIM0->MR0 = 100; LPC_TIM0->MCR = 1; LPC_TIM0->TCR = 1;
    LPC_TIM1->PR = 0; LPC_TIM1->MR0 = 1500; LPC_TIM1->MCR = 1; LPC_TIM1->TCR = 1;
    while (on_ < 2);
    res[10] = order[0]; res[11] = order[1];
    res[12] = (NVIC_IPR[TIMER0_IRQn]);        /* 8 << 3 = 0x40 */
    res[31] = 0xD0D0;
    for (;;);
}
