# MK DOS Archive — O166–O170 input routing, IRQ cadence, scheduler consumption and original effect stream control

**Date:** October 13, 2026. **Latest checkpoint:** O170. **Scope:** source-only static research with original `MK2.EXE` and original separate `RM.DRV`. No emulator capture, actual fighting-stage timing measurement, screenshot placement verification, compiler rewrite or modification of commercial files.

## Original independent inputs

- Original `MK2.EXE`: 861,133 bytes, SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.
- Original `RM.DRV`: 2,522 bytes, SHA-256 `87d2d37bbd69a69d47e4bfc11a4a6495a8ac348cb7824ec1c9c59de3ed186546`.
- Offsets starting `0x...` in these findings are *physical offsets within the respective original file*; they are **not emulator runtime memory addresses**, real-mode segments or linear DPMI addresses. An EXE static operand such as `0x3177C` is a relocated-address operand, not a DOSBox physical watchpoint.
- Read original files separately. This source-only release includes **none** of the original proprietary MK2 executable, driver or resource data.

## O166 — Exact original input scan-code-to-status relationships

In the driver, the IRQ9 handler uses `IN AL,0x60` at `RM.DRV:0x03C3`. It records `0x40` for pressed and `0x80` for released at `CS:[BX+0x50]` after `BX=raw_scan & 0x7F`. The IRQ8 handler at `RM.DRV:0x080E..0x08A8` tests that same key table and conditionally updates other driver status bytes. These relationships were directly sourced:

| Raw scan code | Conventional set-1 name (external interpretation) | Original slot | Source effect | Required modifier |
| --- | --- | --- | --- | --- |
| `0x01` | Esc | `+0x51` | `RM:0x0817` writes `0xFF` to `+0x3A` | No |
| `0x10` | Q | `+0x60` | `RM:0x0832` writes `0xFF` to `+0x3B` | Positive `+0x88` |
| `0x19` | P | `+0x69` | `RM:0x0840` increments word `+0xE4`, `0x0846` conditionally XORs `+0x3C` | Positive `+0x88` |
| `0x32` | M | `+0x82` | `RM:0x0869` increments `+0xE6`, `0x086F` conditionally XORs `+0xEA` | Positive `+0x88` |
| `0x1F` | S | `+0x6F` | `RM:0x0895` increments `+0xE8`, `0x089B` conditionally XORs `+0xEB` | Positive `+0x88` |

The `+0x88` modifier is index `0x38` (conventional PC set-1 Alt). When this entry is absent or negative, branch sites `0x0821/0x0825` skip all modifier-qualified paths by jumping to `0x08A8`. In the EXE, the `+0x3B` reader at `0x66EEF` determines whether the main loop branches back to `0x66E1E` or enters shutdown at `0x66EF9`; readers of `+0x3A` occur at `0x70A47` and `0x74E6C`. **The source-level Alt+Q *main-loop exit flag* is established.** User-visible shortcut operation remains unobserved; actual keyboard mode and software state matter. Do not label Alt+M or Alt+S functionality beyond source flags and callbacks.

When P/M/S states become inactive within the corresponding eligible branch, their phase words reset to `0xFFFF`. While held, those words increment, and the status byte toggles only on 16-bit overflow. This does not guarantee the same behavior when the modifier is released first or under other input-routing modes.

## O167 — Conditional old IRQ0 chaining and theoretical PIT cadence

The driver initializes `+0xEC` to `0x02`. At IRQ8 tail `RM:0x0939`, it decrements this byte. When the signed result becomes negative, it resets the counter to `0x02` at `0x093F` and chains to the saved old IRQ0 far pointer at `CS:0x000C` (`0x094E`). On the other branch, it issues a specific EOI (`AL=0x60` to PIC port `0x20`) and returns via `IRET`. **Under normal uninterrupted counter state this chains every third handler entry.** Other handler activity and real hardware clock behavior were not measured.

The protected-mode original executable programs PIT channel 0 with mode control `0x36` and divisor `0x4D9D` (19,869), as previously established in O151. As an **illustrative engineering calculation**, applying the common PC PIT input-frequency assumption 1,193,182 Hz gives a nominal channel output of ~60.0524 Hz, and a nominal prior-handler chain rate of ~20.0175 Hz if each third timer event chains. **Neither is an observed DOSBox timing measurement, animation FPS, guaranteed BIOS behavior nor proof that every IRQ completes.**

## O168 — IRQ input samples and task countdowns use different quantities

The original frame/scheduler path at `MK2.EXE:0x670DD..0x67108` reads a 32-bit dword from `*(0x3177C)+0x24`. It waits until nonzero (`0x670E6..0x670E8`), records the entire sampled value to `0x35B0C`, updates a separate smoother `0x35B10` using the sample, and **zeros the dword at `0x67101`**. It then enters the linked task traversal. At `0x67158`, each visited task's **16-bit** yield field `+0x06` is decremented **once**, and at `0x6715C` positive values skip task resumption.

**Implication:** a sampled accumulated value of 1, 3 or 5 does not directly cause 1, 3 or 5 decrements of every task countdown. A hypothetical 6-count task changes from 6 to 5 in one traversal for each of those positive samples. Sample magnitude can be recorded, but the task traversals and IRQ increments must not be treated as interchangeable time units. This is why converting a source-side PIT divisor directly to stage-effect animation FPS would be unsupported.

