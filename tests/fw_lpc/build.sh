#!/bin/sh
# usage: build.sh name   (run from tests/fw_lpc)  -> out/name.bin, out/name.elf   (LPC1768 toolchain)
TC=../../toolchain; mkdir -p out
arm-none-eabi-gcc -mcpu=cortex-m3 -mthumb -Os -Wall -Wextra -nostdlib -ffreestanding -ffunction-sections -fdata-sections -I$TC -T $TC/link_lpc.ld -Wl,--gc-sections $TC/startup_lpc.c $1.c -o out/$1.elf -lgcc 2>&1 | grep -v "^$"
arm-none-eabi-objcopy -O binary out/$1.elf out/$1.bin
