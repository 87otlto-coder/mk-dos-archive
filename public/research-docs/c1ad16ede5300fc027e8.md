# MK DOS Archive — O153–O164 original timing source research

**Date:** October 12, 2026. **Current authority:** O164. **Research type:** Original commercial MK2 executable and original separate real-mode driver, examined locally, **never included in source-only release**. These findings are reproducible static binary evidence, **not** observed DOSBox playback or timing measurement.

Original fixture identities:

- `MK2.EXE`: 861,133 bytes; SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.
- `RM.DRV`: 2,522 bytes (0x09DA); SHA-256 `87d2d37bbd69a69d47e4bfc11a4a6495a8ac348cb7824ec1c9c59de3ed186546`.
- Physical offsets in all checkpoints mean **file offsets**, not DOSBox debugger linear addresses. Original 16-bit RM.DRV and original 32-bit MK2.EXE have separate coordinate spaces.

## Significant result

The original executable requests a **0x09DA-byte** real-mode allocation, loads `RM.DRV` into that same block, installs its entry offset zero as real-mode interrupt vector `0x08`, and supplies the block pointer at Object-2 `0x3177C` to the game scheduler. The driver has a relative JMP at file offset `0x0000` to handler `0x07EE`. The handler conditionally increments the dword at driver/block **+0x24**, which the original protected-mode scheduler consumes and subsequently clears. A separate driver/block dword at **+0x28** has an independent game-side reader.

This joins the missing **source-level timer producer to its consumer**. It does **not** prove that DOSBox ran the expected vector at a known wall-clock rate, or establish per-animation FPS. Several gates and counters intervene.

## Each new pass

| Pass | Bounded original-source finding | Not yet proved |
| --- | --- | --- |
| O153 | At `0x62205` the application enters main loop `0x66DF5`, with frame-controller call `0x67050` and an iteration global increment | One game iteration = one displayed frame |
| O154 | Scheduler reads `*(0x3177C)+0x24` at `0x670DD/0x670E3`, waits for nonzero, stores sample, clears at `0x67101`, then decrements independent task countdowns at `0x67158` | Input magnitude as elapsed display frames |
| O155 | At `0x62090` code requests `0x09DA` and calls DPMI allocator; shared block pointer stored at `0x3177C` and exposed through original loader buffer field `0x30034` | Original allocation address during runtime |
| O156 | Original shutdown path resets PIT mode/divisor; main loop counts and timer frequency remain distinct | Measured clock/video frequency |
| O157 | DPMI vector getter/setter saves and installs 08h, 09h, 23h, 1Bh, 24h; 08h installs block segment derived via `shr 4`, offset 0 | Installed vector executing under emulation |
| O158 | Static control/data join between IRQ8 vector, PIT divisor `0x4D9D`, and scheduler input block | Counter producer prior to checking `RM.DRV` (superseded by O161) |
| O159 | Original `RM.DRV` resource is named in Object-2 file descriptor `0x30024`, with size 0x9DA, and passed to original open/read/close path | Actual emulator file-loading capture |
| O160 | `RM.DRV` IRQ8 handler `0x07EE` conditionally increments low/high 16-bit words at `0x24/0x26` and separately `0x28/0x2A` | Unconditional tick updates; actual interrupt rate |
| O161 | Verified two-file source join from installed IRQ8 handler to original driver's counter write and game scheduler's corresponding `+0x24` read/clear | Game FPS and seconds per animation frame |
| O162 | Driver's `+0x28` counter has a different protected-game consumer at `0x7A2C6/0x7A2CC` | Its exact stage/camera semantics |
| O163 | Driver decrement at `0x939` and reset-to-two at `0x93F` conditionally chains saved IRQ8 via far pointer `[CS:0x0C]`; alternate branch outputs `0x60` to PIC port `0x20` then IRET | BIOS chaining wall-clock rate |
| O164 | Driver can toggle gate `+0x3C` when prerequisite byte `+0x88` and `+0x69` take qualifying branches and 16-bit phase counter `+0xE4` overflows; original game loop at `0x66EE3–0x66EED` tests/spins on shared `+0x3C` | Live values of prerequisites, scheduling rate, or exact frame timing |

### Original RM.DRV timer code chain

