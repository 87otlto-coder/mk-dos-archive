# Spelunk 007 — Original DOS MK2 BLOOD.GRA source-list control, two interior rewinds and four-way variant entries

**Date:** 2026-11-17  
**Research branch:** `research/spelunk-007-mk2-blood-list-control`, based on and preserving Spelunk 006.  
**Confidence:** **VERIFIED STATIC SOURCE ORDER AND CONTROL** for source structures with original instruction/LE witnesses; **UNKNOWN / VALIDATION PENDING** for game-triggering, frame timings, active DAC, final screen placement and native presentation.

## Research objective and pre-existing evidence

Before this pass, O69 already established **178 distinct, exactly decodable indexed graphics** spanning all original `BLOOD.GRA` bytes, not their animation driver. O218/O228 independently established original Pit II blood fragment source **177**, descriptor `Object2+0x206FC` / physical `0xC1350`, source offset **111,552**, original **14×9**, **73 opaque pixels**, code-connected spawner and an original *descriptor-associated* palette record at Object1 `0x26CC4`. Those are **prior findings**, not rebranded Spelunk 007 discoveries.

This expedition asked how the **other** original blood descriptors are sequenced, how the original code consumes their lists, and whether any nontrivial source control is lost by a flat animation export.

Read-only canonical originals: `MK2.EXE` 861,133 bytes, SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`; `BLOOD.GRA` 111,780 bytes, SHA-256 `9a47dd926c27a6570bcd81cbb0a3ff1bae2106a26e0f5360c8018fea6f16a5a9`; executable resource filename pool ID **9**. The original LE fixup stream yields **27,004 relocation records, 26,994 unique source sites**.

## Finding 1: two source animations have introductory segments then interior rewinds

The normal original source frame reader at physical `0x86CC5` consumes 32-bit descriptor pointers through Object2 `0x75A78`. Its exact instruction path at `0x86D14` tests for marker `1`, reads the next DWORD as a back-pointer, writes that pointer to `0x75A78`, then loops to `0x86CC5`. Both BLOOD groups below terminate in the original marker `1` and have independently typed LE back-pointer records **inside** their own lists, not at their beginning.

| Original list Object2 | Original entries | One-time introductory entries | Entries traversed again after rewind | Exact typed rewind pointer |
|---|---:|---|---|---|
| `0x1D08C` | **18** | **0–5** (6 entries) | **6–17** (12 entries) | `0x1D0A4` |
| `0x1D178` | **14** | **0–6** (7 entries) | **7–13** (7 entries) | `0x1D194` |

These lists are reached by **original source code that writes their root addresses to the normal frame cursor**: `0x1D08C` has physical writer instructions **`0x9091E`** and **`0x90979`**; `0x1D178` has **`0x90E59`** and a source call into normal runner `0x86C99`. This establishes a real *intro-then-rewind sequence grammar* and code-linked list availability. It does **not** establish how often a branch runs or how many physical presented frames each source entry occupies.

The exact original 18-byte reader witness is `83fb0175c3528b52048915785a07005aeb9f` at physical `0x86D14`. The typed target and original DWORDs for both rewind locations were checked independently.

**Extractor impact:** do not encode either as an unconditional loop over all list entries. Preserve an explicit intro segment and a separate rewind/cycle segment, with source provenance and original indexed frames unchanged. A guessed 6-fps, 12-fps or 50-fps playback would be wrong evidence classification.

## Finding 2: a four-entry selector starts at four offsets within ONE list

An original four-pointer table at Object2 `0x1D028` contains type-7 LE targets:

| Selection slot | Pointer target within source list | Original 12-entry list ordinal |
|---:|---|---:|
| 0 | `0x1D038` | 0 |
| 1 | `0x1D044` | 3 |
| 2 | `0x1D04C` | 5 |
| 3 | `0x1D058` | 8 |

The original source at `0x90661–0x9069C` transfers a DWORD from task `[ESI+0x68]` into cursor `0x75A78`. At `0x9066B` it copies the **high 16 bits into EAX**, then at `0x90673` it **clears the cursor's high word**. Thus the index×4 / table-base arithmetic at `0x9067C–0x9068D` uses the **low 16 bits** of the original task DWORD, not its high 16 bits. At `0x90694` it dereferences the chosen pointer and stores that result back in cursor `0x75A78`. The exact original high-word clearing opcode is `66c7057a5a07000000`. The table-base operand is itself an original typed relocation.

This is **one underlying 12-entry descriptor list with four source-selected entry points**, not four separate source-image records or four independently timed animations. Actual runtime index bounds and which slot a real fight chooses remain **UNKNOWN**. The specific task-field packing and downstream wait/reader presentation are not guessed beyond the original source instructions.

## Finding 3: sixteen finite source structures, two rewind structures, and five caller uncertainties

We independently scanned the original file-backed Object2 for the O69 12-byte sprite descriptor grammar (bounded width/height, signed local offsets, resource 9, original packed offset and exact row-oriented RLE). All **178** independently decodable streams exactly partition the **111,780** source bytes, with no gap or overlap. This is a **regression of prior O69 completeness**, not new coverage.

A separate typed LE pointer scan found **18 contiguous pointer-list structures**, comprising **155 ordered descriptor references to 153 distinct original sprites**. Their end markers are **16 unrelocated zeros** and **two marker-1/typed-back-pointer rewinds**. The remaining **25 distinct original sprites** are not in these eighteen groups and must not be called unused.

Source-consumer classification is stricter than structural recognition:

| Provenance | List structures | Decision |
|---|---:|---|
| **Original direct code `MOV [0x75A78], root`** | **12** | VERIFIED static source cursor writers, original type-7 code operands |
| **Original four-way selection into one source list** | **1** | VERIFIED indirect selector/entry-offset table; don't multiply into four animations |
| **Contiguous valid typed descriptor list, but no direct cursor writer proved** | **5** | STRUCTURAL ONLY — do not promote runtime or even definite original reader usage |
| **Total** | **18** | 155 entries / 153 unique sprites, but NOT 18 verified timed gameplay animations |

The five structurally valid **direct-consumer-unknown** list roots are:
`0x1D010`, `0x1D1D0`, `0x1D1F0`, `0x1D22C`, `0x1D2E0`.

A second source-order trap appears in root **`0x1D240`**: **eight list references to only six distinct descriptors**. Its first four entries are `0x20264, 0x20264, 0x20274, 0x20274`. Deduplicating this eight-entry list before sequence export would discard explicit source repetition.

Original source confirms **159** of the 178 resource descriptors have at least one typed Object2 relocation reference somewhere, but that is a wider reference census than membership in these eighteen contiguous lists. Do not conflate “typed referenced,” “in a source list,” “has direct source code consumer,” and “displayed on screen.”

The **18-row source-safe JSON ledger** records root offsets, list counts, unique sprite counts, encoded source extents, original code writer sites, source marker type and classification. The reproducible original-input verifier can generate detailed per-sprite SHA hashes, indexed/mask hashes and descriptor-local geometry privately.

## Previously verified Pit blood fragment remains separate

The final original BLOOD source sprite 177 is not a fabricated additional source frame, and the original spawner/palette source findings from O218/O228 are untouched. The new verifier regression checks the descriptor Object2 `0x206FC`, physical `0xC1350`, original 14×9 / offset 111,552 / 73 opaque pixels, source code typed pointer at `0x806EC` and original source palette-pointer relation to Object1 `0x26CC4`. The palette record is **descriptor-associated original source data**, not a verified runtime DAC allocation.

## Testing and evidence status

- Private independently written read-only binary investigation authenticated the exact original EXE/GRA hashes and resource IDs; full 27,004/26,994 LE census; 178 indexed streams/111,780 complete source bytes; all eighteen original list structures, two typed interior rewind records, four typed variant entry selectors, duplicate source frames and twelve original code-writer groupings.
- New original-input reproducer `scripts/research/spelunk007/trace_blood_source_lists.py` re-verifies those source relationships and writes original-free metadata only to a **nonexistent** destination path. No game files or sprite pixels are copied into GitHub.
- `scripts/research/spelunk007/test_original_fixture.py` contains **22** private original-file positive, negative, deterministic and no-overwrite cases. **The exact committed original-fixture suite has not been run.** Do not claim 22/22 original-input tests passed.
- [Windows source-only CI #44046658075](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/44046658075) **SUCCESS: 12 synthetic tests** plus syntax checks. It includes synthetic opcode/typed-pointer falsification, indexed-RLE/mask checks, and malformed-input refusals; it uses no original commercial files. An earlier Windows synthetic run **#44046558710 failed** due to insufficient synthetic bytearray backing for relocated Object2 addresses; corrected in the subsequent passing commit. No artifacts uploaded.
- Machine-readable evidence: `docs/validation/SPELUNK_007_MK2_BLOOD_SOURCE_CONTROL_20261117.json`. No original pixel data, resource bytes, palettes, sounds, binary executables or proprietary fixture recordings committed.

## Extraction implications and next research

The extractor should preserve **unique indexed sprite sources**, **ordered original source entries (including repetitions)**, **loop/intro edges**, **choice-of-entry ordinal** and **source consumer provenance** in separate fields. Five source-list structures remain candidate-only, not necessarily animated.

The next useful static investigation is to follow the five as-yet-unproven original list consumers only if their ownership changes extraction completeness. The other still-open source question from Spelunk 005 is the nonuniform BANG.GRA secondary pointer/coordinate region. Beyond that, native timing, palette/DAC ownership and framebuffer parity require original runtime instrumentation; no amount of static list enumeration can honestly substitute for them.

**Confidence:** VERIFIED STATIC for exact typed pointers, original control opcodes, 12 direct cursor writers, one selector and the two interior rewind edges. INFERRED only for the proposed separation of sprite and animation metadata. UNKNOWN for actual live triggering, timing, palette ownership, global stage positioning, occlusion and final composited pixels.
