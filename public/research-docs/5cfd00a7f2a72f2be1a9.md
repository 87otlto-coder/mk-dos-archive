# MK DOS Archive — Pass 1E.3O.38 CAVE Dynamic Scene Export Package

**Status: VERIFIED.**

## Pass 1E.3O.38 — bounded CAVE random-phase dynamic export package — VERIFIED

O38 packages both CAVE module variants with their O31 ordinary scene context (204 placements for `CAVE_MOD`, 133 for `CAVE_MOD386`) and the process-created `BAKLST9` layer. It exports six unique correct-colour `eyez2` RGBA/PNG payloads and the complete 28-slot phase-zero template at eight scheduler ticks per transition. Each of the six runtime objects retains an explicit 0..27 initial-phase domain; visible progression is `(p+n) mod 28`. Independent Python reconstruction matched all six PNG raw-RGBA buffers exactly and independently matched the 28 canonical table slots. No joint random phase vector, canonical first frame, wall-clock timing, or whole-stage flattened animation is fabricated. Verdict `MK1_CAVE_BOUNDED_RANDOM_PHASE_DYNAMIC_EXPORT_PACKAGE_ESTABLISHED`.


Source implementation: `src/games/mk1/research/caveDynamicSceneExportFixture.ts`; smoke runner: `scripts/run-cave-dynamic-scene-export-fixture.mjs`. Read-only; writer surface unchanged.
