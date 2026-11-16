# MK DOS Extractor — Spelunking research register

Spelunking is source-first, extraction-driven investigation that can be done
without user-assisted Windows runtime validation. **After each spelunk, commit
the source-safe findings and tests to GitHub before beginning the next one.**

## Operating rules

- Prioritize unresolved mechanisms that affect extraction accuracy,
  completeness, provenance or native rendering. Do not restart work already
  established by O-series, P-series or accepted source evidence.
- OBSERVE → RECORD → HYPOTHESIZE → TEST → CLASSIFY CONFIDENCE →
  GENERALIZE ONLY AFTER INDEPENDENT REPETITION.
- Prefer original canonical DOS fixture bytes over comments, old handoff
  claims, visual similarity and previously derived spreadsheets. Never
  overwrite originals or commit game binaries, palette words, graphics, audio,
  private runtime packets or copyrighted extracted resources.
- Keep branches isolated. Each completed spelunk gets its own source-safe
  `docs/research/SPELUNK_NNN_*.md`, optional machine-readable metadata
  under `docs/validation/`, validated reproduction script under
  `scripts/research/spelunkNNN/`, and a `PROJECT_STATUS.md` update on the
  research branch.
- Classify VERIFIED STATIC separately from VERIFIED RUNTIME. No generated
  stage, timing, palette owner, original pixel value or test result can be
  promoted from a source-only study to runtime VERIFIED.
- Prefer read-only original-file reproduction in Chat; Windows CI without
  original commercial files may only establish source syntax/synthetic
  mechanism tests. Do not imply that a CI test validated proprietary bytes.
- Reuse existing extractor work before proposing implementation. A new UI,
  release, emulator build or user validation session is not part of a spelunk.

## Register

| ID | Topic / outcome | Evidence | Status |
|---|---|---|---|
| **001** (2026-11-16) | Original MK2 eight-channel selector table, shared channel-zero references and five authenticated script→setup→slot-2 palette-record chains. Subsequent 002 qualification: the shared channel-zero pointer is a base destination; explicit skips can put the first actual setup on channel 1. Static stage-label proximity is not active DAC ownership. | [Report](SPELUNK_001_MK2_PALETTE_CHANNEL_BRIDGE.md), [JSON](../validation/SPELUNK_001_MK2_PALETTE_CHANNEL_BRIDGE_20261116.json), [reproducer](../../scripts/research/spelunk001/spelunk_001_channel_bridge.py), [16 private original-file tests](../../scripts/research/spelunk001/test_spelunk_001_channel_bridge.py) | **VERIFIED STATIC CONDITIONAL**; no runtime claims |
| **002** (2026-11-16) | Recovered root-local setup selector program grammar: explicit skip 1, default abort 0x30240, setup-cell address writes, -1 termination, -2 separate derived-global writes. Independently audited the original MK2 first-ten index × three-mode census: 30 cases/20 distinct roots; Tomb/Portal mode-conditioned channel setup maps. **Corrected 001's implied channel-zero ownership**: Portal mode=2 puts 0x16514 on channel 1 after a channel-zero skip. | [Report](SPELUNK_002_MK2_STAGE_SELECTOR_PROGRAMS.md), [30-case metadata](../validation/SPELUNK_002_MK2_STAGE_SELECTOR_CENSUS_20261116.json), [source producer](../../scripts/research/spelunk002/trace_stage_selector_programs.py), [private fixture test suite](../../scripts/research/spelunk002/test_stage_selector_programs.py), [8-case Windows synthetic CI](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/43937189003) | **VERIFIED STATIC CONDITIONAL**; no live DAC/frame claims. Original private source walker passed; exact committed private-fixture suite pending. |
| **003** (2026-11-16) | Authenticated two further original MK2 stage-linked animation lists: **Armory 12 original entries / 12 unique 10×64 indexed sprites** and **Living Forest 20 original entries / 7 unique 64×64 sprites**, including Forest's repeated/reversing original descriptor order. Verified stage root → mode-gated registration → task callback → animation cursor writer → shared original reader, backed by original LE relocations and exact GRA RLE. Combined new extraction opportunity: 32 entries / 19 distinct original sprite streams; no runtime claim. | [Report](SPELUNK_003_MK2_ARMORY_FOREST_SOURCE_ANIMATIONS.md), [source-safe record](../validation/SPELUNK_003_MK2_ARMORY_FOREST_SOURCE_SEQUENCES_20261116.json), [original-source reproducer](../../scripts/research/spelunk003/trace_original_stage_frame_lists.py), [original fixture test source](../../scripts/research/spelunk003/test_original_fixture.py), [12-test Windows synthetic CI](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/43943213598) | **VERIFIED STATIC SOURCE FRAME ORDER**; 213 private read-only checks + 7 in-memory source mutations; no native timeline or palette. Committed original-fixture regression suite still pending execution. |

## Candidates, not assignments

- **Completed 002:** Source-backed channel-selector program writes, mode-conditional setup availability and correction of channel-zero assumptions.
- **Completed 003:** Two additional original, stage-linked Armory and Forest
  sprite sequences; verified descriptor ordering, frame-resource decode and
  conditional source execution path without inventing FPS, DAC or placement.
- **004 candidate:** Expand the same strict code-consumer/typed-descriptor/RLE
  test to other original MK2 resource categories, especially effects and
  general sprite-list families, while rejecting menus and non-animated tables.
- **Later cross-game study:** compare independently validated palette and
  animation mechanisms between MK1/MK2/MK3, without assuming binary formats
  are interchangeable.

The next active P91 original Tomb runtime packet remains a separate private
Windows task and is not blocked by future spelunking or source checkpoints.
