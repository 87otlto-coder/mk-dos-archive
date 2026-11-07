# MK DOS Archive / Extractor

A forensic, evidence-led asset extractor for the original DOS editions of **Mortal Kombat**, **Mortal Kombat II**, and **Mortal Kombat 3**.

> **Primary objective:** deliver a comprehensive, usable extractor for all three DOS games. Reverse-engineering work is justified when it improves extraction, original asset interpretation, preview, animation, stage construction, audio, music, or export accuracy.

## Current checkpoint

- **P46 is the consolidated source checkpoint on develop; main remains accepted P16.** All earlier source/evidence and the workbench are preserved. No runtime source changes in P46.
- Fresh **27 game gates PASS**: 25 standard three-game suites plus PORTAL/TOWER gates, no skipped games. MK1 **2,656**, MK2 **5,369 / 4,357 cumulative checks**, MK3 **9,186** representations.
- Twelve independent image families: **251 representations / 939,903 pixels / 10,712,883 checks**; 54 altered exports rejected. Current accounting and all 43 existing effect exports: **315 source references / 7,064,335 decoder checks / 171,036 export checks**; eight false reports and six altered exports rejected.
- Legacy package hashes and decoded MK1/MK3 visuals match their prior checkpoints. Source-byte coverage is separate from complete scenes, native palette/alpha/timing and original-data browser acceptance.
- Reproduce: `node scripts/verify-p46-checkpoint.cjs --mk1 <dir> --mk2 <dir> --mk3 <dir> --report <private-json> --work <private-dir>`. P45 remains the MK2-only acceptance runner. P41/P36/P31/P26 stay frozen.
- Next **P47 bounded browser/extractor acceptance**; P51 is the next scheduled consolidation assessment. Main promotion remains separate; original game data/artwork is excluded from Git.

Read [PROJECT_STATUS.md](PROJECT_STATUS.md), [P46 checkpoint](docs/EXTRACTOR_P46_SOURCE_CHECKPOINT.md) and [repository preservation rules](docs/REPOSITORY_POLICY.md) before continuing development.

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
