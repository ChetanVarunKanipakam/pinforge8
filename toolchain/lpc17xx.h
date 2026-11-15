/* PinForge: register header for the NXP LPC1768 (Cortex-M3, up to 100 MHz). CMSIS-style names (LPC_GPIO0, LPC_UART0, ...). */
#ifndef LPC17XX_H
#define LPC17XX_H
#include <stdint.h>
#define __IO volatile
#define __O  volatile

typedef struct { __IO uint32_t FIODIR; uint32_t R0[3]; __IO uint32_t FIOMASK; __IO uint32_t FIOPIN; __IO uint32_t FIOSET; __O uint32_t FIOCLR; } LPC_GPIO_TypeDef;
typedef struct { __IO uint32_t PINSEL0, PINSEL1, PINSEL2, PINSEL3, PINSEL4, PINSEL5, PINSEL6, PINSEL7, PINSEL8, PINSEL9, PINSEL10; uint32_t R0[5];
  __IO uint32_t PINMODE0, PINMODE1, PINMODE2, PINMODE3, PINMODE4, PINMODE5, PINMODE6, PINMODE7, PINMODE8, PINMODE9;
  __IO uint32_t PINMODE_OD0, PINMODE_OD1, PINMODE_OD2, PINMODE_OD3, PINMODE_OD4; } LPC_PINCON_TypeDef;
typedef struct { __IO uint32_t FLASHCFG; uint32_t R0[31]; __IO uint32_t PLL0CON, PLL0CFG; __IO uint32_t PLL0STAT; __O uint32_t PLL0FEED; uint32_t R1[4];
  __IO uint32_t PLL1CON, PLL1CFG; __IO uint32_t PLL1STAT; __O uint32_t PLL1FEED; uint32_t R2[4];
  __IO uint32_t PCON, PCONP; uint32_t R3[15]; __IO uint32_t CCLKCFG, USBCLKCFG, CLKSRCSEL; uint32_t R4[12];
  __IO uint32_t EXTINT; uint32_t R5; __IO uint32_t EXTMODE, EXTPOLAR; uint32_t R6[12]; __IO uint32_t RSID; uint32_t R7[7];
  __IO uint32_t SCS; uint32_t R8; __IO uint32_t PCLKSEL0, PCLKSEL1; uint32_t R9[6]; __IO uint32_t CLKOUTCFG; } LPC_SC_TypeDef;
typedef struct { __IO uint32_t IR, TCR, TC, PR, PC, MCR, MR0, MR1, MR2, MR3, CCR; uint32_t CR0, CR1; uint32_t R0[2]; __IO uint32_t EMR; uint32_t R1[12]; __IO uint32_t CTCR; } LPC_TIM_TypeDef;
typedef struct { __IO uint32_t IR, TCR, TC, PR, PC, MCR, MR0, MR1, MR2, MR3, CCR; uint32_t CR0, CR1, CR2, CR3; uint32_t R0; __IO uint32_t MR4, MR5, MR6, PCR, LER; uint32_t R1[7]; __IO uint32_t CTCR; } LPC_PWM_TypeDef;
/* UART: RBR/THR/DLL share offset 0, DLM/IER share 4, IIR/FCR share 8 */
typedef struct { union { __IO uint8_t RBR; __IO uint8_t THR; __IO uint8_t DLL; uint32_t W0; }; union { __IO uint32_t DLM; __IO uint32_t IER; }; union { __IO uint32_t IIR; __IO uint32_t FCR; };
  __IO uint32_t LCR; uint32_t R0; __IO uint32_t LSR; uint32_t R1; __IO uint32_t SCR; __IO uint32_t ACR; uint32_t R2; __IO uint32_t FDR; } LPC_UART_TypeDef;
