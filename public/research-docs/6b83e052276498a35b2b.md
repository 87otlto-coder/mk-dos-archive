# MK DOS Archive — Pass 1E.3M Main Roster Palette Editor Expansion

25 September 2026 — updated after Rayden normal/alternate runtime verification

## Prior pass closeout — 1E.3L runtime result

Pass 1E.3L is **REAL-FIXTURE / RUNTIME VERIFIED AND CLOSED for its bounded slot-0 normal-ownership claim**.

Returned bundle:

`mk1-cage-normal-colors-2026-09-25T11-53-32-805Z.zip`

Independent bundle reconciliation established:

- ZIP CRC test: clean;
- target: `GRIMM_P`, record 87;
- physical record range: `0x0009CC8A..0x0009CCBA`;
- declared length: 23 colours;
- all 23 tested words: `0x7C1F`;
- edited executable SHA-256: `5a7cf8f8ff81e9b6f8c1a000274a5a62a0ced511141a1e636d1160e4b768395f`;
- 46 physical bytes changed, all inside the 23 target colour words;
- zero unexpected byte changes;
- zero record-header changes;
- 122 other NEWPALS records remained untouched;
- reversing the exact reported byte edits restores canonical original SHA-256 `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`.

Runtime observation supplied by the user shows Johnny Cage rendered in the flat edited magenta palette while Sub-Zero, the stage, and HUD remain visually normal. This closes the bounded claim that slot 0 normal `GRIMM_P` is actually consumed by Cage at runtime.

As with all screenshot evidence in this project, the capture is visual runtime evidence and does not by itself cryptographically prove which executable was running at capture time. The returned bundle/report independently reconcile exactly.

---

## 1E.3M bounded objective

Expand the guarded single-target colour editor across the mechanically aligned seven-name main-roster run without inventing runtime ownership where it has not been observed.

The editor exposes the following table-slot pairs:

| Slot | Recovered roster text | Normal | Alternate |
|---:|---|---|---|
| 0 | CAGE | `GRIMM_P` | `GRIMM3_P` |
| 1 | KANO | `KANO_P` | `KANO3_P` |
| 2 | RAYDEN | `RAIDEN_P` | `RAIDEN3_P` |
| 3 | LIU KANG | `LUKANG_P` | `LUKANG3_P` |
| 4 | SCORPION | `YNINJA_P` | `YNINJA3_P` |
| 5 | SUB-ZERO | `BNINJA_P` | `BNINJA3_P` |
| 6 | SONYA | `LIZ_P` | `LIZRED_P` |

Slots 7 and 8 remain deliberately excluded from the named-roster editor because the recovered seven-name pointer run does not identify them. Their palette records remain preserved in the research evidence but are not assigned roster identities by 1E.3M.

---

## Editing and export behavior

The **Main roster palette editor · 1E.3M**:

- is visible only after the existing 1E.3L ownership scaffold qualifies;
- selects one fighter and one normal/alternate path at a time;
- exposes all 23 original words and swatches for the selected record;
- supports individual word edits, colour-picker edits, reset, and a flat-magenta test fill;
- always fresh-reads and hashes the untouched original installation executable;
- rebuilds only the selected target record from the 1E.3H palette IR;
- verifies exact byte differences;
- reparses the palette module;
- verifies exact reversal to the original executable hash;
- emits a single-target ZIP and JSON artifact.

Edits intentionally do **not** stack. Each export is reconstructed from the untouched original baseline so normal/alternate experiments remain independently attributable.

Existing bounded pass identities remain intact:

- `KANO_P` → 1E.3J;
- `KANO3_P` → 1E.3K;
- `GRIMM_P` → 1E.3L;
- newly exposed main-roster targets → 1E.3M.

---

## Static validation performed for 1E.3M

Because the distributed source snapshot does not include installed npm dependencies, a complete Vite/Vitest run was not claimed at implementation time.

The changed non-React edit core type-checked with TypeScript 5.8.3. The new editor component and `ResearchQuickActions` integration also type-checked with temporary declarations standing in only for unavailable React/lucide package typings.

Independent fixture checks reconstructed the canonical original executable from the returned 1E.3L bundle and verified every newly exposed main-roster palette record against the authoritative 1E.3H ground-truth data. All fourteen normal/alternate targets:

