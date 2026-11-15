#include "drv.h"
int main(void) {
    i2c_init(5, 1);                       /* fast mode DUTY=0: period = 3*CCR = 15 cycles @ 8 MHz -> 533 kHz; real code uses CCR=7 for 400k with 36MHz */
    I2C1->CCR = I2C_CCR_FS | 7;           /* 3*7 = 21 cycles */
    start(); send_addr(0xA0); clr_addr(); wbyte(0x00); wbyte(0x55); wait_btf(); stop();
    I2C1->CCR = I2C_CCR_FS | I2C_CCR_DUTY | 2;   /* 25*2 = 50 cycles */
    start(); send_addr(0xA0); clr_addr(); wbyte(0x01); wait_btf(); stop();
    I2C1->CR1 &= ~I2C_CR1_PE;             /* disable: everything resets */
    res[0] = I2C1->SR1 | I2C1->SR2;
    I2C1->CR1 |= I2C_CR1_PE;
    I2C1->CR1 |= I2C_CR1_SWRST; res[1] = I2C1->CR1; I2C1->CR1 &= ~I2C_CR1_SWRST; res[2] = I2C1->CR1;
    res[31] = 0xD0D0; for (;;);
}
