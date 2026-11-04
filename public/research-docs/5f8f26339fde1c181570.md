# MK DOS Archive — O94A MK2 U8 sample-start caller trace

**Date:** 2026-10-07 (SAST)  
**Base:** `MK-DOS-Archive-2026-10-07-O93-source.zip`  
**Status:** **AUTHENTIC-FIXTURE VERIFIED / INDEPENDENT AUDIT PASSED**  
**Scope:** caller chain only. Disk `+0x04` meaning, active PCM range and WAV conversion remain deliberately unresolved.

## Question for this pass

Trace the direct call path from MK2's `.U8` file read to the Sound Images sample-start routine and answer only:

> Does the authenticated direct caller path rewrite the loaded `.U8` header before the Sound Images driver consumes it?

O94A does **not** attempt to explain the 308/4 disk `+0x04` split.

## Authentic fixture identities

The pass was executed against the user-supplied authentic MK2 fixture. Required identities:

- `MK2.EXE` SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`
- `RM.DRV` SHA-256 `87d2d37bbd69a69d47e4bfc11a4a6495a8ac348cb7824ec1c9c59de3ed186546`
- `GMI.BIN` SHA-256 `7b0bc5261dd550ebac3764aabe3af27611cafee83827f60d796dea7918fc9633`
- `SCC.BIN` SHA-256 `7b0bc5261dd550ebac3764aabe3af27611cafee83827f60d796dea7918fc9633`

`SCC.BIN` and `GMI.BIN` are byte-identical and both exactly `0x1ACA` / 6,858 bytes.

## Established caller chain

### 1. MK2 installs SCC.BIN as the relevant Sound Images driver image

The canonical executable's object-1 code at VMA `0x11262` uses packed resource selector `0x39000000` through the resource lookup path at VMA `0x10A04` and paragraph/segment wrapper at VMA `0x11020`.

The lookup mechanism extracts the high byte as the resource-table index and masks the low 24 bits as the in-resource offset. `0x39` is decimal resource-pool ordinal **57**. O67's authenticated executable resource pool identifies ordinal 57 as **`SCC.BIN`**.

The install branch:

- writes the returned segment to `RM.DRV +0x16`;
- writes far-API offset `0` to `RM.DRV +0x14`;
- writes image length `0x1ACA` to `RM.DRV +0x18`;
- derives the sample-buffer segment stored at `RM.DRV +0x1E`.

The `0x1ACA` immediate exactly matches `SCC.BIN`/`GMI.BIN` size. This closes the prior gap between the RM far-call pointer and the actual Sound Images code image.

### 2. MK2 reads the `.U8` file directly into that sample buffer

At physical `MK2.EXE 0x815C9..0x81620`, the authenticated path:

- opens the selected file with DOS INT 21h;
- reads up to `0xFFFF` bytes;
- takes the destination segment from `[shared RM structure +0x1E]` and uses offset zero;
- closes the file;
- writes request word `1` to shared field `+0x30`;
- writes the volume/control value to shared field `+0x32`.

No instruction in this bounded post-read path writes into the loaded sample buffer.

### 3. RM.DRV routes request 1 to the sample-start far call

`RM.DRV 0x08D3` reads pending requests including `+0x30`. The router at `0x07CA` sends request value `1` to `0x0962`.

At `RM.DRV 0x0962` the driver:

- loads `ES` from `RM.DRV +0x1E`;
- sets `DI=0`;
- computes `CL` from `+0x32`;
- sets `AL=0`, `AH=0x11`;
- far-calls the pointer at `RM.DRV +0x14/+0x16`.

This path does not write the `.U8` buffer.

### 4. SCC/GMI dispatches AH=0x11 to sample-start `0x0F03`

The installed far API offset is zero. `SCC/GMI +0x0000` enters the dispatcher at `0x023D`. The dispatcher indexes a word table from `0x0268` using `AH*2`.

For `AH=0x11`, the word is at `0x028A`. In the authenticated SCC/GMI image that word is exactly **`0x0F03`**.

At `0x0F03`, the sample-start routine loads `DS` from passed `ES` and `SI` from passed `DI`. RM supplied `DI=0`, therefore the routine consumes the descriptor at the beginning of the buffer loaded by MK2.

## O94A decision

**VERIFIED for the bounded direct caller path:**

`MK2 DOS read -> RM.DRV request 1 -> installed SCC/GMI far API -> AH=0x11 dispatch -> GMI/SCC 0x0F03`

No header rewrite is present in that authenticated traced path between the DOS read and the sample-start entry.

This statement is intentionally bounded. O94A does **not** claim that unrelated code elsewhere can never touch the shared buffer. More importantly, it does not solve the disk-header `+0x04` discrepancy.

Still unresolved and intentionally blocked:

- semantic meaning of on-disk `+0x04`;
- whether any transformation outside the traced direct path explains the 308/4 split;
- exact active PCM byte range;
- WAV export/conversion.

`wavAdapterAuthorized = false`.

## Mechanical validation

Project implementation:

- `src/games/mk2/research/u8SampleStartCallerTrace.ts`
- `scripts/run-mk2-u8-o94a-caller-trace.mjs`
- evidence: `evidence/mk2/mk2_u8_o94a_sample_start_caller_trace.json`

Independent implementation that does not import the TypeScript pass:

- `scripts/verify-mk2-u8-o94a-caller-trace.py`
- evidence: `evidence/mk2/o94a-independent-audit.json`

Authentic-fixture results:

- TypeScript O94A: **SUCCESS**
- independent Python audit: **20 checks, 0 failures**
- resource-pool ordinal 57: `SCC.BIN`
- SCC/GMI byte identity: **true**
- AH `0x11` dispatch word: **`0x0F03`**
- header rewrite in traced caller path observed: **false**
- WAV adapter authorized: **false**

## Next pass

**O94B — `.U8 +0x04` field lifetime/transformation**

The sole next question is whether the `+0x04` value is consumed, compared, normalized or transformed anywhere relevant between sample descriptor entry and mixer state strongly enough to explain the 308/4 corpus split. O94B must not infer the answer from file lengths alone.
