#include "drv.h"
static void set_ptr(uint8_t p) { start(); send_addr(0xA0); clr_addr(); wbyte(p); wait_btf(); }
static void rx1(uint8_t *d) {                    /* N=1 */
    start(); send_addr(0xA1);
    I2C1->CR1 &= ~I2C_CR1_ACK; clr_addr(); I2C1->CR1 |= I2C_CR1_STOP;
    while (!(I2C1->SR1 & I2C_SR1_RXNE)); d[0] = (uint8_t)I2C1->DR;
    while (I2C1->CR1 & I2C_CR1_STOP);
}
static void rx2(uint8_t *d) {                    /* N=2 (POS method) */
    I2C1->CR1 |= I2C_CR1_ACK | I2C_CR1_POS; start(); send_addr(0xA1);
    clr_addr(); I2C1->CR1 &= ~I2C_CR1_ACK;
    wait_btf(); I2C1->CR1 |= I2C_CR1_STOP; d[0] = (uint8_t)I2C1->DR; d[1] = (uint8_t)I2C1->DR;
    while (I2C1->CR1 & I2C_CR1_STOP); I2C1->CR1 &= ~I2C_CR1_POS;
}
static void rxn(uint8_t *d, int n) {             /* N>2 */
    I2C1->CR1 |= I2C_CR1_ACK; start(); send_addr(0xA1); clr_addr();
    while (n > 3) { wait_btf(); *d++ = (uint8_t)I2C1->DR; n--; }
    wait_btf(); I2C1->CR1 &= ~I2C_CR1_ACK; *d++ = (uint8_t)I2C1->DR; I2C1->CR1 |= I2C_CR1_STOP;
    *d++ = (uint8_t)I2C1->DR; while (!(I2C1->SR1 & I2C_SR1_RXNE)); *d++ = (uint8_t)I2C1->DR;
    while (I2C1->CR1 & I2C_CR1_STOP);
}
int main(void) {
    uint8_t b[8];
    i2c_init(40, 0);
    set_ptr(0x20); rx1(b); res[0] = b[0];                      /* mem[0x20] */
    set_ptr(0x30); I2C1->CR1 |= I2C_CR1_START; while (!(I2C1->SR1 & I2C_SR1_SB));   /* repeated START */
    I2C1->CR1 &= ~0; { uint8_t t[2]; I2C1->DR = 0xA1; while (!(I2C1->SR1 & (I2C_SR1_ADDR))); (void)I2C1->SR1; (void)I2C1->SR2;
      I2C1->CR1 &= ~I2C_CR1_ACK; I2C1->CR1 |= I2C_CR1_STOP; while (!(I2C1->SR1 & I2C_SR1_RXNE)); t[0] = (uint8_t)I2C1->DR; while (I2C1->CR1 & I2C_CR1_STOP); res[1] = t[0]; }
    set_ptr(0x40); stop(); rx2(b); res[2] = b[0] | (b[1] << 8);
    set_ptr(0x50); stop(); rxn(b, 5); for (int i = 0; i < 5; i++) res[3 + i] = b[i];
    res[31] = 0xD0D0; for (;;);
}
