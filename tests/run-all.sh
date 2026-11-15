#!/bin/sh
# Builds the test firmware and runs every suite. From the repo root:  sh tests/run-all.sh
cd "$(dirname "$0")" || exit 1
(cd fw && for t in t_write t_read t_irq t_fast t_remap; do ./build.sh $t >/dev/null || exit 1; done) || { echo "firmware build failed"; exit 1; }
(cd fw_lpc && for t in l_clk l_gpio l_tmr l_uart l_pwm l_adc l_i2c l_irq; do ./build.sh $t >/dev/null || exit 1; done) || { echo "LPC1768 firmware build failed"; exit 1; }
arm-none-eabi-gcc -mcpu=cortex-m3 -mthumb -fsyntax-only -I../toolchain fw/lpc_offsets.c || { echo "LPC1768 header offsets are wrong"; exit 1; }
rc=0
for t in t_core1 t_core2 t_ssd e2e_i2c e2e_more t_lpc e2e_lpc e2e_site; do
  echo "== $t"; out=$(node $t.js 2>&1); r=$?; echo "$out" | grep -E "^(PASS|FAIL)|Error" | sed 's/^/   /' | awk '{c[$1]++} END{printf "   %d passed, %d failed\n", c["PASS"], c["FAIL"]}'
  echo "$out" | grep "FAIL" ; [ $r -ne 0 ] && rc=1
done
[ $rc -eq 0 ] && echo "ALL TESTS PASSED" || echo "SOME TESTS FAILED"; exit $rc
