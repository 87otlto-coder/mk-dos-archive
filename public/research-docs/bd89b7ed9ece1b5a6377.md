# MK DOS Archive — Handoff — Pass 1E.3O.25 Palette-Binding Exception Census

**Date:** 2026-09-29 SAST  
**Status:** **VERIFIED ON AUTHENTIC MK1 INSTALL / READ-ONLY**

## Purpose

O25 bounds the palette-binding uncertainty left after O24. It enumerates cross-resource descriptors and overlays only palette relationships established independently before this pass. It also records a same-resource effect exception so the exporter cannot accidentally treat a dominant fighter GRA as a universal body-palette key.

## Prerequisites

- O18 authentic resource/decode census: 1,102/1,102 descriptors decode from real GRA data.
- O22 character animation export manifest: explicit palette bindings only for Kano heart and Rayden lightning roots.
- O23 qualified correct-color fixtures: Kano heart -> `BLOOD_P`; Rayden lightning -> `MORPH_P`.
- O24 explicit character normal/alternate rendering for structurally dominant fighter resources, without canonical per-animation binding.

Canonical `MK1.EXE` SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`.

## Result

O24's dominant-resource set covers **1,016** of the **1,102** O18 descriptors. The remaining **86** are cross-resource:

- `GRAPHICS/STANCE.GRA`: 45 — unresolved palette ownership;
- `GRAPHICS/FONTS.GRA`: 28 — unresolved palette ownership;
- `GRAPHICS/VICTORY.GRA`: 6 — unresolved palette ownership;
- `GRAPHICS/MISC.GRA`: 7 — the ANITAB-reached Kano heart descriptors, already qualified to `BLOOD_P`.

Therefore:

- cross-resource descriptors: **86**;
- independently qualified cross-resource descriptors: **7**;
- unresolved cross-resource descriptors: **79**;
- unresolved cross-resource resources: **3**.

The exact Watcom descriptor symbols are preserved in the report. No unresolved descriptor is assigned a palette merely because its opaque index range fits a known 23-colour record.

## Same-resource counterexample

Five ANITAB-reached Rayden lightning descriptors (`HANDBO22`, `HANDBO4`, `HANDBO5`, `HANDBO8`, `HANDBO9`) are inside the structurally dominant `GRAPHICS/RAIDEN.GRA` resource but are independently qualified to `MORPH_P`, not the Rayden body palette. This directly establishes that **dominant resource identity is not universal body-palette ownership**.

The remaining eight qualified lightning continuation/persistent-loop descriptors are outside the O17/O18 ANITAB-reached graph. Together with two off-table heart-loop descriptors, O25 retains **10 qualified off-table effect descriptors**. This is additional evidence that the ANITAB census is not the complete animation/effect universe.

## Verdict

`MK1_PALETTE_BINDING_EXCEPTION_SURFACE_BOUNDED`

Established:

- exact O24 cross-resource remainder;
- retained Kano heart `BLOOD_P` binding;
- retained Rayden `MORPH_P` same-resource override;
- explicit unresolved surface for STANCE/FONTS/VICTORY;
- no compatibility-only palette promotion.

Not established:

- canonical palette ownership for the 79 unresolved descriptors;
- automatic body-palette inheritance for shared resources;
- universal one-palette-per-GRA or one-palette-per-ANITAB behavior;
- broad correct-color export beyond qualified contexts.

## Validation

Direct authentic-install run: **PASS**.  
Fresh deterministic rerun: **PASS**.  
After removing run-specific timestamp/operation IDs, the reports are semantically identical.  
All O25 validation checks pass.  
Smoke script syntax check: **PASS**.

Direct evidence: `/mnt/data/o25_direct.json`.

## Source changes

Added:

- `src/games/mk1/research/paletteBindingExceptionCensus.ts`
- `scripts/run-palette-binding-exception-census.mjs`
- this handoff

Integrated into `ResearchQuickActions` as stage **34/34**. App milestone: `Milestone 1 — Pass 1E.3O.25 — MK1 Palette-Binding Exception Census`.

## Continuation

Do not spend the next pass guessing palettes for the unresolved 79 descriptors. The next verification should instead formalize animation stream control and caller-supplied dwell/timing semantics, preserving the distinction between executor timing and per-animation timing assignment.
