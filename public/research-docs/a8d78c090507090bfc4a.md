# MK DOS Archive — Checkpoint — Pass 1E.3O.73 MK2 JC0 Resource / Palette Selector Slot Join

## Status

**VERIFIED MK2 OBJECT +0x46 IDENTITY SELECTOR / 17-SLOT RESOURCE-FAMILY TABLE BOUNDED / JC0.GRA → IDENTITY SLOT 2 → PALETTE SLOT 2 ESTABLISHED / TWO EXACT 63-COLOUR RECORDS RESOLVED / HUMAN SLOT NAMES PARTIAL / NO RGBA EMITTED / INDEPENDENT 93/93 AUDIT PASSED / SOURCE+UI 34/34 AUDIT PASSED / ONE-PASS PAUSE REACHED**

O73 closes the exact provenance gap left by O72. It does not infer fighter identity from roster order or resource naming. Instead it follows the same MK2 object field used by the palette selector into a separate relocatable per-character resource/animation table and proves that selector value **2** reaches the already-authenticated `JC0.GRA` descriptor family. Because O71/O72's palette path is indexed by that same object field, JC0 is now mechanically joined to palette selector slot 2 and its two exact 63-colour records. Palette-context names and correct-colour RGBA remain deferred.

## Authentic executable anchor

Canonical `MK2.EXE` remains:

- byte length: **861,133**;
- SHA-256: `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.

O72's corrected bound-LE mapping remains authoritative:

- bound module base: `0x26654`;
- LE header: `0x28F0C`;
- file-backed page-data start: `0x61C54`;
- Object 2 page-data start: `0xA0C54`;
- O68 descriptor region classification: `FILE_BACKED_LE_OBJECT2_DATA`.

## The selector index is object field +0x46

Authentic code at physical `0x91909` contains the bounded sequence:

`mov eax,[edi+0x46]`

followed by an indexed read from Object-2 table offset:

`0x1D588`.

Therefore object field `+0x46` directly selects one of **17 per-character resource/animation slots**.

O71/O72's palette-selector caller uses the same object field `+0x46` to index the two 17-slot palette tables at Object-2 offsets:

- table A: `0x1C1B8`;
- table B: `0x1C1FC`.

This establishes a shared numeric identity axis between the resource/animation selector and palette selector without assigning human fighter names from table order.

## 17-slot resource-family skeleton

Every one of the 17 entries in the Object-2 `0x1D588` table is an authentic type-7 LE relocation to Object 2. Bounded relocation witnesses reach already-qualified O69 descriptors with the following resource-family pattern:

`HH, LK, JC, BA, FN, FN, ST, RD, NJ, NJ, NJ, JX, GO, SK, NJ, NJ, FN`

This is deliberately a **resource-family identity skeleton**, not a complete human-readable roster mapping.

The evidence supports resource-family labels because the pointer chains terminate at authenticated GRA descriptors. It does **not** support assigning unique human names to all shared-family or special slots merely from expected roster order, filename conventions, or game knowledge.

Shared-family slots retained without unique human names include:

- FN family: slots 4, 5, 16;
- NJ family: slots 8, 9, 10, 14, 15.

Special resource-only slots 12 and 13 are retained as `GO` and `SK` resource identities only.

## Decisive JC0 join

Selector slot **2** points to Object-2 subtable offset `0xBC6C`.

Within that selected structure, the authentic relocation source at Object-2 `0xBCAC` points to:

- descriptor Object-2 offset `0x24784`;
- physical `MK2.EXE` offset `0xC53D8`.

That descriptor is the exact O68/O69 authenticated first `JC0.GRA` descriptor:

- width: 47;
- height: 100;
- placement: `(22,-12)`;
- packed resource reference: `0x6D000000`;
- resource-pool ordinal / resource ID: **109**;
- executable filename-pool entry 109: `JC0.GRA`;
- GRA offset: `0`.

Therefore the following relationship is mechanically established from MK2-native evidence:

`JC0.GRA → object identity value 2`.

No roster-order assumption is required.

## Palette selector join

Because the O71/O72 palette selector indexes its two 17-slot tables with the same object `+0x46` value, JC0's proven identity value 2 selects **palette slot 2** in both tables.

O72's validated fixups resolve those two slot-2 entries to exact Object-1 counted palette records:

- table A slot 2 → Object-1 `0x2574A` → physical `0x8739E` → **63 colours**;
- table B slot 2 → Object-1 `0x257CA` → physical `0x8741E` → **63 colours**.

O73 therefore establishes:

`JC0.GRA → identity slot 2 → palette selector slot 2 → two exact 63-colour palette records`.

## Deliberate boundaries

Still **not established** in O73:

- which of the two JC0 palette records is "normal", "alternate", P1, P2, or another gameplay context;
- a complete human-readable name for every one of the 17 identity slots;
- correct-colour JC0 RGBA output;
- universal fighter-resource/palette rules beyond the bounded 17-slot evidence;
- a shared MK1/MK2 semantic abstraction.

No human fighter name is assigned from resource prefixes such as `JC`, `FN` or `NJ` alone. The resource labels are provenance identifiers, not user-facing semantic proof.

## Validation

The O73 TypeScript implementation passes **69/69 internal checks**.

A separate Python auditor that does not call the TypeScript O73 implementation passes **93/93 checks**. It independently reparses:

- the bound LE mapping;
- all 27,004 LE fixups sufficiently to reconstruct the relevant pointer surface;
- the physical code signature at `0x91909`;
- the 17 relocatable entries in Object-2 table `0x1D588`;
- all bounded resource-family witness chains;
- the executable resource filename pool and `JC0.GRA` ordinal 109;
- the exact JC0 descriptor at physical `0xC53D8`;
- palette table A/B slot 2 fixups;
- the exact Object-1 targets `0x2574A` / `0x257CA` and their 63-colour counts;
- the human-name and no-RGBA boundaries.

A source/UI audit passes **34/34 checks**. Targeted TypeScript compilation of the O73 core module, MK2 panel and app metadata passes under the established archival React/lucide/`process` shims. A full dependency-backed Vite build is still not claimed in the archival environment.

## Verdict

`MK2_JC0_RESOURCE_TO_PALETTE_SELECTOR_SLOT_JOIN_ESTABLISHED_HUMAN_SLOT_NAMES_PARTIAL`

Independent-audit verdict:

`MK2_O73_INDEPENDENT_AUDIT_PASSED`

Source/UI verdict:

`MK2_O73_SOURCE_UI_INTEGRATION_AUDIT_PASSED`

Per the one-major-pass timeout discipline, the project pauses after O73. **O74 has not started.**

The recommended next single pass is O74: use the two now-proven JC0 palette records with O68's indexed pixels and O71's code-proven packed-colour→VGA DAC conversion to render and independently verify two explicit **unnamed palette-context** JC0 RGBA sets. Do not call the contexts normal/alternate until their gameplay meaning is independently qualified.
