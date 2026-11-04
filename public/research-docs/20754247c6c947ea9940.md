# O199 — Forest mode-gated initializer callbacks and controlled runtime probe

**Date:** 2026-10-15. **Predecessor:** O198 original Forest conditional setup-root graph. **Classification:** independently verified *static* original-executable control flow, byte-checked output package and a deliberately limited, cloned-installation DOSBox probe. **No gameplay execution or live mode measurement has occurred.**

## Most important new relationship

The O134 Forest initializer callback pointer is the original Object-1 pointer `0x20E80`, physical `MK2.EXE` offset `0x82AD4`. All three O198 Forest source roots have a type-7 relocation to this same initializer through root field `+0x10`:

| Stage-root mode | Root Obj-2 offset | Source layer references | Source-reachable Forest registration sites |
|---|---:|---|---|
| mode 2 | `0x16B56` | 1, 2, 3, 4, 5 | first + second |
| mode 1 | `0x16BDA` | 1, 2, 5 | first + second |
| mode 0 (fallback) | `0x16C46` | 1, 2, 5 | **first only** |
| mode 3 (fallback) | `0x16C46` | 1, 2, 5 | first + second |

The mode-1 and fallback Forest roots contain **identical source bytes**, as O198 established. But the Forest initializer itself checks the mode global at Object-2 `0x3014C` against zero. Therefore the mode-0 and mode-3 paths can still differ in original source registration reachability, even though they select the same fallback root. The two mechanisms must **not** be conflated. These rows are **conditional source-code path predictions, NOT observed actual modes in a fight**.

### Two authenticated registration pointers

The initializer always reaches a `MOV EDX, 0x20EB0` at physical `0x82ADB`, then `CALL 0x67222` at `0x82AE0` under normal entry. `0x20EB0` is Object-1 relative, physically `0x82B04`. The original typed LE relocation at `0x82ADC` authenticates this pointer.

At `0x82AE7` the original bytes `83 3D 4C 01 03 00 00 74 13` encode `CMP DWORD PTR [0x3014C], 0` followed by `JE 0x82B03`. If zero, the second block is skipped. Otherwise `MOV EDX, 0x20FF0` at `0x82AF7` and `CALL 0x67222` at `0x82AFC` are reached. This second function is Object-1 `0x20FF0` = physical `0x82C44`, with typed LE relocation at `0x82AF8`. Both calls load `EBX=6` before invocation.

### Registration helper meaning

The helper at physical `0x67222` reads an available-entry list from Object-2 global `0x35B08`. In the available-entry branch it writes the function pointer passed in EDX to object field `+0x1C`, stores BX to a word at `+0x04`, and links that entry into an existing list. It also has an explicit no-free-entry branch. This proves it is an object callback-registration mechanism, more specific than O134's preliminary "registration-like" description. It does **not** prove either registration allocates during a particular game run or that either callback executes or creates visible scenery.

The first target at `0x82B04` references Object-2 globals `0x7650A`, `0x842EA`, `0x8432E` and stores original values to object fields `+0x1E` and `+0x1A` along one code path. Its original immediate operands include `100`, `80`, `84`, `320`, `12` and `64`. These are **machine-code constants, not established frame rates, native screen coordinates or animation intervals**. The second target at `0x82C44` contains three original immediate EDX values `0x650106`, `0x650232`, `0x650352` and a helper call at `0x82CB0`. Their asset and visual meanings are unresolved.

## Exact evidence and verification

- `src/core/experiments/o199.ts`: unmodified canonical `MK2.EXE` required (`fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`); validates all three root table references, initializer pointer fields, call bytes and signed relative call destinations, helper-body instructions and bounded target function bytes. Read-only; does not run original machine code.
- `src/components/O199ForestBehaviorWorkbench.tsx`: Laboratory → Compile & hypotheses → O199 Forest conditional initializer behavior. Displays conditional rows and source-reference details and exports forensic ZIP. Does **not** require a graphics resource for the executable-only investigation.
- `scripts/verify-o199-fixture.cjs`: rejects modified executable; tests all four branch possibilities; tests deterministic nine-member evidence ZIP.
- `scripts/verify-o199-export.py`: independent LE relocation and code-window verifier using the original LE records (27,004 fixups). Validates 3 conditional root pointers, 3 callback fields, both function pointer relocations, a typed mode-global code reference, pool list global pointer and exported source byte windows. It does not import the browser producer.
- `scripts/create-o199-forest-runtime-probe.py`: optional *clone-only* controlled runtime experiment. From a user-owned original MK2 installation it creates `40_F9_CHEAT_CONTROL` and `41_FOREST_SECOND_REGISTRATION_DISABLED`. Both receive the same canonical 11-byte F9 menu unlock at physical `0xCCF0E`. Only the experiment replaces the five original `E8 21 47 FE FF` bytes at physical `0x82AFC` with five NOPs `90 90 90 90 90`; all other original game files remain unchanged. This is an **untested gameplay candidate**, not a verified playable patch. No original executables are bundled in source or forensic evidence.
- A real copy run from the attached original MK2 archive confirmed two 614-file clones, identical non-EXE files, and the exact five-byte difference between patched control and experiment. The source installation remained unchanged.
- O194–O198 fixture regressions passed; changed TS and TSX files transpile with the global TypeScript compiler. The full Vite/browser build remains unavailable (`npm ci --offline` cannot retrieve `yallist@3.1.1`). No graphical browser smoke test is claimed.

## What a DOSBox test can establish

A video or screenshot difference between the controls, holding stage, fighter, initial settings and camera movement comparable, would support the hypothesis that removing the **second registration** affects observable Forest behavior. If the experiment crashes, that is evidence requiring further investigation. **No difference is inconclusive**, and neither case directly measures the mode value. The native runtime selected setup graph, registered callback execution count, full scene positioning, palette bank, animation timing and parallax remain unmeasured.

**Suggested next experiment:** run the paired source-verified clone kit, capture control and candidate gameplay; then trace the corresponding object function's runtime state, before introducing assumed scene stacking. Keep the O197/O198 independent source-layer exports intact.
