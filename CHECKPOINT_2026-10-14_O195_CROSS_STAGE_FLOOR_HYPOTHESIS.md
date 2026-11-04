# MK DOS Archive — O195 cross-stage packed-floor hypothesis

Date: 2026-10-14
Predecessor: O194 Compile All Knowns / Portal → Forest hypotheses
Status: source-verified static research + fixture-backed UI integration; browser runtime/build not yet verified

## Why O195 exists

The user supplied an O194 forensic ZIP testing Portal assumptions on Forest. Independent source review found that packed-draw control grammar is shared across seven MK2 stage configurations, but stage-specific operands and artwork differ. O195 tests the *transferability of the command/row clipping logic*, not of the Portal sprites, palette or placement.

## Source evidence

O130 authenticates the original MK2 executable SHA-256, first-ten stage roots and source control streams. O131 independently guards the original packed-floor row-geometry instructions. The O195 overlay reads those protected source methods, then performs a separately bounded token walk of the same seven original command streams, storing original physical offsets, signed tokens, extra words, instruction byte windows, and source paths/hashes.

| Stage | EXE physical command | Source pointer operand | Original raw Y | Requested rows | Visible rows at scroll 0 | Clipped rows |
|---|---|---|---:|---:|---:|---:|
| Tomb | 0xB7F74 | 0x8432A | 158 | 56 | 42 | 14 |
| Battle | 0xB9F14 | 0x8432A | 164 | 40 | 36 | 4 |
| Tower | 0xB8588 | 0x8432A | 147 | 64 | 53 | 11 |
| Forest | 0xB795C | 0x8432A | 172 | 32 | 28 | 4 |
| Armory | 0xB74C4 | 0x84312 | 159 | 56 | 41 | 15 |
| Portal | 0xB70B4 | 0x8432A | 164 | 40 | 36 | 4 |
| Arena | 0xB918C | 0x8432A | 164 | 40 | 36 | 4 |

**All visible/clipped row counts above are an O131 illustrative calculation at hypothetical vertical scroll 0 and camera word 288, not gameplay measurements.** The original stage source pointer values refer to runtime-managed storage, not offsets to .GRA image bytes. Portal/Battle/Arena have identical raw packed-draw operands; this is a source statement only, not a shared stage texture proof.

## Implementation

New non-destructive code:
- `src/core/experiments/o195.ts` — independent token capture, authenticated comparison, illustration, forensic ZIP exporter
- `src/components/O195FloorWorkbench.tsx` — Laboratory cross-stage control, source table and schematic preview
- `scripts/verify-o195-fixture.cjs` — source regression, parameter changes, missing-resource handling, tamper and package tests
- `scripts/verify-o195-export.py` — stdlib-only independent audit against original EXE, no dependency on TS implementation

Minor non-research changes: `O194Workbench.tsx` embeds new panel; `appMetadata.ts` and package scripts updated; static research index regenerated to include the new note.

## Export contract

`MKDOS_O195_Cross_Stage_Floor_Forensic_Evidence.zip` includes:
- readable `SUMMARY.md`, structured `MANIFEST.json`, `EXPERIMENT.json`
- exact source identities in `evidence/source_hashes.json`
- complete bounded original-token streams in `evidence/full_control_tokens.json`
- executable offsets and raw operands in `evidence/operand_provenance.json`
- computed per-stage row geometry in `results/row_geometry.json`
- `results/geometry_comparison.svg` (schematic, not stage artwork)
- explicit refusals, warnings, reproduction parameters and README

No commercial EXE or GRA source files are bundled. The experiment never edits game files, cannot promote hypotheses into compiled assets, and does not fabricate a Forest render.

## Tests executed

1. Original fixture `mk2(1).zip` checked via `node scripts/verify-o195-fixture.cjs`: **passed**, 7 sources/77 tokens, 0-scroll visibility and changed illustrative scroll, hash authentication, malformed-source rejection, missing `.GRA` handling, ZIP contents.
2. Independently reproduced from physical EXE bytes via `python scripts/verify-o195-export.py`: **passed** for 7 rows/77 tokens and zero-scroll geometry.
3. Inherited O194 `node scripts/verify-o194-fixture.cjs` source smoke: **passed**, 43 original frames, 4 conservative Portal/Forest assumptions, ZIP round-trip and corruption cases.
4. Browser build **not verified**: npm dependency installation failed in this environment, so the full Vite/React runtime needs testing on the user's Windows development system.

## Unresolved

- Stage draw activation/visibility at runtime
- Actual vertical-scroll and camera-word values in DOSBox
- Source interpretation of Forest native floor pixels/palette and stage layer order
- Full layer compositor output for Portal/Forest/Battle/Arena
- In-game verification of O195 schematic assumptions

## Next best investigation

Get the O195 forensic ZIP from an original MK2 session and compare hypothetical scroll/camera samples, or pursue original Forest packed suffix and palette independently; do **not** apply Portal sprite offsets or invented palette bindings to Forest.
