#include <stdint.h>
#include "lpc17xx.h"
volatile uint32_t res[32];
void ADC_IRQHandler(void) { res[9] = LPC_ADC->ADDR1; res[10]++; LPC_ADC->ADINTEN = 0; }
int main(void) {
    pll_100mhz();
    res[0] = LPC_ADC->ADCR;                    /* unpowered (PCONP.12 = 0): reads 0 */
    LPC_SC->PCONP |= PCONP_ADC;
    PINSEL_FN(0, 23, 1);                       /* AD0.0 */
    PINSEL_FN(0, 24, 1);                       /* AD0.1 */
    LPC_ADC->ADCR = 1u | (1u << 8) | (1u << 21);          /* channel 0, CLKDIV 1, power up */
    LPC_ADC->ADCR |= 1u << 24;                            /* start now */
    uint32_t g; while (!((g = LPC_ADC->ADGDR) & 0x80000000));
    res[1] = (g >> 4) & 0xFFF; res[2] = (g >> 24) & 7;
    LPC_ADC->ADCR &= ~(7u << 24);
    res[3] = (LPC_ADC->ADDR0 >> 31);                       /* DONE cleared by the ADGDR read */
    LPC_ADC->ADCR = 2u | (1u << 8) | (1u << 21) | (1u << 24);   /* channel 1 with interrupt */
    LPC_ADC->ADINTEN = 2; NVIC_EnableIRQ(ADC_IRQn);
    while (res[10] == 0);
    res[4] = (res[9] >> 4) & 0xFFF;
    res[31] = 0xD0D0;
    for (;;);
}
