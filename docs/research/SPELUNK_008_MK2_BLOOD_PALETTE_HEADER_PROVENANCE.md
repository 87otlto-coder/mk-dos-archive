# Spelunk 008 — BLOOD.GRA palette-source descriptor headers and non-list sprite provenance

**Date:** 2026-11-17  
**Branch:** `research/spelunk-008-mk2-blood-palette-headers`, based on the verified Spelunk 007 checkpoint.  
**Classification:** **VERIFIED STATIC TYPED SOURCE LINKS**; **NOT** original runtime DAC allocation, timed animation or stage composition.

## Purpose and prior evidence

Spelunk 007 source-authenticated 18 BLOOD list-like structures: 155 original ordered pointer references to 153 distinct indexed sprites, with 12 direct cursor writers, one indirect four-entry selector, and five lists whose consumers were not demonstrated. The 25 authenticated `BLOOD.GRA` sprites outside these lists remained unclassified. O69 independently established that all **178** source graphics tile the entire compressed resource; O218/O228 independently resolved Pit blood sprite 177 and its associated original executable palette record. **None of these earlier sprite discoveries are being rebranded as new artwork.**

The extraction-driven questions here were: (a) can any of the five missing list consumers be authenticated without assuming a function pointer? (b) how do original executable instructions reach the 25 sprites outside normal lists? (c) are there reusable, original relocation-backed palette-source relationships within the broader `BLOOD.GRA` descriptor family?

The study read only the owner's exact original DOS `mk2.zip`: `MK2.EXE` 861,133 bytes, SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`, and `BLOOD.GRA` 111,780 bytes, SHA-256 `9a47dd926c27a6570bcd81cbb0a3ff1bae2106a26e0f5360c8018fea6f16a5a9`. Original resource registry ID **9**. The original LE parser authenticated **27,004 fixup records across 26,994 distinct source sites**.

## Finding 1 — 22 original colour-record links across the entire BLOOD descriptor corpus

**VERIFIED STATIC:** There are exactly **22** original `Object2+descriptorOffset+12` words which have type-7/flag-16 LE relocations to original **Object1 `0x26CC4`**, physical **`0x88918`**. This is the same original colour-record address that O228 established on Pit blood sprite177. All 22 raw EXE target words independently match the typed fixups.

The 22 anchor descriptors are:

```text
0x1FE5C  0x1FEB4  0x1FF0C  0x1FF58  0x1FF68  0x2002C
0x20084  0x20160  0x201B8  0x20264  0x202B0  0x20350
0x20408  0x20418  0x20470  0x204E0  0x20538  0x205A8
0x2063C  0x2067C  0x206D4  0x206FC
```

Original resource-scanning and indexed-RLE validation show that the descriptor runs **between** these headers contain, respectively:

`7, 7, 6, 1, 16, 7, 18, 7, 14, 6, 13, 15, 1, 7, 9, 7, 9, 12, 5, 7, 3, 1` sprites.

The counts total **178**. Every group covers a contiguous original encoded-resource interval, all 22 intervals abut, and their union exactly covers `BLOOD.GRA [0,111780)`, without a missing or overlapping byte. Original stream indexes, source dimensions and descriptor-local coordinates are preserved privately; the committed evidence records only source positions, counts, and SHA-256 fingerprints.

**Critical boundary:** these are **22 directly relocated source-colour links**, not 22 different palettes or proof that every sprite in each group owns a live VGA palette. The original code's handling of group-scoped colour state and actual palette uploads have **not** been observed. The original `0x26CC4` record is a **source-level palette reference**, not a captured DAC bank. Do not blindly colourize all 178 frames based on the group boundary.

## Finding 2 — the 25 non-list sprites are not source-less

Spelunk 007 verified **153 unique descriptors within its 18 source-list structures**. The remaining **25** authenticated original sprites fall into three contiguous resource/descriptor ranges:

| Source descriptor range (Object2) | Original indexed sprites | Encoded `BLOOD.GRA` byte range [start,end) |
|---|---:|---|
| `0x20538–0x2059C` | **9** | `97380–100360` |
| `0x2063C–0x206D4` | **13** | `103196–110256` |
| `0x206E4–0x206FC` | **3** | `110256–111780` |

The original EXE explicitly writes these `BLOOD.GRA` descriptor seeds into selector Object2 `0x75A6C`:

| Physical source instruction | Descriptor Object2 | Proven control role |
|---|---|---|
| `0x90CBD` | `0x20538` | Direct selector seed, then original `0x90CC7` CALL to constructor `0x64548` |
| `0x9154B` | `0x20538` | Alternative selector seed; original short JMP `0x91555` joins constructor at `0x91561` |
| `0x91557` | `0x2063C` | Other alternative seed; falls through to the **same** original constructor `0x91561` |
| `0x8068B` | `0x206D4` | Original Pit effect seed, constructor called at `0x80695` |
| `0x806E6` | `0x206FC` | Previously known O228 Pit blood sprite177 spawner, constructor at `0x806F0` |

