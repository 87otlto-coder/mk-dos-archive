# MK DOS Archive / Extractor

A forensic, evidence-led asset extractor for the original DOS editions of **Mortal Kombat**, **Mortal Kombat II**, and **Mortal Kombat 3**.

> **Primary objective:** deliver a comprehensive, usable extractor for all three DOS games. Reverse-engineering work is justified when it improves extraction, original asset interpretation, preview, animation, stage construction, audio, music, or export accuracy.

## Current checkpoint

- **P21 is the consolidated source checkpoint on develop; main remains the accepted P16 checkpoint.** Earlier P11/P6 source is retained in Git history.
- Fresh P21 regression: **11 suites PASS**. MK2: **5,118 unique asset representations / 536 cumulative checks**, plus **818,695 focused checks**. MK1: **2,656 assets**, including 49 stage previews with PNG export readback. MK3: **9,186 assets**, with representative exports across five kinds.
- Run `node scripts/verify-p21-checkpoint.cjs --mk2 <dir> --mk1 <dir> --mk3 <dir> --report <json>` with original local installations. Omitted optional games are explicitly not run. Keep reports outside the game directories.
- The full research workbench is preserved. Commercial game binaries, extracted artwork/audio and emulator captures remain outside GitHub.
- Source fixture tests and source-offline Chrome startup do not prove real-data browser interaction. P12–P19 browser action checks remain pending. Native timing, live palette ownership and full stage composition are not inferred.
- Next cycle: **P22 MK2 coverage reconciliation**, followed by a bounded missing-family integration grounded in existing verified research.

Read [PROJECT_STATUS.md](PROJECT_STATUS.md), [P21 checkpoint](docs/EXTRACTOR_P21_SOURCE_CHECKPOINT_2026-11-06.md) and [repository preservation rules](docs/REPOSITORY_POLICY.md) before continuing development.

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
- `develop`: P21 source checkpoint and subsequent MK2-focused interim work; preserve tested, evidence-grounded changes.

## Project continuity

This repository is the **persistent GitHub anchor** for ChatGPT's **MK Dos Extractor** Project. Start new sessions by reading [PROJECT_STATUS.md](PROJECT_STATUS.md), verifying the current GitHub branches/commit, and checking the documented source baseline before making changes.
