# MK DOS Archive — Checkpoint — Pass 1E.3O.75 MK2 Palette Selector Gameplay Semantics

## Status

**VERIFIED TABLE-A DEFAULT SEMANTICS / VERIFIED TABLE-B SAME-CHARACTER DUPLICATE OVERRIDE SEMANTICS / JC0 O74 RGBA CONTEXTS SEMANTICALLY ALIASED WITHOUT PIXEL OR PACKAGE CHANGE / PLAYER-NUMBER LABELS NOT PROMOTED / MODE-4 MEANING UNKNOWN / INDEPENDENT 52/52 AUDIT PASSED / SOURCE+UI 31/31 AUDIT PASSED / ONE-PASS PAUSE REACHED**

O75 resolves the gameplay selection meaning of the two 17-slot palette tables established in O72 and joined to JC0 in O73. It does not alter O74 pixels or package paths.

## Authentic anchors

- `MK2.EXE` SHA-256: `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`
- palette/object creation routine: physical `0x85BE3`
- runtime palette-change routine: physical `0x85A6B`
- table A Object-2 offset: `0x1C1B8`
- table B Object-2 offset: `0x1C1FC`
- side-index scratch/global: `0x75A64`
- first-side selected identity global: `0x75FCE`
- unnamed mode global: `0x7650A`
- object identity field: `+0x46`
- object palette-handle field: `+0x30`
- object flags field: `+0x34`
- duplicate-palette flag bit: `0x40`

## Creation-time selector rule

The authentic creation routine loads table A before any duplicate check.

It retains table A when any of these conditions applies:

1. unnamed mode global equals numeric value `4`;
2. side index is `0`;
3. side index is nonzero but the candidate character identity does not equal the already-selected first-side identity.

It switches to table B only when:

- unnamed mode is not `4`;
- side index is nonzero; and
- candidate identity equals the first-side selected identity.

That same path adds flag `0x40` before object creation.

The chosen table is then indexed by the candidate identity (`identity * 4 + table`), the pointed palette record is allocated, the resulting handle is stored to object `+0x30`, and identity is stored to object `+0x46`.

## Independent side-ordering evidence

Two separate creation sequences independently establish the ordering convention:

- first selected identity is written to global `0x75FCE`, side index is set to `0`, then the object is created;
- second selected identity is written to global `0x76152`, side index is set to `1`, then the object is created.

Therefore O75 may state that side index 0 is created first and side index 1 is created second. It does **not** rename those numeric sides `Player 1` / `Player 2`; that UI/controller-number join remains outside this pass.

## Runtime toggle rule

The separate runtime update routine compares object `+0x46` against the same first-side identity global and consults object flag `0x40`.

- unflagged + identity becomes equal → set `0x40` and select table B;
- flagged + identity stops matching → clear `0x40` and select table A;
- equality state unchanged → no palette-table change.

This independent update path corroborates that table B is not a generic second palette. It is the conditional same-character duplicate override.

## Qualified semantic labels

The evidence supports these labels:

- **table A:** `DEFAULT_CHARACTER_PALETTE`
- **table B:** `SAME_CHARACTER_DUPLICATE_OVERRIDE_PALETTE`

For JC0 identity slot 2, O74's existing structural contexts therefore gain semantic aliases:

- `selector_table_A_slot_02` → `DEFAULT_CHARACTER_PALETTE`
- `selector_table_B_slot_02` → `SAME_CHARACTER_DUPLICATE_OVERRIDE_PALETTE`

O75 does not rename files inside the accepted O74 ZIP and does not regenerate its pixels.

## O74 relationship

O74 remains the rendering authority:

- 35 JC0 sprites;
- two exact slot-2 palette records;
- 70 correct-color RGBA PNGs;
- accepted O74 package SHA-256 `d5b76bd511b5f985c1968126788925a92da669bda84a500cb405b326c95dcfd7`.

O75 changes only the semantic interpretation of those two already-verified structural contexts.

## Validation

O75 implementation passes **17/17** internal checks.

A completely separate Python auditor passes **52/52** checks. It independently verifies:

- default table-A load;
- mode-value-4 bypass;
- side-index-0 bypass;
- first-side identity comparison;
- table-B fallthrough only on matching duplicate identity;
- flag `0x40` insertion;
- table lookup / palette allocation / object field stores;
- two independent side-0 then side-1 creation sequences;
- runtime set/clear `0x40` and B/A transitions;
- JC0 O73/O74 semantic alias attachment;
- preservation of player-number and mode-4 naming boundaries.

Source/UI integration passes **31/31** checks. Targeted TypeScript compilation passes under the established archival React/lucide/Node shims.

## Boundaries

O75 establishes exactly:

`table A = default palette`

and

`table B = same-character duplicate override palette for a nonzero side whose identity matches the already-selected first-side identity, except when unnamed mode value 4 suppresses that override`.

O75 does **not** establish:

- numeric side 0/1 equals UI label Player 1/Player 2;
- the semantic meaning of mode global value `4`;
- palette ownership beyond identities already mechanically joined by prior passes;
- any new RGBA pixels or package contents;
- a shared MK1/MK2 palette abstraction.

## Verdict

`MK2_PALETTE_SELECTOR_DEFAULT_AND_SAME_CHARACTER_DUPLICATE_OVERRIDE_SEMANTICS_ESTABLISHED`

Independent audit:

`MK2_O75_INDEPENDENT_SELECTOR_SEMANTICS_AUDIT_PASSED`

Source/UI audit:

`MK2_O75_SOURCE_UI_INTEGRATION_AUDIT_PASSED`

Per the user's timeout discipline, pause after this single major verification pass. **O76 has not started.**
