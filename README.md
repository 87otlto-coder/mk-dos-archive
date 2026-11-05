# MK DOS Archive / Extractor

A forensic, evidence-led asset extractor for the original DOS editions of **Mortal Kombat**, **Mortal Kombat II**, and **Mortal Kombat 3**.

> **Primary objective:** deliver a comprehensive, usable extractor for all three DOS games. Reverse-engineering work is justified when it improves extraction, original asset interpretation, preview, animation, stage construction, audio, music, or export accuracy.

## Current checkpoint

- **P11 is the verified consolidated source checkpoint on `main`** (2026-11-05); earlier P6 source remains in Git history, and subsequent interim work continues on `develop`.
- Original-MK2 cumulative regression: **5,053 unique assets / 40 checks**; P7–P10 independent parity, negative cases and package checks are preserved.
- Strict npm lockfile install, Vite production build, full TypeScript check, source syntax and headless Chrome onboarding passed at candidate `350b44a` ([Actions](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42099652550)).
- User-tested Windows browser support: MK1, MK2, MK3 asset previews, MK2 Pit II source navigation and exports. **Exports are user-verified**, not exhaustive independent cross-game checksum QA.
- Canonical MK1 fixture exposes **49 stage images**, including 24 normalized module previews and a shared moon layer. The 17 `*HDRS.GRA` candidate cards do **not** identify complete arena compositions; source-independent MK1 batch ZIP integrity passed.
- MK3 fixture reports **416 images** but no verified stage-classified images; stage membership is a future extraction task, not a P11 regression.
- Further optional browser QA and incomplete stage research are tracked in [Issue #5](https://github.com/87otlto-coder/mk-dos-archive/issues/5). No original commercial game files or extracted artwork are committed.

Read [PROJECT_STATUS.md](PROJECT_STATUS.md), [P11 promotion record](docs/P11_PROMOTION_2026-11-05.md) and [repository preservation rules](docs/REPOSITORY_POLICY.md) before continuing work.

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

- `main`: verified P11 source checkpoint and stable project documentation.
- `develop`: new interim extractor work after the P11 source checkpoint; merge only tested, evidence-grounded changes.

## Project continuity

This repository is the **persistent GitHub anchor** for ChatGPT's **MK Dos Extractor** Project. Start new sessions by reading [PROJECT_STATUS.md](PROJECT_STATUS.md), verifying the current GitHub branches/commit, and checking the documented source baseline before making changes.
