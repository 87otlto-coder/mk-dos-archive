# MK DOS Archive / Extractor

A forensic, evidence-led asset extractor for the original DOS editions of **Mortal Kombat**, **Mortal Kombat II**, and **Mortal Kombat 3**.

> **Primary objective:** deliver a comprehensive, usable extractor for all three DOS games. Reverse-engineering work is justified when it improves extraction, original asset interpretation, preview, animation, stage construction, audio, music, or export accuracy.

## Current checkpoint

- **Released source checkpoint:** **P6**, dated **2026-11-04**, headless MK2 extraction verified against the original installation at **5,016 assets**.
- **Latest interim work:** **P10**, dated **2026-11-04**, adding original Pit II bridge background actor frame loops. Cumulative headless MK2 census: **5,053 unique assets**.
- **Next scheduled source checkpoint:** **P11** (consolidation and regression testing for P7–P10).
- **Current repository state:** project governance and status files are established. **The complete P6 application source has not yet been imported into GitHub.** Do not confuse this repository's initial commits with the P6 source release.

See [PROJECT_STATUS.md](PROJECT_STATUS.md) for the live handoff and [docs/REPOSITORY_POLICY.md](docs/REPOSITORY_POLICY.md) for source/research preservation rules.

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

- `main`: verified checkpoints and stable project documentation.
- `develop`: interim implementation work and integration testing. P7–P10 remain interim until the P11 consolidation.

## Project continuity

This repository is the **persistent GitHub anchor** for ChatGPT's **MK Dos Extractor** Project. Start new sessions by reading [PROJECT_STATUS.md](PROJECT_STATUS.md), verifying the current GitHub branches/commit, and checking the documented source baseline before making changes.
