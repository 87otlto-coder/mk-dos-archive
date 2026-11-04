# MK DOS Archive — O96O/O96P/O96Q: Conditional Producer-Spawn and Runtime Word-Stream Ancestry

**Date:** 2026-10-09 (SAST)  
**Game:** Mortal Kombat II DOS  
**Status:** BOUNDED STATICALLY VERIFIED / MK2 RESEARCH STILL OPEN

## Source and fixture authority

- Predecessor source: `MK-DOS-Archive-2026-10-08-O96N-source.zip`, SHA-256 `980fd15fb556b1bf41189296ef7c5c5c1b41e8b05b5aeb42a211c1d3518f6fbd`.
- Canonical `mk2.exe`: SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`, **read-only**.
- Earlier O96F/O96N evidence retained unchanged, independently checked as report prerequisites.
- No change to prior animation, palette, graphics or stage-export coverage counts.

## O96O — Nine index-writer calls share a conditional producer-spawn continuation

O96F authenticated nine direct near-call byte encodings into `0x82321`, and five exact preceding literal stores to global `0x75A80` (7, 6, 5, 30, 13). O96O now bounds the rest of the single callee's executable path:

1. `0x82321` loads `0x75A80`; `0x82326` stores it in `0x7747F`.
2. `0x8232F..0x82355` selects one of three relocation-backed Object-2 table bases (`0x15BEC`, `0x15C68`, `0x15CE4`) and replaces `0x75A80` with an indexed table value.
3. `0x8235A` calls helper `0x81EB2`; **assuming it returns along this path**, `0x82361/0x82366` load EBX=5 and EDX=`0x1FF44`.
4. `0x8236B` calls authenticated process constructor `0x67222`, which may install a callback to physical producer-loop entry `0x81B98`, according to O96L/N.

Thus **all nine authenticated direct callers share a bounded downstream conditional process-construction site**. The five adjacent scalars enter the writer; they are **not** thereby proven to be process parameters, valid table indices, stage identities or surviving renderer indices. Allocation itself is conditional, and a local raw call does not prove its gameplay execution.

Evidence: `mk2_writer_to_producer_process_constructor_o96o_2026-10-09.json`.

## O96P — Additional conditional producer-spawn path after two signed-WORD streams

The call at `0x85FAE` is preceded by literal assignment `0x75A80 = 13`. Once the O96O callee returns, its caller follows a separate bounded setup path:

- At `0x86000`, a pointer to head `0x84358` is passed to `0x6513B`.
- At `0x8600A`, ECX takes a pointer from **runtime global `0x76526`**. At `0x86010`, EBX receives a distinct relocation-backed **Object-2** pointer `0x1C2C6`.
- The loop reads a signed WORD from the ECX stream and advances ECX by 2. A **negative value** or literal **13** exits toward `0x86041`. Other values read a signed WORD from the EBX stream, advance EBX by 2, construct EDX using a `<<16` operation plus low constant `0xC5`, then call `0x8608C` and repeat.
- The helper `0x8608C` indexes another relocation-backed Object-2 base `0x1C264` via EAX*4, reads a DWORD, writes it to `0x75A6C` and calls another consumer. Its legal index domain remains unknown.
- After loop exit, bounded sequential code calls eight-row producer `0x81BB3` at **both** `0x86041` and `0x8605F`, sets up EBX=5/EDX=`0x1FF44`, calls constructor `0x67222` at `0x86070`, then enters an already-qualified yield path.

This is **another conditional construction path**, not a proof that runtime data makes the loop terminate or that it occurs in a particular scene. The two word streams do not have an established universal record grammar or semantic label.

Evidence: `mk2_runtime_word_dual_source_conditional_producer_o96p_2026-10-09.json`.

## O96Q — Runtime ECX word-stream source has two direct stores

Across authenticated file-backed Object-1 code, the address operand `0x76526` has **six exact occurrences**. Two are direct stores and four are direct reads:

- **`0x757AC`** sets `[0x76526] = 0`, then the local path calls `0x97FA0` at `0x757CA`.
- **`0x97FD2`** writes a dynamic EAX pointer to `[0x76526]`. The producing routine at `0x97FA0` computes an index through helper `0x645E5` and loads an indexed DWORD from relocation-backed Object-2 base `0x2AF80`, or conditionally substitutes another relocation-backed Object-2 pointer `0x2B078`.
- Direct readers are at operand locations `0x763E9`, `0x76470`, `0x85D76`, `0x8600C`; the last is the O96P dual-stream input.

This supplies concrete pointer ancestry for the O96P runtime first stream. **The actual selected pointer value, contents, legal table index, temporal co-execution with O96P, and stage identity remain UNKNOWN.** No static stream content is invented.

Evidence: `mk2_runtime_word_stream_source_writer_ancestry_o96q_2026-10-09.json`.

## Independent verification

- O96O: **41 checks / 0 failures**.
- O96P: **54,172 checks / 0 failures**, including separate parsing of all 27,004 LE relocation records.
- O96Q: **54,156 checks / 0 failures**, including another separate parse of all 27,004 LE records.
- New subtotal: **108,369 checks / 0 failures**.
- Three deliberate falsifications **rejected**: claiming unconditional allocation; changing the loop's exit sentinel; fabricating stage identification.
- Rerun regressions: O96N **37/0**, O96L/M **54,181/0**, O96I/J **54,443/0**.

Producer scripts:

- `scripts/run-mk2-o96o-o96p-producer-scene-paths.mjs`
- `scripts/run-mk2-o96q-runtime-word-source-writers.mjs`

Separate raw-fixture Python verifiers:

- `scripts/verify-mk2-o96o-o96p-producer-scene-paths.py`
- `scripts/verify-mk2-o96q-runtime-word-source-writers.py`

## Limitations and next direction

No observed gameplay or runtime trace; no guaranteed process allocation, array bounds, scene identity, palette binding, complete stage image, animation or timing model. The source's old O96N next-pass language is historical where contradicted by this checkpoint. MK2 remains **OPEN**.

**Next candidate O96R:** use the now-qualified installer branch and one bounded runtime index/source context to test whether an actual Object-2 stream record can be selected and tied to a consumer. Do **not** infer a complete stage from the table alone. If the executable data flow does not qualify the runtime index, pivot to other MK2 research closure blockers rather than endless producer genealogy.

Mandatory order: **finish MK2 → finish MK1 → finish MK3 → discuss UI/usability with user → build extractor**.
