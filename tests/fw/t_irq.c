#include "drv.h"
static volatile const uint8_t *txp; static volatile int txn, state, nev, ner, done, err; static volatile uint8_t addr;
void I2C1_EV_IRQHandler(void) {
    uint32_t s = I2C1->SR1; nev++;
    if (s & I2C_SR1_SB) { I2C1->DR = addr; return; }
    if (s & I2C_SR1_ADDR) { (void)I2C1->SR1; (void)I2C1->SR2; return; }
    if ((s & I2C_SR1_TXE) && !(s & I2C_SR1_BTF)) { if (txn > 0) { I2C1->DR = *txp++; txn--; if (!txn) I2C1->CR2 &= ~I2C_CR2_ITBUFEN; } return; }
    if (s & I2C_SR1_BTF) { I2C1->CR1 |= I2C_CR1_STOP; I2C1->CR2 &= ~(I2C_CR2_ITEVTEN | I2C_CR2_ITBUFEN); done = 1; }
}
void I2C1_ER_IRQHandler(void) {
    ner++; if (I2C1->SR1 & I2C_SR1_AF) { I2C1->SR1 &= ~I2C_SR1_AF; err = 1; }
    I2C1->CR1 |= I2C_CR1_STOP; I2C1->CR2 &= ~(I2C_CR2_ITEVTEN | I2C_CR2_ITBUFEN); done = 1;
}
static void xfer(uint8_t a, const uint8_t *p, int n) {
    addr = a; txp = p; txn = n; done = 0; err = 0;
    I2C1->CR2 |= I2C_CR2_ITEVTEN | I2C_CR2_ITBUFEN | I2C_CR2_ITERREN; I2C1->CR1 |= I2C_CR1_START;
    while (!done) __WFI();
    while (I2C1->CR1 & I2C_CR1_STOP);
}
int main(void) {
    static const uint8_t d[] = {0x60, 0x11, 0x22, 0x33};
    i2c_init(180 / 2, 0);
    NVIC_EnableIRQ(I2C1_EV_IRQn); NVIC_EnableIRQ(I2C1_ER_IRQn);
    xfer(0xA0, d, 4);  res[0] = err; res[1] = nev;
    xfer(0xA2, d, 4);  res[2] = err; res[3] = ner;
    res[4] = I2C1->SR2;
    res[31] = 0xD0D0; for (;;);
}
