#include <stdint.h>
#include "stm32f1.h"
volatile uint32_t res[32];
static void i2c_init(uint32_t ccr, uint32_t fast) {
    RCC->APB2ENR |= RCC_APB2ENR_IOPBEN | RCC_APB2ENR_AFIOEN;
    RCC->APB1ENR |= RCC_APB1ENR_I2C1EN;
    gpio_cfg(GPIOB, 6, GPIO_AF_OD_50MHZ); gpio_cfg(GPIOB, 7, GPIO_AF_OD_50MHZ);
    I2C1->CR1 = 0; I2C1->CR2 = 8; I2C1->CCR = ccr | (fast ? I2C_CCR_FS : 0); I2C1->TRISE = 9;
    I2C1->CR1 = I2C_CR1_PE;
}
static int start(void) { I2C1->CR1 |= I2C_CR1_START; while (!(I2C1->SR1 & I2C_SR1_SB)); return 0; }
static int send_addr(uint8_t a) {            /* returns 1 if ACK, 0 if NACK (AF) */
    I2C1->DR = a;
    for (;;) { uint32_t s = I2C1->SR1; if (s & I2C_SR1_ADDR) return 1; if (s & I2C_SR1_AF) return 0; }
}
static void clr_addr(void) { (void)I2C1->SR1; (void)I2C1->SR2; }
static void stop(void) { I2C1->CR1 |= I2C_CR1_STOP; while (I2C1->CR1 & I2C_CR1_STOP); }
static void wbyte(uint8_t b) { while (!(I2C1->SR1 & I2C_SR1_TXE)); I2C1->DR = b; }
static void wait_btf(void) { while (!(I2C1->SR1 & I2C_SR1_BTF)); }
