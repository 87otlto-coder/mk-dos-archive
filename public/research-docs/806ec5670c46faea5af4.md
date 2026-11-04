# MK DOS Archive — Handoff — Pass 1E.3O.23 Verified Palette-Bound RGBA Export Fixtures

**Date:** 2026-09-29 SAST  
**Status:** **DIRECT AUTHENTIC-INSTALL VALIDATION PASSED / CORRECT-COLOR RGBA EXPORT ESTABLISHED FOR QUALIFIED FIXTURES**

## Purpose

O23 is the first export-first pass that takes authentic MK1 compressed sprite bytes all the way to deterministic transparent RGBA output using palette bindings already qualified by independent earlier research. It deliberately avoids guessing palette ownership for the broader O17/O18 animation graph.

Qualified fixtures only:

- Kano heart-rip composition → `BLOOD_P` (O2)
- Rayden normal lightning setup/travel → `MORPH_P` (O4)

## Important prerequisite correction

The historical O2 JSON available before this pass was generated from an edited MK1.EXE (`869985...38ca`) and is therefore unsuitable as the canonical prerequisite for O4/O23. O23 did **not** patch or relabel that report.

Instead, O2 was regenerated from the complete authentic installation supplied by the user. Fresh O2 provenance is the canonical MK1 executable:

- size: `1,157,222`
- SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`
- O2 status: `SUCCESS`
- O2 verdict: `MULTI_PART_FRAME_AND_BOUNDED_LOSSLESS_IR_ESTABLISHED`
- no-edit whole-EXE mismatch count: `0`

This fresh canonical O2 report is the O23 prerequisite.

## Export mechanics proved

O23:

1. reads authentic `GRAPHICS/MISC.GRA` and `GRAPHICS/RAIDEN.GRA`;
2. decodes the already-qualified uGRA descriptors;
3. maps opaque source index `n` to palette entry `n-1`, consistent with the earlier GETPAL/PALRAM/renderer one-based alignment proof;
4. converts MK1 15-bit palette words to the verified odd-valued VGA 6-bit channel representation and then to 8-bit preview RGB;
5. writes alpha 0 for transparent pixels and alpha 255 for opaque indexed pixels;
6. composes Kano multi-part heart frames at descriptor-local X/Y offsets;
7. preserves the shared heart frame alias (`PRIMARY:4` / `BEAT_LOOP:2`);
8. emits deterministic RGBA checksums and optional PNG fixtures.

For multi-part heart compositing, structural descriptor order is used only as a **preview layering policy**. Final runtime pixel z-order is not promoted.

## Direct authentic-install result

Report format:

`mk1_verified_palette_bound_export_fixtures_v1`

Verdict:

`MK1_QUALIFIED_PALETTE_BOUND_RGBA_EXPORT_FIXTURES_ESTABLISHED`

Result:

- Kano heart sequence occurrences rendered: **8**
- unique heart frame records: **7**
- multi-part heart occurrences: **1**
- Rayden qualified lightning sprites rendered: **13**
- total RGBA payloads: **21**
- decode failures: **0**
- out-of-palette opaque indices: **0**
- all O23 checks: **10/10 PASS**

Representative visual inspection also reproduces a correctly red Kano heart composite and blue/white Rayden lightning against transparent backgrounds. This visual inspection is supportive; the machine gates remain the authoritative proof.

## PNG fixture package

The smoke harness contains a small Node-only PNG encoder around the core RGBA payloads. The core itself deliberately claims only RGBA generation, not generic PNG-container implementation.

The PNG package contains 21 files:

- `heart/PRIMARY_0..4.png`
- `heart/BEAT_LOOP_0..2.png`
- `lightning/HANDBO22.png`
- `lightning/HANDBO4/5/8/9/10..17.png`

The duplicated shared heart record produces byte-identical PNG output where expected.

## Validation boundaries

Established:

- correct-color RGBA generation for the qualified Kano heart `BLOOD_P` context;
- correct-color RGBA generation for the qualified Rayden lightning `MORPH_P` context;
- transparent output from authentic GRA bytes;
- descriptor-local multi-part composition for the already-qualified heart fixture;
- deterministic output checksums.

Not established by O23:

- generic palette ownership for all 1,102 O18 descriptors;
- automatic body-palette assignment by GRA filename;
- automatic per-animation palette state;
- final multi-part runtime z-order;
- uGRA encoding/import;
- EXE write-back.

## Implementation

Added:

- `src/games/mk1/research/verifiedPaletteBoundExportFixtures.ts`
- `scripts/run-verified-palette-bound-export-fixtures.mjs`

Integrated as research stage **32/32**.

The smoke script explicitly isolates TypeScript type roots so incomplete local `node_modules` directories cannot contaminate targeted validation.

## Artifacts

- direct report: `/mnt/data/o23_direct_final.json`
- fresh canonical O2 prerequisite: `/mnt/data/o23_prereq_fresh/mk1_multi_part_frame_lossless_ir_direct.json`
- PNG directory: `/mnt/data/o23_pngs_final`
- PNG/report bundle: `/mnt/data/MK1-O23-qualified-palette-bound-PNG-fixtures.zip`
- source: `/mnt/data/o23_work/MK-DOS-1E3O23`
- source ZIP: `/mnt/data/o23_work/MK-DOS-1E3O23-source.zip`

Hashes:

- source ZIP SHA-256: `4fc9e559c27be79872332d4740255ce8ee963e80c72d7bcb229444a3b2c3da1a`
- PNG/report ZIP SHA-256: `edb1d32078bd757bc4f6b8b5ede4192b18b7a8d12b002a39af2d1e8ea5f4caa4`
- final direct JSON SHA-256: `e3fb619e637f398c11862c96eb6fbb390510609821907c62b97655b787fce6c3`

## Recommended continuation

Do **not** jump from these two qualified effects to a universal one-palette-per-GRA rule. The next useful export pass should exploit the already-established character palette state and renderer palette-shift mechanism to generate **explicit normal/alternate character-context variants** for primary fighter resources while retaining effect/cross-resource entries as unresolved unless separately qualified.
