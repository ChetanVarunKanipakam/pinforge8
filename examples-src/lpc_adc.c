/* LPC1768: 12-bit ADC. Turn the potentiometer on AD0.0 (P0.23); the value goes to UART0 (Serial Monitor) 5 times a second. */
#include <stdint.h>
#include "lpc17xx.h"

static volatile uint32_t ms;
void SysTick_Handler(void) { ms++; }
static void putc_(char c) { while (!(LPC_UART0->LSR & 0x20)); LPC_UART0->THR = (uint8_t)c; }
static void puts_(const char *s) { while (*s) putc_(*s++); }
static void putu(uint32_t v, int w) { char d[11]; int k = 0; do { d[k++] = (char)('0' + v % 10); v /= 10; } while (v); while (w-- > k) putc_(' '); while (k) putc_(d[--k]); }

static uint32_t adc_read0(void) {
    LPC_ADC->ADCR = 1u | (1u << 8) | (1u << 21) | (1u << 24);   /* channel 0, CLKDIV = 1, power on, start now */
    uint32_t g; while (!((g = LPC_ADC->ADGDR) & 0x80000000u));  /* wait for DONE */
    LPC_ADC->ADCR &= ~(7u << 24);
    return (g >> 4) & 0xFFF;
}

int main(void) {
    pll_100mhz();
    SysTick->LOAD = 100000 - 1; SysTick->CTRL = 7;
    PINSEL_FN(0, 2, 1);                        /* TXD0 */
    LPC_UART0->LCR = 0x83; LPC_UART0->DLL = 163; LPC_UART0->DLM = 0; LPC_UART0->LCR = 3; LPC_UART0->FCR = 7;
    LPC_SC->PCONP |= PCONP_ADC;                /* the ADC is off after reset */
    PINSEL_FN(0, 23, 1);                       /* P0.23 = AD0.0 */
    for (uint32_t t = 0;; t += 200) {
        while (ms < t);
        uint32_t v = adc_read0(), mv = v * 3300u / 4095u;
        puts_("ADC0 = "); putu(v, 4); puts_("   "); putu(mv / 1000, 1); putc_('.'); putu(mv % 1000 / 100, 1); putu(mv % 100 / 10, 1); putu(mv % 10, 1); puts_(" V\r\n");
    }
}