- resolve uniquely;
- declare exactly 23 colours;
- match the original executable bytes at their recorded physical offsets;
- permit a flat test edit confined only to the 46-byte colour-word payload;
- reverse exactly to the canonical original SHA-256.

The direct smoke script was extended to exercise all fourteen targets when run against an authentic installation with dependencies present.

---

# Runtime continuation — Rayden normal palette

Returned bundle:

`mk1-rayden-normal-colors-2026-09-25T13-00-06-709Z.zip`

Independent reconciliation established:

- ZIP CRC test: clean;
- target: `RAIDEN_P`, record 98;
- physical record range: `0x0009CE9A..0x0009CECA`;
- declared length: 23 colours;
- all 23 requested words: `0x7C1F`;
- edited word count: 23;
- changed byte count: 46;
- unexpected byte changes: 0;
- header changes: 0;
- bytes changed outside target words: 0;
- reversal restores original: true;
- canonical original SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`;
- edited executable SHA-256: `fa1d8ec7a45a5f244cade8f1c997ceaf6d651413d14a30e2510530b16beb0502`;
- executable inside the returned ZIP hashes exactly to the report's edited SHA-256.

Runtime screenshots show Rayden rendered with the flat edited magenta palette while Sub-Zero, the stage, and HUD retain their expected appearance.

The character-selection screen supplies an additional bounded observation: the large selected-fighter Rayden presentation also consumes the edited `RAIDEN_P` palette, while the portrait artwork itself remains visually unchanged. Therefore `RAIDEN_P` is not restricted to the combat pose set; it participates in at least one non-combat full-body fighter presentation.

Classification:

**`RAIDEN_P` / slot 2 normal ownership — REAL-FIXTURE / RUNTIME VERIFIED.**

This is a third independently runtime-supported main-roster slot after Cage and Kano.

---

# Runtime continuation — Scorpion normal palette corroboration

The user also performed an informal Scorpion normal-palette edit using the 1E.3M editor. Runtime imagery shows the deliberately altered palette appearing on Scorpion while Johnny Cage and the stage remain visually normal.

No corresponding Scorpion export bundle/report was supplied for independent byte/hash reconciliation in this checkpoint. Therefore this result is retained as:

**`YNINJA_P` / slot 4 normal ownership — RUNTIME CORROBORATED, not independently binary-closed.**

It agrees with the mechanically recovered slot mapping but is not promoted to the same evidence grade as Cage/Rayden without the export artifact.

---

# Runtime continuation — Rayden alternate palette

Returned bundle:

`mk1-rayden-alternate-colors-2026-09-25T13-11-31-689Z.zip`

Independent reconciliation established:

- ZIP CRC test: clean;
- target: `RAIDEN3_P`, record 99;
- physical record range: `0x0009CECA..0x0009CEFA`;
- declared length: 23 colours;
- all 23 requested words: `0x7C1F`;
- edited word count: 23;
- changed byte count: 46;
- unexpected byte changes: 0;
- header changes: 0;
- bytes changed outside target words: 0;
- reversal restores original: true;
- canonical original SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`;
- edited executable SHA-256: `5389a5dd041eb5806b342fcf372974312911877d64f3680194afece03bfe8ad7`;
- executable inside the returned ZIP hashes exactly to the report's edited SHA-256.

Runtime screenshots of Rayden versus Rayden show one Rayden retaining the normal appearance while the other consumes the edited flat-magenta `RAIDEN3_P` palette. The same distinction is visible in the full-body selected-fighter presentations on the character-select screen.

This establishes that the previously recovered same-character alternate-table mechanism is not Kano-specific.

Classification:

**`RAIDEN3_P` / slot 2 alternate ownership — REAL-FIXTURE / RUNTIME VERIFIED.**

Combined with the closed Kano alternate result, the following mechanism is now supported by repeated runtime evidence across more than one roster slot:

`character index → NORMAL_PALETTES[index]`

and, under the already verified same-character equality transition:

`character index → ALTERNATE_PALETTES[index]`

This is a mechanism-level generalization across independently tested characters; it is not merely a naming inference from `_P` symbols.

---

## Rayden effect observation

In the alternate-palette runtime capture, Rayden's body/clothing is replaced by the flat magenta palette while the blue/white electrical effect remains visually distinct.

