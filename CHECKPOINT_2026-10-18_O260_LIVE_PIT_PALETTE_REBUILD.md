# MK DOS Archive — O260 | Pit II live palette eviction and reacquisition

**Status: REAL-RUNTIME OBSERVED for one remove→rebuild interval; ORIGINAL-SOURCE VERIFIED for execution relationships.**

**Immutable baseline:** `MK_DOS_Archive_Source_O257_Pit_II_2026-10-18.zip`.
**Fixture:** unmodified `MK2.EXE`, SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.
**Owner runtime kit:** O259 isolated F9 cheat-enabled MK2.EXE, SHA-256 `95f925bcf343701cd92d2fc631df4df6c8c98d51b1553c62ae4918349b074928`.
**Original files have not been patched for this research.**

## 1. Why this pass exists

O252–O257 established from executable source that wall deletion releases object-owned palette references, that cache eviction is possible when the last holder disappears, and that a subsequent miss can enqueue an update and force a frame-transfer branch. Those results were conditional; live occupancy was missing. O258/O259's initial debugger workflow failed until the debugger command syntax and the **live data relocation** were corrected. The user then supplied runtime screenshots during the actual Pit II fatality.

## 2. Correct address spaces

- Original code file-image base: `0x61C54`. Physical EXE `0x80721` corresponds to Object-1 code offset `0x1EACD`, observed at `0180:0021EACD` (loaded code base `0x200000`).
- Original source data operand `0x75B00` maps to **virtual** `0x002B5B00` (relocation addend `0x240000`). It is **not** `0x00275B00` as an earlier, incorrect capture guide instructed.
- Original Pit palette record `0x27958` is observed as pointer **`0x00227958`** in the cache. These are different address spaces and must not be conflated.

## 3. Live screenshot observations

| Screen evidence | Breakpoint | First visible slot | Pit slot | Relationship |
|---|---|---|---|---|
| `O260_DEBUGGER_AFTER_REMOVE.png` | `0180:0021EAE9` | `00228BBE`, references=1, start=1 | empty in the visible slots | after the first captured removal |
| `O260_DEBUGGER_AFTER_REMOVE_2.png` | `0180:0021EAE9` | `00228BBE`, references=1, start=1 | empty in the visible slots | after the next captured removal |
| `O260_DEBUGGER_AFTER_REBUILD_2.png` | `0180:0021EB42` | `00228BBE`, references=1, start=1 | **`00227958`, references=15, start=64** | directly after rebuilding the same operation captured at `REMOVE_2` |

Transcribed bytes, from the user-provided screenshots:

- After removal: `BE 8B 22 00 01 00 01 00` followed by zero-filled slots in the **visible viewport**.
- After rebuild: `BE 8B 22 00 01 00 01 00 58 79 22 00 0F 00 40 00`.
- The later slot's 16-bit reference count `0x000F` is **15**, consistent with the relevant 15-object original wall grid.
- An earlier separate runtime run also showed 15 references *before* removal; do not claim all three pauses were captured within the same uninterrupted fatality session.

The source at physical `0x80738` calls tagged-wall removal. The debugger return point `0180:0021EAE9` is the next instruction, physical `0x8073D`. The after-build breakpoint `0180:0021EB42` is physical `0x80796`, the selector-index increment after the new tile loop. The allocator's first-match lookup and first-empty-slot selection mean that writing the Pit pointer to empty slot 1 after removal is strong evidence that no previous cache entry for the source was retained at the time of new allocation (although the screenshot shows only the first few slots, not the entire 60-entry cache).

**Qualified result:** The observed same-session remove→rebuild operation evicts the Pit palette and reacquires it, ending with 15 references. This is **live corroboration** of the conditional zero-holder pathway. It is not proof of all 32 iterations or a complete continuous trace.

## 4. Next causal distinction

The original allocator's miss path writes pending palette flag `0x563E0`, clears frame toggle `0x562D4`, and calls the DAC-command enqueue function `0x7B2D0`. It can also reflow later cached palette allocations (O257). That source path is authenticated. **The screenshots do not measure pending-flag values, queue cursor advancement, VGA DAC writes or framebuffer transfers**; do not promote any of them to live-verified based only on the cache screenshots.

The 50fps presentation baseline, ~60Hz timer, 32-entry *selector*, up-to-500 wall object creations, 32-entry *DAC ring* and 30fps recordings must remain separate concepts.

## 5. Verification and immutable evidence

`verify_o260_live_cache.py` checks 13 opcode anchors plus six direct rel32 call targets, rejects 19 independent source mutations with the whole-file hash check disabled only for mutation tests, validates manual screenshot transcriptions and locks screenshots by SHA-256. Two independent runs on the original fixture produced byte-identical JSON.

Original screenshot pixels were independently viewed. **No OCR was used**; screenshot byte verification is a provenance check and the cache values are recorded as manual transcriptions. The screenshots are included in this checkpoint's evidence.

## 6. Correct continuation

Use O261's source-derived candidate map to verify the *live* pending flag, DAC queue cursors and frame-toggle values. Ideally capture (a) directly after palette reacquisition at `0180:0021EB42`, and (b) after the frame controller drains the palette queue. Do not claim frame-presentation causality from cache state alone. Ask the user for a new live test only when a bounded command sequence has been checked against the exact DOSBox-X debugger build.
