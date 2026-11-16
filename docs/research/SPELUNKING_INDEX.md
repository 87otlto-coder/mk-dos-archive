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
| **001** (2026-11-16) | Original MK2 eight-channel selector table, shared channel-zero references and five authenticated script→setup→slot-2 palette-record chains. A selected setup is loaded through runtime mutable Object2 channel state, so static stage-label proximity is not active DAC ownership. | [Report](SPELUNK_001_MK2_PALETTE_CHANNEL_BRIDGE.md), [JSON](../validation/SPELUNK_001_MK2_PALETTE_CHANNEL_BRIDGE_20261116.json), [reproducer](../../scripts/research/spelunk001/spelunk_001_channel_bridge.py), [16 private original-file tests](../../scripts/research/spelunk001/test_spelunk_001_channel_bridge.py) | **VERIFIED STATIC CONDITIONAL**; no runtime claims |

## Candidates, not assignments

- **002 candidate:** Source-backed stage command-stream interpreter writes and
  dispatch rules for Object2 selectors `0x77453..0x7746F`. Only investigate
  the actual path to live palette ownership; stop if it requires runtime state.
- **Another candidate:** Resumable source-bound animation frame relationships
  and descriptor linkage from MK2 O136–O175; determine which uncertainties
  can be resolved statically and which require the native P91 frame packet.
- **Later cross-game study:** compare independently validated palette and
  animation mechanisms between MK1/MK2/MK3, without assuming binary formats
  are interchangeable.

The next active P91 original Tomb runtime packet remains a separate private
Windows task and is not blocked by future spelunking or source checkpoints.
