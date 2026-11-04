# MK DOS Archive — Handoff — Pass 1E.3O.20 Animation Palette Context Bridge

Date: 2026-09-29

## Status

**STATICALLY VERIFIED AGAINST AUTHENTIC MK1 PREREQUISITE CHAIN / READ-ONLY / NORMAL-APP INTEGRATION IMPLEMENTED**

Direct verdict:

`MK1_ANIMATION_PALETTE_CONTEXT_SEPARATION_ESTABLISHED`

O20 is an export-architecture pass. It answers a critical correctness question raised by O18: after sprite decoding is broadly established, can the animation table or resource file itself determine which palette should be used for export?

The answer is **no**. Palette context is an independent semantic axis and must remain explicit in the export IR.

## Prerequisites

O20 binds three previously established mechanisms:

1. O19 runtime character identity -> ANITAB selector;
2. 1E.3L nine-slot character identity -> palette-table slot relationship;
3. 1E.3F verified normal/alternate palette-selection state machine.

All three use the same established object character identity field at `+0x48`.

## Shared identity field, separate selectors

The object-local field at offset:

`+0x48`

is independently used to select:

- the character's ANITAB family through the O19 nine-entry selector at Watcom `0x9914`;
- the character's normal or alternate palette through the verified palette tables at Watcom `0xF1CC` and `0xF1F0`.

This establishes co-selection by character identity while preserving the fact that animation-table identity and palette identity are different pieces of state.

## Nine joined character contexts

| ID | Identity | ANITAB | Normal palette | Alternate palette |
|---:|---|---|---|---|
| 0 | CAGE | `VANDAN_ANITAB` | `GRIMM_P` | `GRIMM3_P` |
| 1 | KANO | `KANO_ANITAB` | `KANO_P` | `KANO3_P` |
| 2 | RAYDEN | `RAIDEN_ANITAB` | `RAIDEN_P` | `RAIDEN3_P` |
| 3 | LIU KANG | `KANG_ANITAB` | `LUKANG_P` | `LUKANG3_P` |
| 4 | SCORPION | `NINJA_ANITAB` | `YNINJA_P` | `YNINJA3_P` |
| 5 | SUB-ZERO | `NINJA_ANITAB` | `BNINJA_P` | `BNINJA3_P` |
| 6 | SONYA | `LIZ_ANITAB` | `LIZ_P` | `LIZRED_P` |
| 7 | GORO | `GORO_ANITAB` | `GONGORO_P` | `GONGORO_P` |
| 8 | EMP | `EMP_ANITAB` | `YANG_P` / `EMP_P` | same record |

Slots 0..6 have distinct normal/alternate records. Slots 7 and 8 use the same record in both table positions.

## Decisive counterexample: one ANITAB, two character palettes

Character IDs 4 and 5 both select:

`NINJA_ANITAB`

but their palette contexts are mechanically distinct:

- Scorpion: `YNINJA_P` / `YNINJA3_P`;
- Sub-Zero: `BNINJA_P` / `BNINJA3_P`.

This directly proves that **ANITAB identity does not determine palette identity**.

It also provides an especially useful export rule: the same structural animation table can legitimately be rendered as different character color sets depending on runtime character identity.

## Normal/alternate proof

For character IDs 0..6, the verified palette state machine can switch between separate normal and alternate palette records while the character identity—and therefore selected ANITAB family—remains the same.

This independently proves that one animation structure can be rendered under multiple qualified palette contexts even without changing character identity.

## Export IR consequence

A safe export model must represent at least these axes separately:

- character/object identity;
- animation table / stream identity;
- frame/descriptors/resource identity;
- palette context.

Do **not** collapse these into a single "resource -> palette" or "ANITAB -> palette" mapping.

The recommended product representation is conceptually:

`Character/Object Context -> Animation Context -> Frame/Descriptor Graph + Palette Context`

rather than:

`GRA file -> one palette`

or:

`ANITAB -> one palette`.

## Important scope boundary

O20 establishes separation of animation and palette selection for the qualified character-table paths. It deliberately does **not** bind every special effect to a palette.

Existing project evidence already warns why this matters:

- Rayden's qualified lightning effect uses `MORPH_P`, even though its sprites are in `RAIDEN.GRA`;
- Kano's heart effect uses `BLOOD_P` with `MISC.GRA` assets;
- Shang morph transition frames use target-specific transition palettes before returning to generic fighter palette selection.

Those are supporting project-history examples, not new O20 claims.

## Direct result

- character slots joined: **9**;
- unique ANITABs: **8**;
- shared-ANITAB/distinct-palette contexts: **1** (`NINJA_ANITAB`, IDs 4/5);
- characters with distinct normal/alternate palette records: **7**;
- characters with same normal/alternate record: **2**.

All nine O20 validation checks pass.

## Source changes

Added:

- `src/games/mk1/research/animationPaletteContextBridge.ts`;
- `scripts/run-animation-palette-context-bridge.mjs`;
- this handoff.

Normal research workflow extended to **29/29**.

App milestone:

`Milestone 1 — Pass 1E.3O.20 — MK1 Animation Palette Context Bridge`

Report format:

`mk1_animation_palette_context_bridge_v1`

## Validation notes

- O20 core targeted TypeScript typecheck: **PASS**;
- O20 direct authentic-prerequisite execution: **PASS**;
- all 9 validation checks: **PASS**;
- O20 smoke script syntax: **PASS**;
- full dependency-backed UI typecheck/build is not claimed in this container because the source snapshot does not contain installed npm dependencies.

No runtime test is needed for this selector-relationship claim.

## Recommended continuation

The next palette/export pass should move from **context separation** to **context binding** for specific animation/effect roots.

Priorities:

1. identify body-animation contexts that inherit the qualified character normal/alternate palette selector;
2. identify setup/callback-driven special-effect palette contexts;
3. keep unresolved contexts as indexed/raw exports rather than guessing colors;
4. separately recover semantic names for ANITAB indices through bounded GET_CHAR_ANI/A9 consumer evidence.
