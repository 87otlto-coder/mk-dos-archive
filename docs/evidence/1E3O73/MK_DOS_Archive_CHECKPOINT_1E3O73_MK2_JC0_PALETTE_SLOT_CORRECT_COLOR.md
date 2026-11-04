# MK DOS Archive — Checkpoint — Pass 1E.3O.73 MK2 JC0 Selector Slot + Correct-Color RGBA

## Status

**VERIFIED SHARED CHARACTER/PALETTE SLOT INDEX / JC0 RESOURCE FAMILY JOINED TO SLOT 2 / TWO SLOT-2 63-COLOR PALETTE RECORDS QUALIFIED / ONE-BASED PIXEL→PALETTE MAPPING VERIFIED / 70 CORRECT-COLOR JC0 PNGs ESTABLISHED / HUMAN FIGHTER NAME AND NORMAL-ALTERNATE LABELS NOT PROMOTED / INDEPENDENT 36/36 AUDIT PASSED / SOURCE+UI 41/41 AUDIT PASSED / ONE-PASS PAUSE REACHED**

O73 addresses the exact identity blocker left by O72. O72 had resolved two 17-slot palette-selector tables to exact 63-color records, but had deliberately not established which slot belongs to `JC0.GRA`. O73 proves the shared selector index from authentic MK2 code, joins slot 2 to the complete O68 JC0 descriptor set through a separate per-character animation-family table, proves the renderer's one-based sprite-index→palette-entry relation, and exports the first bounded correct-color MK2 fighter asset set.

O73 deliberately does **not** infer a human fighter name from slot number and does **not** rename the two selector states as normal/alternate. They remain `table_A_slot_02` and `table_B_slot_02` until those higher-level semantics are independently established.

## Authentic anchors

Canonical `MK2.EXE`:

