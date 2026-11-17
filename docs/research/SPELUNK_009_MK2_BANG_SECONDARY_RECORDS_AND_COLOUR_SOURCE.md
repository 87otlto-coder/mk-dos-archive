# Spelunk 009 — MK2 BANG secondary effect records, eight-call source fanout, and common colour references

**Date:** 2026-11-17  
**Branch:** `research/spelunk-009-mk2-bang-secondary-records` (derived from Spelunk 008).  
**Confidence:** **VERIFIED STATIC SOURCE STRUCTURES AND CODE LINKS**; **UNKNOWN / VALIDATION PENDING** for the live effect activation, DAC, timings and presented pixels.

## Extraction question and inherited research

Spelunk 005 had established that original DOS `BANG.GRA` is **29,556 bytes** containing **101 native indexed sprite streams**. The eleven original selector-linked lists provide **95 ordered references to 93 distinct source sprites**; eight unique graphics remain outside those ordinary ordered lists. It also authenticated a code connection into a pointer-and-signed-coordinate reader at `0x83ECD`, but described the later `0x1B810–0x1B858` region as “nonuniform” with unknown ownership.

O69 already found the individual graphics. **This expedition does not claim 101 newly discovered sprites**. It targeted the remaining source record grammar and source palette pointers, aiming for exportable procedural effect metadata rather than more undirected pointer hunting.

**Original private input:** the owner's unchanged original DOS `mk2.zip`, containing `MK2.EXE` SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65` (861,133 bytes) and `BANG.GRA` SHA-256 `76bdab89c4262555560bd3958eecca58460bddb4d75f5bce90331ab419151152` (29,556 bytes). Original executable resource pool ID **12**. LE fixup parser yielded **27,004 original fixups / 26,994 unique source sites**. All byte and control evidence below was rechecked against the original file, not inferred from source similarity.

## Finding 1 — the apparently irregular record region is three separate source structures

Source interval `Object2 0x1B7DC–0x1B85C` has **15** typed pointer-and-two-signed-word records but must **not** be treated as one continuous fifteen-frame animation.

| Source group | Pointer+XY records | Source stop condition | Code consumer verified? |
|---|---:|---|---|
| `0x1B7DC` | 6 | Sixth record has signed X **0**, so original reader exits before constructing that record; extra zero DWORD at `0x1B80C` | **YES**: original `0x842E0` writer / `0x842EA` CALL `0x83ECD` |
| `0x1B810` | 1 | Unrelocated zero pointer at `0x1B818` | **NO**: no original LE typed incoming pointer to its record interval |
| `0x1B81C` | 8 | Unrelocated zero pointer at `0x1B85C` | **NO**: no original LE typed incoming pointer to its record interval |

All fifteen record pointers are original typed Object2-to-Object2 relocations; they refer to **eight unique** additional `BANG.GRA` sprite descriptors: `0x20CAC, 0x20CBC, 0x20CC8, 0x20CD4, 0x20CE0, 0x20CEC, 0x20CF8, 0x20D04`. All decode with the original indexed-RLE grammar, and their source byte ranges fill `BANG.GRA [24692,29556)`.

The primary source-connected group's signed X coordinates are `48,46,40,29,16,0`. The last record also carries Y `-48`, but its X=0 causes a branch at original physical `0x83F13` to `0x83F35`, **before** the reader executes its Y load or per-record constructor fanout. The first five records pass the source test.

The second and third groups have valid descriptor pointers and nonzero signed X fields; they are structurally compatible with the same reader. However, the full original LE relocation corpus contains **zero typed incoming references into either group's record interval**, and no source instruction selecting those roots was proven. One unrelated raw DWORD equal to `0x1B810` appears in the executable, **without** a matching typed relocation or proven reader. This is insufficient to promote either group to a verified selected animation or to call it unused/dead source.

**Correction of old shorthand:** the formerly “nonuniform” tail contains one single-record zero-terminated candidate followed by an eight-record zero-terminated candidate. The `0x1B818` zero is a boundary, not an animation frame and not evidence of a special sprite.

## Finding 2 — source-connected BANG effect uses a procedural eight-call expansion

A direct original-code chain now links the separate effect records to renderer-object descriptor changes:

```text
0x842D6  seed native descriptor 0x20CAC into global Object2 0x75A6C
0x842E0  set record-list cursor Object2 0x75A78 to 0x1B7DC
0x842EA  CALL original paired-record reader 0x83ECD
0x83ECD  preserve current source descriptor in task +0x64
0x83ED8  read pointed descriptor from cursor; stop on zero
0x83EF7  read signed-X; exit immediately if X == 0
0x83F1C  read signed-Y; only accepted records reach helper
0x83F2E  CALL original fanout 0x83F36
0x83F36  eight distinct CALL sites target wrapper 0x83FC5
0x83FC5  CALL original sprite constructor 0x64548
0x83FD5  CALL descriptor update / alignment routine 0x9377C
0x937D3  conditional source path writes chosen descriptor into object +0x3C
```

All eight per-record call sites are authenticated by checking their original near-call opcodes and arithmetic target `0x83FC5`:

`0x83F36,0x83F47,0x83F5E,0x83F6F,0x83F86,0x83F97,0x83FAE,0x83FBF`.

