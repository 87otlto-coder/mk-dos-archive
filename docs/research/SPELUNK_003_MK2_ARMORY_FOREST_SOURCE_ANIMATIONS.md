# Spelunk 003 — Two additional source-ordered MK2 stage animation tracks

**Date:** 2026-11-16  
**Branch:** `research/spelunk-003-mk2-armory-forest-animation` (derived from the Spelunk 002 research checkpoint, not main).  
**Primary goal:** expand original DOS MK2 extractor coverage for separately exportable indexed frames and authentic source sequence order, without introducing guessed palette ownership, runtime timing or stage placement.  
**Confidence:** **VERIFIED STATIC SOURCE FRAME ORDER**, **NOT VERIFIED RUNTIME PLAYBACK**.

## Baseline: what was already known

O136/O137/O138/O139/O140/O169/O171–O173 authenticated six Tomb, Portal and Tower effect lists comprising **43 unique decoded sprite streams** with original ordering, zero/rewind markers, code writers and descriptor-to-render-object consumers. O177/O181 already created a source-checked 43-frame archive. O220/O221 separately traced two source-authenticated seven-frame Pit distant-actor lists (14 frame entries) into the shared animation reader.

**Do not count these prior discoveries as new.** This spelunk sought *additional original stage-linked sequences* of direct extractor value. The original files were searched by LE relocation-backed descriptor-pointer runs, then each candidate was independently required to pass the original resource registry, source writer, task callback, stage root, bounded RLE decoder and original terminator checks. Pointer runs lacking those joins were not promoted to animations.

Input was the owner's untouched original DOS `mk2.zip` containing `MK2.EXE`, `ARMORY.GRA` and `FOREST.GRA`; no game, emulator, browser or resource patch was executed. Original `MK2.EXE`: **861,133 bytes**, SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.

## Findings: 32 ordered entries, 19 unique source sprites

| Source-linked track | Original Object2 list | Source descriptor entries | Distinct original sprites | Sprite geometry | Original GRA bytes [start,end) | Source terminal |
|---|---|---:|---:|---|---|---|
| Armory source effect | `0x168D4` | **12** | **12** | 10×64, descriptor-local (0,0) | `ARMORY.GRA 0x1C780–0x1ED80` | DWORD `0` |
| Living Forest source effect | `0x16D38` | **20** | **7** | 64×64, descriptor-local (0,0) | `FOREST.GRA 0x28390–0x2F544` | DWORD `0` |
| **New combined source evidence** | 2 lists | **32** | **19** | Preserve native dimensions | Two distinct resources | Zero-terminated **per list traversal** |

Exact source resource fingerprints:

- `ARMORY.GRA`: `fb68c5fb70267dc64cf176056c7711f43973f9b8b8a2e53513f43afc7c56c612`.
- `FOREST.GRA`: `8aef888aeef608eefe03e3cdc142035ff3a53984b77b525850a218c68b7e44b9`.

The source **descriptor identity and order** are fully authenticated: every list entry has its own original typed LE Object2-to-Object2 pointer, each descriptor's original 12-byte structure identifies the expected GRA resource ID (**26 Armory, 27 Forest**), and every referenced compressed stream decodes with the original O122 indexed command grammar. The independent decoder verified the 8-bit indices and exact 0/1 opacity mask and computed source-safe SHA-256 fingerprints; it did **not** assign a runtime DAC palette. Unique original GRA encoded spans join *exactly* without gaps.

### Armory: twelve separate original frames

At `Object2+0x168D4`, twelve descriptors follow resource stream offsets contiguously from `0x1C780` through `0x1ED80`. The first is descriptor `0x169EC`; every source sprite is 10×64. All twelve encoded streams are distinct source records, and the list ends with an unrelocated zero DWORD. The original source range's SHA-256 is `064a81c5e52a83d6156e906c8d150e261f57ed3d95861d170469572c1e468541`.

**Extractor meaning:** twelve independent source-index and opacity frames are available for a source-ordered export, but palette, coordinates beyond descriptor-local zeros, and timed playback are **not** known.

### Living Forest: twenty entries deliberately reference seven sprites

The sequence at `Object2+0x16D38` contains **20 typed descriptor pointers** but only **seven unique** 64×64 resource streams. Their seven unique encoded original streams fill `FOREST.GRA 0x28390–0x2F544` without gaps (span SHA-256 `1c8da5ad56e6f21561932afd0c637cabedabb22e47fe66fe384f4cadfd941721`).

The source-ordered ordinal-to-distinct-sprite map is:

```text
0,1,2,3,4,5,6,5,6,5,6,5,6,5,6,4,3,2,1,0
```

This matters directly to a future extractor's animation data model: **preserve 20 sequence entries referencing seven unique sprite assets**. If deduplicated into a simple seven-frame list, the original repeating/reversing order is lost. This is evidence of *source sequence order and reuse*, not evidence of a 20-frame periodic real-time animation. The callback might restart the zero-terminated list in a different task loop; no live restart frequency has been measured.

## Source-to-consumer join and conditional activation

Original code and typed LE relocations establish a stronger connection than a speculative descriptor array scan:

