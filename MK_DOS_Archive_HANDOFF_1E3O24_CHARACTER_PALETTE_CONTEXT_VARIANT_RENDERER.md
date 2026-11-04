# MK DOS Archive — Handoff — Pass 1E.3O.24 Character Palette-Context Variant Renderer

**Date:** 2026-09-29 SAST  
**Status:** **DIRECT AUTHENTIC-INSTALL VERIFIED / DETERMINISTIC RECHECK PASSED / NORMAL-APP USER-RETURNED EXPORT NOT REQUIRED FOR CORE CLAIM**

## Purpose

O24 advances the export-first MK1 path from O23's two effect-specific correct-color fixtures to explicit **character palette-context rendering** for the structurally dominant animation resource of each discovered character ANITAB family.

The pass is intentionally contextual rather than universal. It does **not** claim that a GRA filename, ANITAB, or dominant resource determines palette ownership for every animation/effect descriptor. Instead it applies the already-established O20 character identity -> normal/alternate palette context, together with the independently verified one-based renderer palette-shift bridge, only to the dominant resource reached from that character's ANITAB. Cross-resource/effect descriptors remain excluded unless separately qualified.

## Authentic fixture and prerequisites

Canonical MK1 installation source:

- `MK1.EXE` size: **1,157,222** bytes
- SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`
- source kind: `user-loaded-directory`
- synthetic: false

Prerequisites:

- O18 animation/resource decode census — **1,102/1,102** reached descriptors decode successfully from authentic GRA payloads;
- O20 animation/palette context bridge — nine character identity contexts joined to their ANITAB and normal/alternate palette records while preserving palette/animation separation;
- verified palette renderer bridge — `rendererPaletteShiftBridgeEstablished = true`, `oneBasedRendererAlignmentCorroborated = true`, verdict `PALETTE_SETUP_TRANSFER_PIPELINE_ESTABLISHED`.

## Method

For each O20 character context, O24:

1. groups O18 descriptors by ANITAB and authentic resource path;
2. identifies the single structurally dominant resource for that ANITAB by descriptor count;
3. decodes every descriptor belonging to that dominant resource and requires its uGRA checksum to match O18;
4. resolves the character's already-established normal/alternate palette record(s) from canonical Watcom Segment-2 data;
5. requires every selected palette record to contain 23 colors;
6. maps opaque source index `n` to palette entry `n-1`, using the previously verified one-based renderer alignment;
7. renders deterministic transparent RGBA for every selected descriptor/palette-context combination;
8. rejects any opaque source index outside the selected palette;
9. emits aggregate checksums and one representative PNG payload per explicit palette context;
10. leaves all cross-resource descriptors outside the rendering claim.

The dominant-resource classification is explicitly recorded as:

`STRUCTURAL_DOMINANT_ANITAB_RESOURCE_NOT_UNIVERSAL_PALETTE_KEY`

This wording is important: dominance is a structural selection strategy for bounded body-context export, not palette-ownership proof.

## Direct authentic-install result

Report format:

`mk1_character_palette_context_variant_renderer_v1`

Verdict:

`MK1_CHARACTER_PALETTE_CONTEXT_VARIANT_RENDERING_ESTABLISHED`

Summary:

- character contexts: **9**
- unique ANITABs: **8**
- unique dominant-resource descriptors across the eight ANITAB families: **1,016**
- character-context descriptor instances: **1,190**
- explicit palette context variants: **16**
- rendered descriptor/palette RGBA variants: **2,263**
- palette records length 23: **all**
- opaque indices inside selected palette: **all**
- shared `NINJA_ANITAB` character contexts: **2**
- distinct Scorpion/Sub-Zero normal/alternate palette records applied to shared ninja geometry: **4**
- representative sample PNG payloads: **16**
- validation checks: **13/13 PASS**

Per-context dominant-resource coverage:

- Cage / `VANDAN_ANITAB` -> `GRAPHICS/VANDAN.GRA`: 140 dominant descriptors, 10 other-resource descriptors; `GRIMM_P` / `GRIMM3_P`;
- Kano / `KANO_ANITAB` -> `GRAPHICS/KANO.GRA`: 146 dominant, 17 other; `KANO_P` / `KANO3_P`;
- Rayden / `RAIDEN_ANITAB` -> `GRAPHICS/RAIDEN.GRA`: 148 dominant, 9 other; `RAIDEN_P` / `RAIDEN3_P`;
- Liu Kang / `KANG_ANITAB` -> `GRAPHICS/KANG.GRA`: 135 dominant, 14 other; `LUKANG_P` / `LUKANG3_P`;
- Scorpion / `NINJA_ANITAB` -> `GRAPHICS/NINJA.GRA`: 174 dominant, 26 other; `YNINJA_P` / `YNINJA3_P`;
- Sub-Zero / `NINJA_ANITAB` -> `GRAPHICS/NINJA.GRA`: the same 174 dominant geometry descriptors and 26 other-resource descriptors; `BNINJA_P` / `BNINJA3_P`;
- Sonya / `LIZ_ANITAB` -> `GRAPHICS/LIZ.GRA`: 156 dominant, 10 other; `LIZ_P` / `LIZRED_P`;
- Goro / `GORO_ANITAB` -> `GRAPHICS/GGORO.GRA`: 68 dominant, 0 other; `GONGORO_P`;
- EMP / `EMP_ANITAB` -> `GRAPHICS/EMP.GRA`: 49 dominant, 0 other; aliased palette symbols `YANG_P` + `EMP_P` sharing one record.

The shared NINJA result is especially valuable: one animation geometry family is deterministically rendered under four distinct character palette records. This reinforces the O20 proof that animation structure and palette state are separate axes.

## Independent deterministic recheck

After the interrupted long run, O24 was independently rerun from the O22/O18/O20 prerequisite evidence and the authentic installation directory.

Fresh recheck result:

- status: `SUCCESS`;
- verdict: `MK1_CHARACTER_PALETTE_CONTEXT_VARIANT_RENDERING_ESTABLISHED`;
- all summary counts exactly reproduced;
- after removing run-specific timestamps/operation IDs, the fresh report is **semantically identical** to the original O24 direct report;
- all **16 representative PNG files are byte-for-byte identical** to the original sample set by SHA-256.

This closes the timed-out-run uncertainty for the O24 core claim.

## What O24 establishes

- explicit correct-color rendering of dominant fighter-resource descriptors under already-qualified character normal/alternate palette contexts;
- deterministic RGBA generation for 2,263 descriptor/context variants;
- correct reuse of shared NINJA geometry under distinct Scorpion/Sub-Zero palette state;
- all selected opaque indices fit their selected 23-color palette records;
- cross-resource/effect descriptors remain deliberately excluded;
- export architecture can carry geometry and palette context independently.

## What O24 does **not** establish

- automatic per-animation palette binding;
- universal one-palette-per-GRA behavior;
- universal one-palette-per-ANITAB behavior;
- palette ownership for cross-resource/effect descriptors;
- semantic proof that the structurally dominant resource is always a fighter's complete body resource;
- final palette-switch timing inside arbitrary animations;
- stage/background palette behavior;
- uGRA encoding/import;
- EXE write-back.

A successful render under a 23-color character palette is not, by itself, ownership proof for excluded or effect-specific descriptors.

## Implementation

Added:

- `src/games/mk1/research/characterPaletteContextVariantRenderer.ts`
- `scripts/run-character-palette-context-variant-renderer.mjs`

Integrated into `ResearchQuickActions` as research stage **33/33**.

`src/appMetadata.ts` identifies:

`Milestone 1 — Pass 1E.3O.24 — MK1 Character Palette-Context Variant Renderer`

The smoke script compiles the core module with isolated TypeScript type roots and can emit representative PNGs without relying on application UI dependencies.

## Artifacts

- direct report: `/mnt/data/o24_direct.json`
- deterministic recheck: `/mnt/data/o24_recheck.json`
- representative PNG directory: `/mnt/data/o24_samples`
- representative PNG/report ZIP: `/mnt/data/MK1-O24-character-palette-context-samples.zip`
- source root: `/mnt/data/o24_work/MK-DOS-1E3O24`
- source ZIP: `/mnt/data/o24_work/MK-DOS-1E3O24-source.zip`

Known hashes at closeout:

- original direct JSON SHA-256: `d6de0ff9179c2e7421b101658f2424c104a98fc124282d8a2e2fe993512f990f`
- representative PNG/report ZIP SHA-256: `53fe89a67ba8e6854a2bb24466387153b871e8fc30b463230073b523f7a6f097`

The source ZIP hash is recorded after packaging below in the authoritative master handoff and pause report.

## Recommended continuation

Pause here together with O23 per the user's two-major-verification cadence and refresh/persist the authoritative master handoff before any further research.

After the pause, the next export-first block should focus on **palette binding for the currently excluded cross-resource/effect descriptors** and/or **stream control/timing semantics** rather than treating O24 body-context success as universal palette ownership.