- byte length: **861,133**;
- SHA-256: `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.

Canonical `JC0.GRA`:

- byte length: **120,240**;
- SHA-256: `ef7b96d1725f45386f9503b252602db3ae22ab7ef638a3f1add91adb42079f1b`;
- O68 qualified streams: **35**;
- O68 opaque source index domain: **1..63**.

O72's corrected bound-LE mapping remains authoritative. The O68 descriptor corpus is file-backed Object-2 data, not a post-LE overlay.

## Shared selector identity field

The O71/O72 palette-table helper at physical `0x64ED2` indexes by:

`dword [object + 0x46]`.

A separate MK2 animation-family helper at physical `0x918F1` independently reads the same:

`dword [object + 0x46]`

and uses it to index a 17-entry Object-2 animation-family table.

The animation-family table is:

- Object-2 offset `0x1D544`;
- physical `0xBE198` under the O72 mapping.

Slot **2** resolves by authentic LE fixup to:

- Object-2 family offset `0xBB64`;
- physical `0xAC7B8`.

This establishes a shared native identity index between palette selection and character animation-family selection. O73 does not require or infer a human-readable roster name for the slot.

## Exact JC0 resource-family join

Five directly table-selected substreams under slot-2 family `0xBB64` contain fixup-backed descriptor references to the O68 JC0 set:

- root `0xBC88` → next `0xBCE4`: **7** JC0 references;
- root `0xBCE4` → next `0xBD14`: **3** references;
- root `0xBD80` → next `0xBDDC`: **9** references;
- root `0xC1AE` → next `0xC25A`: **8** references;
- root `0xC546` → next `0xC5B2`: **8** references.

Total: **35** references.

The terminal descriptor target set matches the complete O68 JC0 descriptor set exactly:

- O68 JC0 descriptors: **35**;
- direct slot-2 JC0 descriptor references: **35**;
- unique matched descriptors: **35**;
- every O68 JC0 descriptor referenced exactly once across the bounded five spans;
- no non-JC0 descriptor target appears inside those five selected spans.

The broader slot-2 family can reference other resource data elsewhere, so O73 does not claim that every byte/stream in family `0xBB64` is JC0-only. The qualified claim is the exact complete JC0 join above.

Bounded identity label:

`JC_RESOURCE_FAMILY_SLOT_2`

Human character name from slot index: **NOT PROMOTED**.

## Slot-2 palette records

O72's two 17-slot palette tables are now joined to JC0 through the shared slot-2 identity.

### `table_A_slot_02`

- selector table Object-2 offset: `0x1C1B8`;
- palette record Object-1 offset: `0x2574A`;
- physical record: `0x8739E`;
- color count: **63**;
- raw 128-byte record SHA-256: `7adc8dc507fe4f8008179bb711de2f0c16e24bcbe989074f33352890080badec`.

### `table_B_slot_02`

- selector table Object-2 offset: `0x1C1FC`;
- palette record Object-1 offset: `0x257CA`;
- physical record: `0x8741E`;
- color count: **63**;
- raw 128-byte record SHA-256: `f9d2bf2a5327d4dd0b761a948e2c883831ad654820869c214bea797e44a3130e`.

The two states remain named exactly as above. **Normal/alternate semantics are not established by O73.**

## Exact sprite-index → palette-entry mapping

The MK2 renderer at physical `0x659C6` reads the palette handle's DAC start byte at handle `+0x06`, then decrements that start value before applying a four-byte replicated lookup-table offset to source pixel bytes.

O72-corrected fixup provenance resolves the renderer's lookup-table reference to:

- Object-2 offset `0x1084`;
- physical `0xA1CD8`.

The authentic 256-entry lookup table is exactly:

- entry 0 = `00 00 00 00`;
- entry 1 = `01 01 01 01`;
- ...;
- entry 255 = `FF FF FF FF`.

All 256 entries are verified.

O71 had already proven that palette-record color 0 is queued at the palette handle's DAC start index. Combining those independently proven mechanisms gives the exact mapping:

**opaque sprite index N (1..63) → palette record color N-1 (0..62)**.

This removes the previous off-by-one ambiguity without relying on the convenient numerical equality between 63 opaque source indices and 63 palette colors.

## Correct-color export surface

O73 renders every O68 JC0 indexed sprite under both qualified slot-2 selector states:

- JC0 sprites: **35**;
- selector states: **2**;
- correct-color RGBA PNGs: **70**.

The visualization converts O71's code-proven 6-bit DAC components to 8-bit display channels using deterministic `round(component × 255 / 63)` scaling. Transparency comes from the independently decoded O68 mask; index 0 is not treated as an inferred color.

The package contains:

- **70** RGBA PNGs;
- **2** raw 128-byte palette records;
- **2** manifests;
- **1** README;
- total ZIP entries: **75**.

Accepted package:

- filename: `MK2_O73_JC0_CORRECT_COLOR_PACKAGE.zip`;
- byte length: **1,615,157**;
- SHA-256: `20b4dd43702e77bd89da2a2f89ac82bbfbd8ecb43d819769caacc25735135671`;
- outer encoding: `ZIP_STORE_ONLY`;
- PNG encoding: deterministic RGBA8/filter-0/stored-DEFLATE.

A second independent regeneration from the same authentic fixture produced the package **byte-for-byte identically** at the same SHA-256.

## Semantic boundaries

O73 establishes:

`object+0x46 identity slot 2 → slot-2 animation family → complete JC0 descriptor set`

and independently:

`object+0x46 identity slot 2 → table A/B slot-2 palette records`

plus:

`sprite index N → palette color N-1`.

Therefore correct-color JC0 RGBA is established for the two explicit selector states.

O73 does **not** establish:

- that slot 2's canonical human-facing name is Johnny Cage;
- that `table_A` means normal and `table_B` means alternate, or vice versa;
- a universal palette binding for JC1..JC5;
- palette ownership for the broad O69 94-resource corpus;
- palette ownership for the O69 partial/ambiguous or zero-candidate resources;
- any shared MK1/MK2 palette abstraction.

Existing human-name strings and roster-looking tables in MK2 are retained as context only because their numeric identity field has not yet been mechanically joined to `object+0x46`.

## Validation

The O73 TypeScript implementation passes **17/17 internal checks**.

A separate Python auditor that does not call the TypeScript O73 implementation passes **36/36 checks**. It independently:

- reparses authentic LE fixups;
- confirms the shared `object+0x46` palette/animation index;
- resolves slot 2 and the five bounded JC0-bearing substreams;
- rederives the exact 35/35 JC0 descriptor join;
- independently decodes all 35 JC0 streams and full-resource tiling;
- independently resolves both slot-2 63-color palette records;
- independently verifies the 256-entry replicated-byte LUT and renderer decrement;
- reconstructs all 70 expected RGBA payloads;
- parses the finished PNGs, including PNG CRC/zlib/filter state;
- compares all **70 PNG RGBA buffers byte-for-byte**;
- validates both raw palette binaries, manifests, README, inventory and accepted package SHA.

The source/UI integration audit passes **41/41 checks**. Targeted TypeScript compilation of the O67–O73 core path plus `MK2FoundationPanel.tsx` passes under the established archival React/lucide/`process` shims. Runner and Python audit syntax checks also pass.

A full dependency-backed Vite build remains unclaimed in the archival environment because `node_modules` are not bundled; this is an environment boundary, not a detected O73 source failure.

## Verdict

`MK2_JC0_SELECTOR_SLOT_2_AND_TWO_STATE_CORRECT_COLOR_RGBA_ESTABLISHED`

Independent-audit verdict:

`MK2_O73_INDEPENDENT_AUDIT_PASSED`

Source/UI verdict:

`MK2_O73_SOURCE_UI_INTEGRATION_AUDIT_PASSED`

Per the user's timeout discipline, the project pauses after this **single major pass**. **O74 has not started.**

The recommended next single pass should first reassess research value. A sensible candidate is to determine whether the same `object+0x46` identity graph can qualify palette ownership for the remaining directly character-bound MK2 resource families without assuming that every resource in a character family uses the body palette. Any expansion must preserve effect/cross-resource exceptions explicitly.
