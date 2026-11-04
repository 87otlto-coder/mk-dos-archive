# MK DOS Archive — Checkpoint — Pass 1E.3O.72 MK2 Bound-LE Fixup / Palette Pointer Provenance

## Status

**VERIFIED BOUND DOS/4GW LE FILE/PAGE/FIXUP MAPPING / O67 POST-LE OVERLAY INTERPRETATION SUPERSEDED / TWO 17-SLOT PALETTE SELECTOR TABLES RESOLVED / JC0 SLOT OWNERSHIP STILL UNRESOLVED / INDEPENDENT 63/63 AUDIT PASSED / SOURCE+UI 34/34 AUDIT PASSED / ONE-PASS PAUSE REACHED**

O72 addresses the exact blocker left by O71: trustworthy provenance for relocation-sensitive MK2 palette pointers. It establishes the bound DOS/4GW module base, corrects the physical LE data-page mapping, independently parses the complete LE fixup surface, and resolves a bounded palette-selector caller family through authentic fixups to exact counted palette records. It deliberately does **not** assign one selector slot to `JC0.GRA` or emit correct-colour RGBA.

## Authentic executable anchor

Canonical `MK2.EXE` remains:

- byte length: **861,133** (`0xD23CD`);
- SHA-256: `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.

O72 proves that the application LE is part of a **bound DOS/4GW module** beginning at physical `0x26654`.

At `0x26654 + 0x3C`, the embedded MZ header contains:

- `e_lfanew = 0x28B8`.

Therefore:

`0x26654 + 0x28B8 = 0x28F0C`

which lands exactly on the already-known MK2 LE header.

## Corrected LE page mapping

The LE header's data-pages value is:

- module-relative `0x3B600`.

For this bound executable the physical page-data start is therefore:

`0x26654 + 0x3B600 = 0x61C54`.

With:

- 113 module pages;
- page size 4096;
- final-page byte count `0x779` = 1913;

the final file-backed page ends exclusively at:

`0x61C54 + 112 × 0x1000 + 0x779 = 0xD23CD`,

which is **exactly executable EOF**.

This mechanically disproves the earlier O67 interpretation that bytes `0xABD79..EOF` formed a 157,268-byte post-LE overlay.

### Permanent correction

The following prior interpretation is now **SUPERSEDED**:

`UNRESOLVED_POST_LE_OVERLAY`

for the O68/O69 descriptor-bearing region.

The stronger O72 classification is:

`FILE_BACKED_LE_OBJECT2_DATA`

for the O68 descriptor corpus.

O69's previously qualified indexed decode/export results remain valid for the byte range it actually scanned; that scan is now understood as a **conservative subset of file-backed Object 2**, not an overlay census.

## Object mapping

The corrected bound-module mapping preserves the two LE objects:

- Object 1: relocation base `0x10000`, virtual size `0x3EE98`, page-map index 1, 63 pages, physical page-data start `0x61C54`;
- Object 2: relocation base `0x50000`, virtual size `0x86660`, page-map index 64, 50 pages, physical page-data start `0xA0C54`.

All 35 O68 JC0 descriptors map inside file-backed Object 2 under this corrected mapping.

## Complete LE fixup qualification

O72 reparses the real LE fixup structures directly from authentic `MK2.EXE`:

- fixup page table physical: `0x291CB`;
- fixup record table physical: `0x29393`;
- fixup record data end: `0x61AF3`;
- fixup section end: `0x61AF4`;
- corrected data pages start: `0x61C54`;
- padding between fixup section and page data: `0x160` bytes.

The 113 page-map entries are legal, sequential pages 1..113 with flag 0.

The complete fixup census is:

- **27,004 records**;
- all 27,004 targets are internal;
- source type 7 / 32-bit offset: **26,900**;
- source type 8 / 32-bit self-relative: **104**;
- target flags `0x10`: **21,118**;
- target flags `0x00`: **5,886**.

For **all 26,900** type-7 internal 32-bit offset fixups, the authentic source dword reproduces the parsed target object offset exactly.

There is one source crossing the truncated final module page. Only three source bytes are physically present; the fourth is implicit loader zero-fill. Reconstructing under that bounded zero-fill rule still yields the exact target object offset. This is preserved as a specific edge case rather than hidden.

## Palette selector pointer surface

O71's dynamic selector caller uses two relocation-sensitive table immediates. O72 resolves both through authentic LE fixups:

- immediate source physical `0x85AA5` → Object-2 offset `0x1C1B8` → table physical `0xBCE0C`;
- immediate source physical `0x85AAC` → Object-2 offset `0x1C1FC` → table physical `0xBCE50`.

Each table contains **17 dword slots**.

Every slot has its own authentic LE fixup. Across both tables:

- selector slots: **34**;
- exact selector-pointer fixups: **34**;
- all targets: Object 1;
- all targets decode under O71's code-proven counted palette grammar as **63-colour records**;
- unique palette records: **29**.

The two tables share slots/targets in part, including their later entries. O72 records exact slot→target provenance but does not infer user-facing fighter names from slot order.

## JC0 boundary

O72 materially strengthens JC0 **provenance**, not JC0 **palette ownership**.

Established now:

- the 35 JC0 descriptor records are file-backed Object-2 data;
- their `JC0.GRA` resource/decode/indexed-pixel relationship from O68 remains valid;
- O71's palette machinery is valid;
- the two 17-slot palette selector tables resolve to exact 63-colour records.

Still **not established**:

`JC0/resource identity → one concrete selector slot → one concrete palette record`.

Therefore:

- JC0 palette ownership: **UNRESOLVED**;
- correct-colour JC0 RGBA: **NOT ESTABLISHED**;
- no palette is assigned from filename `JC0`, visual plausibility, index compatibility, slot order, proximity, or MK1 roster assumptions.

## Validation

The O72 TypeScript implementation passes **15/15 internal checks**.

A separate Python auditor that does not call the TypeScript implementation passes **63/63 checks**. It independently rederives:

- embedded MZ / bound-module base;
- exact LE-header relation;
- corrected data-page physical start and exact EOF closure;
- both object/page geometries;
- page map;
- all **27,004** fixup records;
- all **26,900** type-7 raw source/target matches;
- the one final-page zero-fill edge case;
- both selector-table immediate fixups;
- all 34 selector-slot pointer fixups;
- all 29 unique 63-colour palette targets;
- the unresolved JC0 palette-slot boundary.

A separate source/UI audit passes **34/34 checks**. Targeted TypeScript compilation of the O67/O68/O71/O72 core path plus `MK2FoundationPanel.tsx` and app metadata also passes under the established archival React/lucide/`process` shims. The normal full dependency-backed Vite build remains outside the archival environment's available dependency cache and is not claimed.

## Verdict

`MK2_BOUND_LE_FIXUP_AND_PALETTE_POINTER_PROVENANCE_ESTABLISHED_JC0_SLOT_JOIN_UNRESOLVED`

Independent-audit verdict:

`MK2_O72_INDEPENDENT_AUDIT_PASSED`

Source/UI verdict:

`MK2_O72_SOURCE_UI_INTEGRATION_AUDIT_PASSED`

Per the user's timeout discipline, the project pauses after this **single major pass**. **O73 has not started.**

The recommended next single pass is a bounded MK2 **resource/character identity → palette selector-slot join**, beginning with JC0 only if MK2 code/data provides affirmative identity evidence. Slot order, filename semantics, visual plausibility and MK1 roster order are not acceptable substitutes.
