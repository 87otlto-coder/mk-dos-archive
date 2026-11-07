# MK DOS Archive / Extractor

A forensic, evidence-led asset extractor for the original DOS editions of **Mortal Kombat**, **Mortal Kombat II**, and **Mortal Kombat 3**.

> **Primary objective:** deliver a comprehensive, usable extractor for all three DOS games. Reverse-engineering work is justified when it improves extraction, original asset interpretation, preview, animation, stage construction, audio, music, or export accuracy.

## Current checkpoint

- **P31 is the consolidated source checkpoint on develop; main remains accepted P16.** P26, P21, P11 and earlier source/evidence remain in Git history.
- Fresh **19-suite three-game regression PASS**, no skipped games: MK1 **2,656**, MK2 **5,304 / 1,940 cumulative checks**, MK3 **9,186** representations. MK1/MK3 decoded visuals match P21 and P26.
- **Eight independent MK2 image families PASS:** 186 representations / 691,028 indexed pixels / 6,548,174 checks; **31 altered exports rejected** and clean rechecks passed. P27-P30 add 84 standalone known components, preserving existing mosaics/effects/floors and used/unlinked provenance.
- Reproduce P31 on its matching historical source with `node scripts/verify-p31-checkpoint.cjs --mk1 <dir> --mk2 <dir> --mk3 <dir> --report <private-json> --work <private-dir>`. All three fixtures are required. P31 pins P30's census; P26 remains frozen to historical source.
- Interim **P32** adds nine additional FOREST originals: **5,313 current MK2 representations / 2,558 cumulative checks**, all **18 MK2 suites PASS**. FOREST now has a verified 58-stream/native-floor source-byte partition; scene/palette/timing remain separate.
- Interim **P33** adds 28 PIT originals: **5,341 current MK2 representations / 3,577 cumulative checks**, all **19 MK2 suites PASS**. Six P9 canvases reconstruct exactly; 42 streams account for PIT.GRA while lower-wall FALL.GRA remains separate.
- All **2,162 P30 committed blobs / 378 src files** matched the local source before consolidation. P31 changes verification/CI/docs only. No original game media or private export artwork is committed.
- Original-data browser action checks remain pending. Source-only Chrome does not establish original-data interaction, live palette ownership, native timing or full stage composition. MK1 ZIP metadata volatility remains inferred; decoded visuals are verified unchanged.
- Next **P34 ARMORY [116608,126336) source audit** against existing descriptor/component/floor evidence. The standard interim runner defaults to P33; historical checkpoint runners require matching source. Main promotion remains separate.

Read [PROJECT_STATUS.md](PROJECT_STATUS.md), [P31 checkpoint](docs/EXTRACTOR_P31_SOURCE_CHECKPOINT_2026-11-07.md) and [repository preservation rules](docs/REPOSITORY_POLICY.md) before continuing development.

## In scope

Asset identification, graphics and source indices, palette attribution, sprite and background animation structures, stage layers and compositions, audio/speech/music, previews, metadata and batch export.

Gameplay controls, combat/damage/collision behavior and full generalized game reassembly are **not** first-milestone goals. The original research workbench is to be preserved intact; any future extractor-only application should branch or copy from verified code rather than destructively slim down the research source.

## Source cadence and evidence

- Interim passes: implement focused, extractor-relevant findings and run targeted tests.
- Every fifth meaningful pass: consolidate, run regression checks and publish a full source checkpoint if warranted.
- Provenance labels distinguish **verified**, **inferred**, **hypothesis**, **unknown**, and **implemented / validation pending**.
- A headless-verified pipeline must not be described as a browser-verified application.

## Original game files

This repository **does not distribute commercial game installations, game executables, extracted commercial artwork/audio, or emulator dumps**. A user's legitimately obtained local game installation is required for fixture-based verification. Never add those source files to version control.

## GitHub branch use

- `main`: verified P16 Git-safe source checkpoint and stable project documentation.
- `develop`: P31 source checkpoint and subsequent MK2-focused interim work; preserve tested, evidence-grounded changes.

## Project continuity

This repository is the **persistent GitHub anchor** for ChatGPT's **MK Dos Extractor** Project. Start new sessions by reading [PROJECT_STATUS.md](PROJECT_STATUS.md), verifying the current GitHub branches/commit, and checking the documented source baseline before making changes.
