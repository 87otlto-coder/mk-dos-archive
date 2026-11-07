# P54 — MK1 original header-to-preview provenance join (interim develop pass)

Date: 2026-11-07. Baseline: P53 `eb93e01290bd6cf4cee58bbddac567b32e085283`. Main remains P16.

## Problem and verified source foundation

P53 exposed a false navigation promise: MK1 stage-gallery HDRS.GRA candidates are discovered from the installation **file inventory**, whereas actual decoded normalized stage rasters have module-oriented keys in the Asset Library. These identifiers were not joined.

Existing original-MK1 research **O27** already reconstructs exact BGND.ASM top-level module symbols, packed header resource roots and scene BMOD references from the canonical executable and registered GRA file handles, without asserting arcade-stage names. Existing **O54/O55** exports normalized_combined_background.png for 24 modules. Neither establishes a canonical gameplay screenshot.

## Changes

Added `src/core/assets/mk1StageHeaderBindingsP54.ts`. It joins each authenticated O27 `topLevelModules` entry to a decoded O54 asset by **exact module symbol transformed with O54's existing stable slug grammar**, and preserves the original `resourcePath`, HDRS.GRA basename, module symbol, source BMOD names, normalized preview ID and explicit missing-preview status. It rejects unqualified O27 reports, repeated module symbols, duplicate/invalid raster planes, reused preview IDs and non-HDRS resource roots; missing preview IDs remain expressly `PREVIEW_UNAVAILABLE`, not guessed. The aggregate report is named `MK1_P54_VERIFIED_HEADER_MODULE_PREVIEW_JOINS.json`.

The existing MK1 pipeline returns the O27 graph it already computes; the MK1 registry adds the metadata-only P54 report/package with **no new sprite/stage assets**, no decoder or preview changes, no speculative stage names and no new live palette claims. Existing MK1 stage-gallery navigation continues to avoid unsupported per-file deep links pending original-fixture verification.

Added source-only control script `scripts/test-p54-mk1-stage-bindings.cjs`: three positive module joins over two shared headers, an explicit missing-preview case, and **six refusal controls** for false graph qualification, invented stage claims, duplicate module symbols/preview IDs, invalid preview geometry and a non-header root. CI executes those controls and checks script syntax. Added `scripts/verify-mk1-p54-stage-joins.cjs` for the canonical private MK1 directory; it requires **24 exact O27/O54 preview joins**, 2,656 unchanged assets, authentic MK1.EXE SHA, matching original HDRS resources, an intact JSON export, and negative raster mutation refusal.

## Confidence and acceptance boundaries

**VERIFIED:** O27 and O54 source-level report/asset contracts were inspected on GitHub; new source and tests are committed on develop. Source-only CI at [run 42393175579](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42393175579) passed the newly introduced join/refusal test, TypeScript, production build and headless Chrome offline startup. This does not use original DOS fixtures.

**VALIDATION PENDING:** full original-MK1 execution of `scripts/verify-mk1-p54-stage-joins.cjs`, exact 24 preview joins, export report parity, legacy three-game regression, and manual local browser interaction. The user-provided private MK1 ZIP is present in the current chat runtime, but the complete repository cannot be obtained through this container's direct Git network connection (DNS unavailable), so this new runner has not run here.

**UNKNOWN:** arcade-stage nomenclature, original gameplay stage layout/camera, final composite palette ownership, runtime activation and timing. The join only connects already-qualified source/header/module/normalized-preview identities, not a playable scene.

## Continue

Run the P54 original-fixture gate using the complete committed checkout and canonical MK1 installation, investigate any missing joins without inventing identities, and only then consider exposing verified per-header module/preview navigation in the stage gallery. P55 may target MK2 source-qualified palette display or additional verified stage usability. P56 remains next consolidation assessment; no promotion to main; original game files and extracted copyrighted assets stay outside Git.
