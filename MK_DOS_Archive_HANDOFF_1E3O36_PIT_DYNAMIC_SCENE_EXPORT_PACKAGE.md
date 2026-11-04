# MK DOS Archive — Pass 1E.3O.36 PIT Dynamic Scene Export Package

Date: 2026-09-30

## Status

**VERIFIED — `MK1_PIT_BOUNDED_DYNAMIC_SCENE_EXPORT_PACKAGE_ESTABLISHED`**

O36 joins the established PIT static placement package to O35's process-created motion families without manufacturing unresolved ordering, camera evolution, process phase or wall-clock timing.

## Package contents

Ordinary PIT scene:

- 358 O28 placement records;
- 88 qualified correct-colour descriptor/palette RGBA variants;
- O29/O31 initial camera state X=211, Y=35.

Persistent dynamic family:

- 10 no-scroll moving groups;
- 8 unique `dcloud_p` RGBA part assets;
- normalized 8-tick poll timeline through tick 2112;
- 265 poll snapshots;
- 12 wrap events in the bounded window, including second wraps of groups 02 and 05.

Conditional transient family:

- 8 correct-colour random silhouette variants;
- exact spawn gate retained;
- 32-tick initial process wait recorded separately from object-local phase;
- normalized local lifecycle: first threshold 250, pause complete 538, second threshold/delete 788.

Shadow/render-bound track:

- exact symbolic `SHAD_SCRNTL` formula preserved;
- cadence = one scheduler tick;
- no fabricated numeric timeline because runtime `CEILING_Y` / `WORLDTLY` state is not bound here.

## RGBA export validation

Total deterministic RGBA/PNG payloads: **104**

- 88 ordinary placement variants;
- 8 persistent dynamic parts;
- 8 transient variants.

All dynamic opaque indices fit the 14-colour `dcloud_p` record. An independent Python implementation reread the authentic EXE/GRA bytes, independently decoded/colorized all 104 assets and matched every generated PNG's raw RGBA exactly. It also reproduced the 265-poll persistent timeline, all 12 wrap events and the transient lifecycle.

The final integrated-source rerun is semantically identical to the independently audited verification output; all 104 final PNG files are byte-identical to the independently audited PNG set.

## Why no full-stage flattened raster is emitted

A canonical raster is still blocked by evidence, not implementation convenience:

- unresolved equal-primary+Y tie ordering from O29/O31;
- runtime PIT camera evolution outside the bounded process family;
- conditional/random transient presence and descriptor choice;
- unresolved absolute mutual process phase;
- runtime inputs required to numerically evaluate the shadow bound.

The canonical export is therefore structured/time-aware rather than a guessed composite.

## Integration

Normal research workflow advances from 43/43 to **45/45** through O36. O35/O36 are read-only and do not broaden the writer surface.

## Pause / next direction

O35 + O36 complete the current two-major-verification block. Stop here and refresh the authoritative master handoff before further research. A natural next bounded pair is CAVE process-created object/random-phase qualification followed, only if that closes cleanly, by a bounded CAVE dynamic export. STRIPPED's external child remains unresolved and should not be guessed.