- Driver entry `0x0000`: `E9 EB 07` = near jump to `0x07EE` (IRQ8).
- Handler `0x08A8`: `F6 06 3C 00 FF` = test byte `[0x3C]`.
- Handler `0x08AD`: `75 51` = jump to `0x0900` **on nonzero**, thereby skipping tick increments.
- `0x08AF/0x08B5`: increment low word +0x24, increment high word +0x26 only when low word wraps.
- `0x08B9/0x08BF`: increment separate low +0x28 and high +0x2A, also carry on overflow.
- `0x08C3..` provides additional conditional processing after counter updates.
- `0x0939..0x0961` conditionally chains saved interrupt or issues PIC-specific EOI and IRET.

### O164 gating refinement

- `0x081C` tests status `+0x88`, and zero/sign branches lead directly to `0x08A8`; this is part of an eligibility path, not a universal prerequisite for every possible counter tick.
- `0x0837` tests status `+0x69`; inactive branches reset phase counter word `+0xE4` to `0xFFFF` (`0x085A`), while the eligible path increments word `+0xE4` (`0x0840`).
- On that increment's overflow, `0x0846` XORs byte `+0x3C` by `0xFF`.
- The game main loop reads the same block's `+0x3C` and spins on a nonzero branch (`0x66EE3..0x66EED`).
- The driver timer increment checks the same byte at `0x08A8`; on nonzero it skips counter updates.
- None of these source-level branches establish live input prerequisites or regular wall-clock spacing. **Do not model per-animation FPS from a naive PIT divisor or VGA retrace assumption**.

## Independent verification performed

| Scope | Independent source assertions | Tests |
| --- | ---: | ---: |
| O153–O156 | 94 | 12 |
| O157–O158 | 105 | 12 |
| O159–O163 | 280 | 17 |
| O164 | 40 | 11 |
| **New O153–O164** | **519** | **52** |
| Inherited O139–O144 (rerun) | 510 | 39 |
| Inherited O145–O152 (rerun) | 468 | 27 |

All new reports were created from **canonical original files**; the independent checkers do not call the producer routines. Original-hash guards, branch-target checks, adversarial forged-report detection, mutated-binary rejection, and explicit no-fake-FPS claims passed. All **118 O139–O164 regression test methods** passed. Source-level report validation is **not** a substitute for DOSBox instrumentation; the complete React/Vite build is also not asserted.

## Reproduction

The original files should be supplied independently by their legitimate owner. Run from repository root:

```bash
EXE=/path/to/original/MK2.EXE
DRV=/path/to/original/RM.DRV
T=tools/mk2_animation_continuation

python "$T/trace_o153_o156_frame_counter_origin.py" --exe "$EXE" --outdir /new/O153_O156
python "$T/trace_o157_o158_irq_vector_join.py" --exe "$EXE" --outdir /new/O157_O158
python "$T/trace_o159_o163_rm_driver_timer.py" --exe "$EXE" --driver "$DRV" --outdir /new/O159_O163
python "$T/trace_o164_timer_gate_handshake.py" --exe "$EXE" --driver "$DRV" --out /new/O164_REPORT.json

python "$T/verify_o153_o156_independent.py" --exe "$EXE" --report-dir research_outputs
python "$T/verify_o157_o158_independent.py" --exe "$EXE" --report-dir research_outputs
python "$T/verify_o159_o163_independent.py" --exe "$EXE" --driver "$DRV" --report-dir research_outputs
python "$T/verify_o164_independent.py" --exe "$EXE" --driver "$DRV" --report research_outputs/O164_REPORT.json

python "$T/test_o153_o156.py" --exe "$EXE"
python "$T/test_o157_o158.py" --exe "$EXE"
python "$T/test_o159_o163.py" --exe "$EXE" --driver "$DRV"
python "$T/test_o164.py" --exe "$EXE" --driver "$DRV"
```

## Where source-only research should continue

Trace writer(s) of driver input flags `+0x88`, `+0x69`, `+0x3C`, inspect the game main-loop activation modes, and identify the stage effect/task object association in those modes. Do not collapse object source coordinate words into guaranteed screen positions. Then test a **specific, instrumented DOSBox hypothesis**, locating loaded driver `CS` and `+0x24/+0x3C/+0xE4` values; recording real IRQ8 entry frequency, scheduler clearing, visible frame transitions, and first-effect stage triggers, while keeping on-disk offsets separate from runtime addresses. No emulator recording has been supplied for this checkpoint.

**Preservation:** The 115 native full-width Tomb/Portal layer PNGs, 43 original stage effect frame PNGs (158 images total), and original 86 mask/index planes are unchanged by these source-only passes. Original commercial game files remain outside the development/source bundles.
