# MK DOS Archive — O225: Original fatality tile grids and exact sprite59 phase alias

**Date:** 2026-10-17. **Predecessor:** O224. Source-authenticated original placement instructions, not live runtime camera, with independently checked original-graphics/video pixels.

## Original six-tile placement scripts

The O224 six-entry source pointer-pair list stores an original `FALL.GRA` special-sprite descriptor plus a pointer to one of **three original coordinate streams**, each terminated with DWORD `0xFFFFFFFF`. At physical `MK2.EXE:0x8075F–0x80796` the source consumer reads each coordinate DWORD, splits its low/high 16-bit words into runtime object fields `[EDI+0x1A]` / `[EDI+0x1E]`, and calls source object commit `0x646B4`. All relevant pointers are original typed LE relocations.

Original grid streams and native indexed source sprites:

| Stream Object-2 | Tiles | Grid (source-local) | Original coordinates | First placement phase modulo resource geometry |
|---|---|---|---|---|
| `0x14181` | 55, 58, 59, 60 | 5 columns × 3 rows, 96-pixel stride | X = −48,48,144,240,336; Y = −80,16,112 | (48,16) |
| `0x141C1` | 56 | 5×3, 80-pixel stride | X = −40,40,120,200,280; Y = −24,56,136 | (40,56) |
| `0x14201` | 57 | 5×4, 64-pixel stride | X = 0,64,128,192,256; Y = 0,64,128,192 | (0,0) |

The entire original grid data, sentinel words, code-level coordinate writes, pointer bindings, and original source dimensions are checked; **8/8** deliberate source-mutation controls are rejected.

## Visual phase discrepancy RESOLVED, not a camera law

O214 had video-fit phase `(16,80)` for source 59, rather than the `(48,16)` implied by the 96px tile grid. O225 independently redecodes the original sprite 59 source and finds it is actually a **96×96 resource made of exactly nine repeats of a 32×32 core**. The two phases therefore produce **100% identical original indexed pixels** across the native 320×200 field. On the 29.533-second real gameplay frame, the video-calibrated RGB patch errors are **identical to the last decimal place** at both phases (5.93237 left, 6.07472 right, source palette only). O214's selected phase was an equally optimal alias, not a camera-displacement measurement. 

Original sprite58 also has a native 96×96 descriptor but exact **48×48** per-axis repetition. This is important for further texture-identity reasoning but is **not** visual proof of its runtime rendering at 29.6–29.7s.

Intrinsic exact source periods:

- 55: 96×96; 56: 80×80; 57: 64×64; **58: 48×48**; **59: 32×32**; 60: 96×96.

Note the period is the minimum *independent axis-aligned translation* preserving all source pixel indices, not an inferred screen parallax or palette transformation.

## Verification

Two fresh runs of `scripts/verify-o225-pit-fatality-tile-grids.py` on canonical original MK2 ZIP plus exact original 30fps fatality recording gave **byte-identical** report SHA-256 `d8dbfa9633ab0a900abfe526a2adf5f0d2aed667621f22921043d43de936560e`. The new report is `research_outputs/O225_PIT_FATALITY_SOURCE_TILE_GRID_AND_PHASE_EXCEPTION.json` (name retained from the initial question; its conclusion explicitly resolves the exception).

```
python scripts/verify-o225-pit-fatality-tile-grids.py --game-zip <original-mk2.zip> --video <original-151933.mp4> --project . --out <new-absent-output-dir>
```

All inherited source and research members remain unchanged. No original game executable patched and no new application build asserted. Still unresolved: why source58's five selected steps are absent from O214's video-selected texture set; active task and presentation timing, true full-screen renderer and fatality dispatch, exact crack/blood object draw order and DAC ownership.
