extern unsigned _etext, _sdata, _edata, _sbss, _ebss, _estack;
int main(void);
void Default_Handler(void) { for (;;); }
void Reset_Handler(void) {
    unsigned *s = &_etext, *d = &_sdata;
    while (d < &_edata) *d++ = *s++;
    for (d = &_sbss; d < &_ebss;) *d++ = 0;
    main();
    for (;;);
}
#define W(n) void n(void) __attribute__((weak, alias("Default_Handler")))
W(NMI_Handler); W(HardFault_Handler); W(SVC_Handler); W(PendSV_Handler); W(SysTick_Handler);
W(WDT_IRQHandler); W(TIMER0_IRQHandler); W(TIMER1_IRQHandler); W(TIMER2_IRQHandler); W(TIMER3_IRQHandler);
W(UART0_IRQHandler); W(UART1_IRQHandler); W(UART2_IRQHandler); W(UART3_IRQHandler); W(PWM1_IRQHandler);
W(I2C0_IRQHandler); W(I2C1_IRQHandler); W(I2C2_IRQHandler); W(EINT0_IRQHandler); W(EINT1_IRQHandler);
W(EINT2_IRQHandler); W(EINT3_IRQHandler); W(ADC_IRQHandler);
__attribute__((section(".isr_vector"), used)) void (*const vectors[51])(void) = {
    [0] = (void (*)(void))&_estack, [1] = Reset_Handler, [2] = NMI_Handler, [3] = HardFault_Handler,
    [11] = SVC_Handler, [14] = PendSV_Handler, [15] = SysTick_Handler,
    [16] = WDT_IRQHandler, [17] = TIMER0_IRQHandler, [18] = TIMER1_IRQHandler, [19] = TIMER2_IRQHandler, [20] = TIMER3_IRQHandler,
    [21] = UART0_IRQHandler, [22] = UART1_IRQHandler, [23] = UART2_IRQHandler, [24] = UART3_IRQHandler, [25] = PWM1_IRQHandler,
    [26] = I2C0_IRQHandler, [27] = I2C1_IRQHandler, [28] = I2C2_IRQHandler,
    [34] = EINT0_IRQHandler, [35] = EINT1_IRQHandler, [36] = EINT2_IRQHandler, [37] = EINT3_IRQHandler, [38] = ADC_IRQHandler };
void *memcpy(void *d, const void *s, unsigned n) { char *a = d; const char *b = s; while (n--) *a++ = *b++; return d; }
void *memset(void *d, int c, unsigned n) { char *a = d; while (n--) *a++ = (char)c; return d; }
