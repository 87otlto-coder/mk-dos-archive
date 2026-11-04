# MK DOS Archive — Pass 1E.3N Unresolved Character Slot 7 Qualification

25 September 2026

## Prior checkpoint carried forward

Pass 1E.3M established enough repeated runtime evidence that the first seven selectable-roster palette slots no longer need to be treated as a Kano-only hypothesis.

Runtime-supported results at this checkpoint:

- slot 0 / Cage normal `GRIMM_P` — real-fixture / runtime verified;
- slot 1 / Kano normal `KANO_P` — runtime verified from the earlier bounded edit;
- slot 1 / Kano alternate `KANO3_P` — real-fixture / runtime verified;
- slot 2 / Rayden normal `RAIDEN_P` — real-fixture / runtime verified;
- slot 2 / Rayden alternate `RAIDEN3_P` — real-fixture / runtime verified;
- slot 4 / Scorpion normal `YNINJA_P` — runtime corroborated from imagery, without an independently reconciled returned export artifact in that checkpoint.

The repeated mechanism now supported by both binary reconstruction and runtime behavior is:

`character index → NORMAL_PALETTES[index]`

and, after the already verified same-character equality transition:

`character index → ALTERNATE_PALETTES[index]`

This mechanism-level conclusion does not make every untested individual roster record runtime-verified.

The Rayden alternate test also established a separate bounded observation: the edited `RAIDEN3_P` changed Rayden's body/clothing while the blue/white electrical effect retained its distinct appearance. Therefore that electrical effect is not governed by `RAIDEN3_P`; its exact sprite/effect palette path remains unresolved.

---

## 1E.3N bounded question

The verified character-index palette tables have nine slots, while the independently recovered uppercase roster-name pointer run names only slots 0–6.

Pass 1E.3N asks one deliberately narrow question:

> **Which runtime fighter/object actually consumes unresolved character palette slot 7?**

Do not answer that question from the Watcom symbol name alone.

---

## Slot-7 static evidence

The already verified 1E.3L table census gives:

- `NORMAL_PALETTES[7]` → Watcom static-data offset `0x000104D6`;
- `ALTERNATE_PALETTES[7]` → the same offset `0x000104D6`;
- qualified palette record: `GONGORO_P`;
- ground-truth record index: **101**;
- physical record start: **`0x0009CF2A`**;
- physical record end: **`0x0009CF5A`** exclusive;
- declared colour count: **23**;
- normal and alternate table sides therefore share one exact record for slot 7.

The independent seven-name roster run has no slot-7 entry, so the report/UI keeps `rosterName = null` for this slot. `GONGORO_P` is evidence of a recovered Watcom symbol, not permission to pre-label the runtime consumer.

For reference, slot 8 is also unresolved by the seven-name run and both table sides point to the same physical record at Watcom `0x00010356` / physical `0x0009CDAA`. That record has the aliases `YANG_P` and `EMP_P`. Slot 8 remains held back in 1E.3N until slot 7 is runtime-qualified.

---

## Implemented 1E.3N editor

A new **Unresolved character slot 7 test · 1E.3N** panel appears after the existing 1E.3L ownership scaffold succeeds.

It is fail-closed unless all of the following reproduce:

- ownership report status is `SUCCESS`;
- palette-table index remains mechanically tied to character identity;
- slot index is exactly 7;
- no roster name was supplied by the independent seven-name run;
- normal and alternate slot entries resolve to the same record;
- both slot entries include the recovered symbol `GONGORO_P`;
- both qualified records declare 23 colours.

The editor supports:

- original swatch/word display for all 23 entries;
- individual colour-picker or hexadecimal word edits;
- per-entry reset and reset-all;
- **Fill magenta test** for a visually unmistakable runtime probe;
- guarded single-target ZIP export;
- exact-difference verification;
- palette-module reparse;
- exact reversal verification.

The exported JSON remains `STATIC_VALIDATION_PASSED_RUNTIME_PENDING`. The bundle instructions explicitly state that the runtime identity is unresolved and that the user must report the actual consumer rather than infer it from `GONGORO_P`.

