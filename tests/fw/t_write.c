#include "drv.h"
int main(void) {
    i2c_init(40, 0);                              /* 8 MHz / (2*40) = 100 kHz */
    start(); res[0] = I2C1->SR2;                  /* after START: MSL|BUSY expected */
    res[1] = send_addr(0xA0);                     /* 0x50 write */
    res[2] = I2C1->SR1; clr_addr();               /* ADDR and TXE set */
    res[3] = I2C1->SR2;                           /* MSL|BUSY|TRA */
    wbyte(0x10); wbyte(0xDE); wbyte(0xAD); wbyte(0xBE); wbyte(0xEF);
    wait_btf(); stop();
    res[4] = I2C1->SR2;                           /* idle */
    /* probe an absent address */
    start(); res[5] = send_addr(0xA2);            /* 0x51 -> NACK */
    res[6] = (I2C1->SR1 & I2C_SR1_AF) != 0; I2C1->SR1 &= ~I2C_SR1_AF; stop();
    res[7] = I2C1->SR1 & I2C_SR1_AF;              /* cleared */
    res[31] = 0xD0D0;
    for (;;);
}
