# MK DOS Extractor — P17 original MK2 IMAGES.GRA indexed setup-local mosaics

**Date:** 2026-11-06  
**Parent:** P16 main/develop `c84acad696adb3fa2f2ff7433be711e1c5654407`  
**Classification:** first focused interim pass after the P16 source checkpoint. **MK2-first**; research evidence applied to the working Asset Library without changing the forensic research workbench.

## Extraction improvement

Two 320 × 200 **original-indexed setup-local composites** that were already independently qualified in original DOS O121/O122 research are now exposed in the MK2 Asset Library. They use the native 3-command indexed sprite grammar and exact original executable placement controls. They are *not* original RGB screenshots, not identified gameplay arena scenes and not an animation.

The previous P2–P4 source pipeline integrates eight of O122's ten source mosaics from original `TOMB.GRA` and `PORTAL.GRA`; P17 adds the two previously omitted original `IMAGES.GRA` mosaics. The original `IMAGES.GRA` source family labels `tomb79` and `portal79` identify 79-colour source records, **not** a verified runtime game stage/palette owner. In particular, the earlier O119 runtime perturbation supported the *80-colour* records, not these 79-colour alternatives.

| Original O121 Object-2 setup | O121 family | Native source controls | Native output | Independent O122 exact index SHA-256 |
|---|---|---:|---|---|
| `0x2E7E4` | `tomb79` source label | 10 | 320 × 200 | `44cc8a2c23c68b75f6c795d47f542a86487fdba7b938bc01587e31d055a40630` |
| `0x2E720` | `portal79` source label | 10 | 320 × 200 | `0b8bcbc29c6775a5391ecca256e953a78a1709efae9b547db8a3a8aceb10024b` |

All **20 original streams** lie exactly within `IMAGES.GRA [351472,460192)` and connect contiguously with no overlap or gap. Source records point to resource ID 22 and original signed local XY/descriptor entries, independently validated by the O121 producer. Both canvases have ten native 64 × 100 tiles in 5 × 2 source-local positions. The original 20 decoded frames were present as individual graphical source streams; P17 supplies the **two composited representations**, not 128,000 previously unseen commercial source pixels.

**Preview and export:** each asset is an indexed, transparency-aware diagnostic grayscale PNG, with source `indices`, paint `mask`, and *all-zero* `paletteKnownMask` exported separately. Grayscale uses `min(255,originalIndex*3)` to improve inspectability and is **never** presented as authentic original DOS RGB. The selected ZIP preserves source controls, counts, original offsets, hashes, index/mask planes and explicit uncertainty. The two newly exposed composites also have a source-specific ZIP package.

## Source and test evidence

- Canonical `MK2.EXE` SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65` and `IMAGES.GRA` SHA-256 `2b26796a64c2aebfee75832696aeae9bbcf9df56d82cb9a39df58a557d3ad8cf`. Both are required. The original EIP parser/format and O121 packed source placements remain read-only.
- Original O122 Python producer was rerun on the user-provided canonical MK2 ZIP; it recovered 49 source sprites, **10 source mosaics**, and the two target independent original index/opacity digest pairs. The `IMAGES.GRA` family contributes 20 distinct decoded streams across the two composites; 79-colour one-based RGBA from the old Python experiment was **not** adopted.
- New P17 TypeScript adapter parity against immutable independent O122 hashes: **77 focused checks PASS**, including indexed planes, alpha masks, PNG readback, exact exported ZIP sidecars, source offset/provenance and **8** negative source-input cases (altered, missing, duplicate, synthetic, truncated).
- Current P11 source plus P17 original-fixture collection scan: **5,055 unique assets / 28 headless cumulative checks PASS**. This intentionally retests P11's preserved baseline plus the P17 integration, including byte-identical original P8/P9/P10 output ZIP hashes.
- **Full P16+P17 original-fixture cumulative re-run is VALIDATION PENDING.** The P16/P15 baseline was previously verified at 5,108 unique assets / 83 checks, so **5,110 is the EXPECTED total, not freshly observed** in the full current source during this pass. A default `scripts/verify-mk2-p17-cumulative.cjs` test is provided for the full source and must be run on the original fixture before any fifth-pass promotion; the optional explicit `--p11-baseline` reproduces only the above 5,055 / 28 compatibility check.
- GitHub CI validates committed syntax, TypeScript, Vite and source-offline Chrome startup without commercial game assets; a CI PASS does not substitute for a local original-fixture scan or user browsing/preview of the two new records.

## Confidence boundaries

- **VERIFIED:** original bytes and source ID, O121 controls, original source-local placements, native stream decoder, two original 320 × 200 index/opacity mosaics, gapless 20-stream source coverage, diagnostic preview/ZIP parity.
- **UNKNOWN:** original 79-colour record runtime selection, palette-bank owner / live DAC, correct RGB, whether the source `tomb79` / `portal79` alternatives ever appear in gameplay, arena ownership, final world placement, draw order, triggers and frame timing.
- **VALIDATION PENDING:** full 5,110-asset cumulative scan on P16+P17 and new-feature browser interaction on Windows. Do **not** infer stage completeness or palette correctness from the source-family names.

## Reproduction

```sh
# Canonical original DOS file fixture only; no commercial files in GitHub
node scripts/verify-mk2-p17-unassigned-images.cjs /path/to/original/mk2
node scripts/verify-mk2-p17-cumulative.cjs /path/to/original/mk2 /tmp/p17-cumulative.json

# Historical compatibility test, not the current full-source acceptance suite
node scripts/verify-mk2-p17-cumulative.cjs /path/to/original/mk2 --p11-baseline
```

**Git-safe changes:** new bounded P17 adapter, two original SHA-only golden records, focused and cumulative verifiers, one additive Asset Library collection registration, and this handoff. No commercial original game files, extracted PNGs or raw indexed assets are committed. Preserve P16 on `main`; continue MK2-first through P18–P20 before the next P21 consolidation where justified.
