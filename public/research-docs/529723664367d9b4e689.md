# MK DOS Archive — O94B MK2 U8 `+0x04` end-field lifetime

**Date:** 2026-10-07 (SAST)  
**Base:** `MK-DOS-Archive-2026-10-07-O94A-source.zip`  
**Status:** **AUTHENTIC-FIXTURE VERIFIED / INDEPENDENT AUDIT PASSED**  
**Scope:** disk header `+0x04` lifetime/transformation only. The purpose of the 32 trailing bytes, exact active PCM range and WAV conversion remain deliberately unresolved.

## Question for this pass

Trace the `.U8` header field at `+0x04` from the authenticated SCC/GMI sample-start routine into live playback state and answer only:

> Is `+0x04` transformed before the mixer uses it, and what bounded role does it have?

O94B does **not** attempt to decide whether the 32 bytes beyond the limit in 308 files are padding, guard material or audible sample data.

## Authentic code path

O94A already established the direct caller chain:

`MK2 DOS read -> RM.DRV request 1 -> SCC/GMI AH=0x11 -> 0x0F03`

O94B authenticates three additional SCC/GMI instruction regions against canonical `GMI.BIN` SHA-256:

`7b0bc5261dd550ebac3764aabe3af27611cafee83827f60d796dea7918fc9633`

### Sample-start copy at `0x0F2F`

With `SI` at the `.U8` descriptor base:

- `LODSW` reads descriptor `+0x00` low word;
- two increments skip descriptor `+0x02/+0x03`;
- the data-start low word is rebased and stored as channel current offset;
- `MOVSW` then copies descriptor `+0x04/+0x05` **directly** into channel state `+0x04/+0x05`;
- two increments skip descriptor `+0x06/+0x07`;
- descriptor `+0x08` low word is read for the optional loop restart.

No arithmetic or base addition is applied to disk `+0x04`. The high 16 bits at disk `+0x06/+0x07` are not consumed by this routine.

### Mixer threshold at `0x0CF8`

The mixer:

- loads current offset from channel `+0x00`;
- compares it unsigned against channel `+0x04`;
- follows the sample-read path only when `current < end` (`JB`);
- otherwise considers loop restart or no-sample handling.

Therefore channel `+0x04` is a bounded **unsigned playback end threshold** for the current sample offset.

### Completion threshold at `0x0E9C`

Completion logic repeats the same current-vs-end comparison. When the current offset has reached/passed the threshold and no loop restart exists, it clears channel `+0x04` and marks current `0xFFFF`.

## Canonical corpus result

All **312** authentic `fx/*.U8` files were inspected.

- disk `+0x00` = 32 in **312/312**;
- disk `+0x04` high word = 0 in **312/312**;
- maximum `+0x04` value = 38,089, so the canonical corpus fits the 16-bit consumer;
- **308** files encode `+0x04 = fileBytes - 33`;
- **4** files encode `+0x04 = fileBytes - 1`;
- equivalently, using `+0x04` as an inclusive marker for byte accounting only, 308 files have exactly **32 bytes after it**, while the four exceptional files have **0 bytes after it**.

The four exceptional names remain:

- `gong.u8`
- `liu-kang.u8`
- `thunder.u8`
- `thundsht.u8`

The 308 trailing 32-byte blocks are **not a single fixed footer**:

- 295 distinct SHA-256 values across the 308 blocks;
- 12 blocks are all zero;
- therefore a universal constant 32-byte metadata/footer interpretation is rejected.

This does **not** establish what the varying trailing blocks are for.

## O94B decision

**VERIFIED, bounded:**

- disk `+0x04` low 16 bits are copied unchanged into runtime channel `+0x04`;
- no base addition/normalization occurs at sample-start;
- mixer/completion use runtime channel `+0x04` as an unsigned current-offset end threshold;
- the 308/4 split is encoded on disk and survives unchanged into mixer state.

**Still UNKNOWN / blocked:**

- why 308 files retain 32 bytes beyond their declared threshold while four do not;
- whether those 32 bytes are padding, guard samples, source material intentionally excluded from playback, or something else;
- exact byte-for-byte audible/active PCM export range;
- WAV conversion.

`wavAdapterAuthorized = false`.

## Mechanical validation

Project implementation:

- `src/games/mk2/research/u8EndFieldLifetime.ts`
- `scripts/run-mk2-u8-o94b-end-field-lifetime.mjs`
- evidence: `evidence/mk2/mk2_u8_o94b_end_field_lifetime.json`

Independent implementation that does not import the TypeScript pass:

- `scripts/verify-mk2-u8-o94b-end-field-lifetime.py`
- evidence: `evidence/mk2/o94b-independent-audit.json`

Authentic-fixture results:

- TypeScript O94B: **SUCCESS**
- independent Python audit: **12 checks, 0 failures**
- relation partition: **308 / 4 / 0 other**
- bytes-after-threshold accounting: **308 x 32 bytes / 4 x 0 bytes**
- distinct 32-byte-tail hashes: **295**
- all-zero 32-byte tails: **12**
- WAV adapter authorized: **false**

## Next pass

**O94C — four-exception and 32-byte-tail role audit**

The next pass should compare the four exceptional files against the 308-file population and investigate whether file-generation patterns, waveform continuity, loader behavior or driver over-read/guard behavior can explain the missing/present 32-byte tails. It must not declare an exact WAV range unless that role becomes mechanically established.
