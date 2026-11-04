# O126 — Original MK2 stage-configuration mode lifecycle

**Date:** October 12, 2026. **Status:** Source-verified static machine instructions, authenticated LE relocations, independent verifier and browser-side explanation. **No runtime mode, handle, DAC index or camera value measured.**

## Why this matters

O125 authenticated three 31-slot tables selected by the mode at Object-2 `0x3014C`. O126 traces the **lifecycle** of this value, rather than assuming the currently selected table can be inferred from screenshots or from the presence of a default instruction.

The original unpatched `MK2.EXE` (SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`) contains **27 direct code-image references** to this mode address. Every site is the source of an original type-7 LE relocation to Object 2, offset `0x3014C`. The code uses these references to compare, read and write the mode. This is an exhaustive census of literal address references in the authenticated code-image range—not a claim that indirect writes are impossible.

## Verified instruction paths

1. **Integrity-conditional default:** At `0x65174`, code computes a byte sum over a settings block and compares it to the stored word at `0x30232` (`0x65188`). A matching sum branches past the reset. On mismatch, code clears/reset-copies settings (`0x65191`, `0x6519F`) and executes `mov dword [0x3014C], 2` at **`0x651BA`**. Therefore the presence of this write does **not** prove that mode 2 is permanently active.
2. **Configuration save/restore:** Original code copies `0x3014C` into another Object-2 variable, `0x3030F`, at **`0x9A9DF`**; the reciprocal restore path is at **`0x9AA54`**. This is a verified memory transfer, not evidence of how often it happens in normal gameplay.
3. **Two temporary mode-3 overrides:** At **`0x9B284`** and **`0x9B2DE`**, the original code writes the immediate value 3 after saving the previous mode, with restoring writes at **`0x9B2A4`** and **`0x9B2FE`** (instruction sequences anchored at `0x9B29D` and `0x9B2F7`). These are distinct conditional paths, not evidence that mode 3 was active in the supplied Tomb/Portal fights.
4. **Two dispatch consumers:** `0x82321` and `0x98BA7` use **mode 2 → table `0x15BEC`; mode 1 → table `0x15C68`; every other value → table `0x15CE4`**. Hence mode 3, while temporarily set, follows the fallback table in either dispatcher *if that dispatcher executes during the override*.

## Subtle but consequential table distinction

Across all 31 entries, **mode 1 and fallback are NOT fully equivalent**: they differ at **indices 0 and 4**. Mode 2 and mode 1 differ at indices **0–7**. Tomb-family index 1 and Portal-family index 7 have the same roots for mode 1 and fallback, so prior Tomb/Portal screenshots cannot tell these two modes apart. No assertion is made that either root was actually selected in a particular user screenshot.

The scratch variable at Object-2 `0x75A80` may serve as a configuration index in one path and later hold a pointer or unrelated intermediate value. **Do not infer a stable stage index or camera coordinate from that address.**

## Implementation and verification

- `tools/mk2_native_stage_palettes/trace_o126_mode_lifecycle.py`: fails closed on wrong EXE, audits all direct references, verifies original instruction bytes, LE relocation provenance, mode tables and conditional lifecycle. Does **not** patch the game.
- `tools/mk2_native_stage_palettes/verify_o126_mode_independent.py`: independently reconstructs the 27-site census and table differences from the separate O120 independent fixup parser. Does not import the O126 producer.
- `tools/mk2_native_stage_palettes/test_o126_mode_lifecycle.py`: **30 passed** original, rejection, tampering, determinism and no-false-runtime-claim tests.
- `src/games/mk2/research/stageConfigDispatchO125.ts`: adds source-qualified O126 lifecycle evidence and detects the two indices at which mode 1 differs from fallback.
- `src/components/MK2IndexedStageMosaicsO122.tsx`: displays the mode lifecycle qualification beside the authenticated layer and stage-root provenance.
- `scripts/run-mk2-o126-mode-lifecycle-bridge.mjs`: **74 passed** Python/browser parity checks. Inherited O125 bridge: **104 passed**.
- O126 independent verifier: **202 checks passed**. O120–O125 inherited regression suites: **145 passed** (23+32+20+20+20+30).
- Targeted standalone TypeScript module type-check passed. **The complete React/Vite application build and DOSBox runtime were not executed in this checkpoint.**

## Reproduce

Supply the exact original unmodified MK2 DOS executable; it is not included with development source.

```sh
python tools/mk2_native_stage_palettes/trace_o126_mode_lifecycle.py --exe /path/MK2.EXE --out /new/O126_REPORT.json
python tools/mk2_native_stage_palettes/verify_o126_mode_independent.py /path/MK2.EXE /new/O126_REPORT.json
python tools/mk2_native_stage_palettes/test_o126_mode_lifecycle.py /path/MK2.EXE
node --experimental-strip-types scripts/run-mk2-o126-mode-lifecycle-bridge.mjs /path/MK2.EXE /new/O126_REPORT.json
```

## Next legitimate research question

Trace the actual source and permissible range of the **configuration index** supplied to `0x82321`/`0x98BA7`, and establish which initialization actions run under each mode. Source analysis can continue; proving the actual mode, setup object, returned palette handle and DAC start during the user's DOSBox fights will ultimately require runtime state instrumentation.

**Accounting:** O126 is one evidence-supported research/development checkpoint. Fifty passes is a **maximum**, not a quota. MK2 remains the priority, while intelligent bot/Authentic Enhanced runtime work stays deferred.
