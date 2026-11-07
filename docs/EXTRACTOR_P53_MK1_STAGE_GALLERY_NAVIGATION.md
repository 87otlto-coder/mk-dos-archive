# P53 — MK1 stage gallery source/decoded-asset navigation boundary

Date: 2026-11-07. Interim pass after P51; `develop` only. `main` remains P16.

## Observation and root cause

User-supplied local screenshots show MK1 `*HDRS.GRA` stage gallery cards (for example FU5HDRS.GRA) with `Browse resource` taking the user to an Asset Library search returning `No matches`. The committed `discoverStageGallery` model creates MK1 header candidate cards from the **file inventory**, not from the **decoded asset registry**. `MuseumStages` previously passed `stage.file` to `onSelectResource`, which routes to Asset Browser's text filter over asset name/group/confidence/source path. Consequently existence of an inventory header never established a matching decoded asset, and the card advertised navigation unsupported by its evidence.

## Focused change

`src/components/MuseumWorkspace.tsx` now retains the existing MK2 browse actions while replacing MK1 header-candidate `Browse resource` with a noninteractive, explicit `Header identified; no verified per-file decoded-asset link` message. The existing MK1 `Browse normalized previews` banner remains the source-qualified route for actual normalized background previews. No game binary decoder, asset registry, palette, original-stage mapping, stage composition, export, source scan, research workbench or game census changes.

This is a **navigation truthfulness fix**, not a complete MK1 stage-browser solution. A future improvement must separately join candidate header inventory names to independently qualified decoded assets before enabling per-resource deep links. Do not infer arcade-stage names or stage assembly from filename similarity.

## P52 user-local acceptance association

The user supplied a console PASS from `scripts/verify-mk1-p52-fallback-indexed.cjs`, reporting 187 original Kano frames, 928,368 index pixels, 340,324 opaque pixels, the expected combined digest `838216030d67125687534f8a5e7e576d2381d049e3b98ca13185c48b12a8668a`, 187 indexed ZIPs, four malformed-export refusals, modified-executable fallback and descriptor fail-closed checks. This is **user-local test evidence**, not a regression independently rerun by this development session. P52 original-fixture acceptance is supported by that reported run; actual browser interaction with fallback remains pending.

## Confidence and next

**VERIFIED (source):** inventory/asset-browser deep-link mismatch and focused conditional markup correction; earlier MK1 normalized preview button and MK2 links preserved.

**VALIDATION PENDING:** source-only CI on the committed candidate; updated MK1 stage gallery click-through in the user's browser, complete P53 original-fixture regressions. Existing P51 full three-game results remain the latest recorded comprehensive baseline.

**UNKNOWN:** original per-header arcade-stage mapping, full compositing, native runtime palette/placement. Next P54 should prioritize an evidence-backed stage/resource correlation or one high-impact native MK2 palette witness rather than cosmetic stage cards. P56 remains the next consolidation assessment. Keep all original commercial game data outside Git.