Edits still do not stack. Every export fresh-reads and hashes the untouched original installation and rebuilds from the verified 1E.3H baseline.

---

## Independent static byte validation for the recommended magenta probe

Using the canonical original MK1 executable reconstructed from the previously returned reversible Rayden-alternate bundle:

Original SHA-256:

`750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`

A direct flat `0x7C1F` replacement of all 23 `GONGORO_P` colour words gives:

- record header remains `0x0017` and is unchanged;
- changed-byte range is confined to `0x0009CF2C..0x0009CF59`;
- exactly **46 bytes** change;
- no bytes outside the 23 colour words change;
- edited executable SHA-256:
  `a5799a3b6f452db797aa9b7acf98acbe3523ffc5f6e5ecf10054f4a07e0d86c2`;
- restoring the 23 original words returns the canonical original SHA-256 exactly.

This is static validation only. It does not establish the runtime identity of slot 7.

---

## User runtime test

1. Extract the new source package completely.
2. Run `Launch_Source.bat`.
3. Load the **untouched original MK1 installation**.
4. Click **Run What's Needed** and allow the prerequisite chain through 1E.3L to qualify.
5. Open **Unresolved character slot 7 test · 1E.3N**.
6. Click **Fill magenta test**.
7. Download the unresolved slot-7 bundle.
8. Put its `MK1.EXE` in a separate complete test installation.
9. Progress to the late-game encounter(s) until a fighter/object visibly consumes the edited palette.
10. Capture a screenshot with the changed consumer and enough surrounding scene/UI to identify the context.
11. Return the generated palette-entry JSON or the complete exported ZIP.

Because the normal and alternate table entries are the same record, a same-character comparison is not needed for this pass. The important observation is **which actual runtime consumer changes**.

If the anticipated boss encounter changes, that runtime observation may justify naming slot 7. Until then, keep the identity unresolved.

---

## Validation limits at implementation time

The source snapshot does not include installed npm dependencies, so a full Vite/Vitest run is not claimed unless dependencies are installed in the user's environment.

The changed TypeScript core/UI paths are checked separately with the available TypeScript compiler, and the slot-7 edit mechanics are independently reproduced at byte level against the canonical fixture. The direct smoke script has also been extended so an authentic installed source environment checks slot-7 table invariants, guarded export generation, zero unexpected changes, and exact reversal.

---

## Current status

- **1E.3J `KANO_P`:** runtime verified for bounded normal edit
- **1E.3K `KANO3_P`:** REAL-FIXTURE / RUNTIME VERIFIED — CLOSED
- **1E.3L slot 0 `GRIMM_P` / Cage:** REAL-FIXTURE / RUNTIME VERIFIED — CLOSED for bounded ownership claim
- **1E.3M `RAIDEN_P`:** REAL-FIXTURE / RUNTIME VERIFIED
- **1E.3M `RAIDEN3_P`:** REAL-FIXTURE / RUNTIME VERIFIED
- **1E.3M `YNINJA_P` / Scorpion:** RUNTIME CORROBORATED; binary-return artifact not independently reconciled at that checkpoint
- **seven-slot selectable-roster mechanism:** strongly supported by repeated runtime evidence
- **1E.3N slot 7 `GONGORO_P`:** IMPLEMENTED / STATIC VALIDATION PASSED / RUNTIME IDENTITY PENDING
- **slot 8 `YANG_P` / `EMP_P`:** unresolved and intentionally held back
- **combined multi-target export:** not implemented; single-target isolation remains intentional

## Main new/changed files

- `src/games/mk1/research/paletteEntryEdit.ts`
- `src/components/UnresolvedPaletteSlotEditor.tsx`
- `src/components/ResearchQuickActions.tsx`
- `src/components/MainRosterPaletteEditor.tsx`
- `src/tests/paletteEntryColors.test.ts`
- `scripts/run-palette-entry-edit.mjs`
- `src/appMetadata.ts`
- `docs/CURRENT.md`
- `docs/RESEARCH.md`
- `README.md`
