# MK DOS Archive — Checkpoint — Pass 1E.3O.71 MK2 Palette Storage / Selection Reconnaissance

## Status

**VERIFIED MK2 PALETTE MECHANISM / JC0 CONCRETE PALETTE OWNERSHIP UNRESOLVED / INDEPENDENT 55/55 AUDIT PASSED / SOURCE+UI 29/29 AUDIT PASSED / ONE-PASS PAUSE REACHED**

O71 is a bounded MK2-native palette reconnaissance pass. It establishes how authentic MK2 executable code stores, allocates, references, queues and transfers palettes. It deliberately does **not** assign a palette to `JC0.GRA` or emit correct-colour RGBA without an affirmative resource/selector relationship.

## Authentic executable anchors

O71 operates against canonical `MK2.EXE` SHA-256:

`fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`

The file-backed LE image contains the diagnostic strings:

- physical `0xA0E08`: `mk: Ran out of palettes in GETPAL.`
- physical `0xA0E2C`: `mk: Ran out of palettes in PALSET.`

These strings are retained as executable anchors. O71's stronger claims come from the independently inspected code paths below, not from the diagnostic names alone.

## Palette record grammar

The allocation routine at physical `0x7B439` directly reads:

- `word [EAX]` as a colour count;
- then advances the source pointer by two bytes;
- then queues that many 16-bit colour values.

Therefore the bounded record grammar is code-proven as:

`[u16le colourCount][colourCount × u16le packedColour]`

with total record length:

`2 + (2 × colourCount)` bytes.

O71 does **not** claim that every byte sequence matching this shape is a palette record. Concrete ownership still requires an affirmative runtime/code relationship.

## Palette handle model

The same allocator manages a **60-entry table**, each **8 bytes**, at runtime address `0x75B00`.

Established fields are:

- `+0x00`: 32-bit palette-record pointer;
- `+0x04`: 16-bit reference count;
- `+0x06`: 8-bit DAC start index;
- `+0x07`: uninterpreted.

The table initialiser clears `0x78` dwords = 480 bytes = 60 × 8 bytes.

MK2 object field **`+0x30`** stores the palette-handle index. A release bridge at physical `0x7B3F8` reads `word [object+0x30]` and sends it to the palette-release routine. Multiple independent allocator callers store the returned handle back into `word [object+0x30]`.

## Palette request queue and VGA transfer

The transfer path establishes a ring buffer from runtime `0x562D8` up to exclusive `0x563D8`:

- span: `0x100` bytes;
- entry size: **8 bytes**;
- capacity: **32 requests**.

Each request contains:

- `+0x00`: 32-bit source-colour pointer;
- `+0x04`: 16-bit DAC start index;
- `+0x06`: 16-bit colour count.

The transfer routine waits on VGA status port `0x3DA`, writes a start index to `0x3C8`, and writes colour components to `0x3C9`. For each packed 16-bit source colour it emits three bounded 6-bit components using the executable's exact formulas:

- `((packed >> 9) & 0x3F) | 1`
- `((packed >> 4) & 0x3F) | 1`
- `((packed << 1) & 0x3F) | 1`

The order is classified only as the observed **VGA DAC write sequence**. O71 does not infer a wall-clock timing model from the retrace polling.

## Selection surface

A bounded direct-call census finds **15 direct file-backed calls** to the palette allocator at physical `0x7B439`:

`0x81DDA, 0x85ABF, 0x85C79, 0x86B1F, 0x989AF, 0x98C65, 0x98C79, 0x98D6F, 0x995A6, 0x9964F, 0x997BA, 0x9AB0E, 0x9ABD9, 0x9D626, 0x9E3BE`.

Affirmatively established patterns include:

- dynamic table selection → allocator → `object+0x30`;
- pointer-indirect selection → allocator → `object+0x30`;
- nonzero `structure+4` palette pointer → allocator → `object+0x30`;
- a control/bytecode stream carrying a dword palette pointer into the allocator;
- a sequential multi-palette block routine at physical `0x98C45` that reads a palette-record count immediately before the first record and walks records as `next = current + 2 + 2*colourCount`.

Several other callers contain raw immediates whose runtime identity is relocation-sensitive. O71 does **not** resolve those immediates because the quick reconnaissance of LE fixup source-to-file mapping was not independently qualified. They are therefore excluded from concrete palette identity claims.

## JC0 boundary

The independently verified O68 surface remains:

- resource ID / executable pool ordinal: **109** = `JC0.GRA`;
- **35** qualified descriptor streams;
- exact full-resource tiling;
- opaque indexed domain: **1..63**;
- descriptor corpus location: `UNRESOLVED_POST_LE_OVERLAY`.

The 12-byte JC0 descriptor form carries geometry/placement plus the packed resource reference; O71 establishes no palette field in that descriptor form. More importantly, O71 does not establish an affirmative selector/data-flow join from JC0 resource identity or those post-LE records to one concrete palette record.

Therefore:

- `JC0` palette ownership: **UNRESOLVED**;
- correct-colour JC0 RGBA: **NOT ESTABLISHED**;
- no palette is selected by filename, visual plausibility, index compatibility, proximity, or MK1 structure.

## Correction preserved: the naive 223-record scan

During reconnaissance, a broad byte-shape scan found a long chain of **223 structurally compatible** `[count][u16…]` records and was initially treated as a possible palette corpus.

That interpretation is **not promoted**. Follow-up relocation/fixup reconnaissance showed that structural compatibility alone is insufficient to classify every member, and the quick ad-hoc fixup source-to-file mapping was itself not independently qualified. O71 therefore retreats to the stronger evidence boundary:

- the palette-record **grammar** is code-proven;
- the allocator/handle/queue/DAC mechanism is code-proven;
- selected local records may be retained as `STRUCTURAL_CANDIDATE_ONLY_NOT_OWNERSHIP`;
- the broad 223-record chain is **not** called a verified palette corpus.

This correction is part of the permanent project history.

## Validation

The O71 implementation performs **29/29 internal checks** against authentic MK2 bytes.

A separate Python auditor, which does not call the TypeScript implementation, passes **55/55 checks**. It independently verifies:

- canonical executable identity and file-backed LE boundary;
- GETPAL/PALSET diagnostic anchors;
- exact hashes of 11 bounded palette-related code spans;
- all 15 direct allocator call sites;
- 32-slot queue geometry and request-field writes;
- 60-entry handle-table geometry;
- palette-record count/read/advance behavior;
- object `+0x30` release and assignment paths;
- VGA ports and all three packed-colour component transforms;
- sequential palette-block traversal;
- structural-candidate-only policy and rejection of the naive 223-record promotion;
- independent reconstruction of the O68 JC0 35-stream / exact-tiling / 1..63 indexed boundary;
- zero promotion of JC0 palette ownership or correct-colour RGBA.

A source/UI audit passes **29/29 checks**. The MK2 foundation panel now runs O67→O71 and exposes O71's JSON evidence while keeping the JC0 palette warning explicit. MK1's established workflow remains separate.

## Verdict

`MK2_PALETTE_STORAGE_ALLOCATION_AND_DAC_TRANSFER_ESTABLISHED_JC0_BINDING_UNRESOLVED`

Independent-audit verdict:

`MK2_O71_PALETTE_MECHANISM_INDEPENDENT_AUDIT_PASSED`

Source/UI verdict:

`MK2_O71_SOURCE_UI_INTEGRATION_AUDIT_PASSED`

Per the user's timeout discipline, the project pauses after this **single major pass**. **O72 has not started.**