## O169 — Six original effect streams: proven loop vs finite termination

The source cursor reader `MK2.EXE:0x86CC5` consumes DWORDs from global `0x75A78` and calls the render-object consumer on descriptor entries. After a descriptor it looks ahead at the next token (`0x86D2B`). A `1` token causes an explicit back-pointer rewind (`0x86D40..0x86D4F`), while a zero returns with carry set (`0x86D52`). Its caller at `0x86C99/0x86CA6` branches on carry to the termination path.

| Original effect | Source frame descriptors | Original termination |
| --- | ---: | --- |
| Tomb flying A | 8 | loop pointer to start |
| Tomb flying B | 8 | loop pointer to start |
| Portal swaying | 7 | loop pointer to start |
| Portal hanging | 7 | zero/carry finite exit |
| Portal electric | 6 | zero/carry finite exit |
| Tower effect | 7 | loop pointer to start |

The independent audit directly checked all **43 distinct original descriptor pointers**, the six lists at original Object-2 data locations, four original loop pointers and two original zero terminators. **This verifies source loop structure, not actual real-time display cadence or active object counts.** No animation is flattened into a stage background.

## O170 — Original keyboard routing mode and key-state table clear

Both original executable regions `0x9B320..0x9B343` and `0x9D5BC..0x9D5DF` contain *identical* pairs of routines:

- First routine obtains the shared driver/input block pointer at `0x3177C`, writes `0xFF` to field `+0x3D`, and returns.
- Second routine writes **zero** to `+0x3D` and runs `REP STOSD` for `0x20` DWORDs from driver/input block field `+0x50` — **clearing the exact 128-byte IRQ9 key-state table** before returning.

On original IRQ9 handler `RM.DRV:0x03BC–0x03C3`, **nonzero** `+0x3D` chains to the prior IRQ9 vector (at `CS:0x10`); **zero** executes the driver's own `IN 0x60` handler. The executable main loop `0x66EC6..0x66EDE` checks the same flag: nonzero skips its BIOS `INT 16h` poll, while zero reaches the BIOS status/read path. The source only proves these branches; do not infer a live stage-mode value or claim a specific keyboard shortcut was tested.

## Independently checked verification

| Group | Independently re-derived source assertions | Adversarial tests |
| --- | ---: | ---: |
| O166–O168 | 125 | 18 |
| O169 | 70 | 15 |
| O170 | 28 | 12 |
| **New total** | **223** | **45** |
| Inherited O139–O165, rerun | Previously checked | **128** |

**Total locally rerun test methods: 173.** The O166–O170 independent verifiers do not import the corresponding producer modules. Tests reject forged key mappings, fake measured FPS claims, changed source hashes, missing witness bytes, forged list termini, impossible timer chain rates and fabricated input-mode claims.

The original EXE and RM.DRV were read from the user's provided canonical `mk2(1).zip`. They were **not modified**, copied into releases or executed under DOSBox. Existing graphics and source PNG files are not edited by these passes. No new full React build or live animation playback validation is claimed.

## Reproduction from repository root

```bash
EXE=/path/to/original/MK2.EXE
DRV=/path/to/original/RM.DRV
T=tools/mk2_animation_continuation
python "$T/trace_o166_o168_input_cadence.py" --exe "$EXE" --driver "$DRV" --outdir /new/O166_O168
python "$T/verify_o166_o168_independent.py" --exe "$EXE" --driver "$DRV" --reports /new/O166_O168
python "$T/trace_o169_original_effect_list_control.py" --exe "$EXE" --out /new/O169_REPORT.json
python "$T/verify_o169_independent.py" --exe "$EXE" --report /new/O169_REPORT.json
python "$T/trace_o170_keyboard_mode_switch.py" --exe "$EXE" --driver "$DRV" --out /new/O170_REPORT.json
python "$T/verify_o170_independent.py" --exe "$EXE" --driver "$DRV" --report /new/O170_REPORT.json
python "$T/test_o166_o168.py" --exe "$EXE" --driver "$DRV"
python "$T/test_o169.py" --exe "$EXE"
python "$T/test_o170.py" --exe "$EXE" --driver "$DRV"
```

## Next honest verification boundary

The largest remaining uncertainty for real animation playback is **runtime timing and activated task identity**. Static source evidence now establishes the IRQ counter writer, input gates, scheduler sample/clear, task countdown traversal, original descriptor cursor grammar and render-object mutation path, but **not** their observed elapsed timings in a fighting stage.

A targeted emulator trace, once available, should first capture the **runtime-installed** interrupt 08h handler segment and offset (not a guessed file offset), driver-block fields `+0x24`, `+0x3C`, `+0x3D`, `+0xE4`, and task `+0x06`; record the runtime read/clear of `+0x24`, stage effect list cursor changes and presented frames with a known wall-clock reference. Do not equate physical EXE offsets to DOSBox addresses. Revalidate source-relative addresses after deriving the actual loaded mapping.

The user has requested autonomous continuation without a pass limit. Do not artificially expand pass counts, invent FPS, or claim actual emulator verification where none occurred. If no more source-only mechanism remains meaningfully testable, stop at the true emulator-evidence boundary rather than guessing.
