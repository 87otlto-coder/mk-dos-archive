# Spelunk 006 — SUCK.GRA nested source selections and complete original sprite-byte accounting

**Date:** 2026-11-17  
**Branch:** `research/spelunk-006-mk2-suck-nested-source-groups` (child of Spelunk 005).  
**Classification:** **VERIFIED STATIC CONDITIONAL SOURCE GROUPS**, **NOT VERIFIED RUNTIME ANIMATION**.

## Why this improves extraction

Spelunk 005 authenticated three SUCK.GRA list consumers and **18 distinct indexed sprites occupying the final 4,128 bytes** of the original resource. The preceding **117,872 bytes** were deliberately left unclassified. O69 had already catalogued original graphic descriptors, so another blind sprite census would not add much value. This expedition instead traced the executable's **selection table → nested list → source command record → original sprite descriptor** relationships.

It establishes complete original encoded sprite-stream coverage and an exportable *source-group provenance model*, not additional observed gameplay frames.

**Original DOS fixture:** `MK2.EXE`, 861,133 bytes, SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`; `SUCK.GRA`, 122,000 bytes, SHA-256 `d5672116021a56c27b94a14c1eb51e83bb077209cf67fcf92add51553e862d08`, original resource ID 14. The unmodified source was read from the user's private `mk2.zip`. Full LE fixup parsing gave **27,004 entries / 26,994 unique source sites**.

## Original executable link: a twelve-choice nested selector

At original physical `0x846CA`, original code loads Object2 `0x1BBA0`, a typed LE-backed **12-DWORD selector table**. It calls helper `0x64ED2` at `0x846CF`. The helper uses `MOV EBX,[EDI+0x46]`, then `MOV EAX,[EAX+EBX*4]` to choose a group pointer. At `0x846D4`, it writes the result to the shared source cursor at Object2 `0x75A78`. The path prepares raw argument `4` and jumps at `0x846E8` to `0x86825`.

**The latter is scheduler/wait control, not a sprite reader.** The value `4` is not a measured display frame duration. The observed input value `[EDI+0x46]`, selection frequency and range checks are **UNKNOWN**. The source table has twelve entries, but that does not prove a live selector cannot read beyond them.

The original generic source interpreter at physical `0x63E79` reads pointer-valued commands from the same cursor and calls `0x640DF`, which dereferences sprite-bearing records and their original descriptor fields (including signed local X/Y). This is a **source-backed compatible record grammar**, but **no direct invocation of the interpreter from the selected-list cursor store was proven** in this investigation. It must not be promoted to actual on-screen animation or compositing.

## What the twelve slots select

The twelve original LE-typed selector pointers collapse to **nine distinct group addresses**. Each group is a zero-terminated sequence of typed pointers to original **eight-byte records**, and each record is a typed sprite-descriptor pointer followed by a literal, unrelocated DWORD zero. This is one extra indirection compared with the three straightforward Spelunk 005 lists.

| Selector slots | Group Object2 | Group record entries | Original SUCK.GRA encoded byte range [start,end) |
|---|---|---:|---|
| 0 | `0x1BE50` | 7 | `0–15356` |
| 1 | `0x1BEA8` | 7 | `15356–27852` |
| 2 | `0x1BDF8` | 7 | `27852–40656` |
| 3 | `0x1BD3C` | 7 | `40656–53272` |
| **4 and 5** | `0x1BD94` | 8 | `53272–67248` |
| 6 | `0x1BC1C` | 7 | `67248–78424` |
| 7 | `0x1BC74` | 8 | `78424–94132` |
| **8, 9 and 10** | `0x1BCD8` | 8 | `94132–108340` |
| 11 | `0x1BBD0` | 6 | `108340–117872` |
| **12 slots / 9 groups** | | **65 distinct records** | **117,872 original bytes, zero gaps** |

The repeated slots **4–5** and **8–10** are *aliases of the same source data*, not duplicate graphics or additional sequence frames. All group record pointers, descriptor pointers, original zeros and terminal markers were independently checked against the original LE typed-fixup stream and source bytes. Nine separate group source spans decode as consecutive RLE streams, with original dimensions, indexed pixels, opacity masks and signed descriptor-local offsets preserved in private memory.

These groups should be represented as **conditionally selectable source records**. It would be premature to call them “nine complete native playback animations,” assign an FPS or assume all twelve selector slots are activated.

## New full-resource coverage result

All **65 prefix streams** and the **18 previously authenticated suffix streams** independently decode using original indexed RLE. Their distinct original encoded byte intervals form one exact, contiguous partition:

| Resource interval | Distinct sprites | Source classification |
|---|---:|---|
| `SUCK.GRA [0,117872)` | **65** | Nine nested pointer-to-command-record groups, selectable through twelve source slots |
| `SUCK.GRA [117872,122000)` | **18** | Three already established lists: 5 finite, 5 finite, 8 looping (Spelunk 005) |
| **Full `[0,122000)`** | **83** | **100% decoded compressed-sprite byte coverage; zero gaps, zero overlaps** |

The prefix SHA-256 is `32bd54ff93057d401ae4612a0d7e48529819ec9c321b73e6b2d4aac80d02b513`. The suffix SHA-256 is `a87b9cab47d98fa6f7db0e24947baae153c42d881d9f5696d9e728fbe1e58130`.

This is **not** a claim of 83 newly discovered artworks. O69 already investigated sprite resources. The new asset-extractor value is source ownership, complete byte accounting, an explicit nested-pointer representation, and a source-verified reason not to flatten script records into a guessed timeline.

## Reproduction and falsification

- **Private original-input audit:** the script `scripts/research/spelunk006/trace_suck_nested_sources.py` reads original `mk2.zip`, refuses other EXE/GRA hashes, re-parses every LE fixup, checks 15 exact original code anchors, checks every group and descriptor relocation, decodes and hashes all 83 indexed/mask frames, validates source byte boundaries and refuses an existing output path. It writes *only* source-safe metadata JSON.
- **Private original-fixture regression source:** `scripts/research/spelunk006/test_original_fixture.py` contains 20 read-only positive, deterministic, adversarial and no-overwrite controls. The locally equivalent original-input audit and **20 original-file regression tests passed** (one assertion expectation was corrected during development). The **exact GitHub-committed copy's private-fixture execution remains VALIDATION PENDING**; do not conflate this with Windows source-only CI.
- **Original-free Windows CI:** [run #44041851628](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/44041851628) **SUCCESS**, compiling the producer and private test source and running **10 synthetic source/LE/RLE/opacity tests**; no DOS game, original resource or artifact uploaded.
- **Source-safe evidence:** `docs/validation/SPELUNK_006_MK2_SUCK_SOURCE_GROUPS_20261117.json` records the twelve slots, nine distinct group spans and SHA-256 values, code offsets and the complete 83-stream interval proof. The private full-detail JSON with all 83 per-frame SHA hashes stays outside GitHub.

**Original-file mutation tests** reject altered code, relocation-backed table entries, nested descriptor pointer sites, eight-byte record zeros, source group zero terminators, wrong GRA resource IDs, suffix terminators, malformed RLE, changed source hashes and pre-existing output files. The tests do not modify the ZIP.

## Extractor implications

1. In a future source-animation export manifest, separate **selector slots**, **source command groups**, **unique indexed sprite records** and **runtime playback**. For SUCK, 12 slots share 9 group objects and 65 unique prefix sprites; the last 18 belong to three different original reader-controlled lists.
2. Preserve original palette indices, binary opacity masks, signed *descriptor-local* geometry, original source offsets and provenance. Do **not** invent global placement, lifetime or palette ownership.
3. Keep Spelunk 005's four-pointer **single-descriptor lookup** at `0x1BF58` separate from the above sequence census. The lookup reuses suffix descriptors; it does not add sprites or source list entries.
4. No change to O69, O177, P90/P91, existing animations, workbench UI, or user commercial files. All evidence is additive and source-safe.

## Confidence register

**VERIFIED STATIC:** original input identity, 12 source-selected pointer slots, nine distinct nested groups, zero-terminated group record grammar, 65 unique prefix descriptors, 18 previously code-linked suffix descriptors, 83 contiguous RLE streams, 122,000/122,000 source-byte coverage, original code helper/wait and generic interpreter instruction semantics.

**INFERRED:** the best exporter data model separates nested source-script groups and original indexed sprite assets rather than inventing one linear animation.

**UNKNOWN / VALIDATION PENDING:** whether the selection leads into `0x63E79` during a fight; the live selector and branch state; which and how many sprites actually display; frame timing or task cadence; original VGA DAC/palette allocation; world position, occlusion or complete framebuffer matching.

### Next targeted question

Before spelunking still more unrelated object lists, investigate **the live-independent code bridge between SUCK's selected source cursor and the generic `0x63E79` interpreter**. If the path is entirely scheduled/dynamic and no static call proves it, record that boundary and move on. This directly improves confidence in whether the 65 source records form exported animation command groups or merely available effect script variants.
