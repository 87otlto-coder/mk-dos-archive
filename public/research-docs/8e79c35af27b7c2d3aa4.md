# MK DOS Archive — Handoff — Pass 1E.3O.22 Character Animation Export Manifest

Date: 2026-09-29

## Status

**STATICALLY VERIFIED / READ-ONLY / PRODUCT-FACING EXPORT IR ESTABLISHED / NORMAL-APP INTEGRATION IMPLEMENTED**

Direct verdict:

`MK1_CHARACTER_ANIMATION_EXPORT_MANIFEST_ESTABLISHED`

O22 converts the already-qualified MK1 animation/resource evidence into a character-oriented export manifest without collapsing four distinct axes:

1. structural ANITAB / stream / frame identity;
2. authentic indexed-pixel decode coverage;
3. palette context and palette-binding confidence;
4. code-consumer context and semantic-label confidence.

It does not modify the game and does not invent a body-palette rule for arbitrary resources or streams.

## Prerequisites

O22 combines:

- O17 — eight discovered ANITAB families and their structural stream/frame/descriptor graph;
- O18 — authentic GRA backing and successful indexed-pixel decode for all 1,102 reached descriptors;
- O19 — nine runtime character identities mapped to the eight ANITAB families;
- O20 — character palette context explicitly separated from ANITAB/resource identity;
- O21 — direct `GET_CHAR_ANI` consumer/index context without semantic-name promotion.

All prerequisite reports are successful and validation-complete.

## Character contexts

Nine character contexts are carried explicitly:

| ID | Identity | ANITAB | Normal palette context | Alternate palette context |
|---:|---|---|---|---|
| 0 | CAGE | `VANDAN_ANITAB` | `GRIMM_P` | `GRIMM3_P` |
| 1 | KANO | `KANO_ANITAB` | `KANO_P` | `KANO3_P` |
| 2 | RAYDEN | `RAIDEN_ANITAB` | `RAIDEN_P` | `RAIDEN3_P` |
| 3 | LIU KANG | `KANG_ANITAB` | `LUKANG_P` | `LUKANG3_P` |
| 4 | SCORPION | `NINJA_ANITAB` | `YNINJA_P` | `YNINJA3_P` |
| 5 | SUB-ZERO | `NINJA_ANITAB` | `BNINJA_P` | `BNINJA3_P` |
| 6 | SONYA | `LIZ_ANITAB` | `LIZ_P` | `LIZRED_P` |
| 7 | GORO | `GORO_ANITAB` | `GONGORO_P` | same |
| 8 | EMP | `EMP_ANITAB` | `YANG_P` / `EMP_P` | same record |

`NINJA_ANITAB` remains one shared structural table with two separate character palette contexts. O22 does not duplicate it into two fake structural tables.

## Table-cell coverage

Across the eight ANITABs:

- total table cells: **739**;
- structural stream cells: **564**;
- image-bearing stream cells: **559**;
- control-only stream cells: **5**;
- direct descriptor table entries: **33**;
- image-bearing table entries ready for indexed export: **592**;
- non-image / unknown / sentinel / unassigned cells: **147**.

Every one of the 592 image-bearing entries is `indexedExportReady=true` because every descriptor it reaches is already authenticated and decoded by O18.

Control-only animation streams are deliberately not mislabeled as image exports.

## Palette policy

Character normal/alternate palettes are included as explicit character context, but O22 sets:

`automaticBodyPaletteApplied = false`

for every table entry.

This is intentional. Prior evidence contains counterexamples where a fighter GRA participates in a special-effect palette context.

Only three previously qualified character/index palette bindings are promoted:

1. **KANO / KANO_ANITAB[67] -> BLOOD_P**
   - prior evidence: 1E.3O.2;
   - scope: qualified heart-rip primary animation/effect context.

2. **RAYDEN / RAIDEN_ANITAB[60] -> MORPH_P**
   - prior evidence: 1E.3O.4;
   - scope: normal lightning projectile setup descriptor `HANDBO22`.

3. **RAYDEN / RAIDEN_ANITAB[34] -> MORPH_P**
   - prior evidence: 1E.3O.4;
   - scope: qualified normal lightning travel animation descriptors.

Everything else retains character palette context but remains unresolved at the individual entry/stream binding layer.

## Consumer / semantic policy

O21 provides immediate `A9` consumer evidence for **65** numeric indices. O22 attaches those contexts to the corresponding numeric table indices, including module names and nearest Watcom code symbols.

However every entry retains:

`canonicalGameplayName = null`

because contextual call-site names are not automatically promoted into authoritative animation labels.

This distinction is critical when one numeric index may have different table contents across characters.

## Product consequence

O22 establishes a safe export architecture:

`Character Context`
`  -> ANITAB Structural Table`
`     -> Table Entry / Stream / Frame / Descriptor Graph`
`        -> Authentic Indexed Pixels`
`  + Palette Context (separate)`
`  + Code Consumer Context (separate)`

This is sufficient to begin exporting indexed/composited animation assets without pretending unresolved colors or names are known.

## Direct summary

- character contexts: **9**;
- unique ANITABs: **8**;
- table entries preserved: **739/739**;
- image-bearing entries ready for indexed export: **592**;
- known qualified palette bindings: **3**;
- O21 consumer-context numeric indices carried: **65**;
- all validation checks: **10/10 passed**.

## Source changes

Added:

- `src/games/mk1/research/characterAnimationExportManifest.ts`;
- `scripts/run-character-animation-export-manifest.mjs`;
- this handoff.

O21 was also fully integrated into the source snapshot before O22:

- `src/games/mk1/research/getCharAniConsumerCensus.ts`;
- `scripts/run-get-char-ani-consumer-census.mjs`;
- `MK_DOS_Archive_HANDOFF_1E3O21_GET_CHAR_ANI_CONSUMER_CENSUS.md`.

Normal research workflow is now **31/31**.

App milestone:

`Milestone 1 — Pass 1E.3O.22 — MK1 Character Animation Export Manifest`

Report format:

`mk1_character_animation_export_manifest_v1`

## Validation performed

- O22 targeted TypeScript compilation with local Node declaration shim: **PASS**;
- O22 smoke-script syntax: **PASS**;
- O22 direct execution over the verified O17/O18/O19/O20/O21 evidence chain: **PASS**;
- table entries preserved: **739/739**;
- all 592 image-bearing table entries indexed-export ready: **PASS**;
- known effect palette bindings resolve to image-bearing qualified entries: **PASS**;
- no arbitrary body-palette application: **PASS**;
- shared NINJA character contexts preserved: **PASS**;
- canonical animation names remain unassigned: **PASS**.

## Non-claims

O22 does not establish:

- universal correct-color export;
- canonical gameplay names for all indices;
- universal frame timing;
- complete animation universe beyond the discovered structural scope;
- that every GRA resource has one palette;
- GRA encoding/import;
- MK2/MK3 parity.

## Recommended continuation

Use the newly established manifest to prove the first end-to-end **correct-color export fixtures** from authentic installation bytes. Start only with palette bindings that are already strongly qualified:

- Kano heart / `BLOOD_P`;
- Rayden lightning / `MORPH_P`.

Generate deterministic RGBA compositions and PNG fixtures, compare them against existing descriptor/placement evidence, and keep all other animations as indexed/composited exports until their palette binding is separately qualified.
