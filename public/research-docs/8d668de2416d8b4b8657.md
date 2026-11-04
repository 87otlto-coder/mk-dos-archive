# MK DOS Archive — O95T bounded identity-copy provenance audit

**Date:** 2026-10-08 (SAST)  
**Game:** Mortal Kombat II DOS  
**Status:** VERIFIED / MK2 RESEARCH REMAINS OPEN

## Question and scope

O95T follows the 12 O95F `COPY_OR_DYNAMIC` executable writes to current/related object identity field `+0x46`. O95F proved 24 qualified write sites: 12 immediate-constant writers and 12 other writers. O95T checks only the latter twelve and asks **where the assigned value came from immediately before the write**, not which animation a numeric fighter identity represents.

Original MK2 executable SHA-256: `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.

## Results

All 12 previously source-unclassified write sites have an exact adjacent producer instruction and executable-backed local source provenance:

- **10 `OBJECT_FIELD_COPY`**: the value comes from another object's `+0x46` field, sometimes reached through temporary globals `0x75A7C` / `0x75A80`, or an object pointer at `[ESI+0x28]`.
- **2 `GLOBAL_SCALAR_TO_IDENTITY`**: `0x7B1AA` and `0x85C73` load the value from the shared global `0x75A78` and write it into object `+0x46`. At `0x7B1AA` the bounded local path restores `0x75A78` from an EBP stack slot; at `0x85C73` the write follows helper `0x86ADF` and a global load. These are global-to-identity assignments, **not proof of an animation pointer** or a fixed numeric slot.

| Write physical | Local source | Target | Source class |
|---|---|---|---|
| `0x67A11` | `[EDI+0x46]` | `[EBX+0x46]` | Object copy |
| `0x7B1AA` | global `0x75A78` | `[EDI+0x46]` | Shared cursor/scalar global |
| `0x7BCA5` | `[EBX+0x46]` | `[EDI+0x46]` | Object copy |
| `0x8399B` | `[EAX+0x46]`, EAX from `0x75A7C` | `[EDI+0x46]` | Object copy |
| `0x845BA` | `[EAX+0x46]`, EAX from `0x75A80` | `[EDI+0x46]` | Object copy |
| `0x85C73` | global `0x75A78` | `[EDI+0x46]` | Shared cursor/scalar global |
| `0x95237` | `[EAX+0x46]`, EAX from `0x75A7C` | `[EDI+0x46]` | Object copy |
| `0x95D57` | `[EAX+0x46]`, EAX from `0x75A7C` | `[EDI+0x46]` | Object copy |
| `0x960A2` | `[EDI+0x46]`, EDI from `0x75A80` | `[EBX+0x46]` | Object copy |
| `0x96228` | `[EAX+0x46]`, EAX from `[ESI+0x28]` | `[EDI+0x46]` | Object copy |
| `0x971A8` | `[EAX+0x46]`, EAX from `0x75A7C` | `[EDI+0x46]` | Object copy |
| `0x97F2B` | `[EDI+0x46]` | `[EAX+0x46]`, EAX from `0x75A7C` | Object copy |

**Boundary:** these are *local executable instruction data flows*, not interprocedural numerical identity propagation theorems. An inherited object identity is not numerically determined solely because an exact copying instruction exists. A use of `0x75A78` as a scalar does not establish the global's value at all callers or turn it into an animation cursor in that context.

## Validation

- Authentic-fixture JS producer: **PASS**; all twelve machine source/load/store contexts authenticated.
- Independently authored Python verifier: **242 checks / 0 failures**; decodes source/destination register fields independently and checks source classes, earlier O95F site census, exact byte intervals and hashes.
- Falsification controls: **3 rejected / 3**, deliberately inventing a numeric identity, changing a global source into an object source, or falsely increasing bounded sequences to eight.
- Fresh authentic-fixture O69 graphics report reproduced **94 exact-full resources**, **3,790 descriptors**, and resource-list hash `9aa22c45ee43598ddb9c030c7d1c6e8bcb40b7b8f237ded2c5749f4f4cb4353c`.
- Fresh O95S rerun against regenerated O69 report and independent verifier: **27,245 checks / 0 failures**. The regenerated O69 file hash is not the frozen O95S report's historical input hash, so the regression producer and verifier use a *paired new output in a separate directory*, without mutating O95S's historical evidence.
- O95Q/R regression: **37,639 checks / 0 failures**; O95P regression: **877 checks / 0 failures**.

Run O95T:

```bash
node scripts/run-mk2-o95t-identity-copy-provenance.mjs <original-mk2-fixture-directory> <output-directory>
python scripts/verify-mk2-o95t-identity-copy-provenance.py <original-MK2.EXE> mk2_animation_fixed_identity_provenance_expansion_o95f_2026-10-07.json <O95T-report.json> <source-root>
```

## Changed artifacts

- `scripts/run-mk2-o95t-identity-copy-provenance.mjs`
- `scripts/verify-mk2-o95t-identity-copy-provenance.py`
- `mk2_animation_identity_copy_provenance_o95t_2026-10-08.json`
- `CHECKPOINT_2026-10-08_O95T.md`
- authoritative handoff and documentation authority markers

## Coverage and next pass

**No eighth fixed-identity animation is claimed.** Existing sequence witnesses **7**, terminal qualified lookups **210/253**, strong consumers **239/253**, held **14**. Seven O95P animation/exportability obligations and stage, palette, GRA, and non-MID audio closure areas remain open.

**O95U candidate:** narrowly test whether any **object-field copy source** can be connected through executable control-flow to a prior immediate identity write and a later selected-pointer consumer. Do not cross-product object slots or treat mere copy-chain shape as numeric identity. If no short bounded executable join exists, pivot to remaining MK2 palette selector contexts or stage reconstruction instead of repeated ancestry guesses.

Mandatory user sequence: **finish MK2 → finish MK1 → finish MK3 → UI/usability discussion → extractor design/implementation**.
