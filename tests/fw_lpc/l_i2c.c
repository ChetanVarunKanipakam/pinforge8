#include <stdint.h>
#include "lpc17xx.h"
volatile uint32_t res[32];
#define SLA 0xA0
static uint32_t wait_si(LPC_I2C_TypeDef *i) { while (!(i->I2CONSET & I2C_SI)); return i->I2STAT; }
static uint32_t st[32]; static int ns;
static void rec(uint32_t s) { if (ns < 32) st[ns++] = s; }
int main(void) {
    pll_100mhz();
    PINSEL_FN(0, 27, 1); PINSEL_FN(0, 28, 1);              /* SDA0 / SCL0 */
    LPC_I2C0->I2SCLH = 125; LPC_I2C0->I2SCLL = 125;        /* 25 MHz / 250 = 100 kHz */
    LPC_I2C0->I2CONCLR = 0x6C; LPC_I2C0->I2CONSET = I2C_I2EN;
    res[0] = LPC_I2C0->I2STAT;                             /* 0xF8 idle */
    /* write: ptr 0x10, data 11 22 */
    LPC_I2C0->I2CONSET = I2C_STA;  rec(wait_si(LPC_I2C0));
    LPC_I2C0->I2DAT = SLA; LPC_I2C0->I2CONCLR = I2C_STA | I2C_SI;  rec(wait_si(LPC_I2C0));
    LPC_I2C0->I2DAT = 0x10; LPC_I2C0->I2CONCLR = I2C_SI;           rec(wait_si(LPC_I2C0));
    LPC_I2C0->I2DAT = 0x11; LPC_I2C0->I2CONCLR = I2C_SI;           rec(wait_si(LPC_I2C0));
    LPC_I2C0->I2DAT = 0x22; LPC_I2C0->I2CONCLR = I2C_SI;           rec(wait_si(LPC_I2C0));
    LPC_I2C0->I2CONSET = I2C_STO; LPC_I2C0->I2CONCLR = I2C_SI;
    while (LPC_I2C0->I2CONSET & I2C_STO);
    res[1] = LPC_I2C0->I2STAT;
    /* read back 3 bytes from 0x10: write ptr, repeated start, read */
    LPC_I2C0->I2CONSET = I2C_STA;  wait_si(LPC_I2C0);
    LPC_I2C0->I2DAT = SLA; LPC_I2C0->I2CONCLR = I2C_STA | I2C_SI;  wait_si(LPC_I2C0);
    LPC_I2C0->I2DAT = 0x10; LPC_I2C0->I2CONCLR = I2C_SI;           wait_si(LPC_I2C0);
    LPC_I2C0->I2CONSET = I2C_STA; LPC_I2C0->I2CONCLR = I2C_SI;     res[2] = wait_si(LPC_I2C0);   /* 0x10 repeated start */
    LPC_I2C0->I2DAT = SLA | 1; LPC_I2C0->I2CONCLR = I2C_STA | I2C_SI; res[3] = wait_si(LPC_I2C0); /* 0x40 */
    LPC_I2C0->I2CONSET = I2C_AA; LPC_I2C0->I2CONCLR = I2C_SI;      res[4] = wait_si(LPC_I2C0);   /* 0x50 */
    res[5] = LPC_I2C0->I2DAT;
    LPC_I2C0->I2CONCLR = I2C_SI;                                   wait_si(LPC_I2C0);
    res[6] = LPC_I2C0->I2DAT;
    LPC_I2C0->I2CONCLR = I2C_AA | I2C_SI;                          res[7] = wait_si(LPC_I2C0);   /* 0x58: last byte NACKed */
    res[8] = LPC_I2C0->I2DAT;
    LPC_I2C0->I2CONSET = I2C_STO; LPC_I2C0->I2CONCLR = I2C_SI;
    while (LPC_I2C0->I2CONSET & I2C_STO);
    /* NACK: nobody at 0xA4 */
    LPC_I2C0->I2CONSET = I2C_STA;  wait_si(LPC_I2C0);
    LPC_I2C0->I2DAT = 0xA4; LPC_I2C0->I2CONCLR = I2C_STA | I2C_SI; res[9] = wait_si(LPC_I2C0);   /* 0x20 */
    LPC_I2C0->I2CONSET = I2C_STO; LPC_I2C0->I2CONCLR = I2C_SI;
    while (LPC_I2C0->I2CONSET & I2C_STO);
    res[10] = LPC_I2C0->I2STAT;
    for (int k = 0; k < 5; k++) res[16 + k] = st[k];
    res[31] = 0xD0D0;
    for (;;);
}
