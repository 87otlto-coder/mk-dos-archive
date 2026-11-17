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
| **004** (2026-11-16) | Authenticated two SOUL.GRA source phases: a 3-entry loop plus a 14-entry finite sequence, **17 unique indexed sprites partition the entire 47,612-byte resource without gaps**. Two distinct FIRESKEL.GRA six-entry loop lists are selected by an original signed global test and preserved through task +0x5C; these cover only 2,784 bytes within that larger resource. **29 newly source-linked descriptor entries, not 29 newly invented artworks or live-timed frames.** Screened BLOOD/BANG/SUCK candidates but did not promote unverified consumer links. | [Report](SPELUNK_004_MK2_SOUL_FIRESKEL_SOURCE_EFFECTS.md), [source-safe record](../validation/SPELUNK_004_MK2_SOUL_FIRE_EFFECT_PROVENANCE_20261116.json), [read-only reproducer](../../scripts/research/spelunk004/trace_soul_fireskel_source.py), [original-fixture regression source](../../scripts/research/spelunk004/test_original_fixture.py), [Windows original-free CI](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/43947941505) | **VERIFIED STATIC**: independent private input 194 checks/10 in-memory controls; CI 13 synthetic passed. No actual game execution, DAC or timed animation. Exact committed private fixture suite pending. |
| **005** (2026-11-17) | Original MK2 BANG.GRA has 11 typed code-selected lists (**95 ordered references, 93 unique sprites**) plus 8 separately referenced graphic streams: **101 distinct encoded sprites cover all 29,556 source bytes**, without asserting these eight are an additional animation. A source-connected BANG paired-record reader has a signed-X zero stop; the following nine pointer sites are nonuniform/unclassified. SUCK.GRA has 3 code-linked source lists (**5, 5, 8**, only final 4,128 source bytes), plus a separate four-slot single-descriptor lookup that repeats one pointer. | [Report](SPELUNK_005_MK2_BANG_SUCK_SOURCE_OWNERSHIP.md), [source-safe ledger](../validation/SPELUNK_005_MK2_BANG_SUCK_SOURCE_CENSUS_20261117.json), [read-only reproducer](../../scripts/research/spelunk005/trace_bang_suck_sources.py), [private regression source](../../scripts/research/spelunk005/test_original_fixture.py), [Windows synthetic CI](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/44033956610) | **VERIFIED STATIC SOURCE/CONSUMER LINKS**; 600 independent read-only source checks and 11 in-memory refusals; 13 original-free Windows tests passed. Exact committed original-fixture test suite pending. |
| **006** (2026-11-17) | Closed Spelunk 005's SUCK.GRA prefix gap: original 12-slot LE selector table has **9 distinct nested source groups**, each made of typed pointers to two-DWORD sprite-bearing records. Their **65** unique indexed sprites occupy the first **117,872** bytes. Combined with the 18 code-linked suffix sprites, **83 distinct RLE streams account for all 122,000 SUCK.GRA bytes with zero gaps**. Source path **`0x846CA → 0x64ED2 → 0x86825 → 0x63E79 → 0x640DF`** is instruction-confirmed; runtime timing/palette not established. | [Report](SPELUNK_006_MK2_SUCK_COMPLETE_SOURCE_GROUPS.md), [source-safe census](../validation/SPELUNK_006_MK2_SUCK_SOURCE_GROUPS_20261117.json), [original-input audit](../../scripts/research/spelunk006/trace_suck_nested_sources.py), [21 private regression tests](../../scripts/research/spelunk006/test_original_fixture.py), [Windows original-free CI](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/44042239000) | **VERIFIED STATIC CONDITIONAL SOURCE GROUPS**; local private 21/21 tests passed using equivalent audit version, exact committed private-file rerun pending; CI 10/10 synthetic passed. No native gameplay/frame/DAC claims. |
| **007** (2026-11-17) | Independently reconstructed BLOOD.GRA's original **18 typed sprite-list structures** (**155 source entries, 153 distinct sprites**) within O69's existing 178-sprite full-byte corpus. **12 lists** have original code cursor writers; one 12-entry list has four **entry-point selector** choices; five remain structural-only without a proved direct cursor writer. Original normal reader's marker-1 logic authenticates **two intro-then-interior-rewind loops** (18 entries: 0–5 then repeat 6–17; 14 entries: 0–6 then repeat 7–13). An eight-entry group repeats two descriptors. Retains O218/O228 source177 independently. | [Report](SPELUNK_007_MK2_BLOOD_SOURCE_LIST_CONTROL.md), [source-safe ledger](../validation/SPELUNK_007_MK2_BLOOD_SOURCE_CONTROL_20261117.json), [read-only producer](../../scripts/research/spelunk007/trace_blood_source_lists.py), [private-fixture regressions](../../scripts/research/spelunk007/test_original_fixture.py), [Windows original-free CI](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/44047102646) | **VERIFIED STATIC SOURCE ORDER/CONTROL**; source evidence independently checked against private original files; 12/12 original-free Windows tests passed; exact committed private fixture suite unexecuted. No live timing, palette or composition claims. |
| **008** (2026-11-17) | Original BLOOD.GRA has **22 exact typed palette-source links** from descriptor+12 to Object1 `0x26CC4` (O228's Pit source177 colour record), partitioning all 178 indexed sprites into 22 source-contiguous descriptor groups. Separately classified 25 non-list sprites as **9+13+3**, proved five original descriptor-seed instructions converge on four constructor callsites, and preserved O228 Pit placement pointers. All five former unclassified list roots have **zero original typed inbound pointers into their entries and no exact root DWORD occurrence**; retain consumer UNKNOWN rather than declaring them unused. | [Report](SPELUNK_008_MK2_BLOOD_PALETTE_HEADER_PROVENANCE.md), [22-anchor SHA ledger](../validation/SPELUNK_008_MK2_BLOOD_PALETTE_HEADERS_20261117.json), [original-input reproducer](../../scripts/research/spelunk008/trace_blood_palette_headers.py), [20 exact private fixture regression tests](../../scripts/research/spelunk008/test_original_fixture.py), [original-free Windows CI](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/44100547455) | **VERIFIED STATIC TYPED SOURCE LINKS**; **20/20 exact committed private tests PASS** and source Git SHA matches; CI synthetic checked separately. Source palette pointers are not runtime DAC ownership or animation timing. |
| **009** (2026-11-17) | Resolved BANG.GRA's previously “nonuniform” extra records into **three pointer+signed-XY groups (6+1+8 records)** separated by independently verified stops. Only first group is code-connected: source `0x842E0→0x83ECD` accepts five records, skips a sixth X=0 sentinel and reaches **eight original constructor-wrapper CALL sites per accepted record**, with original descriptor update via `0x9377C`. The other groups have no typed inbound code link and remain consumer UNKNOWN. Found **12 explicit BANG descriptor+12 source-colour pointers** to Object1 `0x26CC4`, partitioning all 101 indexed sprites / 29,556 bytes; same source colour record as 22 independent BLOOD links from 008, **not DAC ownership**. | [Report](SPELUNK_009_MK2_BANG_SECONDARY_RECORDS_AND_COLOUR_SOURCE.md), [12-colour/3-group ledger](../validation/SPELUNK_009_MK2_BANG_SECONDARY_AND_COLOUR_LINKS_20261117.json), [read-only reproducer](../../scripts/research/spelunk009/trace_bang_secondary.py), [25 original tests](../../scripts/research/spelunk009/test_original_fixture.py), [original-free Windows CI](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/44116493434) | **VERIFIED STATIC**, exact committed source and private original test Git blob hashes match, **25/25** original tests PASS and **14/14** synthetic CI PASS. Actual allocations, native DAC, FPS and selected unknown groups remain unverified. |

## Candidates, not assignments

- **Completed 002:** Source-backed channel-selector program writes, mode-conditional setup availability and correction of channel-zero assumptions.
- **Completed 003:** Two additional original, stage-linked Armory and Forest
  sprite sequences; verified descriptor ordering, frame-resource decode and
  conditional source execution path without inventing FPS, DAC or placement.
- **Completed 004:** recovered full SOUL.GRA two-phase source list ownership,
  conditional FIRESKEL.GRA alternate lists, independent source control joins,
  and bounded encoded-byte coverage (without live playback).
- **Completed 005:** BANG.GRA original 11-choice frame-list table and
  101-sprite full source-byte accounting; SUCK.GRA three source-linked list
  consumers and a separate non-animation single-descriptor lookup, with
  deliberately unresolved pointer/placement structures preserved.
- **Completed 006:** recovered SUCK.GRA's nine nested source-command
  groups through 12 selector slots, confirmed the direct original interpreter
  bridge, and established complete 83-stream resource-byte coverage.
- **Completed 007:** Recovered 18 original BLOOD.GRA source-list structures, two
  intro-then-interior-rewind controls, a four-choice entry selector into one
  list, and the clear boundary between 12 direct/1 indirect/5 source-only
  consumers, without duplicating prior O69/O218/O228 sprite knowledge.
- **Completed 008:** BLOOD.GRA's 22 explicit executable palette-source
  headers, source-backed non-list sprite constructors, 25 descriptor complements,
  and reproducible exclusion of five unproven direct-cursor list consumers.
- **Completed 009:** BANG.GRA's secondary effect data consists of three
  distinct coordinate/descriptor groups, with only the first proven original
  reader; decoded the original eight-call procedural construction fanout and
  authenticated 12 explicit source-colour pointers without DAC assumptions.
- **010 candidate:** Consolidate the authenticated MK2 effect/animation
  selector, ordered-entry, repeat, rewind and source-colour structures into a
  source-safe extractor manifest specification. Prefer applying established
  evidence to building a useful exporter over another unconstrained scan.
- **Later cross-game study:** compare independently validated palette and
  animation mechanisms between MK1/MK2/MK3, without assuming binary formats
  are interchangeable.

The next active P91 original Tomb runtime packet remains a separate private
Windows task and is not blocked by future spelunking or source checkpoints.
