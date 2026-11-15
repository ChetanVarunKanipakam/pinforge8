#include "drv.h"
static void putc_(char c) { while (!(USART1->SR & 0x80)); USART1->DR = (uint32_t)c; }
static void puts_(const char *s) { while (*s) putc_(*s++); }
static int probe(uint8_t a7) {
    I2C1->CR1 |= I2C_CR1_START; while (!(I2C1->SR1 & I2C_SR1_SB));
    I2C1->DR = (uint8_t)(a7 << 1); int ok;
    for (;;) { uint32_t s = I2C1->SR1; if (s & I2C_SR1_ADDR) { (void)I2C1->SR2; ok = 1; break; } if (s & I2C_SR1_AF) { I2C1->SR1 &= ~I2C_SR1_AF; ok = 0; break; } }
    I2C1->CR1 |= I2C_CR1_STOP; while (I2C1->CR1 & I2C_CR1_STOP); return ok;
}
int main(void) {
    RCC->APB2ENR |= RCC_APB2ENR_IOPAEN | RCC_APB2ENR_IOPBEN | RCC_APB2ENR_AFIOEN | RCC_APB2ENR_USART1EN;
    RCC->APB1ENR |= RCC_APB1ENR_I2C1EN;
    gpio_cfg(GPIOA, 9, GPIO_AF_PP_2MHZ); USART1->BRR = 8000000 / 115200; USART1->CR1 = (1u << 13) | (1u << 3);
    I2C1->CR2 = 8; I2C1->CCR = 40; I2C1->TRISE = 9; I2C1->CR1 = I2C_CR1_PE;
    puts_(probe(0x3C) ? "A:ack " : "A:nack ");                 /* pins still plain GPIO inputs */
    gpio_cfg(GPIOB, 8, GPIO_AF_OD_50MHZ); gpio_cfg(GPIOB, 9, GPIO_AF_OD_50MHZ);
    puts_(probe(0x3C) ? "B:ack " : "B:nack ");                 /* AF configured but remap not enabled: bus is PB6/PB7 */
    AFIO->MAPR |= AFIO_MAPR_I2C1_REMAP;
    puts_(probe(0x3C) ? "C:ack " : "C:nack ");                 /* remapped to PB8/PB9 */
    gpio_cfg(GPIOB, 9, GPIO_IN_FLOATING);
    puts_(probe(0x3C) ? "D:ack\n" : "D:nack\n");               /* SDA released from the peripheral */
    for (;;);
}
