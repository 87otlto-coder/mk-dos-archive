# MK DOS Archive — O94C MK2 U8 four-exception and tail-role audit

**Date:** 2026-10-07 (SAST)  
**Base:** `MK-DOS-Archive-2026-10-07-O94B-source.zip`  
**Status:** **AUTHENTIC-FIXTURE VERIFIED / INDEPENDENT AUDIT PASSED**  
**Scope:** explain the 308/4 end-field populations as far as the authentic bytes and mixer code permit; audit whether the trailing regions are required by mixer over-read. Exact WAV export contract remains deliberately deferred to O94D.

## Question for this pass

O94B established that disk `.U8 +0x04` low 16 bits are copied unchanged into the live Sound Images channel end threshold. O94C asks:

1. What exact on-disk relation distinguishes the 308-file group from the four exceptions?
2. How many file bytes are actually unreachable by the authenticated mixer because it reads only while `current < end`?
3. Do the one-, two-, or four-channel software mixer paths ever dereference the trailing bytes as an over-read/guard region?
4. Do the trailing bytes have a byte pattern strong enough to identify them as metadata, fixed padding, or some other semantic structure?

## Important O94B accounting clarification

O94B reported **32 bytes after the declared inclusive marker** for 308 files and **0** for four files. That accounting was arithmetically correct, but the mixer does **not** read the marker byte itself: every authenticated software mixer kernel dereferences a sample only on the `current < end` branch.

Therefore the operational mixer-unread regions are:

- **308 files: 33 bytes** (`end` byte itself + the 32 bytes after it)
- **4 files: 1 byte** (`end` byte itself)

This is a clarification of the half-open runtime interval, not a reversal of O94B.

## Two exact on-disk encodings

All 312 canonical `fx/*.U8` files have a 32-byte header and disk `+0x00 = 32`.

The corpus divides exactly into two populations:

### 308-file population

`+0x04 = payloadBytes - 1`

where `payloadBytes = fileBytes - 32`.

Because the runtime current offset begins at 32 and the mixer reads only while `current < +0x04`, these files have **33 file bytes that the authenticated mixer cannot dereference**.

### Four-file population

The four files remain:

- `gong.u8`
- `liu-kang.u8`
- `thunder.u8`
- `thundsht.u8`

For these:

`+0x04 = fileBytes - 1`

Only the final file byte is therefore beyond the authenticated mixer-readable interval.

No third end-field relation occurs in the 312-file canonical corpus.

## Mixer-read boundary audit

O94C authenticates the threshold-before-read sequence independently in all three software mixer kernels present in canonical `GMI.BIN` / byte-identical `SCC.BIN`:

- four-channel kernel at `GMI+0x0CF8`
- two-channel kernel at `GMI+0x0DE2`
- one-channel kernel at `GMI+0x0E68`

Each follows the same bounded structure:

1. load current sample offset;
2. compare unsigned against channel `+0x04` end threshold;
3. dereference `ES:[BX]` only when `current < end`;
4. otherwise enter loop/no-sample handling before any sample-byte read.

All **312/312** disk loop fields at `+0x08` are zero, so no canonical file can use a loop restart to expose bytes at or beyond the end threshold.

Therefore, for this canonical corpus and these authenticated software mixer paths, the file-container interval potentially dereferenceable as source sample bytes is bounded to:

`[ U16(+0x00), U16(+0x04) )`

This does **not** yet define the final WAV contract: sample stepping, rate/pitch semantics and export timing remain O94D work.

## Tail byte-shape audit

The 308 mixer-unread 33-byte regions are not a fixed footer or universal constant:

- **295 distinct SHA-256 values** across 308 regions;
- **12** are entirely zero;
- only **4** exactly duplicate the immediately preceding 33 bytes.

As signed 8-bit byte sequences they are usually smooth/low-amplitude near the boundary:

- median absolute signed boundary delta: **1**
- boundary delta `<= 5`: **279/308**
- boundary delta `<= 10`: **293/308**
- median excluded-region signed RMS: **2.1742180581**
- median immediately preceding 33-byte signed RMS: **2.7024061257**
- excluded-region RMS `<= 5`: **239/308**
- excluded-region RMS `<= 10`: **278/308**
- excluded-region RMS `> 20`: **15/308**
- median adjacent signed delta inside excluded region: **0.90625**
- median adjacent signed delta in immediately preceding region: **0.984375**

The four exceptional files' final 33-byte windows are also ordinary waveform-shaped byte sequences rather than a distinct structural signature:

- `gong.u8`: RMS **0.5773502692**
- `liu-kang.u8`: RMS **1.1806521054**
- `thunder.u8`: RMS **10.4097856060**
- `thundsht.u8`: RMS **0.6513389473**

In those four files, 32 of those final 33 bytes are inside the mixer-readable interval; only the final byte is excluded. This is an important falsification result: **byte-shape alone cannot be used to decide whether a tail is playable**.

The data are compatible with PCM-like waveform continuation, but that is only a byte-shape observation. O94C does not assign semantic ownership or authoring intent to the 33-byte normal tails.

## O94C decision

**VERIFIED, bounded:**

- there are exactly two `.U8 +0x04` encoding populations in the canonical MK2 corpus;
- 308 files encode `end = payloadBytes - 1`;
- four named files encode `end = fileBytes - 1`;
- actual mixer-unread file bytes are **33 vs 1**, respectively;
- all 312 loop fields are zero;
- one-, two-, and four-channel authenticated software mixer paths test the end threshold before sample dereference;
- therefore the observed mixer does not require or consume the normal 33-byte trailing region as an over-read guard;
- a fixed metadata/footer interpretation is rejected;
- byte statistics alone cannot classify playable vs non-playable tail data.

**Still UNKNOWN / blocked:**

- why the asset corpus contains two authoring/end-field conventions;
- why the 308-file convention carries 33 mixer-unread bytes;
- whether those bytes are deliberate source/converter residue, padding, preserved waveform continuation, or another authoring artifact;
- exact PCM export timing/rate contract;
- WAV conversion.

`wavAdapterAuthorized = false`.

## Mechanical validation

Project implementation:

- `src/games/mk2/research/u8TailRoleAudit.ts`
- `scripts/run-mk2-u8-o94c-tail-role-audit.mjs`
- evidence: `evidence/mk2/mk2_u8_o94c_tail_role_audit.json`

Independent implementation that does not import the TypeScript pass:

- `scripts/verify-mk2-u8-o94c-tail-role-audit.py`
- evidence: `evidence/mk2/o94c-independent-audit.json`

Authentic-fixture results:

- TypeScript O94C: **SUCCESS**
- independent Python audit: **17 checks, 0 failures**
- canonical U8 count: **312**
- encoding partition: **308 / 4 / 0 other**
- mixer-unread partition: **308 x 33 bytes / 4 x 1 byte**
- WAV adapter authorized: **false**

## Next pass

**O94D — PCM export contract qualification**

O94D should now focus on the remaining items required for a defensible WAV export:

1. authenticate signedness across the actual mixer paths;
2. trace the `+0x10` / `+0x12` sample-rate and pitch fields through sample-start/step calculation;
3. establish how the runtime step corresponds to the source sample rate under the canonical output mode(s);
4. decide whether a WAV can faithfully represent the source interval `[+0x00, +0x04)` at an established rate;
5. only then authorize deterministic WAV generation.

Do not use the visual smoothness of the trailing bytes to expand the export range beyond the runtime end threshold.
