# MK DOS Archive / Extractor

A source-backed **MK2-first creative toolkit** for animated wallpapers, sprite/stage animations, playable sound effects and music exports. The original DOS MK1 and MK3 code and research remain preserved for sequential expansion **after MK2 v1**.

> **Current priority (2026-11-21):** finish one usable result at a time, starting with **Living Forest Wallpaper v0.1**, not exact native framebuffer reconstruction. See the [active creative toolkit SOP](docs/MK2_CREATIVE_TOOLKIT_SOP.md). Historical forensic research and fidelity labels remain available; current creative presentation may use clearly labeled aesthetic choices.

Read the [chat-first scene workflow](docs/CHAT_FIRST_CREATIVE_SCENES.md) for direct, original-fixture headless reconstruction and future scene-editor control requirements.

## Active plan and development branch

- **Single current deliverable:** Living Forest Wallpaper v0.1, using existing O196/O197/O201/O202 assets and parallax evidence. Deliver a real 320×200, 30 fps, 10-second seamless-loop MP4 and reproduction instructions before starting the next item.
- Next: MK2 audio exports (312 independently verified WAV effect sources and 165 MIDI musical representations), then more stage wallpapers, supported sprite animations and an MK2 v1 usability pass. MK1 then MK3; no parallel work.
- **Runtime-perfect rendering and P91 are paused**, not deleted. Accurate source pixels, masks, raw sound and original event data remain mandatory; visual timing, positioning and palette adjustments may be marked CREATIVE.
- The headless continuation is [`feat/headless-mk2-stages`](https://github.com/87otlto-coder/mk-dos-archive/tree/feat/headless-mk2-stages) at historical checkpoint `0deaf71` (20 Node and 2 stage-component user-local tests passed). Do not conflate this headless count with legacy asset-catalog counts.
- The following P16 checkpoint notes document the historical `main` snapshot; they are **not the active sprint plan**.

## Historical current-on-main checkpoint (P16)

- **P16 is the verified, consolidated Git-safe source checkpoint on main** (2026-11-06). P11 and earlier P6 remain in Git history; new extractor work continues on develop.
- MK2 original-file scanner: **5,108 unique assets / 83 P15 cumulative checks previously passed**, up from P11 5,053 / 40. The P12–P15 cycle adds 31 original PROBE/ACCLAIM intro frames, 15 native Mountain images, seven neutral stage-floor projections and two screenshot-witnessed Tomb/Portal floor previews.
- P16 independently verified the canonical 614-file ZIP and 13 critical source hashes (**643 input-identity checks**), and independently reran the preserved P11 baseline (**5,053 assets / 40 checks**; original P8–P10 ZIP hashes unchanged). The P15 complete decoder suite was **not rerun in P16**, since no decoder code changed.
- [P16 source CI](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42261497116) passed strict dependency install, syntax, forbidden-media audit, Vite build, TypeScript and Chrome source-offline startup. CI now covers main and develop.
- The user verified MK1/MK2/MK3 browser import, previews and exports at P11. Browser interaction with newly added P12–P15 records remains pending independent confirmation. Existing MK1/MK3 known extraction limitations remain unchanged.
- Index pixels and source provenance are preserved. Conditional screenshot colour is **not proof of live DAC palette ownership**; normalised floor views are **not complete 320×200 gameplay stages**; animation timing and world placement are not invented.
- Commercial game binaries and extracted copyrighted media are excluded. Remaining optional browser QA and stage research are tracked in [Issue #5](https://github.com/87otlto-coder/mk-dos-archive/issues/5).

Read the [active creative toolkit SOP](docs/MK2_CREATIVE_TOOLKIT_SOP.md), [PROJECT_STATUS.md](PROJECT_STATUS.md), [P16 checkpoint and regression handoff](docs/EXTRACTOR_P16_CUMULATIVE_CHECKPOINT_2026-11-06.md) and [repository preservation rules](docs/REPOSITORY_POLICY.md) before continuing development.

## Scope

**Active:** MK2-only asset identification, source graphics/indices, composited creative wallpaper scenes, source animations, sound effects, music, previews and batch exports. **Deferred:** MK1/MK3 feature work, perfect native runtime stage and palette parity, emulator capture, advanced interface frameworks and unrelated research. Preserve source provenance and distinguish creative presentation from original runtime facts.

Gameplay controls, combat/damage/collision behavior and full generalized game reassembly are **not** first-milestone goals. The original research workbench is to be preserved intact; any future extractor-only application should branch or copy from verified code rather than destructively slim down the research source.

## Source cadence and evidence

- Deliver one user-visible feature/output at a time; test the changed mechanism and inspect actual media.
- Consolidate and run broader regressions at meaningful checkpoints; the historical five-pass cadence is optional, not a reason to create research work.
- Provenance labels distinguish **verified**, **inferred**, **hypothesis**, **unknown**, and **implemented / validation pending**.
- A headless-verified pipeline must not be described as a browser-verified application.

## Original game files

This repository **does not distribute commercial game installations, game executables, extracted commercial artwork/audio, or emulator dumps**. A user's legitimately obtained local game installation is required for fixture-based verification. Never add those source files to version control.

## GitHub branch use

- `main`: historical P16 accepted Git-safe source checkpoint and durable policy documentation.
- `develop`: separate legacy research/application development lineage; historical next-pass instructions there do not override the active SOP.
- `feat/headless-mk2-stages`: current MK2 headless extraction continuation to extend narrowly for creative deliverables; verify actual HEAD before modifying.

## Project continuity

This repository is the **persistent GitHub anchor** for ChatGPT's **MK Dos Extractor** Project. Start new sessions by reading the [active SOP](docs/MK2_CREATIVE_TOOLKIT_SOP.md), then [PROJECT_STATUS.md](PROJECT_STATUS.md), verifying the current GitHub branches/commit, and checking the documented source baseline before making changes.