The bounded conclusion is:

**Rayden's electrical effect is not governed by `RAIDEN3_P`.**

This is evidence for a separate effect sprite and/or palette path. Do not yet promote the stronger claim that the lightning is universally independent of all Rayden artwork or fully characterize its renderer path; that remains future work.

---

# 1E.3M closeout state

The value of further one-by-one normal-palette magenta tests for the remaining selectable roster is now low. The recovered main-roster palette mechanism has repeated through:

- slot 0 / Cage normal — binary + runtime verified;
- slot 1 / Kano normal — previously runtime verified;
- slot 1 / Kano alternate — binary + runtime verified;
- slot 2 / Rayden normal — binary + runtime verified;
- slot 2 / Rayden alternate — binary + runtime verified;
- slot 4 / Scorpion normal — runtime corroborated.

Liu Kang, Sub-Zero, Sonya and the remaining untested alternate records remain individually runtime-unobserved, but the shared seven-slot normal/alternate table mechanism is now strongly supported by repeated independent runtime behavior.

**Pass 1E.3M main-roster editor and non-Kano alternate-selection generalization: REAL-FIXTURE / RUNTIME VERIFIED for the bounded tested claims.**

Do not rewrite every untested fighter row as individually runtime-verified. Preserve the distinction between mechanism-level repetition and per-record runtime observation.

---

# Next bounded milestone — 1E.3N unresolved table slots

The next high-value work should qualify table slots 7 and 8 instead of repeating the already established selectable-roster experiment.

Current unresolved pairs carried by the verified table structure are:

- slot 7: `GONGORO_P` / `GONGORO_P`;
- slot 8: `YANG_P` / `EMP_P`.

The seven-name selectable-roster pointer run does not name these slots. Boss-character ownership is therefore a **hypothesis**, not yet a schema fact, even though symbol names and roster cardinality provide obvious leads.

Recommended 1E.3N sequence:

1. preserve the existing table/index evidence without assigning names prematurely;
2. expose a guarded single-target edit for slot 7 `GONGORO_P`;
3. perform an obvious bounded colour edit;
4. reach the relevant late-game encounter on the authentic fixture;
5. reconcile the returned bundle byte-for-byte and classify the runtime consumer;
6. only after slot 7 is qualified, investigate slot 8 `YANG_P` / `EMP_P` and determine whether its asymmetric normal/alternate pair has distinct runtime meaning.

Do not assume `GONGORO_P` means Goro solely from the label, and do not assign `YANG_P` / `EMP_P` to Shang Tsung before runtime/mechanical evidence establishes that relationship.

---

## Current status summary

- **1E.3J `KANO_P`:** REAL-FIXTURE / RUNTIME VERIFIED for bounded normal edit
- **1E.3K `KANO3_P`:** REAL-FIXTURE / RUNTIME VERIFIED — CLOSED
- **1E.3L slot-0 `GRIMM_P` / Cage:** REAL-FIXTURE / RUNTIME VERIFIED — CLOSED for bounded normal-ownership claim
- **1E.3M `RAIDEN_P`:** REAL-FIXTURE / RUNTIME VERIFIED
- **1E.3M `RAIDEN3_P`:** REAL-FIXTURE / RUNTIME VERIFIED
- **1E.3M `YNINJA_P` / Scorpion:** RUNTIME CORROBORATED; export artifact not independently reconciled
- **1E.3M seven-slot normal/alternate mechanism:** strongly supported by repeated runtime evidence; do not convert untested rows into individual runtime-verification claims
- **slots 7–8 named ownership:** unresolved
- **Rayden electrical effect:** verified not to be governed by edited `RAIDEN3_P`; exact effect ownership/render path unresolved
- **combined multi-target export:** not implemented; single-target isolation remains intentional
- **next pass:** 1E.3N unresolved slot qualification, beginning with slot 7 `GONGORO_P`

## Main 1E.3M implementation files

- `src/games/mk1/research/paletteEntryEdit.ts`
- `src/components/MainRosterPaletteEditor.tsx`
- `src/components/ResearchQuickActions.tsx`
- `src/tests/paletteEntryColors.test.ts`
- `scripts/run-palette-entry-edit.mjs`
- `docs/CURRENT.md`
- `docs/RESEARCH.md`
- `README.md`
