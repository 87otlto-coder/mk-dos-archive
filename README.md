# MK DOS Archive / Extractor

A forensic, evidence-led asset extractor for the original DOS editions of **Mortal Kombat**, **Mortal Kombat II**, and **Mortal Kombat 3**.

> **Primary objective:** deliver a comprehensive, usable extractor for all three DOS games. Reverse-engineering work is justified when it improves extraction, original asset interpretation, preview, animation, stage construction, audio, music, or export accuracy.

## Current checkpoint

- **P16 is the verified, consolidated Git-safe source checkpoint on main** (2026-11-06). P11 and earlier P6 remain in Git history; new extractor work continues on develop.
- MK2 original-file scanner: **5,108 unique assets / 83 P15 cumulative checks previously passed**, up from P11 5,053 / 40. The P12–P15 cycle adds 31 original PROBE/ACCLAIM intro frames, 15 native Mountain images, seven neutral stage-floor projections and two screenshot-witnessed Tomb/Portal floor previews.
- P16 independently verified the canonical 614-file ZIP and 13 critical source hashes (**643 input-identity checks**), and independently reran the preserved P11 baseline (**5,053 assets / 40 checks**; original P8–P10 ZIP hashes unchanged). The P15 complete decoder suite was **not rerun in P16**, since no decoder code changed.
- [P16 source CI](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42261497116) passed strict dependency install, syntax, forbidden-media audit, Vite build, TypeScript and Chrome source-offline startup. CI now covers main and develop.
- The user verified MK1/MK2/MK3 browser import, previews and exports at P11. Browser interaction with newly added P12–P15 records remains pending independent confirmation. Existing MK1/MK3 known extraction limitations remain unchanged.
- Index pixels and source provenance are preserved. Conditional screenshot colour is **not proof of live DAC palette ownership**; normalised floor views are **not complete 320×200 gameplay stages**; animation timing and world placement are not invented.
- Commercial game binaries and extracted copyrighted media are excluded. Remaining optional browser QA and stage research are tracked in [Issue #5](https://github.com/87otlto-coder/mk-dos-archive/issues/5).

Read [PROJECT_STATUS.md](PROJECT_STATUS.md), [P16 checkpoint and regression handoff](docs/EXTRACTOR_P16_CUMULATIVE_CHECKPOINT_2026-11-06.md) and [repository preservation rules](docs/REPOSITORY_POLICY.md) before continuing development.

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
- `develop`: next MK2-focused interim extractor work after P16; merge only tested, evidence-grounded changes.

## Project continuity

This repository is the **persistent GitHub anchor** for ChatGPT's **MK Dos Extractor** Project. Start new sessions by reading [PROJECT_STATUS.md](PROJECT_STATUS.md), verifying the current GitHub branches/commit, and checking the documented source baseline before making changes.
