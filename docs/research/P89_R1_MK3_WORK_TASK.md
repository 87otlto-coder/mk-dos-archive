# P89 R1 — Work mode bounded MK3 P79 continuation decoding research

## RECONCILIATION AFTER ORIGINAL R1 SOURCE TEST (2026-11-14)

**The first R1 hypothesis pass has already been executed directly against canonical `DATA.MK3`. Do not redo it.** Read [P89_R1_SOURCE_OBSERVATIONS_20261114.md](P89_R1_SOURCE_OBSERVATIONS_20261114.md) first, then `scripts/research/p89/r1_payload_discriminators.py`. The new report verifies 210 distinct nonempty source record hashes, 209 shared three-byte prefixes (exception ordinal 66), 209 common two-zero suffixes (exception ordinal 68), and record 0's exceptional `(47679,51839)` fields. Two *precisely specified* naïve byte RLE + assumed output-bound hypotheses were tested and rejected against all 210 nonempty records. **ZERO verified additional images; native codec, palette, timing and record field meanings still UNKNOWN.**

[Hosted Windows source-only #43576433860](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/43576433860) PASS on the newly committed executable/test/workflow source `816e1716b6ecfd828e7fca5a053d993fbda37af3`. The original-user Windows R1 baseline was on older source `5821bf3`; new discriminator source was original-tested in the private research runtime using the supplied exact original ZIP, *not yet rerun on the user's Windows machine*.

**Next discriminating effort:** no further generic codec guesses. Trace an original-DOS P79 record decompression entry point or observe its memory output at the boundary of a representative payload; qualify command semantics against actual source-verified output indexed positions. Use record 0, 23, 66, 68 and a holdout, with one candidate codec plus independent verifier if evidence supports it. If runtime/trace evidence is unavailable, record the source blocker explicitly; do not equate structure with decoded frames. The remainder of this original task is retained as historical testing contract, not an instruction to re-run the completed first pass.


**Status:** READY FOR RESEARCH EXECUTION, **NOT a decoded-frame result**. **2026-11-14.** Authored following user-local P89 original Windows inventory PASS at source `5821bf32fd24084ec471561fa8a2c84dcc8b3a2e`, tree `405b11e23bd2a20f60933482d31004e7bc7d9613`. The R1 per-record private report has not been inspected by this author. Do not invent values from it.

## Context / required reading (no rediscovery)

Repository `87otlto-coder/mk-dos-archive`, branch `research/p89-extraction-unknowns`, draft PR #30; accepted base `interim/p83-mk2-stage-library` at P88 merge `97d67a14b2bd6c854d3e749247226ab1d5023f1a`.

Read in this order: `PROJECT_STATUS.md`; `docs/research/P89_EXECUTION_ENTRYPOINT.md`; `docs/research/P89_WORK_SESSION_PACKET_DRAFT.md`; `docs/EXTRACTOR_P79_MK3_LEADING_SPAN.md`; `scripts/mk3_p79_leading_span.py`; `scripts/verify_mk3_p79_leading_span.py`; `scripts/research/p89/structures.py`. Review P77/P78 only to keep their **216 already decoded images** separate from these P79 **216 raw records**.

Private original input expected under `F:\Dev\MKEXT\FIXTURES\mk3\mk3`; local R1 evidence folder:
`F:\Dev\MKEXT\FIXTURES\VALIDATION\P89-8a231588f5fb4663875532744c50163c`.

Files to inspect if accessible:
- `r1-mk3-raw-records.json`: independently original-oracle-checked structural observations, fields/offsets/lengths/digests/statistics; **not itself proof of a decoder**.
- `p79-source.zip`: source-derived original data, **private / do not upload to GitHub or public Actions**.
- Original canonical `DATA.MK3`, SHA256 `72905bc96b752bceb0055296e26b904402909f73a1401541c0dd175135a55517`.

**Work mode may not have access to the user's Windows F: drive.** Check availability once. If inaccessible, use any securely supplied permitted private attachments or JSON evidence, and state `ORIGINAL_SOURCE_UNAVAILABLE` for any pixel-decoding test requiring those bytes. Do not recreate or guess original bytes from hashes, entropy or screenshots. Do not spend the Work session searching indefinitely for files.

## Precisely bounded source facts

The independently accepted P79 source span is [667866, 2508500), length 1,840,634 bytes. It has a 6-byte count/width/height header, 768 adjacent RGB8 comparison bytes, 8-byte base header, one original 320×200 numeric-index plane and 216 tagged-3 raw continuation entries with 14-byte headers. All original bytes of that span were accounted for by P79. Six records, ordinals 120–125, have empty payloads (verify this directly against the R1 report before relying on it). The two 32-bit header fields `fieldA` and `fieldB` are **UNKNOWN**, as is each payload's record semantics. The 768 adjacent RGB bytes are NOT proven native DAC palette ownership.

## Core research question

**Does at least one nonempty P79 continuation payload independently support a reproducible additional indexed image/plane, image update, or other extractor-usable visual record?** If not, determine which discriminating evidence is missing and stop rather than creating speculative animation.

## Required testing sequence

### Gate 0: source/evidence integrity

1. Record actual Git HEAD, tree and clean tracked source. Verify exact DATA.MK3 hash and `r1` original-oracle acceptance from the private report/archived P79 ZIP. Output status `ORIGINAL_BYTES_VERIFIED` only if actually inspected.
2. Read every report row, compute observed `fieldA`, `fieldB`, payload lengths and offsets; compare claims to source bytes where accessible. Keep empty records 120–125; do not treat them as decoded blank frames.
3. Confirm that the candidate raw source region does not duplicate the accepted P77 chained-index image locations/records.

### Gate 1: discriminate source record structure before proposing graphics

Pre-register the following mutually testable *candidate* explanations (may all be false):
- **H1 independent bounded raster:** an entry may include enough local structure for its own spatial raster/plane.
- **H2 delta/update:** an entry may transform the 320×200 base plane or another prior reconstructed index plane.
- **H3 mixed records/control:** record fields could select control or nonimage data, with no guarantee of one picture per record.
- **H4 other compressed source data:** payload may use a format already verified elsewhere in this repository, but reuse must be justified by exact byte-level grammar and offsets, not resemblance.

For each H1–H4, identify *specific discriminators* from the private record header statistics and payload bytes: structure, boundaries, explicit rectangle dimensions, consumed sizes, plausible scanline pointer tables, repeated opcodes, or stable state relationships. Distinguish true observations from inferred meanings. Reject unsupported width/height, field endianness, selected palette and frame count.

### Gate 2: bounded candidate decoder (only if byte evidence supports it)

Implement candidate in a separate script or feature-flagged research module, not the accepted workbench decoder:
- Read-only original input; reject malformed record tags, integer overflow, out-of-span reads, invalid dimensions, row overruns, nonterminating commands, and unexpected trailing bytes.
- At first attempt on **one** promising nonempty record; then another independent nonempty record with distinct length/header pattern, and a holdout record not used to design the hypothesis. Do not generalize from one success.
- Declare exact binary start/end offsets, 100% consumed or explicitly preserved residual bytes, output width/height, indices, visibility/paint mask (if proven), and any unknown semantics. Do not infer native palette/timing/ordering.
- Candidate may output temporary private indexed/mask evidence and diagnostic PNG; do not commit original-derived pixels to GitHub.

### Gate 3: independently falsify candidate

The verifier must **not import** the candidate decompression routine or parse-only helpers used to produce candidate graphics. It must independently inspect original record byte bounds, reconstructed pixel/index/mask positions, output size, selected headers and exact source provenance.

Required adversarial controls: truncated payload; inflated length; changed record tag; changed field A/B; invalid row/coordinate pointer; nonterminating/cyclic stream; data after supposed end; changed previous-frame state for H2; damaged original source hash. Each negative fixture should fail closed, with an explicit reason. A candidate that only looks plausible in a PNG is **not VERIFIED**.

### Gate 4: significance decision

- **VERIFIED** only if record parsing, source byte accounting, an independently validated output/index relation and repeated independent examples succeed. Narrowly state record subset and semantics actually proven.
- **INFERRED** for constrained implications that still lack runtime witnesses.
- **HYPOTHESIS** for candidate grammar not yet verified.
- **UNKNOWN** for `fieldA`, `fieldB`, palette, playback, relation to base and scene unless separately evidenced.
- **VALIDATION PENDING** if original private input was unavailable, runner could not execute, or Windows acceptance is not complete.

Do not label the 216 source records `animation frames`, even if a subset eventually encodes an image. A source-record count is not native runtime frame count. No stage association, full palette, draw order, timing, playable animation or browser runtime proof without separate original evidence.

## Hard stop / usage budget

- Spend the first part of the session inspecting **existing R1 JSON and source span**, not configuring another toolchain.
- Stop at one candidate grammar and a small independent holdout set. Document rejection if discriminators fail; don't survey unrelated MK3 executable/gameplay behaviour.
- R2/R3 remain prepared for later sessions, but do not divert into them unless R1 has a clear source-data blocker and reallocation is explicitly documented.
- Preserve original DOS binaries, all historical research, P86/P87/P88 accepted code and verified source archive output. Keep commercial and derived original pixels/audio out of GitHub.
- Use one or two recoverable commits for a verified *source-only* research script/negative controls if useful, rather than a premature complete source release; keep PR #30 draft. Windows-only GitHub source CI, opt-out of large browser build uploads.
- No changes to gameplay, controls, damage or collision.

## Work deliverables

A precise R1 research report with:
1. Exact tested HEAD/tree and original input/report SHA and availability.
2. Table of observations, H1–H4 tests, rejected hypotheses, file/source offsets, and confidence classifications.
3. Any validated candidate output with independent verifier result, negative controls, repeat/holdout records; a private preview path where available.
4. Explicit `newVerifiedImageRecords`, `recordsStillUndecoded`, `nativePaletteVerified`, `nativePlaybackVerified` (do not guess).
5. Whether to implement a bounded P90 extractor capability, and exactly what acceptance still requires.
6. Updated safe GitHub research documentation/PR only if evidence supports changes. No original data committed.

Return a concise completed result or explicit blocker, not a promise to investigate later.
