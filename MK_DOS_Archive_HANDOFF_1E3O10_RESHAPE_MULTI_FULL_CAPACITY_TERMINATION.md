# MK DOS Archive — Handoff — Pass 1E.3O.10 RESHAPE_MULTI Full-Capacity Termination Semantics

Date: 2026-09-27

## Status

**VERIFIED — canonical-fixture control-flow qualification completed; full-capacity chain exhaustion established.**

Pass 1E.3O.10 is a read-only control-flow qualification. It follows the verified O9 relocation census but deliberately does **not** begin storage allocation research yet.

O9 verified that `heart_2` has zero slack for a conventional four-pointer-plus-zero representation. O10 tests the remaining assumption behind that conclusion: whether `RESHAPE_MULTI` actually requires a fifth/terminator dword after the fourth descriptor when all four preallocated linked objects are occupied.

No binary write, part addition, pointer rewrite, relocation, allocation, pixel edit, palette edit, collision research or gameplay edit is performed in O10.

---

## 1. Canonical fixture contract

Canonical `MK1.EXE`:

- size: **1,157,222 bytes** (`0x0011A866`)
- SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`

O10 fresh-reads and hashes the executable before producing an authoritative report.

Prerequisites:

- O8 full heart-rip fixed-layout editor: verified;
- O9 structural growth / relocation census: verified as a read-only census;
- `MSU_HEART` linked-object capacity: 4;
- `heart_2`: 3 descriptors + current zero dword in 16 bytes.

---

## 2. Why this pass precedes relocation qualification

O9 measured:

- `heart_2` start: `0xB254`;
- current bytes: 16;
- current zero dword: `0xB260`;
- following `heart_3` starts: `0xB264`;
- slack after the current record: 0 bytes.

A four-descriptor **plus trailing zero** form would therefore need 20 bytes and cannot fit in place.

However, the runtime setup already has exactly four linked objects. If `RESHAPE_MULTI` advances the linked-object chain after processing a non-zero descriptor and returns when that chain is exhausted, then a maximum-capacity frame does not need another descriptor read after object 4. In that case four descriptor pointers occupy exactly the existing 16-byte record and the current zero slot becomes descriptor pointer 4.

This pass qualifies that consumer behavior directly.

---

## 3. New O10 research module

Added:

`src/games/mk1/research/reshapeMultiFullCapacitySemantics.ts`

Report format:

`mk1_reshape_multi_full_capacity_semantics_v1`

The module:

1. requires successful canonical O8 + O9 prerequisites;
2. fresh-reads canonical `MK1.EXE`;
3. resolves exact Watcom symbols `RESHAPE_MULTI` and `NULL_IMAGE`;
4. re-qualifies the O2 descriptor-load sequence;
5. resolves the non-zero descriptor branch around the NULL_IMAGE padding path;
6. resolves the normal-path linked-object `+0x04` advance;
7. resolves the linked-object null test;
8. resolves the loop branch target and requires it to return exactly to the descriptor load;
9. follows chain-exhaustion fallthrough to the first return instruction;
10. requires no further descriptor load before that return;
11. re-reads the current `heart_2` zero dword at `0xB260`;
12. confirms `heart_3` still starts at `0xB264`;
13. exports no writer.

---

## 4. Bounded decision contract

If direct canonical execution establishes all control-flow checks, the refined grammar becomes:

- under-capacity frame: descriptor pointers terminate early with zero, then `NULL_IMAGE` pads remaining linked objects;
- full-capacity frame: descriptor consumption may terminate by **linked-object chain exhaustion** after the final object, without reading a fifth dword.

For the controlled heart fixture this would establish:

- maximum objects: 4;
- full-capacity descriptor record: 4 dwords = **16 bytes**;
- existing terminator dword `0xB260` can become descriptor pointer 4;
- following record at `0xB264` remains unchanged;
- bytes of growth required: **0**;
- sequence pointer remains unchanged;
- relocation not required for this bounded 3→4-part case.

Expected successful verdict:

`FULL_CAPACITY_CHAIN_EXHAUSTION_ESTABLISHED_FOURTH_PART_FITS_IN_PLACE`

This would supersede O9's **conditional** relocation requirement for this specific maximum-capacity edit only. It would not establish generic arbitrary frame growth.

---

## 5. O10 UI / pipeline integration

Added:

`src/components/ReshapeMultiFullCapacitySemanticsPanel.tsx`

The quick research pipeline is now **19 stages**. Stage 19 runs after O9 and exports:

`mk1_reshape_multi_full_capacity_semantics_<timestamp>.json`

The panel reports:

- descriptor-loop branch address and target;
- whether the loop returns to the descriptor load only when another linked object exists;
- fallthrough return address;
- whether chain exhaustion returns before another descriptor read;
- the existing `heart_2` terminator slot;
- whether a bounded fourth pointer fits without relocation.

---

## 6. Smoke command

Added:

`scripts/run-reshape-multi-full-capacity.mjs`

Package command:

```bash
npm run smoke:reshape-multi-full-capacity -- /path/to/mk1 /path/to/evidence
```

The smoke rebuilds the authentic prerequisite chain through O9, executes O10, and requires:

- O10 `SUCCESS`;
- all O10 checks passed;
- loop branch targets the descriptor load;
- chain exhaustion falls through to return before another descriptor read;
- current record bytes = 16;
- full-capacity record bytes = 16;
- current terminator value = 0;
- fourth pointer can occupy the existing terminator dword;
- growth bytes = 0;
- relocation required for bounded fourth part = false;
- topology writer remains disabled.

---

## 7. Source-level validation completed here

- `reshapeMultiFullCapacitySemantics.ts` targeted TypeScript under project compiler settings: **passed**;
- `ReshapeMultiFullCapacitySemanticsPanel.tsx` targeted TypeScript with existing local React declarations: **passed**;
- modified `ResearchQuickActions.tsx` full integration path targeted TypeScript: **passed**;
- `node --check scripts/run-reshape-multi-full-capacity.mjs`: **passed**;
- `package.json` / `metadata.json`: structurally valid;
- pipeline count updated to 19 stages;
- no writer/export path that mutates `MK1.EXE` was added.

Direct canonical O10 execution is not claimed in this source environment because canonical raw fixture bytes are not materializable here. The browser source can execute the pass against the untouched installation.

---

## 8. User interaction needed to close O10

Use the O10 source build with the same untouched canonical MK1 directory used for O8/O9.

1. Run **What's Needed** through **19/19**.
2. Confirm **RESHAPE_MULTI full-capacity termination semantics · 1E.3O.10** appears.
3. Click **Export Latest**.
4. Return `mk1_reshape_multi_full_capacity_semantics_*.json`.

No edits, compile, runtime bundle or DOSBox test are required for O10.

If the returned control-flow report passes, O10 can close VERIFIED and the next bounded writer pass can test an actual fourth descriptor pointer **without relocation**.

---

## Canonical-fixture closeout — 2026-09-27

**Final status: VERIFIED.**

User-returned artifact: `mk1_reshape_multi_full_capacity_semantics_2026-09-27T13-21-05-200Z.json`.

Canonical fixture identity:

- `MK1.EXE` size: 1,157,222 bytes;
- SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`;
- authentic user-loaded source; synthetic false.

Direct `RESHAPE_MULTI` result:

- descriptor load: physical `0x00067225`;
- descriptor pointer advances by four bytes;
- zero descriptor enters the existing `NULL_IMAGE` padding path;
- non-zero path advances linked object `+0x04`;
- linked-object test branches back to the descriptor load only when another object exists;
- when the linked-object chain is exhausted, execution falls through to `RET` at `0x0006724D`;
- there is no further descriptor load before that return.

Bounded heart implication:

- current `heart_2`: 3 descriptors + zero = 16 bytes;
- maximum linked objects already allocated: 4;
- current zero slot: Watcom `0x0000B260`, physical `0x00097CB4`;
- full-capacity record: four descriptor dwords = 16 bytes;
- trailing zero at full capacity: not required;
- growth bytes required: 0;
- relocation required for this bounded fourth part: false.

All **10/10** O10 validation checks passed. No writer was enabled by O10.

Verified verdict:

`FULL_CAPACITY_CHAIN_EXHAUSTION_ESTABLISHED_FOURTH_PART_FITS_IN_PLACE`

This supersedes O9's bounded relocation requirement for this specific four-object heart fixture only. O9's relocation/storage census remains valid evidence for cases that genuinely require record growth.
