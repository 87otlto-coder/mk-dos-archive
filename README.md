# MK DOS Archive / Extractor

A forensic, evidence-led asset extractor for the original DOS editions of **Mortal Kombat**, **Mortal Kombat II**, and **Mortal Kombat 3**.

> **Primary objective:** deliver a comprehensive, usable extractor for all three DOS games. Reverse-engineering work is justified when it improves extraction, original asset interpretation, preview, animation, stage construction, audio, music, or export accuracy.

## Current checkpoint

- **P41 is the consolidated source checkpoint on develop; main remains accepted P16.** All prior source and evidence remain in Git history; no runtime source changes in P41.
- P41 fresh **25 standard three-game suites plus P40 fixture gate PASS**, no skipped games: MK1 **2,656**, MK2 **5,369 / 4,357 cumulative checks**, MK3 **9,186** representations. MK1/MK3 decoded visual hashes match P21, P26, P31 and P36.
- **Twelve independent MK2 families PASS:** 251 representations / 939,903 indexed pixels / 10,712,883 checks; **54 altered exports rejected**, clean rechecks passed.
- P32-P35 add 65 standalone representations. FOREST, PIT, ARMORY and ARENA native byte partitions are verified separately from palette, timing, runtime use and full scene composition.
- Reproduce with matching source: `node scripts/verify-p41-checkpoint.cjs --mk1 <dir> --mk2 <dir> --mk3 <dir> --report <private-json> --work <private-dir>`. All three fixtures are required. P36/P31/P26 remain frozen historical runners; the interim runner defaults to P38.
- Build, TypeScript, syntax and source-only refusal controls pass. Original-data browser action checks remain pending. MK1 whole-ZIP variance is observed; metadata volatility remains inferred despite verified unchanged decoded visuals.
- Interim **P37** adds a metadata-only source interval report: 15 resources / 272 qualified references, independent original-file and byte-set checks, six rejected false reports; all 22 current MK2 suites pass. Census unchanged. Scope gaps do not imply missing artwork.
- Interim **P38** independently joins sixteen existing TOMB effects into complete native byte accounting; no new asset representations. All 23 current MK2 suites pass; P37 report byte-identical. P38 reports 288 qualified references; report scope is separate from complete scene/runtime qualification.
- **P39/P40 PORTAL acceptance PASS:** twenty existing effects close native byte accounting with no new assets; 23 cumulative MK2 suites plus the separate P40 original-fixture gate pass at 5,369 representations. P37/P38 report hashes preserved.
- **P42-P45 complete:** seven existing TOWER effects joined; 315 source references and all 43 stage-effect exports independently verified. P45 current MK2 acceptance passes at 5,369 representations. Use scripts/verify-p45-mk2-acceptance.cjs with explicit --mk2, --report and --work paths.
- Next **P46 consolidation assessment**; latest full three-game evidence is P41. No original game media or private export artwork is committed. Main promotion remains separate.

Read [PROJECT_STATUS.md](PROJECT_STATUS.md), [P41 checkpoint](docs/EXTRACTOR_P41_SOURCE_CHECKPOINT.md) and [repository preservation rules](docs/REPOSITORY_POLICY.md) before continuing development.

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