| Step | Armory | Living Forest |
|---|---|---|
| Stage index / source initializer | 5 / `0x829BC` | 4 / `0x82AD4` |
| Original condition preventing registration when mode=0 | `0x829BC` | `0x82AE7` |
| Registered task callback pointer instruction | `0x829DF` → `0x82A0F` | `0x82AF7` → `0x82C44` |
| Common callback registration helper | `0x67222` | `0x67222` |
| First sprite descriptor seed | `0x82A61` → `0x169EC` | `0x82CB1` → `0x16F14` |
| Frame-list cursor write into Object2 `0x75A78` | `0x82A43` → `0x168D4` | `0x82C90` → `0x16D38` |
| Original raw task yield argument at that writer | 6 | 5 |
| Shared reader path | `0x82A87` → calls `0x86CC5` | `0x82CA9` jumps to `0x82A87` → calls `0x86CC5` |

All **three** original mode-root variants for each stage have the same original type-7 callback pointer (Armory `0x829BC`; Forest `0x82AD4`). Both initializer registration paths contain an explicit **stage-mode-zero gate**. Reaching a stage or choosing a root does not, by itself, prove this registered task exists or has executed during a given fight; scheduler allocation can also fail. The shared reader is called at **`0x82A8F`, `0x82AA4` and `0x82AB6`**. The common zero-token carry path is authenticated at `0x86D3B`; it ends the current source traversal, **not necessarily the caller's whole lifetime**.

The raw code arguments **6 and 5** are *source caller-supplied scheduler values*, not a measured number of display frames, milliseconds or FPS. O140/O168/O221 already explain the distinction between task-countdown visits and actual rendered/presented frames.

## Provenance and validation

A fresh independent read-only private audit parsed the canonical original **27,004** LE fixups (**26,994** unique source sites), decoded all 32 source entries and seven+12 unique indexed sprites, checked original stage callbacks, mode guards, task registration calls, cursor writers, seed pointers, source reader calls and zero terminators.

- **213 positive source/pointer/frame assertions passed** in that independent private original-file audit.
- **Seven targeted in-memory corruption checks** covered list pointers, cursor opcode, mode gate, zero terminator and malformed original RLE commands. These tests never wrote a modified original game file.
- [Windows original-free CI #43943213598](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/43943213598) **SUCCESS**: Python syntax, 12 synthetic indexed/mask/RLE/typed-pointer tests; no original commercial bytes or artifacts uploaded.
- Committed reproducible producer: `scripts/research/spelunk003/trace_original_stage_frame_lists.py`, which requires the exact original EXE/Armory/Forest hashes, reads the user's own ZIP, refuses existing output and writes source-safe source-offset/index/mask hashes only.
- Committed original-file regression/negative source: `scripts/research/spelunk003/test_original_fixture.py` (14 tests). **Its exact committed test suite has not been run with the private fixture** in this session; do not present it as a passed 14/14 test result.
- Source-safe machine record: `docs/validation/SPELUNK_003_MK2_ARMORY_FOREST_SOURCE_SEQUENCES_20261116.json`. It records list positions, 19 unique descriptors, source spans/hashes, ordinal mapping, code provenance and validation boundaries; it contains no pixels, palette data, GRA bytes or executable bytes.

**Not claimed:** original game launched; Forest object seen or timed in gameplay; original stage palette selected or DAC uploaded; exact world position; image preview generated; actual frame display order or time; complete enumeration of MK2 animations. Any frame usage claims remain conditional on live task activation and presentation.

## Extractor implications and next actions

1. Existing O177's 43-frame Tomb/Portal/Tower archive must **not** be deleted or rewritten. Add separate Armory/Forest original-frame manifest/export adapters later, using exactly decoded source indexed planes, opacity masks, native dimensions and descriptor provenance. Preserve separate stages rather than flattening them into backgrounds.
2. Model `uniqueSprites` separately from `orderedEntries`: Forest uses seven independent encoded originals with twenty source references. This is a reusable mechanism for sequence metadata, not proof that different stages share the same binary format or active palette.
3. Combining prior **43** Tomb/Portal/Tower source entries, prior **14** Pit entries from O221 and these **32** new ones yields **89 known source-linked entries across these selected stage tracks**, not an exhaustive census. This pass adds **19** distinct decodable original sprite streams.
4. For eventual live evidence, capture original task callback activation, `0x75A78` cursor and object `+0x3C` descriptor at matched frame generations; compare with the source list position and actual framebuffer before promoting frame duration, palette or placement.
5. Further spelunking can classify other candidate pointer runs by **source consumer**, **typed pointer**, **RLE validity**, **end marker** and **stage/resource ownership**. A blind pointer scan is insufficient and will produce false positives from fonts, menus and sprite tables.

### Confidence register

- **VERIFIED STATIC:** resource hashes, both stage root→callback→task registrations→cursor-writer→shared-reader joins, original mode-zero source gates, original typed list/descriptor pointers, 32-entry list order, 19 unique source decoded sprite spans and zero markers.
- **CARRIED VERIFIED:** O136/O137/O169 normal effect-reader semantics; O220/O221 Pit fourteen-entry loops; O200 Forest task registration and conditional source objects.
- **INFERRED EXTRACTOR DESIGN:** preserve unique sprite assets with separate ordered descriptor references; later add source-index-only export capability and targeted P91 runtime correlation.
- **UNKNOWN / VALIDATION PENDING:** whether any given fight activates these tasks; palette allocation/handle/DAC state; object positioning, stage composition/occlusion; full-frame pixel matching; time and FPS.

No original commercial files, reconstructed graphics, palette words, PCM/music, binary patches or private captures were committed to GitHub. P90/P91 research and the existing workbench were left untouched.
