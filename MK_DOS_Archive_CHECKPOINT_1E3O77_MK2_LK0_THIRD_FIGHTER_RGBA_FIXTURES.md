# MK DOS Archive — Checkpoint 1E.3O.77 — MK2 LK0 Third Fighter-Resource RGBA Fixtures

**Date:** 2026-10-02  
**Scope:** one bounded MK2 verification pass  
**Verdict:** `MK2_LK0_THIRD_FIGHTER_RESOURCE_TWO_SEMANTIC_PALETTE_CONTEXT_RGBA_FIXTURES_ESTABLISHED`

## Purpose

O77 independently repeats the already-qualified MK2 fighter-resource correct-colour chain for identity slot 1 / `LK0.GRA`. It does not generalize palette ownership to `LK1+`, the full `LK` family, or a human fighter name.

## Authentic inputs

- `MK2.EXE` SHA-256: `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`
- `LK0.GRA` SHA-256: `9a01fb1924bf97a1005514cff7dfeeb343c49dba56a48cd50091bad4f4d1b874`
- fixture archive remains authentic `mk2.zip` SHA-256 `b68d4a6884b927601d34f4a01ed90dcfc31b8f6ea92de75fa9aa8cc736e481f2`

## Identity/resource join

O73's authenticated identity-slot table establishes:

`object +0x46 identity value 1 -> LK resource-family subtable -> exact LK0.GRA offset-0 descriptor`

The exact offset-0 witness is physical `0xC4878`, resource ID `103`, `LK0.GRA+0`.

O69 independently qualifies `LK0.GRA` as `EXACT_FULL_RESOURCE_TILING`:

- 36 unique streams;
- first stream begins at GRA offset 0;
- final stream ends exactly at resource EOF;
- authentic resource byte length: 131,528;
- opaque index domain: 1..63.

## Exact slot-1 palette records

O72 resolves identity/palette selector slot 1 to two exact counted 63-colour records:

### Default character palette

- structural context: `selector_table_A_slot_01`
- Object-1 offset: `0x254A0`
- physical: `0x870F4`
- raw record SHA-256: `63b2271ae86c2ebb59202020df619132aafe1c4b68a8e187355373e0a0774c93`

### Same-character duplicate override

- structural context: `selector_table_B_slot_01`
- Object-1 offset: `0x25520`
- physical: `0x87174`
- raw record SHA-256: `431d31b771524d80c2addaa8ccbd724a6e656775f9039eb2a2f1785c04dcab96`

The semantic labels are inherited from O75's executable-proven selection behavior. Player-number labels remain unpromoted.

## Rendering relation

O77 reuses the independently established MK2 renderer relation:

`opaque source index N (1..63) -> palette-record colour N-1 (0..62)`

The exact 6-bit DAC triples are converted to PNG RGB8 only for display using `round(component * 255 / 63)`.

## Exported package

- filename: `MK2_O77_LK0_PALETTE_CONTEXT_RGBA_PACKAGE.zip`
- 36 indexed streams × 2 semantic palette contexts = **72 RGBA PNGs**
- 2 exact palette binaries
- 2 manifests
- 1 README
- total entries: **77**
- byte length: **1,659,164**
- SHA-256: `04723ef7c8f69099875746e76d7dd30aa297ccb121b89ae6e68d0d7ffb49f836`
- ZIP: STORE-only
- PNG: RGBA8 / filter 0 / stored-DEFLATE zlib

A second regeneration produced byte-identical package bytes and the same SHA-256.

## Validation

- TypeScript implementation checks: **14/14**
- independent Python reconstruction: **281/281**
- source/UI integration audit: **33/33**
- targeted core TypeScript: passed
- targeted MK2 panel TypeScript: passed

The independent audit freshly decodes all 36 `LK0.GRA` streams from authentic bytes and compares all 72 packaged PNG RGBA buffers byte-for-byte. It does not call the O77 TypeScript implementation.

## Boundaries

O77 establishes exactly:

`identity slot 1 -> LK0.GRA offset 0 -> exact-full 36-stream resource -> palette slot 1 -> default + same-character duplicate override palettes -> 72 correct-colour RGBA fixtures`

O77 does **not** establish:

- palette ownership for `LK1.GRA` or any later `LK` resource;
- palette ownership for the whole `LK` family;
- a human fighter name for `LK`;
- Player 1 / Player 2 labels for side indices;
- the meaning of O75 mode value 4;
- a shared MK1/MK2 palette abstraction.

Visual appearance is not used as identity evidence.