The code at `0x9377C` compares the object’s existing descriptor with **EBX**, the original pointer extracted from the source record. When applicable it updates the renderer object's source descriptor at `+0x3C`; the signed source coordinates also feed the construction/alignment path.

Thus one traversal of the code-connected group has **five accepted records, each reaching eight static wrapper CALL sites**—**40 potential constructor invocations** in the original control flow. This is **not** proof of forty successfully allocated objects, forty visible sprites, forty presented frames, animation FPS or a specific screen position. Allocation, task state and rendering remain runtime dependencies.

### Source arithmetic is not idealized radial symmetry

The eight call sites interleave original `SAR` (signed arithmetic shift), `SHL` and `NEG` instructions on the two signed coordinate accumulators. **SAR then SHL loses one low bit for odd signed values.** For example, the original record with relative X=29 and Y=-38 has the initial stages:

```text
(29, -38)
(14, -19)
(-28, -38)
(-14, -19)
...
```

A renderer that simply produces perfectly symmetrical (`±29`) mirrored offsets would be an invented interpretation. The reproducer preserves the exact original eight-stage source transform program as **relative record metadata**, without asserting a viewport origin or display timing.

## Finding 3 — 12 original source-colour pointers link all 101 BANG sprites

The original EXE contains exactly **12** type-7/flag-16 relocations at `Object2+descriptor+12` within the 101 source-verified BANG descriptors, all targeting **Object1 `0x26CC4`** (physical `0x88918`). Each original raw pointer also matches its typed relocation.

The source-anchor descriptor offsets are:

```text
0x20824  0x20888  0x208D4  0x20974  0x20A08  0x20A6C
0x20AD0  0x20B34  0x20B98  0x20BFC  0x20C48  0x20CAC
```

Their corresponding contiguous sprite group counts are:

`8,6,13,12,8,8,8,8,8,6,8,8` = **101**.

All twelve groups have internally consecutive, independently decodable original RLE streams. Group boundaries also meet exactly, so the groups partition **100% of the original 29,556 bytes**, without gaps/overlap. The first eleven groups reconcile with the source-ordered selector sprite families from Spelunk 005; the twelfth contains exactly the eight distinct nonselector graphics examined here.

**Cross-resource source relationship:** Spelunk 008 independently authenticated **22** equivalent `BLOOD.GRA` descriptor+12 source-colour pointers targeting that **same Object1 `0x26CC4`** record. There are therefore **34 explicit source-colour pointer occurrences across the two independently examined resources**—not 34 independent palettes or 34 verified DAC bank assignments. The relationship is a high-value future palette provenance input, but live allocation/ownership must still be observed.

## Verification ledger

**Exact committed original-input producer and test suite:** `scripts/research/spelunk009/trace_bang_secondary.py` and `scripts/research/spelunk009/test_original_fixture.py` were run read-only against the owner's unchanged `mk2.zip`. **25/25 original-file regression tests passed**, including canonical SHA pins, full 101-stream source tiling, LE relocations, twelve colour pointers, three record boundaries, direct call chain, near-call targets, signed shift rounding, null/zero-X sentinels, eight per-record helper calls, source mutations, determinism and no-overwrite protection.

Local files and GitHub blobs were compared directly: producer Git blob SHA-1 **`2ef4a16e8d901dc7e76531fc40b58013ed1c252a`**; private regression source SHA-1 **`52af79fb21af6ec5dae0c3282a8f88f7840739ae`**. The exact private full metadata JSON SHA-256 is **`784a8ae0f0ca8fa224efbfb317b31f454c4c5edf13221fdb72f8fbaadd7cc168`**, retained only in private working files.

**Windows original-free CI [run #44116493434](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/44116493434): SUCCESS, 14/14 synthetic tests**, source syntax checks, no commercial originals, no uploaded output artifacts. Synthetic success is not the original-file result.

[Source-safe machine-readable evidence](../validation/SPELUNK_009_MK2_BANG_SECONDARY_AND_COLOUR_LINKS_20261117.json) records all twelve original source-colour boundary hashes, three source record groups, verified code targets, test provenance and clear runtime limitations. It contains neither source graphics pixels nor original compressed bytes or palette words.

## Implications and next decision

For the future extractor, keep four **distinct exportable information layers**: (1) unique 8-bit indexed source sprites and opacity, (2) the eleven original BANG selector-sequence lists (95 entries / 93 sprites), (3) three separate descriptor-plus-coordinate data groups with only **one confirmed active code path**, and (4) twelve original *source* colour pointer anchors. The original eight-stage coordinate transform can be preserved as a verified procedural effect recipe, not an invented animation time series.

Do not guess that either unselected group is dead, visible, colourized by a particular live bank or timed. The P91 native capture effort remains the right method for proving original presented pixels, DAC and timing, and this spelunk does not block it.

**Suggested Spelunk 010:** consolidate already verified MK2 animation source program structures into a **source-safe extractor manifest schema** without rebuilding the workbench or making another general-purpose pointer crawler. This produces a practical handoff from nine source-led expeditions to implementation. Further binary digging should have an explicit extraction gap it will close.

**Copyright and source safety:** original game files, decoded sprites, indexed planes, palette words, original audio, assembled private effects and original framebuffer captures were never committed to GitHub. Accepted extractor functionality, P90/P91 tooling and earlier research remain untouched.
