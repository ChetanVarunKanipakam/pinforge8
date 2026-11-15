#include <stdint.h>
#include "lpc17xx.h"
volatile uint32_t res[32];
int main(void) {
    LPC_GPIO1->FIODIR = (1u << 18) | (1u << 20);
    LPC_GPIO1->FIOSET = 1u << 18;       res[0] = LPC_GPIO1->FIOPIN & ((1u << 18) | (1u << 20));
    LPC_GPIO1->FIOCLR = 1u << 18;       res[1] = LPC_GPIO1->FIOPIN & ((1u << 18) | (1u << 20));
    LPC_GPIO1->FIOSET = 1u << 18;
    LPC_GPIO1->FIOPIN = 1u << 20;       res[2] = LPC_GPIO1->FIOPIN & ((1u << 18) | (1u << 20));   /* writing FIOPIN replaces ALL bits: P1.18 goes low */
    LPC_GPIO1->FIOMASK = 1u << 20;
    LPC_GPIO1->FIOCLR = 1u << 20;       res[3] = (LPC_GPIO1->FIOPIN >> 20) & 1;   /* masked: reads 0 and CLR ignored */
    LPC_GPIO1->FIOMASK = 0;             res[4] = (LPC_GPIO1->FIOPIN >> 20) & 1;   /* still high */
    res[5] = (LPC_GPIO2->FIOPIN >> 5) & 1;                                        /* input: default pull-up -> 1 unless driven */
    res[6] = (LPC_GPIO2->FIOPIN >> 6) & 1;                                        /* driven low externally */
    LPC_PINCON->PINMODE0 = 3u << 2;     /* P0.1 pull-down */
    res[7] = (LPC_GPIO0->FIOPIN >> 1) & 1;
    LPC_PINCON->PINMODE0 = 2u << 2;     /* P0.1 no pull: floating reads 0 */
    res[8] = (LPC_GPIO0->FIOPIN >> 1) & 1;
    LPC_GPIO3->FIODIR = 1u << 25; LPC_GPIO3->FIOSET = 1u << 25; res[9] = (LPC_GPIO3->FIOPIN >> 25) & 1;
    LPC_GPIO0->FIODIR = 0xFF;           /* byte-wise: FIO0DIR byte access */
    *(volatile uint8_t *)0x2009C001 = 0x0F;   /* FIO0DIR1 */
    res[10] = LPC_GPIO0->FIODIR;
    res[31] = 0xD0D0;
    for (;;);
}
