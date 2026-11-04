# MK DOS Archive — Handoff — Pass 1E.3O.28 Background Placement + PIT Scene Export IR

**Date:** 2026-09-30  
**Status:** VERIFIED / AUTHENTIC-INSTALL READ-ONLY QUALIFICATION COMPLETE

## Purpose

O28 follows O27's stage/background resource graph into the canonical `BAKGND.ASM` consumer that turns each BMOD placement record into a created background object. This pass is export-first and read-only. It establishes the packed placement selector grammar, validates that grammar over every O27-reached placement record, and builds a bounded correct-colour scene IR for internal fixture `PIT_MOD`.

It deliberately does **not** claim final renderer z-order, scrolling/clipping transforms, or a canonical full-stage raster.

## Authentic source

- `MK1.EXE` size: **1,157,222 bytes**
- SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`
- code file-image base: `0x00050A54`
- Watcom static-data file-image base: `0x0008CA54`
- GRA resources: authentic files from the user's complete MK1 installation

Prerequisite:

- O27 verdict: `MK1_BACKGROUND_MODULE_RESOURCE_GRAPH_ESTABLISHED`

## Static BAKGND consumer proof

The canonical `BAKGND.ASM` code symbol `BGND_UD1` begins at Watcom code offset `0x4382`. O28 qualifies the inner placement consumer at `0x4413..0x458A` using exact instruction-byte signatures from the canonical executable.

The consumer proves the 18-byte BMOD record layout:

| Offset | Size | Qualified role |
|---|---:|---|
| `+0x00` | 2 | first culling-extent word |
| `+0x02` | 2 | second culling-extent word |
| `+0x04` | 2 | placement-record count |
| `+0x06` | 4 | placement-table pointer |
| `+0x0A` | 4 | NO_XY descriptor-table pointer |
| `+0x0E` | 4 | palette-pointer-table pointer |

The 8-byte placement record is now bounded as:

| Offset | Size | Qualified role |
|---|---:|---|
| `+0x00` | 2 | control word; high byte copied to created object `+0x18`, low nibble contributes palette selector, remaining bits participate in object flags |
| `+0x02` | 2 | signed local position coordinate 0; added to scene-entry coordinate 0 and stored to created object `+0x12` |
| `+0x04` | 2 | signed local position coordinate 1; added to scene-entry coordinate 1 and stored to created object `+0x16` |
| `+0x06` | 2 | packed descriptor/palette selector |

The two position fields are code-grounded as object-position fields. O28 does not rename them world X/Y because the broader camera/scroll coordinate model is not yet qualified.

## Selector equations

The canonical consumer establishes:

- descriptor byte address = `descriptorTableRef + 4 * (selectorWord & 0x0FFF)`;
- every canonical low-12 selector in the reached dataset is even;
- therefore the 8-byte NO_XY descriptor ordinal is `(selectorWord & 0x0FFF) / 2`;
- palette selector = `((selectorWord >> 8) & 0xF0) | (controlWord & 0x0F)`;
- object position field 0 = signed-16 result of `scenePair.low16 + placement.word1`;
- object position field 1 = signed-16 result of `scenePair.high16 + placement.word2`.

This is not a heuristic inferred from visual appearance; the equations are backed by the exact BAKGND machine-code consumer and then validated against all reached canonical data.

## Whole O27 BMOD population validation

Across all **41** O27-reached BMOD records:

- placement records: **2,550**
- unique descriptor/palette pairs: **527**
- odd low-12 descriptor dword indices: **0**
- descriptor selectors out of range: **0**
- palette selectors out of range: **0**
- selected RGBA palette-range failures: **0**
- all 41 O27 placement-table `0xFFFF` terminators remain verified.

For every canonical placement record, O28 resolves the selected 8-byte NO_XY descriptor, decodes it from the authentic HDRS.GRA resource, resolves the selected palette pointer from the BMOD palette table, parses the variable-length palette record, and verifies that every opaque decoded source index fits that selected palette.

This materially strengthens O27: the palette tables are not merely adjacent/referenced metadata; the actual BAKGND consumer encodes a per-placement palette selector and all canonical placements are compatible with the selected palette records.

## Bounded `PIT_MOD` export fixture

O28 uses the internal canonical symbol `PIT_MOD` as a bounded fixture. This is an internal code/data name; O28 still does not generalize an arcade-stage-name mapping beyond that symbol.

Top-level fixture:

- resource: `GRAPHICS/FU5HDRS.GRA`
- file ID: **27**
- descriptor table: `0x000023A4`
- descriptor prefix: **85** authentic NO_XY descriptors
- palette table: `FU5PALS`
- palette pointer count: **35**
- scene list:
  1. `bridge0BMOD`, scene coordinate pair `(14, 721)`, 25 placement records
  2. `bridge1BMOD`, scene coordinate pair `(0, 89)`, 333 placement records

Bounded fixture result:

- placement records: **358**
- unique descriptors reached: **85 / 85**
- palette selectors used: **23**
- unique descriptor/palette RGBA variants: **88**
- selector failures: **0**
- opaque-index/palette-range failures: **0**

A deterministic preview/export package is generated containing:

- `PIT_scene_ir.json` — the bounded scene placement IR;
- 88 transparent RGBA PNGs, one for each unique descriptor/palette combination reached by the two BMODs.

The diagnostic spatial envelope obtained from the two created-object position fields plus descriptor dimensions is:

- min position field 0: `0`
- min position field 1: `89`
- max position field 0 + width: `914`
- max position field 1 + height: `804`

This envelope is useful structural evidence but is **not** promoted to the final visible stage viewport because clipping, camera/scroll transforms and renderer ordering are still open.

## Determinism

O28 was run twice against the authentic installation.

After removing timestamp/operation-ID provenance:

- machine reports are semantically identical;
- generated fixture contains **89 files** (`PIT_scene_ir.json` + 88 PNGs);
- every fixture file is byte-for-byte identical across reruns.

## Validation

All 15 O28 checks pass:

1. canonical authentic source;
2. O27 prerequisite;
3. 11 exact BAKGND consumer signatures;
4. all 41 O27 BMODs / 15 contexts covered;
5. exactly 2,550 placement records;
6. descriptor selector even/in-range;
7. palette selector in-range;
8. selected RGBA indices in-range;
9. all placement terminators preserved;
10. exact PIT two-BMOD scene list;
11. PIT descriptor/palette binding;
12. 88 PIT RGBA variants;
13. final z-order not promoted;
14. no full-stage raster claim;
15. no write path.

## Verdict

`MK1_BACKGROUND_PLACEMENT_AND_PIT_SCENE_EXPORT_IR_ESTABLISHED`

## What is now established for export

For the O27-reached background population, the project can now export a placement-aware structural scene representation containing:

- top-level module/resource relationship;
- ordered scene BMOD references;
- signed scene coordinate pair;
- each BMOD's placement count and table;
- per-placement local coordinate pair;
- resolved NO_XY descriptor;
- authentic uGRA pixels;
- exact per-placement palette-table selection;
- correct-colour transparent RGBA sprite variants;
- raw control/selector words for lossless provenance.

## Boundaries retained

Not yet established:

- semantic name of every control-word bit;
- renderer priority/z-order meaning of the copied control high byte;
- final draw ordering between all objects/layers;
- exact camera/scroll/clipping transform from object positions to final screen pixels;
- full canonical stage raster;
- stage animation behavior beyond the static placement population;
- arcade stage-name mapping for every internal module;
- any writer/import path.

## Recommended continuation after pause

The next block should first investigate the background renderer/order and camera/scroll transform sufficiently to determine whether a canonical visible-scene composite can be reconstructed without runtime guessing. If that cannot be statically bounded cleanly, pivot to a broader stage export package that preserves layers/positions/palettes as IR instead of forcing a flattened raster. A second pass in that block can then broaden from `PIT_MOD` to the other O27 top-level modules or investigate animated/interactive stage elements, depending on which dependency resolves first.
