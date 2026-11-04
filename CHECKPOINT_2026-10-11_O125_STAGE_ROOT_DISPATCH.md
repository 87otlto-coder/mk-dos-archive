# O125 — Original MK2 stage-selection tables and conditional setup roots

**Date:** 2026-10-11. **Status:** verified static executable structure, browser/Python parity, original-game screenshots remain as O119–O124. Not a new gameplay test or live palette/camera measurement. One focused development checkpoint (50 passes is a ceiling, not a quota).

## Research result

Two original executable code paths (`0x82321` and `0x98BA7`) select one of three **31-entry Object-2 tables** based on comparisons to the original mode variable at Object-2 offset `0x3014C`. Their table bases are `0x15BEC` (mode equals 2), `0x15C68` (mode equals 1), and `0x15CE4` (fallback). Each index occupies 4 bytes, giving 93 table entries. Every nonnull entry has a corresponding authenticated type-7 LE relocation targeting Object-2; each table has 28 nonnull entries, with null indices **10, 11 and 21**. Only indices **0–7** change root target across modes. The paths scale the selector by 4 before dereferencing a pointer from the selected table.

O121-authenticated Tomb (original `TOMB.GRA` sprite/setup record family) is rooted at **table index 1**, and Portal (`PORTAL.GRA`) at **table index 7**. Their source roots are:

| Static mode case | Tomb index 1 | Portal index 7 |
|---|---|---|
| `mode == 2` | `0x171F0` | `0x16378` |
| `mode == 1` | `0x1726C` | `0x163D0` |
| fallback | `0x1726C` | `0x163D0` |

All six root entries contain LE-relocated references to the appropriate O121 stage setup structures. The two mode-2 variants expose setup references used to produce the O122–O124 screenshot-qualified background layers. These are **static references**: a setup appearing in a table doesn't by itself establish its activation in a particular DOSBox fight.

The `0x81BB3` path separately iterates eight 16-byte records at Object-2 `0x15B68`; their final pointer fields target `0x77453 + 4*i` for `i=0..7`. Original code initializes these eight slots with sentinel `0x30240` at `0x81B60` onward, and conditionally dereferences them at `0x81BD9`. This establishes a related set of **eight live object slots** distinct from the 31-entry stage selection tables. No live slot contents have been observed, and no claim is made that eight slots equal eight stage backgrounds.

A subsequent path at `0x81EB2` dereferences an input root pointer and calls additional initialization and screen-buffer routines. It has not yet been fully assigned semantic names. Runtime global `0x75A80` can be used as a selector in one code path and overwritten with a selected root pointer, so **do not label the same memory location as a stable camera variable or stable stage index across execution**.

## Implementation

- `tools/mk2_native_stage_palettes/trace_o125_stage_dispatch.py`: authenticates full original `MK2.EXE`, reparses complete LE fixups, proves three code paths/table owners and six Tomb/Portal roots, writes a fail-closed evidence JSON.
- `tools/mk2_native_stage_palettes/verify_o125_dispatch_independent.py`: separately reads the original LE fixups using the previously independent parser and validates every table entry, root-region pointer and code instruction; does not import the O125 producer.
- `tools/mk2_native_stage_palettes/test_o125_stage_dispatch.py`: 30 positive/negative regression methods, including evidence falsifications and unsupported live-state claims.
- `src/games/mk2/research/stageConfigDispatchO125.ts`: read-only, exact-executable browser decoder for the three conditional 31-slot arrays.
- `scripts/run-mk2-o125-stage-dispatch-bridge.mjs`: byte-for-byte 93-entry Python/browser parity and tamper rejection (104 assertions).
- `src/components/MK2IndexedStageMosaicsO122.tsx`: new provenance display for conditional mode-dependent Tomb/Portal source roots when rendering a verified individual layer.

## Verification

- 27,004 original LE relocation entries reparsed; **93 array entries**, **84 typed nonnull array pointers**, **six authenticated Tomb/Portal root bindings**, **eight independent stage object-slot pointers**, **25 machine instruction sites** checked.
- Independent O125 audit: **284 assertions**, `PASS_O125_INDEPENDENT`.
- New O125 Python regressions: **30 passed**.
- Earlier O120–O124 regressions: **115 passed** (23 + 32 + 20 + 20 + 20).
- O125 browser-to-Python parity: **104 checks passed**. Original O122 indexed mosaic browser parity: **49 checks passed**.
- O125 standalone TypeScript module type-checked in isolation; a complete React/Vite build was **not run** (npm dependencies unavailable locally).

## Reproduction

Supply the exact original DOS `MK2.EXE` whose SHA256 is `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`. No executable or commercial game assets are bundled with development source.

```sh
python tools/mk2_native_stage_palettes/trace_o125_stage_dispatch.py --exe /path/MK2.EXE --out /new/O125_DISPATCH.json
python tools/mk2_native_stage_palettes/verify_o125_dispatch_independent.py /path/MK2.EXE /new/O125_DISPATCH.json
python tools/mk2_native_stage_palettes/test_o125_stage_dispatch.py /path/MK2.EXE
node --experimental-strip-types scripts/run-mk2-o125-stage-dispatch-bridge.mjs /path/MK2.EXE /new/O125_DISPATCH.json
```

## Evidence boundaries and next investigations

1. Trace the writing of the runtime mode at Object-2 `0x3014C` and index/source selection at `0x75A80`, including the transfer and setup-list management at `0x81EB2`, to distinguish startup/static table paths from specific live fight behavior.
2. For definitive selected setup, handle and palette-bank allocation, use targeted emulator state observations; neither screenshots nor LE pointers alone disclose those RAM values.
3. Continue stage-layer activation/draw-order work and export qualified original stage imagery in the extractor, keeping the authenticated Tomb/Portal mosaics and floors separate from unverified layers.
4. Roadmap remains MK2 → MK1 → MK3 → extractor/compiler first; bot and Authentic Enhanced wrapper remain postponed.
