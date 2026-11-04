# Pass 1E.3K — Alternate Kano color editor

25 September 2026

## Status

**IMPLEMENTED / STATIC MECHANICS CHECKED / USER BROWSER + DOS RUNTIME VALIDATION PENDING**

This continuation starts from the user-validated 1E.3J normal-Kano editor. It does not redefine 1E.3J.

User runtime observation carried forward from the previous chat:

- a custom normal `KANO_P` edit setting all 23 words to `0x0421` rendered Kano near-black in-match;
- the opposing fighter, stage, and HUD remained normal in the supplied screenshot;
- this is bounded runtime evidence for normal `KANO_P` editing only.

## Delivered behavior

The existing Kano color editor now exposes two explicit targets:

- **Normal · `KANO_P` · 1E.3J**
- **Alternate · `KANO3_P` · 1E.3K**

Each target has independent draft/reset state. Both contain 23 editable 15-bit words with original swatches, edited color pickers, hexadecimal word inputs, per-entry reset, reset-all, and a guarded test-bundle export.

The alternate export is not implemented as an alias of the normal target. It resolves the verified `KANO3_P` record independently from the 1E.3H ground-truth/IR baseline and builds edits only for that record.

## Verified inherited fixture facts used by 1E.3K

- `KANO_P`: record 84, physical `0x0009CBFA..0x0009CC2A`, 23 colors.
- `KANO3_P`: record 85, physical `0x0009CC2A..0x0009CC5A`, 23 colors.
- `NORMAL_PALETTES` and `ALTERNATE_PALETTES` are verified parallel 9-entry palette tables.
- Kano occupies corresponding slot 1 as `KANO_P` / `KANO3_P`.
- 1E.3F established an edge-triggered character-equality palette latch: the same-character equality edge selects `ALTERNATE_PALETTES`; inequality restores `NORMAL_PALETTES`.
- “mirror match” remains shorthand/inference; the mechanically verified statement is same-character equality/inequality.

## 1E.3K export safeguards

The alternate editor reuses the same guarded edit path as 1E.3J:

- authentic user-loaded source required;
- original executable path, size, and SHA-256 must still match the 1E.3H baseline;
- target must resolve to exactly one qualified 23-color `KANO3_P` record;
- requested values must be exactly 23 valid `0000..7FFF` words;
- no-op exports are rejected;
- edited bytes are reconstructed from the original executable and baseline IR;
- every actual byte difference must correspond to the planned word changes;
- reparsing and hash evidence are recomputed on export;
- reversal must restore the original executable hash;
- runtime remains explicitly `NOT_TESTED` in machine-generated evidence until observed externally.

Normal and alternate exports use separate pass identities: 1E.3J and 1E.3K. Export Latest/All retains one latest artifact per pass rather than allowing an alternate edit to overwrite a normal-edit artifact.

## Static mechanics check performed in this continuation

The preserved 1E.3H direct evidence was used to exercise the edit-plan and byte-edit mechanics for `KANO3_P`.

Observed:

- resolved target: record 85;
- physical record: `0x0009CC2A..0x0009CC5A`;
- all 23 entries changed in the test plan;
- changed bytes: 45;
- unexpected byte changes: 0;
- first changed byte: `0x0009CC2C` (after the u16 record length);
- last changed byte: `0x0009CC59`;
- every changed byte fell inside the `KANO3_P` color-word payload;
- the complete `KANO_P` record remained byte-identical;
- reversal restored the pre-edit buffer hash.

This check establishes the bounded edit mechanics against the preserved qualified palette module. It is not a substitute for a fresh authentic browser export from the user's original `MK1.EXE`.

## Compiler checks in this environment

- `paletteEntryEdit.ts` type-check passed with the available TypeScript 5.8 compiler and a minimal Node-global declaration.
- the changed React UI path (`KanoPaletteEditor.tsx` and `ResearchQuickActions.tsx`) type-check passed with minimal external React/Lucide declarations while retaining the project's actual local module types.
- the changed test files type-check passed with a minimal Vitest declaration.
- a TypeScript transpile/syntax pass over changed TS/TSX files passed.

A complete npm/Vite/Vitest run is **not claimed** here because the extracted source package contains no `node_modules` and the dependency installation could not be completed in this execution environment. The user's normal `Launch_Source.bat` path will install dependencies when needed.

## Bounded user validation

1. Extract the new source ZIP fully.
2. Run `Launch_Source.bat`.
3. Load the untouched original MK1 installation.
4. Click **Run What's Needed**.
5. In **Kano color editor**, choose **Alternate · KANO3_P · 1E.3K**.
6. Change one or more entries to obvious test values.
7. Download the `KANO3_P` test bundle.
8. Put its `MK1.EXE` into a separate complete test installation.
9. Launch **Kano versus Kano**.
10. Capture a screenshot with both fighters and the stage visible and retain the generated JSON.

Expected bounded observation: only colors sourced through the alternate Kano record should reflect the edit. This pass deliberately does not assert which player-side object receives that palette.

## Main changed files

- `src/components/KanoPaletteEditor.tsx`
- `src/components/ResearchQuickActions.tsx`
- `src/games/mk1/research/paletteEntryEdit.ts`
- `src/tests/paletteEntryColors.test.ts`
- `docs/CURRENT.md`
- `README.md`

## Next decision

Do not broaden to other fighters yet. First review the 1E.3K browser JSON and Kano-vs-Kano runtime screenshot. If both agree with the bounded target, close alternate-Kano editing before moving to generalized fighter palette ownership/editing.
