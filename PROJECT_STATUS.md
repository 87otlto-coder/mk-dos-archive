# MK DOS Extractor — project status

**Last status reconciliation:** 2026-11-04  
**Project:** ChatGPT Project “MK Dos Extractor”  
**GitHub:** https://github.com/87otlto-coder/mk-dos-archive

## Governing objective

The first major milestone is a sophisticated extractor for original DOS **MK1, MK2 and MK3**, capable of showing and exporting original resources with correct index pixels, palettes where evidenced, sprite/background animation groups, stage construction information, sound, speech and music. Investigate executable behavior only when it serves that extractor. Gameplay, control, combat and damage logic are not current work.

**Maintain the existing research workbench.** Do not simplify or separate source destructively. Consider an extractor-only copy/branch once coverage is mature enough.

## Verified source and development checkpoint

| Item | Status |
|---|---|
| Original frozen application source | O270 (2026-10-31) |
| Last *full source* checkpoint | **P6 (2026-11-04)** |
| P6 ZIP SHA-256 | `49cf14b72475189bcb8be53fe6ad1d11e4b145205b9e4012c4c2320235a7735e` |
| MK2 original EXE SHA-256 | `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65` |
| P6 canonical MK2 headless scanner | **5,016 unique assets** |
| Most recent interim pass | **P10** |
| P10 cumulative MK2 headless scanner | **5,053 unique assets** |
| Next planned pass | **P11** consolidation and source checkpoint |
| Browser / full React + Vite verification | **Not yet validated** in current environment |
| Full P6 app source uploaded to GitHub | **No — pending import** |

The archived P6 source ZIP is retained in the original project conversation. The repository currently contains status/governance documents, **not an equivalent source baseline**. Treat application source history as incomplete until import and hash comparison finish.

## P7–P10 cumulative work (headless and fixture verified)

| Pass | Asset improvement | MK2 census |
|---|---|---:|
| P6 | Consolidated P1–P5 | 5,016 |
| P7 | Five Living Forest source-local layers, index and provisional-color previews (+10) | 5,026 |
| P8 | Seven Pit II lower-wall/crack original graphics (+7) | 5,033 |
| P9 | Six Pit II upper-stage source-local background layers (+6) | 5,039 |
| P10 | Fourteen Pit II bridge-actor frames in two authenticated seven-frame source loops (+14) | **5,053** |

Keep confidence boundaries: source-local layers are **not** completed full stages; palette candidates are not runtime-confirmed DAC selection; source frame order and loop-backs do not imply known milliseconds or world placement.

**P10 tested:** 225 integration checks, 61 independent parity checks, original O221 mutation controls; exported 14 original frame records. Previous headless MK2 asset groups remained available. P7–P10 edits are preserved in interim patch/handoff artifacts in project conversation and have **not** been merged into a full source ZIP.

## Near-term next steps

1. Import the full **P6 application source** into GitHub in a provenance-preserving way, excluding game binaries, copyrighted extracted assets, sensitive secrets and generated test output.
2. Establish a reproducible `develop` worktree based on that source. Recover P7–P10 from recorded interim patches, checking the patch chain and published fixture evidence.
3. At **P11**, consolidate P7–P10 into one source tree. Confirm the cumulative 5,053 MK2 asset census, export ZIP content and independent source verifiers. Do not silently substitute synthetic assets for original binaries.
4. Run full React/Vite build and browser-level asset preview/export tests **when dependencies and browser test environment are available**. No unsupported browser success claim.
5. Review, but do not automatically prioritize, the deferred interface requests in [docs/UI_BACKLOG.md](docs/UI_BACKLOG.md).
6. Continue extractor-relevant research for MK1/MK2/MK3. Cross-stage mechanisms may generalize only after independent validation; avoid expanding into gameplay reverse engineering.

## Scope discipline

**OBSERVE → RECORD → HYPOTHESIZE → TEST → CLASSIFY CONFIDENCE → GENERALIZE ONLY AFTER REPETITION.**

A verified source relationship is not automatically verified runtime timing, ownership or final scene composition. A research pass should contribute to extraction completeness, accuracy or usability; otherwise record the unknown and move on.

## Release conventions

- P6 = source checkpoint, **headless verified**.
- P7–P10 = interim verified changes, **not a new source checkpoint**.
- P11 = planned consolidation and checkpoint, pending real validation.
- Never describe code that is not actually committed to GitHub as “uploaded” or “tracked in GitHub.”

Update this file whenever the authoritative baseline or release status changes.
