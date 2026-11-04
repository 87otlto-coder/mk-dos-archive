# O250 — Pit II palette-queue, rendering-mode and frame-transfer gate qualification

**Date:** 2026-10-17. **Inherited checkpoint:** O249. **Scope:** bounded, original-source-only verification. All original game inputs are read-only. **Status:** independently reproduced original executable relationships; actual Pit II runtime gate values remain unknown.

## Verified result

The O249 `0x563E0` **special-render** branch has a stronger source characterization: it is set by palette-queue/update code and cleared by the VGA DAC-processing code. It is therefore a pending-palette/update flag (this source association is verified; exclusive semantics outside tested callers are not). The original frame controller `0x67050` tests that flag at `0x6708C`: a nonzero flag with rendering enabled and mode not 3 enters the forced composition/transfer branch, rather than the normal alternating branch.

Original `0x7B2D0` writes 8-byte palette queue commands via head/tail pointers `0x563D8` and `0x563DC`, recording source pointer, starting index and count. `0x7B30B` waits for VGA retrace using port `0x3DA` and processes queued palette changes by writing VGA DAC index port **0x3C8** and color-data port **0x3C9**. After the processing loop it stores the queue read pointer and clears `0x563E0` at `0x7B3ED`.

The verified original writer/caller relationships are:

- `0x75CF2` rendering enable: routines at `0x650CE` (write 0) and `0x650D9` (write 1), plus independently verified values at `0x8678E`, `0x9D610`, `0x9D66C`, `0x9E3E0`.
- `0x3014C` mode: an initializer writes 2 at `0x651BA`; two mode-3 wrappers temporarily write 3 at `0x9B284` and `0x9B2DE`, explicitly saving/restoring the previous value (`0x9B277` / `0x9B2A4` and `0x9B2D1` / `0x9B2FE`). Therefore the original source does NOT establish that mode is fixed to 2 or 3 during Pit fatality.
- `0x563E0` palette pending: original writes 1 at `0x746D5`, `0x76C58`, `0x7B48F`, `0x94F97`, while the DAC path writes 0 at `0x7B3ED`.
- `0x562D4` alternating bit: the palette setup helper at `0x7B499` resets it to 0; frame entry at `0x67050` XORs its low bit. Importantly, it is also tested in the object walker at `0x9320E` and compositor at `0x933C2`, so it is **not solely** a video-transfer toggle.
- Original call edges: `0x746D0 -> 0x7B2D0` and `0x7B4A3 -> 0x7B2D0`; the frame controller calls `0x7B30B` for retrace/palette handling, `0x933C2` for composition and `0x65420` for video transfer, under the O249 branch conditions.

## Why it matters to Pit II

A queued palette update can change the frame controller's composition/transfer branch and its handling of the alternating bit. This is a **source-supported mechanism to test**, not a retrospective claim that palette updates caused the held-frame discrepancy in O248. No original Pit II session's `0x563E0`, `0x75CF2`, `0x3014C`, or `0x562D4` runtime values were captured.

The original 50 fps DOS presentation observation remains distinct from the approximately 60 Hz source timer and from 30 fps video capture. The O248 mismatch persists as an unresolved *runtime* fact. O246/O247 original graphic-58 live visibility remains verified.

## Verification and controls

`python scripts/verify-o250-pit-palette-frame-gates.py --game-zip <original owner mk2 ZIP> --source-zip <inherited O249 source ZIP> --out <new directory>`

- Canonical original MK2 executable and `FALL.GRA` SHA-256 guards; inherited O249 JSON SHA-256 guard.
- 41 original opcode/source intervals checked, 12 original direct rel32 caller targets checked.
- 53 targeted altered-byte controls all rejected.
- Enumerated 16 conditional controller states for render-enable, mode, palette-pending and toggle state; these are **hypothetical inputs** not sampled runtime states.
- Independent runs A/B produced byte-identical report SHA-256 `675b635c95c39ef712e5d8cd5d50d8492b217b3759ca508907d1e989c0afa1e5`.
- The fixture and original user videos were not modified. No executable patch, DOSBox runtime instrumentation, game playback, new React/Vite build or actual palette-DAC trace is claimed.

## Next step

A bounded O251 can trace the specific Pit II scene's palette-queue callers and test whether stage transitions request/flush the palette in a way that could choose the forced transfer path. If static code cannot establish actual values, a narrow read-only runtime-state capture would be the next genuine evidence requirement. Do not infer live transfer scheduling from static gate references.