typedef struct { __IO uint32_t I2CONSET; __IO uint32_t I2STAT; __IO uint32_t I2DAT; __IO uint32_t I2ADR0; __IO uint32_t I2SCLH; __IO uint32_t I2SCLL; __O uint32_t I2CONCLR; } LPC_I2C_TypeDef;
typedef struct { __IO uint32_t ADCR; __IO uint32_t ADGDR; uint32_t R0; __IO uint32_t ADINTEN; __IO uint32_t ADDR0, ADDR1, ADDR2, ADDR3, ADDR4, ADDR5, ADDR6, ADDR7; __IO uint32_t ADSTAT; __IO uint32_t ADTRIM; } LPC_ADC_TypeDef;
typedef struct { __IO uint32_t IntStatus, IO0IntStatR, IO0IntStatF, IO0IntClr, IO0IntEnR, IO0IntEnF; uint32_t R0[3]; __IO uint32_t IO2IntStatR, IO2IntStatF, IO2IntClr, IO2IntEnR, IO2IntEnF; } LPC_GPIOINT_TypeDef;

#define LPC_GPIO0   ((LPC_GPIO_TypeDef *)0x2009C000UL)
#define LPC_GPIO1   ((LPC_GPIO_TypeDef *)0x2009C020UL)
#define LPC_GPIO2   ((LPC_GPIO_TypeDef *)0x2009C040UL)
#define LPC_GPIO3   ((LPC_GPIO_TypeDef *)0x2009C060UL)
#define LPC_GPIO4   ((LPC_GPIO_TypeDef *)0x2009C080UL)
#define LPC_GPIOINT ((LPC_GPIOINT_TypeDef *)0x40028080UL)
#define LPC_PINCON  ((LPC_PINCON_TypeDef *)0x4002C000UL)
#define LPC_SC      ((LPC_SC_TypeDef *)0x400FC000UL)
#define LPC_TIM0    ((LPC_TIM_TypeDef *)0x40004000UL)
#define LPC_TIM1    ((LPC_TIM_TypeDef *)0x40008000UL)
#define LPC_TIM2    ((LPC_TIM_TypeDef *)0x40090000UL)
#define LPC_TIM3    ((LPC_TIM_TypeDef *)0x40094000UL)
#define LPC_PWM1    ((LPC_PWM_TypeDef *)0x40018000UL)
#define LPC_UART0   ((LPC_UART_TypeDef *)0x4000C000UL)
#define LPC_UART1   ((LPC_UART_TypeDef *)0x40010000UL)
#define LPC_UART2   ((LPC_UART_TypeDef *)0x40098000UL)
#define LPC_UART3   ((LPC_UART_TypeDef *)0x4009C000UL)
#define LPC_I2C0    ((LPC_I2C_TypeDef *)0x4001C000UL)
#define LPC_I2C1    ((LPC_I2C_TypeDef *)0x4005C000UL)
#define LPC_I2C2    ((LPC_I2C_TypeDef *)0x400A0000UL)
#define LPC_ADC     ((LPC_ADC_TypeDef *)0x40034000UL)

/* PCONP bits */
#define PCONP_TIM0 (1u<<1)
#define PCONP_TIM1 (1u<<2)
#define PCONP_UART0 (1u<<3)
#define PCONP_UART1 (1u<<4)
#define PCONP_PWM1 (1u<<6)
#define PCONP_I2C0 (1u<<7)
#define PCONP_ADC (1u<<12)
#define PCONP_GPIO (1u<<15)
#define PCONP_I2C1 (1u<<19)
#define PCONP_TIM2 (1u<<22)
#define PCONP_TIM3 (1u<<23)
#define PCONP_UART2 (1u<<24)
#define PCONP_UART3 (1u<<25)
#define PCONP_I2C2 (1u<<26)
/* I2C control bits */
#define I2C_AA (1u<<2)
#define I2C_SI (1u<<3)
#define I2C_STO (1u<<4)
#define I2C_STA (1u<<5)
#define I2C_I2EN (1u<<6)
/* IRQ numbers */
typedef enum { WDT_IRQn = 0, TIMER0_IRQn, TIMER1_IRQn, TIMER2_IRQn, TIMER3_IRQn, UART0_IRQn, UART1_IRQn, UART2_IRQn, UART3_IRQn, PWM1_IRQn,
  I2C0_IRQn, I2C1_IRQn, I2C2_IRQn, SPI_IRQn, SSP0_IRQn, SSP1_IRQn, PLL0_IRQn, RTC_IRQn, EINT0_IRQn, EINT1_IRQn, EINT2_IRQn, EINT3_IRQn,
  ADC_IRQn, BOD_IRQn, USB_IRQn, CAN_IRQn, DMA_IRQn, I2S_IRQn, ENET_IRQn, RIT_IRQn, MCPWM_IRQn, QEI_IRQn, PLL1_IRQn } IRQn_Type;

