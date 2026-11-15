# P89 R1 — direct-original MK3 P79 continuation observations (2026-11-14)

**State: source structure VERIFIED; two narrowly defined naïve RLE hypotheses FAILED; source image/animation decoding remains UNKNOWN.** Do not promote this to a decoded frame count, native runtime interpretation or extractor implementation without independently verified index pixels.

## Source and reproducibility

The attached *private original* `mk3.zip` supplied with the MK DOS Extractor project was directly inspected in a non-Git research runtime, reading member `mk3/DATA.MK3` without changing game bytes. The **whole source SHA-256** exactly matched canonical original `72905bc96b752bceb0055296e26b904402909f73a1401541c0dd175135a55517`; source size 9,015,508 bytes.

The R1 P79 slice is [667866,2508500), **1,840,634 bytes**, SHA-256 `33d9f900bdb5054cb5520bdf9b7e0d5afd65e9971c5467dbe35857202ddcc599`. Its base original indexed pixel plane SHA-256 `3553eead898a40d15788ef8072634cef04b2047cf7d4055682e7129aa6e7dd2e`. Existing P79 and the user-run P89 independent original-oracle checks had previously validated the complete interval. New raw observations below independently reproduce record boundaries and source fingerprints directly from DATA.MK3.

**Source-only research code committed:** `scripts/research/p89/r1_payload_discriminators.py` and `scripts/research/p89/test_r1_payload_discriminators.py`. On original input the script outputs only structural counts, source offsets and SHA-256, *never* original indexed planes, compressed record payloads, GIFs or screenshots. A private metadata JSON report was generated, SHA-256 `40965672b6f547ebe72a737e272fc1dc18f8714a06c66bd23614c9ee9954bf46`. The JSON report is not committed to GitHub because the user can retain all per-record original-source information privately. Sixteen synthetic original-free tests passed in the research runtime; hosted Windows source CI must be verified separately.

**Prior Windows original P89 baseline** tested source HEAD `5821bf32fd24084ec471561fa8a2c84dcc8b3a2e` / tree `405b11e23bd2a20f60933482d31004e7bc7d9613`, with 20 original-free controls and P79/P65/P82 original-source oracles PASS. This new R1 script was authored *after* that Windows test; no Windows original-machine PASS is claimed for the new code yet.

## OBSERVE — canonical source facts

| Original field / observation | Verified source value |
| --- | --- |
| P79 header `count,width,height` | 216, 320, 200 |
| Base original indexed plane | 64,000 bytes |
| Raw continuation records | 216; **210 nonempty**, six empty (ordinals 120–125) |
| Nonempty payload bytes | 1,772,828 |
| `fieldA,fieldB` at ordinal 0 | **47679,51839** (difference **4160**, or 13×320) |
| `fieldA,fieldB` for other nonempty records | **0,64000** (209 records) |
| `fieldA,fieldB` for six empty records | **0,0** |
| Unique SHA-256 among nonempty raw record payloads | 210/210 |
| Nonempty records starting with bytes `80 81 00` | 209/210; exception **ordinal 66** starts `80 a1 0c` |
| Nonempty records ending `00 00` | 209/210; exception **ordinal 68** ends `20 00` |
| All 216 declared original tagged record boundaries | Full, gap-free P79 source interval coverage |
| Verified newly decoded continuation images | **0** |

The unusual `fieldA=47679` and `fieldB=51839` can be expressed as `149×320-1` and `162×320-1` respectively. Their difference is 13 complete rows. **This is a mathematical relation, not evidence that the fields are a draw rectangle, image start/end offset or row range.** All other nonempty records have `fieldB-fieldA=64000`, which is consistent with—but does not prove—a full 320×200 affected region.

The recurring three-byte markers suggest structure. **No opcode meaning or native image output was inferred solely from recurrence**, and the exceptional record 66/68 patterns are preserved, not normalized.

## HYPOTHESIZE → TEST → CLASSIFY

| Hypothesis | Discriminator / measured result | Classification |
| --- | --- | --- |
| H1: each record is an independent image | A canonical 64,000-index size appears in the record header field difference on 209 records, but no source-verified pixel decoder or mask exists | **HYPOTHESIS**, image count remains **0** |
| H2: records are deltas from prior indexed planes | Record 0's field difference is 4,160, while subsequent nonempty records mostly cover an apparent 64,000-position range. No verified previous-frame-dependent reconstruction | **HYPOTHESIS** |
| H3: mixture of control and graphics source | Six zero-length entries and one exceptional span are source evidence of distinct structural forms, not proof that any is a control instruction | **UNKNOWN** |
| H4a: naïve PackBits | Under the explicit assumption `0x80=NOP`, signed-byte literal/repeat packets: **0/210** nonempty payloads yield `fieldB-fieldA` output positions. Malformed packet bounds are also refused | **REJECTED for this specific grammar plus output-size interpretation**, not every PackBits-like variant |
| H4b: naïve `0x80,count8,value8` RLE | Under the explicit escape-triplet specification, **0/210** nonempty records yield `fieldB-fieldA` positions | **REJECTED for this specific grammar plus output-size interpretation**, not a generic escape/RLE family |

Both negative tests compare *proposed decoded counts* against the **hypothesized** output bounds `fieldB-fieldA`. Because the header fields' native semantics are **UNKNOWN**, the mismatches are evidence against those *combinations*, not absolute proof that no PackBits/escape-based codec is present. Neither test produced or validated original indexed pixels.

## What changes for the extractor

**None yet.** The existing P79 original base-image export plus 216 byte-perfect preserved opaque raw records remains correct; the R1 research improves the exact refusal/triage surface. The P77 chained-image corpus is separate and already decoded; do not conflate two source families with the same numerical count.

Next necessary discriminating evidence: native DOS decompression output or original EXE decompression routine/byte-level grammar for the P79 frame records, with explicit input and output bounds. Start with record **0** (exceptional field range), record **23** (different initial marker sequence), record **66** (marker exception), record **68** (tail exception), and an untrained holdout. Implement any candidate decoder separately and require an independent oracle for every pixel, an adversarial suite and at least two independent confirmed records. Preserve palette, original timing, order and runtime state as **UNKNOWN** until separately witnessed.

**Acceptance status:** P89 R1 source structure/rejected simple hypotheses **VERIFIED ON AVAILABLE ORIGINAL FILES IN RESEARCH RUNTIME**. New code's hosted Windows CI and user's own Windows original execution remain **VALIDATION PENDING** until observed. **New verified decoded images=0**; **original undecoded raw records=210 nonempty plus six empty**; **native palette=false**; **native playback=false**.