All five immediate source pointers and their type-7 relocation targets, source selector instructions, shared alternative branch and **four near calls** into constructor `0x64548` were directly checked on original EXE bytes. This establishes **real source construction routes to four distinct non-list descriptors**, without showing that every adjacent descriptor in the same range is visited by an animated runtime object.

O228's preceding Pit paired placement table independently contains typed source links at Object2 `0x13DA0` and `0x13DB0` to source `0x206E4`, and at `0x13DA8` and `0x13DB8` to `0x206F0`. These are **separate placement-record references**, not newly discovered normal animation lists. Source177 `0x206FC` remains 14×9 with 73 original opaque pixels and original resource start 111,552; its existing visual/candidate-palette validation remains untouched.

**Exporter implication:** distinguish source-based direct sprite constructors, paired placement records, pointer-list sequences and descriptor runs. Contiguous source descriptors do not prove sequential playback.

## Finding 3 — five previously unclassified BLOOD lists still lack source evidence of independent selection

For the five Spelunk 007 unresolved roots:

| Candidate Object2 root | Source pointer entries | Typed LE inbound pointers into ANY entry | Raw 32-bit root occurrences in original EXE |
|---|---:|---:|---:|
| `0x1D010` | 5 | **0** | **0** |
| `0x1D1D0` | 2 | **0** | **0** |
| `0x1D1F0` | 3 | **0** | **0** |
| `0x1D22C` | 4 | **0** | **0** |
| `0x1D2E0` | 7 | **0** | **0** |

Each source candidate still has original typed descriptor entries and a zero terminator. However, a complete walk of the canonical original type-7 LE relocations finds **no pointer into any of those entry intervals**, and a whole-file raw DWORD search finds no exact start-address constants. That materially weakens the theory that these are independently selectable lists; it does **not** prove they are unused. Dynamic address arithmetic, implicit sequential traversal, or nonstandard consumers could remain possible.

**Decision:** preserve them as **STRUCTURAL SOURCE LIST / CONSUMER UNKNOWN**, not as five verified standalone animations. No source-backed reason to spend P91 runtime budget on these particular roots yet.

## Reproducible verification

**This pass closes the exact-committed-private-test gap present in several earlier spelunks.**

The source-safe read-only producer `scripts/research/spelunk008/trace_blood_palette_headers.py` and exact 20-case original-fixture regression suite `scripts/research/spelunk008/test_original_fixture.py` were executed locally against the owner's original archive. **20/20 tests passed**, including full source tiling, 22 palette header relocation counts and raw targets, five negative candidate list checks, 25-sprite source coverage, direct construction routes, O228 preservation, deterministic output, deliberate EXE/GRA corruption and refusal to overwrite an existing report.

The committed files' Git blob SHA-1 values were checked against the locally executed source bytes:

- Reproducer: **`f146138c2ed9f9547bc77ee62cb29d0ea5ed86e1`**
- Original-fixture tests: **`e88e2ca60ed53cb2a9387c607274787d4769f993`**

The complete private report's SHA-256 was **`a0a1906bdd2a24df143ae47d3f31cfe938352bef6d6cc9f5f62f177d97777a42`**. This private output was not uploaded because it includes granular per-frame provenance better kept with original fixtures; a source-safe 22-anchor summary is in `docs/validation/SPELUNK_008_MK2_BLOOD_PALETTE_HEADERS_20261117.json`.

Windows original-free CI checks source syntax and bounded synthetic LE/RLE/mutation mechanics only. These are separate from the **private original-file** result; no commercial bytes or graphics enter GitHub Actions.

## Practical next steps

The extractor can safely show 22 explicit original source palette-reference anchors, 178 original indexed sprites, their complete resource partition and origin-specific references (list entry, direct constructor, or Pit placement). It must **not** silently claim the 22 links establish the live palette for all 178 sprites.

The best next static dig is the nonuniform second `BANG.GRA` effect-placement region left unresolved in Spelunk 005. That region may contain multiple record sequences with separate zero terminators and no direct typed inbound pointer. A precise classification would improve the source effect manifest more than continuing to treat all adjacent BLOOD descriptor records as animation frames.

**Confidence register:** VERIFIED STATIC — typed colour-record pointers, complete source-byte grouping, direct constructor calls and source-only negative pointer census. CARRIED VERIFIED — O69/O218/O228 graphics/Pit associations. UNKNOWN — actual DAC state, group-scoped renderer colour propagation, live activation, animation duration, world placement, occlusion or original presented framebuffer.

**Copyright and preservation:** no source EXE, GRA, indexed pixel plane, decoded palette words, music, speech, private capture or patched commercial file was committed. Existing MK1/MK2/MK3 workbench, P90/P91 capture adapter, accepted source and original research remain unchanged.
