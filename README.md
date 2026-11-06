# MK DOS Archive / Extractor

A forensic, evidence-led asset extractor for the original DOS editions of **Mortal Kombat**, **Mortal Kombat II**, and **Mortal Kombat 3**.

> **Primary objective:** deliver a comprehensive, usable extractor for all three DOS games. Reverse-engineering work is justified when it improves extraction, original asset interpretation, preview, animation, stage construction, audio, music, or export accuracy.

## Current checkpoint

- **P26 is the consolidated source checkpoint on develop; main remains the accepted P16 checkpoint.** P21, P11 and earlier source remain in Git history.
- Fresh P26 verification: **15 standard three-game suites PASS**, plus four independent original-file MK2 image/export verifiers and 13 rejected falsified exports. MK1 **2,656**, MK2 **5,220**, MK3 **9,186** asset representations. MK1/MK3 decoded visual hashes match P21.
- P22–P25 added **102 original indexed image representations**: CAVE 49, ARMORY 18, BATTLE 20, ARENA 15. P27/P28 add **16 standalone TOMB and 13 standalone PORTAL components already used in existing mosaics**, and P29 adds **six mixed-descriptor TOWER originals**, and P30 adds **49 FOREST originals (43 used in P7 layers, six unlinked)**, for **5,304 current MK2 representations / 1,940 cumulative checks**. This is new standalone access, not newly discovered artwork. Prior source and provenance are preserved.
- Reproduce the full checkpoint with `node scripts/verify-p26-checkpoint.cjs --mk1 <dir> --mk2 <dir> --mk3 <dir> --report <json>`. All three fixtures are required; test artwork stays outside source and original games. The standard interim runner remains available.
- All **2,122 P25 committed file blobs** matched local materialized source before consolidation. P26 adds verification/CI/docs only; the full research workbench and runtime source are preserved. No commercial game media is committed.
- Original-data browser action checks remain pending. Source-offline Chrome startup does not establish those interactions, native timing, live palette ownership or complete stage composition. MK1 research ZIPs contain variable per-run metadata; their whole hashes are not used as stable decoded-pixel baselines.
- Next: **P31 fifth-pass consolidation assessment**, including fresh three-game verification, all eight MK2 family independent checks and full committed-source audit. The interim runner defaults to P30 (`--through p30`); the P26 full checkpoint runner remains frozen to P26 source. Main promotion remains separate.

Read [PROJECT_STATUS.md](PROJECT_STATUS.md), [P26 checkpoint](docs/EXTRACTOR_P26_SOURCE_CHECKPOINT_2026-11-06.md) and [repository preservation rules](docs/REPOSITORY_POLICY.md) before continuing development.

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
- `develop`: P26 source checkpoint and subsequent MK2-focused interim work; preserve tested, evidence-grounded changes.

## Project continuity

This repository is the **persistent GitHub anchor** for ChatGPT's **MK Dos Extractor** Project. Start new sessions by reading [PROJECT_STATUS.md](PROJECT_STATUS.md), verifying the current GitHub branches/commit, and checking the documented source baseline before making changes.
