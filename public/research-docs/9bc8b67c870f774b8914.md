# MK DOS Archive — Checkpoint — Pass 1E.3O.74 MK2 JC0 Verified Unnamed Palette-Context RGBA Fixtures

## Status

**VERIFIED JC0 SLOT-2 PALETTE OWNERSHIP INHERITED FROM O73 / MK2 RENDERER ONE-BASED INDEX→PALETTE MAPPING ESTABLISHED / TWO UNNAMED 63-COLOR CONTEXTS RENDERED / 70 RGBA PNGs ESTABLISHED / PACKAGE DETERMINISTIC / INDEPENDENT 268/268 AUDIT PASSED / SOURCE+UI 31/31 AUDIT PASSED / ONE-PASS PAUSE REACHED**

O74 closes the exact rendering step left open by O73. It does not broaden palette ownership beyond `JC0.GRA` and does not assign gameplay meaning to the two selector contexts.

## Authentic anchors

- `MK2.EXE` SHA-256: `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`
- `JC0.GRA` SHA-256: `ef7b96d1725f45386f9503b252602db3ae22ab7ef638a3f1add91adb42079f1b`
- O68 JC0 streams: **35**
- O68 opaque source-index domain: **1..63**
- O73 identity/palette selector slot: **2**

O73 remains the ownership authority: `JC0.GRA → object identity 2 → palette selector slot 2`.

## Exact palette records

### `selector_table_A_slot_02`
- Object-1 offset: `0x2574A`
- physical: `0x8739E`
- color count: **63**
- raw 128-byte record SHA-256: `7adc8dc507fe4f8008179bb711de2f0c16e24bcbe989074f33352890080badec`

### `selector_table_B_slot_02`
- Object-1 offset: `0x257CA`
- physical: `0x8741E`
- color count: **63**
- raw 128-byte record SHA-256: `f9d2bf2a5327d4dd0b761a948e2c883831ad654820869c214bea797e44a3130e`

These are structural selector-table names only. O74 does **not** rename them normal/alternate, P1/P2, primary/secondary, or any other gameplay semantic.

## MK2-native source-index → palette-entry relation

O74 independently closes the remaining off-by-one question in authentic renderer code.

At physical `0x659EA`, MK2 reads the palette handle DAC-start byte from the 8-byte handle table at field `+0x06`, then decrements that byte. The resulting value indexes the authentic 256-entry replicated-byte lookup table at Object-2 `0x1084` / physical `0xA1CD8`, whose entries are exactly `00 00 00 00`, `01 01 01 01`, ..., `FF FF FF FF`.

At physical `0x65A14`, the renderer executes the bounded dword loop equivalent to:

`load packed source indices → add replicated (DAC_start - 1) offset → store`

O71 independently established that palette-record color 0 is transferred beginning at the palette handle's DAC-start index. Therefore:

**opaque JC0 source index N (1..63) → palette-record color N-1 (0..62)**.

This relation is code-derived; it is not inferred from the coincidental equality of the 63 source indices and 63 palette colors.

## RGBA display conversion

O71's MK2 executable-proven DAC component formulas remain authoritative:

- `((packed >> 9) & 0x3F) | 1`
- `((packed >> 4) & 0x3F) | 1`
- `((packed << 1) & 0x3F) | 1`

For PNG display only, O74 expands each 6-bit DAC component to 8-bit using deterministic:

`round(component * 255 / 63)`

This display expansion is explicitly recorded as `ROUND_DAC6_TIMES_255_OVER_63`; the exact 6-bit DAC triples are preserved in the palette manifest.

## Export surface

O74 renders all **35** O68 JC0 indexed sprites under both exact selector contexts:

- 35 sprites × 2 contexts = **70 RGBA PNGs**
- 2 raw palette-record binaries
- 2 manifests
- 1 README
- total entries: **75**

Accepted package:

- filename: `MK2_O74_JC0_PALETTE_CONTEXT_RGBA_PACKAGE.zip`
- byte length: **1,617,629**
- SHA-256: `d5b76bd511b5f985c1968126788925a92da669bda84a500cb405b326c95dcfd7`
- outer ZIP: `ZIP_STORE_ONLY`
- PNG: RGBA8, filter 0, zlib stored-DEFLATE

A second regeneration from the same authentic fixture reproduced the package **byte-for-byte identically** at the same SHA-256.

## Independent validation

The TypeScript O74 implementation passes **13/13** internal checks.

A separate Python auditor that does not call the TypeScript O74 implementation passes **268/268 checks**. It independently:

- verifies authentic executable/resource hashes;
- verifies the renderer's DAC-start decrement and replicated-byte LUT;
- verifies both exact 63-color palette records and their raw hashes;
- independently rediscovers and decodes all 35 JC0 descriptor streams from authentic bytes;
- confirms exact JC0 full-resource tiling and the 1..63 opaque domain;
- reconstructs both palette-context RGBA outputs for every sprite;
- parses all 70 PNGs including PNG CRCs, zlib payloads, filter state and dimensions;
- compares every PNG RGBA buffer byte-for-byte;
- validates both raw palette binaries, both manifests, README, ZIP inventory and package SHA.

Source/UI integration passes **31/31** checks. Targeted TypeScript compilation of the modified MK2 panel plus O74 module passes under the established archival shims. Runner and Python auditors are syntax-clean.

## Boundaries

O74 establishes exactly:

`O73-qualified JC0 selector slot 2 → two exact palette records → source index N maps to record color N-1 → 70 deterministic RGBA fixtures`

O74 does **not** establish:

- a unique human fighter name from selector slot 2;
- normal/alternate or player-number meaning for the two contexts;
- palette ownership for `JC1.GRA` through `JC5.GRA` merely by family association;
- palette ownership for any other O69 resource family;
- any shared MK1/MK2 palette abstraction.

The prior unintegrated source draft that incorrectly described this work as an O73 correct-color pass has been removed. The accepted chronology remains O73 = resource/palette-slot join, O74 = RGBA rendering/validation.

## Verdict

`MK2_JC0_TWO_UNNAMED_PALETTE_CONTEXT_RGBA_FIXTURES_ESTABLISHED`

Independent audit:

`MK2_O74_INDEPENDENT_RGBA_AUDIT_PASSED`

Source/UI audit:

`MK2_O74_SOURCE_UI_INTEGRATION_AUDIT_PASSED`

Per the user's timeout discipline, pause after this single major verification pass. **O75 has not started.**
