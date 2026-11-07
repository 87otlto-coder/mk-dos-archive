# MK DOS Archive / Extractor

A forensic, evidence-led asset extractor for the original DOS editions of **Mortal Kombat**, **Mortal Kombat II**, and **Mortal Kombat 3**.

> **Primary objective:** deliver a comprehensive, usable extractor for all three DOS games. Reverse-engineering work is justified when it improves extraction, original asset interpretation, preview, animation, stage construction, audio, music, or export accuracy.

## Current checkpoint

- **P36 is the consolidated source checkpoint on develop; main remains accepted P16.** All prior source and evidence remain in Git history; no runtime source changes in P36.
- Fresh **23-suite three-game regression PASS**, no skipped games: MK1 **2,656**, MK2 **5,369 / 4,357 cumulative checks**, MK3 **9,186** representations. MK1/MK3 decoded visual hashes match P21, P26 and P31.
- **Twelve independent MK2 families PASS:** 251 representations / 939,903 indexed pixels / 10,712,883 checks; **54 altered exports rejected**, clean rechecks passed.
- P32-P35 add 65 standalone representations. FOREST, PIT, ARMORY and ARENA native byte partitions are verified separately from palette, timing, runtime use and full scene composition.
- Reproduce with matching source: `node scripts/verify-p36-checkpoint.cjs --mk1 <dir> --mk2 <dir> --mk3 <dir> --report <private-json> --work <private-dir>`. All three fixtures are required. P31/P26 remain frozen historical runners; the interim runner defaults to P37.
- Build, TypeScript, syntax and source-only refusal controls pass. Original-data browser action checks remain pending. MK1 whole-ZIP variance is observed; metadata volatility remains inferred despite verified unchanged decoded visuals.
- Interim **P37** adds a metadata-only source interval report: 15 resources / 272 qualified references, independent original-file and byte-set checks, six rejected false reports; all 22 current MK2 suites pass. Census unchanged. Scope gaps do not imply missing artwork.
- Next **P38**: reconcile TOMB report gaps with existing effect exports and source provenance. No original game media or private export artwork is committed. Main promotion remains separate.

Read [PROJECT_STATUS.md](PROJECT_STATUS.md), [P36 checkpoint](docs/EXTRACTOR_P36_SOURCE_CHECKPOINT_2026-11-07.md) and [repository preservation rules](docs/REPOSITORY_POLICY.md) before continuing development.

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
