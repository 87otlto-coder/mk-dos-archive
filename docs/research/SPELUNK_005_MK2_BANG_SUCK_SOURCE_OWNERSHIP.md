# Spelunk 005 — MK2 BANG and SUCK: selector tables, distinct readers and complete-vs-partial indexed byte coverage

**Date:** 2026-11-17  
**Research branch:** `research/spelunk-005-mk2-bang-suck-source-ownership` (child of Spelunk 004, no changes to accepted P90/P91 or existing app).  
**Confidence:** **VERIFIED STATIC SOURCE AND CONSUMER LINKS**, not verified runtime frame activation, palette/DAC, actual placement or animation timing.  
**Input:** user-supplied original DOS `mk2.zip`, read-only, `MK2.EXE` SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`, 861,133 bytes. Relocation walker recovered 27,004 original LE records, 26,994 unique sites.

## What was already known, and what changed

The O69 sprite resource census had already authenticated many individual `BANG.GRA` and `SUCK.GRA` graphics; Spelunk 004 explicitly refused to promote raw clusters of descriptor-pointer runs into animations. This pass does **not** claim the discovery of previously unknown artwork. Its contribution is tracing original executable code to **selected list pointers, frame readers, task state and source-byte coverage**, while separating a second kind of pointer/coordinate record and a single-descriptor lookup from actual ordered list entries.

**Authenticated original resource fingerprints:**

| Original resource | Registry ID | Original bytes | SHA-256 |
|---|---:|---:|---|
| `BANG.GRA` | 12 | 29,556 | `76bdab89c4262555560bd3958eecca58460bddb4d75f5bce90331ab419151152` |
| `SUCK.GRA` | 14 | 122,000 | `d5672116021a56c27b94a14c1eb51e83bb077209cf67fcf92add51553e862d08` |

## Finding 1 — BANG has an 11-choice animation-list selector

A typed LE code operand at original physical **`0x84118`** targets Object2 **`0x1B514`**. The source at `0x84100` reads a **signed WORD at input record +0x0A**, `0x8410B` multiplies it by four, `0x84112` adds the original table base, and `0x84123` dereferences the selected entry. Every one of the **eleven table entries** is a typed Object2 relocation to a sprite list.

The code registers callback Object1 `0x2276A` (original physical `0x843BE`) through task helper **`0x67222`**. It preserves the selected list in new task object field **`+0x58`** at `0x841BD`. The callback reads that field and writes it to global original animation cursor Object2 **`0x75A78`** at **`0x843D2`**, calls sprite constructor **`0x64548`** and later reaches frame-advance helper **`0x6435A`**. This code connection establishes a source-selected frame-list mechanism, not merely a nearby list of graphic pointers.

**Important:** the source operand and table are valid, but the live input word or guarantee that it lies within the range 0–10 has **not** been observed.

| Selector | Original Object2 list | Original ordered entries | Distinct sprite descriptors | End marker | Original contiguous encoded source span |
|---:|---|---:|---:|---|---|
| 0 | `0x1B540` | 8 | 8 | 1, back to list | `0x1144–0x1B04` |
| 1 | `0x1B568` | 8 | 8 | 1, back to list | `0x1B04–0x2E30` |
| 2 | `0x1B590` | 8 | 8 | 1, back to list | `0x2E30–0x3AA4` |
| 3 | `0x1B5B8` | 8 | 8 | 1, back to list | `0x3AA4–0x4A3C` |
| 4 | `0x1B5E0` | 8 | 8 | 1, back to list | `0x4A3C–0x52E8` |
| 5 | `0x1B608` | 8 | **6** | **0**, finite | `0x52E8–0x5CC4` |
| 6 | `0x1B62C` | 8 | 8 | **0**, finite | `0x5CC4–0x6074` |
| 7 | `0x1B650` | 8 | 8 | 1, back to list | `0x0000–0x05C4` |
| 8 | `0x1B678` | 6 | 6 | 1, back to list | `0x05C4–0x07A8` |
| 9 | `0x1B698` | 13 | 13 | 1, back to list | `0x07A8–0x0D84` |
| 10 | `0x1B6D4` | 12 | 12 | 1, back to list | `0x0D84–0x1144` |
| **Total** | **11 code-selectable lists** | **95** | **93 unique** | Nine looping, two finite | **All source intervals exactly partition `[0,24692)`** |

Every BANG list entry was independently checked for the original typed LE pointer to its sprite descriptor, original resource ID 12, native width/height, original row-indexed RLE, 8-bit indexed pixels, opacity mask, and marker/back-reference structure. **Selector 5 intentionally repeats the same first sprite descriptor in its final two list slots**, so it must not be reduced to six sequence entries merely because it has six unique sprites.

The 95 entries are **conditional source-list references**, not 95 observed on-screen frames or an established playback sequence across all eleven alternatives.

## Finding 2 — the remaining BANG sprites are source-valid, but not a twelfth animation list

The original BANG file has a contiguous remainder `[24692,29556)`, consisting of **eight more distinct indexed sprite streams** with source descriptors Object2:

`0x20CAC, 0x20CBC, 0x20CC8, 0x20CD4, 0x20CE0, 0x20CEC, 0x20CF8, 0x20D04`.

These eight streams decode individually, abut without gaps, and cover exactly the file remainder. Combined with the 93 unique stream intervals from the eleven selector-linked lists, this establishes **101 nonoverlapping, consecutive original encoded sprite streams occupying every byte of `BANG.GRA`**. It is a complete **original compressed-sprite source-byte accounting statement**, not proof that all streams are invoked during gameplay.

A separate original code path demonstrates why the remaining pointers must be classified differently:

- At physical `0x842E0`, a typed LE instruction sets original cursor `0x75A78` to Object2 **`0x1B7DC`**. At `0x842EA`, it calls the original **`0x83ECD`** consumer.
- The reader at `0x83ED8` reads a descriptor DWORD and advances four bytes, then at `0x83EF7` reads a signed 16-bit word, advances two bytes and checks whether this word is zero. If zero, it **exits before reading the next signed coordinate and before emitting that record**; otherwise it reads a second signed 16-bit word and enters its helper at `0x83F2E`.
- The connected `0x1B7DC` data contains six typed sprite-pointer/signed-word pairs, but their first signed values are **48, 46, 40, 29, 16, 0**. The **sixth record is therefore a source sentinel**, not proof of a sixth displayed effect. The subsequent `0x1B80C` zero DWORD is also source data, not evidence of a frame.
- The neighboring `0x1B810–0x1B858` region contains nine more typed references to these same eight sprites, but has an **intervening zero at `0x1B818`** and is **not a uniform eight-byte pair list**. No direct typed code reference to that region's start was independently found in this pass. Its exact interpreter/selection semantics are **UNKNOWN**.

This is a valuable **negative finding**: merely decoding nine pointer-like entries and presenting them as a nine-frame animation would be unsound. They remain extra original graphic-resource provenance, not an activated or timed source sequence.

## Finding 3 — SUCK has two finite lists, one looping list and a separate single-descriptor lookup

Three original code locations write source list addresses into the normal global cursor `0x75A78`, all checked against typed LE relocations and original instructions:

| Original Object2 list | Entries / distinct sprites | Source marker | Encoded `SUCK.GRA` range | Verified code path |
|---|---:|---|---|---|
| `0x1BF00` | 5 / 5 | unrelocated zero | `0x1CC70–0x1CF6C` | `0x84929` → constructor `0x848E9` → source sequence runner `0x86C99` |
| `0x1BF18` | 5 / 5 | unrelocated zero | `0x1CF6C–0x1D284` | `0x84944` or `0x8495F` → constructor → `0x86C99` |
| `0x1BF30` | 8 / 8 | 1, typed back-pointer | `0x1D284–0x1DC90` | `0x84998` → normal reader `0x86CC5`; separate downstream source invokes frame advance `0x6435A` |

**18 ordered source entries, 18 distinct sprite streams** fill exactly `SUCK.GRA [117872,122000)`, the final **4,128 bytes**. The first **117,872 bytes** are **not covered by these three lists**; that is not a claim those bytes are unknown to O69, unused, undecodable or unextractable.

A fourth *pointer structure* at Object2 **`0x1BF58`** is **not another normal animation sequence**. Original source `0x84A2E–0x84A46` computes an indexed address within a four-DWORD table, then calls the normal descriptor reader **once** on that source path. The four pointer entries are:

`0x217C0, 0x217D0, 0x217F4, 0x217F4`

Thus there are **four lookup slots but only three unique descriptors**, all already members of the eight-entry looping source list. There is no independent four-frame terminator/rewind proof; do not add this table to the source-ordered animation count. The random/helper return range and actual branch choice are not observed.

The finite-list paths and looping path also use different control code. Do not collapse them into a single presumed 18-frame animation or supply arbitrary FPS values.

## Reproducibility, falsification and implementation boundary

The original private input was independently examined read-only: **600 positive original source/typed-pointer/indexed RLE and terminal checks passed**, alongside **11 deliberately corrupted in-memory source/relocation/marker/hash checks**, all rejected. These are **independent checker findings**, **not** a claim that the exact committed original-fixture suite was executed.

The submitted source-safe verifier `scripts/research/spelunk005/trace_bang_suck_sources.py` reuses previously verified Spelunk 004 generic LE and RLE functions, requires exact original `MK2.EXE`, `BANG.GRA` and `SUCK.GRA` identities, checks the new code paths and source geometry, and refuses any existing destination JSON. It emits no original game bytes. The private original-fixture regression `test_original_fixture.py` is committed but **its exact version remains VALIDATION PENDING**.

[Windows original-free CI #44033956610](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/44033956610) **SUCCESS**: 13 synthetic tests validating repeated descriptor accounting, finite/loop parser mechanics, interval coverage/refusal, source object trust boundaries and new source Python syntax. **No original commercial files were run in CI and no artifacts were uploaded.**

[Machine-readable static metadata](../validation/SPELUNK_005_MK2_BANG_SUCK_SOURCE_CENSUS_20261117.json) records source addresses, list sizes, SHA-256s, dispatch links, byte coverage, nonuniform tail and explicit runtime unknowns. It contains no copyrighted pixel data, palette entries, compressed streams or commercial binary files.

### Consequence for the extractor

- Represent BANG's eleven source-selectable lists as **95 ordered references to 93 distinct source sprites**, preserving zero vs rewind markers and selector index. Preserve the eight extra original graphics separately under their **non-animation/source-structure** provenance. BANG's 101 distinct original compressed sprites provide a full-resource byte-accounting witness without implying all are timed effect frames.
- Represent SUCK as three separate code-linked source lists (**5, 5, 8**), plus one **independent single-descriptor lookup table** with repeated pointer. Do not promote SUCK's first 117,872 bytes into these specific lists.
- The resource names/IDs identify **original indexed sprite sources**, not runtime colour allocation. Exact palette ownership, DAC bank, task activation, world coordinates, depth/occlusion and final visual timing still require P91 native runtime evidence or other independent capture.
- Do not modify O69's existing graphics, O177's established effect exports, P90/P91 normal-core adapter, or the research workbench. No original asset payloads enter GitHub.

### Next plausible spelunk

The highest-value next static question is **how the remaining SUCK.GRA sprite families and original BLOOD.GRA effect-list consumers select descriptors**, without duplicating O218/O228's already verified blood sprite 177. Another useful bounded branch is classifying the **unresolved second BANG pointer region** by its true consumer; no reason to invent a consumer to fill that gap.

**Confidence register:** VERIFIED STATIC source resource identity, 11 BANG selector lists, 95/93 repetition, 101 original-encoded sprite byte partition, one code-connected BANG signed-X pair consumer, three SUCK code-linked lists, four-pointer single-descriptor lookup. INFERRED extractor representation of source references/alternate programs. UNKNOWN live activations, original DAC, full SUCK source consumer map, exact additional BANG record grammar, elapsed frame timing, world positioning, and original framebuffer parity.
