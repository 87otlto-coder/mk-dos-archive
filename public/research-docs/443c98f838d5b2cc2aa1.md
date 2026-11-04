# MK DOS Archive — O95S Fixed-Identity Stream Recovery Across Identity Reassignment

**Date:** 2026-10-08 (SAST)  
**Game:** Mortal Kombat II DOS  
**Status:** VERIFIED / MK2 ANIMATION RESEARCH REMAINS OPEN

## Canonical source and scope

O95S continues from O95Q/O95R and uses the genuine MK2 fixture `MK2.EXE` with SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`. It revisits two O95F constant-identity caller intervals formerly not promoted because the object identity is rewritten **after** Family-A selection.

**Key distinction:** the lookup at `0x918F1` reads the object's `+0x46` identity and writes the selected pointer into `0x75A78`. Rewriting object `+0x46` later does **not** retroactively change that selected pointer. The bounded caller continuations do not overwrite `0x75A78` before entering the standard composition wrapper `0x86825`, which calls `0x63E79`.

This is a **selected-pointer provenance** result, not evidence that an animation belongs to identity 6 or has any particular move name.

## Newly authenticated runtime-path witnesses

| Witness | Original selection | Later identity | Selected stream Object-2 | Structural sequence |
|---|---|---|---|---|
| `O95S_A_SLOT12_INDEX3_REASSIGN6` | A slot 12, index 3, call `0x95152` | slot 6 at `0x9515C` | `0x1313C` | 3 single-part `GO.GRA` compositions, raw token 0 |
| `O95S_A_SLOT12_INDEX13_REASSIGN6` | A slot 12, index 13, call `0x951C1` | slot 6 at `0x951CB` | `0x1307C` | 4 single-part `GO.GRA` compositions, raw token 0 |

For the index-3 route the exact authenticated code interval is `[0x95140, 0x95173)`, SHA-256 `112b2903b5c0c151da6a6de7d92d28a8afd3b3237dc9ad2bdd739c91a5f97232`.

For index-13 the exact interval is `[0x951AF, 0x951E2)`, SHA-256 `b444e51f8cd504f967b6a149bdc581f35c1bfef22b3e113d2b4bd1f723b3c324`.

Both code intervals explicitly write identity 12, write the literal index to cursor global `0x75A78`, call Family A `0x918F1`, **then** write identity 6, install the known wrapper argument `3` and jump directly to `0x86825`. The wrapper does not reselect; it enters the previously established `0x63E79` interpreter. The meaning of wrapper argument 3 remains unassigned as wall-clock time.

### Exact frame descriptors

**A slot 12 / index 3**, stream `0x1313C`:

| Order | Composition Object-2 | Descriptor Object-2 | GRA offset | Width × height | X, Y |
|---:|---:|---:|---:|---|---|
| 0 | `0x13158` | `0x2A730` | 279840 | 80×109 | 36, -10 |
| 1 | `0x13160` | `0x2A73C` | 285344 | 116×108 | 36, -13 |
| 2 | `0x13168` | `0x2A748` | 291928 | 127×108 | 34, -12 |

**A slot 12 / index 13**, stream `0x1307C`:

| Order | Composition Object-2 | Descriptor Object-2 | GRA offset | Width × height | X, Y |
|---:|---:|---:|---:|---|---|
| 0 | `0x13098` | `0x2A6A0` | 190904 | 118×104 | 56, -7 |
| 1 | `0x130A0` | `0x2A6AC` | 198720 | 102×108 | 47, -3 |
| 2 | `0x130A8` | `0x2A6B8` | 206276 | 89×125 | 35, 13 |
| 3 | `0x130B0` | `0x2A6C4` | 213940 | 86×136 | 33, 24 |

All seven descriptor records are authenticated source records in the independently regenerated O69 **exact-full** `GO.GRA` indexed graphics corpus. Composition arrays have one relocation-backed descriptor pointer followed by a raw zero. Both streams contain a raw zero token after their final composition pointer, establishing finite structural sequences.

## Coverage discipline

- Fixed numeric identity / index / stream / consumer bounded sequence examples: **5 → 7** (+2).
- New individually authenticated descriptor steps: **7**.
- The previously established 253 selected-pointer lookup **consumer coverage stays 210/253 terminal and 239/253 strong, with 14 held**. These two callsites already belonged to the prior terminal consumer census; O95S supplies previously missing *numeric identity → exact finite stream* joins, not two new consumer callsites.
- O95Q's historical five-witness report remains intact. O95S stores the two newly authenticated witnesses separately; do not falsify O95Q's original scope by modifying its frozen baseline.

## Validation

1. O95S producer reconstructed **27,004 LE relocation records** from original fixture and completed both exact source-to-renderer chains.
2. Independent Python verifier independently reconstructed all 27,004 relocations: **27,245 checks / 0 failures**.
3. Three deliberately corrupted O95S reports were **rejected**: falsified selection identity 6; altered `GO.GRA` descriptor offset; invented seven-to-eight total.
4. Regression verifiers: **O95Q/R 37,639/0; O95P 877/0; O95O 152/0**.
5. O69 corpus was freshly regenerated from authentic game files and matched its established exact-full-resource count **94**, descriptor count **3,790**, and resource-list hash `9aa22c45ee43598ddb9c030c7d1c6e8bcb40b7b8f237ded2c5749f4f4cb4353c`.

To reproduce O95S, first regenerate the O69 report using `node scripts/run-mk2-broad-indexed-census.mjs <original-mk2-fixture-directory> <report-directory>`. Then run:

```bash
node scripts/run-mk2-o95s-reassigned-identity-streams.mjs <original-mk2-fixture-directory> <o69-report.json> <output-directory>
python scripts/verify-mk2-o95s-reassigned-identity-streams.py <original-MK2.EXE> <o69-report.json> <o95s-report.json> <source-root>
```

## Boundary / next research

These are executable-connected structural routes. O95S does **not** claim an observed DOSBox gameplay event, a fighter or move identity, frame dwell/FPS, universal stream parser, complete animation coverage, or MK2 research closure. All seven O95P export obligations and the remaining stage, palette, graphics, and non-MID audio/music closure blockers stay open.

**Next bounded target O95T:** review remaining constant-identity and copy-identity paths for similarly exact pointer-preservation cases, but promote additional sequences only when identity origin, selected stream, consumer, termination, and graphic descriptor joins are independently proven. If no new executable-connected sequences are provable, pivot to the next MK2 extractor-relevant closure blocker instead of repeating speculative root combinations.

Project order remains **MK2 → MK1 → MK3 → UI/usability discussion → extractor implementation**.
