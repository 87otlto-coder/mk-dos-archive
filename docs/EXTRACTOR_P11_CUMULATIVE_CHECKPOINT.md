# MK DOS Extractor — P11 cumulative checkpoint, 2026-11-04

## Goal
Consolidate the P7–P10 interim MK2 stage extractors into the P6 workbench without deleting or restructuring prior research; prepare a GitHub source-code baseline while excluding commercial assets and research output derived from commercial game media.

## Checkpoint source lineage

- Source base: `MK_DOS_Extractor_P6_Cumulative_Source_2026-11-04.zip`, SHA-256 `49cf14b72475189bcb8be53fe6ad1d11e4b145205b9e4012c4c2320235a7735e` (verified).
- P10 compared against P6: **18 added files; 1 modified file (`src/core/assets/collection.ts`); 0 deleted files.** Two added `.pyc` cache files are generated artifacts, excluded from P11.
- P11 adds `scripts/verify-mk2-p11-cumulative.cjs` and this handoff; no application runtime code was altered in the P11 consolidation itself.
- P7: five Living Forest source-local layers, 10 indexed/candidate-color assets (palette runtime unconfirmed).
- P8: seven Pit II original wall/crack graphics.
- P9: six Pit II upper-stage source-local background layers.
- P10: 14 original Pit II bridge actor frames, two original seven-frame loops (duration unknown).

## Re-run validation, original canonical MK2 installation

- **5,053 unique assets**, P6 = 5,016, P7 = 5,026, P8 = 5,033, P9 = 5,039, P10/P11 = **5,053**.
- 40 P11 cross-pass integrity checks (stage-group counts, source-status reports, selective indexed/opacity/PNG ZIP export and P8/P9/P10 historical archive SHA-256 equality).
- 225 P10 integration checks, 61 independent O220/O221 checks.
- 68 independent P8 original O210 parity checks.
- Independent P9 O205 layer/parity suite passed.
- O195 seven-stage floor grammar fixture suite passed, with authenticated 77 source tokens and tamper rejection.
- Source fixture stays in a separate *local-only* path; never commit commercial game binaries to GitHub.

### Known limits

- This is **headless verified**. React/Vite/browser build and browser-level preview/export flow were **not** verified: dependencies (`vite`, React etc.) are not installed in the execution environment.
- Research layer images are not full gameplay stage compositions; runtime palette association, cross-layer offsets, camera rules, animation timing, and playback behavior remain bounded unknowns.
- No MK1/MK3 regression suite was re-run in this specific checkpoint.
- GitHub source upload is **not** complete merely because this local checkpoint exists. Check `PROJECT_STATUS.md` and verify the `main`/`develop` branch contents.

## GitHub import plan

1. Preserve full research/source ZIP as local archival checkpoint.
2. Create a separately audited, Git-safe source snapshot. It carries source code, safe research markdown and build config, but **not** original game files, generated MIDI, commercial image exports, large raw evidence JSON, binary dumps, or session captures. Paths and hashes of excluded files are retained in the snapshot audit manifest to allow local recovery without uploading content.
3. Import P6 Git-safe source to GitHub `main`, P11 tested consolidated source to `develop`, preserving the existing repository README, source policy and status. For durable traceability, retain P7–P10 patch files and these handoffs with the P11 import.
4. After commits are visible on GitHub, update `PROJECT_STATUS.md` and close GitHub Issues #1 and #2 only when their acceptance criteria are met.

## Deferred UX backlog

See `docs/EXTRACTOR_UI_FEEDBACK_BACKLOG_P7.md` and GitHub `docs/UI_BACKLOG.md`. Independent scrolling/sticky inspector, reset Asset Library view, evidence-grounded completion indicators and previewable stage interpretation remain scheduled UI work; no UI change is falsely claimed in P11.