typedef struct { __IO uint32_t CTRL, LOAD, VAL; } SysTick_TypeDef;
#define SysTick ((SysTick_TypeDef *)0xE000E010UL)
#define NVIC_ISER ((volatile uint32_t *)0xE000E100UL)
#define NVIC_ICER ((volatile uint32_t *)0xE000E180UL)
#define NVIC_ISPR ((volatile uint32_t *)0xE000E200UL)
#define NVIC_ICPR ((volatile uint32_t *)0xE000E280UL)
#define NVIC_IPR  ((volatile uint8_t  *)0xE000E400UL)
static inline void NVIC_EnableIRQ(IRQn_Type n)  { NVIC_ISER[(unsigned)n >> 5] = 1u << ((unsigned)n & 31); }
static inline void NVIC_DisableIRQ(IRQn_Type n) { NVIC_ICER[(unsigned)n >> 5] = 1u << ((unsigned)n & 31); }
static inline void NVIC_SetPendingIRQ(IRQn_Type n)   { NVIC_ISPR[(unsigned)n >> 5] = 1u << ((unsigned)n & 31); }
static inline void NVIC_ClearPendingIRQ(IRQn_Type n) { NVIC_ICPR[(unsigned)n >> 5] = 1u << ((unsigned)n & 31); }
static inline void NVIC_SetPriority(IRQn_Type n, uint32_t p) { NVIC_IPR[(unsigned)n] = (uint8_t)(p << 3); }   /* 5 priority bits */
static inline void __disable_irq(void) { __asm volatile ("cpsid i" ::: "memory"); }
static inline void __enable_irq(void)  { __asm volatile ("cpsie i" ::: "memory"); }
static inline void __WFI(void) { __asm volatile ("wfi"); }
#define SystemCoreClock_DEFAULT 4000000UL   /* internal RC at reset */

/* Helpers: select a pin function (0..3) and run the clock up to 100 MHz from the 12 MHz crystal. */
static inline void pin_func(LPC_PINCON_TypeDef *pc, unsigned port, unsigned bit, unsigned fn) {
    volatile uint32_t *r = &pc->PINSEL0 + (port * 2 + (bit >> 4)); unsigned sh = (bit & 15) * 2;
    *r = (*r & ~(3u << sh)) | ((uint32_t)fn << sh);
}
#define PINSEL_FN(port, bit, fn) pin_func(LPC_PINCON, (port), (bit), (fn))
static inline void pll_100mhz(void) {                       /* same sequence as CMSIS SystemInit(): 12 MHz x 50 / 3 x 2 = 400 MHz CCO, /4 = 100 MHz */
    LPC_SC->SCS = 0x20; while (!(LPC_SC->SCS & 0x40));      /* main oscillator on, wait for it */
    LPC_SC->CLKSRCSEL = 1;
    LPC_SC->PLL0CFG = (49u) | (2u << 16);                   /* M = 50, N = 3 */
    LPC_SC->PLL0FEED = 0xAA; LPC_SC->PLL0FEED = 0x55;
    LPC_SC->PLL0CON = 1; LPC_SC->PLL0FEED = 0xAA; LPC_SC->PLL0FEED = 0x55;
    LPC_SC->CCLKCFG = 3;
    while (!(LPC_SC->PLL0STAT & (1u << 26)));               /* PLOCK0 */
    LPC_SC->PLL0CON = 3; LPC_SC->PLL0FEED = 0xAA; LPC_SC->PLL0FEED = 0x55;   /* connect */
}
#endif
