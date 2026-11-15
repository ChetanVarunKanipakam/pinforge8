/* I2C bus scanner: probes every 7-bit address on I2C1 (PB6 = SCL, PB7 = SDA) and I2C2 (PB10 = SCL, PB11 = SDA)
   and prints the devices that answer on USART1 (PA9, 115200 baud): open the Serial Monitor.
   A missing device shows up as a NACK (the AF flag), which is what the scanner looks for. */
#include <stdint.h>
#include "stm32f1.h"

static void putc_(char c) { while (!(USART1->SR & 0x80)); USART1->DR = (uint32_t)c; }
static void puts_(const char *s) { while (*s) putc_(*s++); }
static void hex2(unsigned v) { putc_("0123456789ABCDEF"[(v >> 4) & 15]); putc_("0123456789ABCDEF"[v & 15]); }

static void i2c_init(I2C_TypeDef *i2c) {
    i2c->CR2 = 8; i2c->CCR = 40; i2c->TRISE = 9; i2c->CR1 = I2C_CR1_PE;       /* 100 kHz at 8 MHz */
}
static int probe(I2C_TypeDef *i2c, uint8_t addr7) {
    i2c->CR1 |= I2C_CR1_START;
    while (!(i2c->SR1 & I2C_SR1_SB));
    i2c->DR = (uint8_t)(addr7 << 1);                    /* write, address only */
    int ok;
    for (;;) {
        uint32_t s = i2c->SR1;
        if (s & I2C_SR1_ADDR) { (void)i2c->SR2; ok = 1; break; }
        if (s & I2C_SR1_AF) { i2c->SR1 &= ~I2C_SR1_AF; ok = 0; break; }
    }
    i2c->CR1 |= I2C_CR1_STOP;
    while (i2c->CR1 & I2C_CR1_STOP);
    return ok;
}
static void scan(I2C_TypeDef *i2c, const char *name) {
    int found = 0;
    puts_(name); puts_(":\r\n");
    for (unsigned a = 1; a < 127; a++)
        if (probe(i2c, (uint8_t)a)) { puts_("  found device at 0x"); hex2(a); puts_("\r\n"); found++; }
    if (!found) puts_("  no devices\r\n");
}
int main(void) {
    RCC->APB2ENR |= RCC_APB2ENR_IOPAEN | RCC_APB2ENR_IOPBEN | RCC_APB2ENR_AFIOEN | RCC_APB2ENR_USART1EN;
    RCC->APB1ENR |= RCC_APB1ENR_I2C1EN | RCC_APB1ENR_I2C2EN;
    gpio_cfg(GPIOA, 9, GPIO_AF_PP_2MHZ);
    gpio_cfg(GPIOB, 6, GPIO_AF_OD_50MHZ);  gpio_cfg(GPIOB, 7, GPIO_AF_OD_50MHZ);
    gpio_cfg(GPIOB, 10, GPIO_AF_OD_50MHZ); gpio_cfg(GPIOB, 11, GPIO_AF_OD_50MHZ);
    USART1->BRR = 8000000 / 115200; USART1->CR1 = (1u << 13) | (1u << 3);
    i2c_init(I2C1); i2c_init(I2C2);
    puts_("I2C scanner\r\n");
    scan(I2C1, "I2C1 (SCL=PB6, SDA=PB7)");
    scan(I2C2, "I2C2 (SCL=PB10, SDA=PB11)");
    puts_("done.\r\n");
    for (;;);
}
