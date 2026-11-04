# MK DOS Archive / Extractor

A forensic, evidence-led asset extractor for the original DOS editions of **Mortal Kombat**, **Mortal Kombat II**, and **Mortal Kombat 3**.

> **Primary objective:** deliver a comprehensive, usable extractor for all three DOS games. Reverse-engineering work is justified when it improves extraction, original asset interpretation, preview, animation, stage construction, audio, music, or export accuracy.

## Current checkpoint

- **Verified P6 source baseline on `main`**, code import commit `eb9691510ce57dd1a7670fcf404de0c0dbd6941b`; MK2 canonical headless fixture census: **5,016 assets**.
- **P11 consolidated source on `develop`**, import commit `65023df71d20eb049a571d6a0d1672d670cddf92`; MK2 canonical headless fixture census from the filtered local P11 source: **5,053 assets**.
- Both branches have been inspected through GitHub; full `src` and research code files are present. The committed source has **not yet been rebuilt or independently re-run from a fresh GitHub clone**.
- **Source parity and original-MK2 headless regression qualified:** P6 5,016 assets / 121 checks, P11 5,053 assets / 40 checks, independent P8–P10 pixel parity passed. [Details](docs/P11_GITHUB_SOURCE_REGRESSION_2026-11-04.md).
- **Next quality gates:** restore reviewed `package-lock.json`, clean dependency installation, Vite/React build, real browser preview/export checks and relevant MK1/MK3 regressions. Do not prematurely promote P11 to `main`.

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
- `develop`: P11 consolidated source candidate and ongoing implementation. Promotion to `main` requires remaining validation.

## Project continuity

This repository is the **persistent GitHub anchor** for ChatGPT's **MK Dos Extractor** Project. Start new sessions by reading [PROJECT_STATUS.md](PROJECT_STATUS.md), verifying the current GitHub branches/commit, and checking the documented source baseline before making changes.
