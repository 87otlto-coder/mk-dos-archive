# MK DOS Archive — Handoff — Pass 1E.3O.9 Heart-Rip Structural Growth / Relocation Census

Date: 2026-09-27

## Status

**VERIFIED — canonical-fixture relocation census completed; no binary mutation performed.**

Pass 1E.3O.9 is a read-only relocation census. It does not relocate or write any record. Its bounded question is whether the already-qualified Kano heart-rip `heart_2` multi-part frame can mechanically accept a fourth part, whether it can grow in place, and what reference/storage evidence must exist before a future relocation writer can be enabled.

O8 is authoritative and CLOSED as VERIFIED. O9 consumes the O8 model but does not reopen O8 authoring or the unrelated collision/hit-detection branch.

---

## 1. Canonical fixture contract

Canonical `MK1.EXE`:

- size: **1,157,222 bytes** (`0x0011A866`)
- SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`

O9 fresh-reads and hashes the complete executable before producing an authoritative report. Synthetic or modified fixtures fail closed.

---

## 2. Proven prerequisite facts

From verified O2/O8:

- `MSU_HEART` allocates **4 linked part objects**;
- qualified record grammar is `[descriptor pointer 0, descriptor pointer 1, ... , 0]`;
- `heart_2` is `[KHEART3A, KHEART3B, KHEART3C, 0]`;
- `heart_2` Watcom offset: `0x0000B254`;
- `heart_2` current part count: **3**;
- O8 keeps topology read-only and verifies all 22 bounded semantic regions losslessly.

Therefore one additional structural part is mechanically within the already-established linked-object capacity. This is a grammar/capacity observation only; it does not itself authorize a binary write.

---

## 3. Independently precomputed growth boundary

The canonical O8 model supplied by the user was independently read before O9 implementation closeout.

Derived directly from that model:

- `heart_2` current record size: `(3 pointers + terminator) × 4 = 16 bytes`;
- four-part record size: `(4 pointers + terminator) × 4 = 20 bytes`;
- additional bytes required: **4**;
- `heart_2` range: `0xB254..0xB264` exclusive;
- next record `heart_3` begins exactly at `0xB264`;
- bytes available for in-place growth: **0**.

Result: **in-place part-count growth is rejected before any writer is considered.** A fourth part requires relocation or another separately qualified structural representation.

---

## 4. Qualified inbound reference known before whole-file census

O8's semantic IR contains one qualified inbound reference to `heart_2`:

- sequence: `PRIMARY`;
- sequence frame index: `2`;
- sequence cell Watcom offset: `0x0000B224`;
- physical EXE offset: `0x00097C78` (`621688` decimal);
- stored value: `0x0000B254`.

This is the known semantic pointer cell. O9 additionally scans the complete executable for the same dword value, but raw numeric equality elsewhere remains only a raw occurrence until independently qualified.

---

## 5. New O9 research module

Added:

`src/games/mk1/research/heartRipRelocationCensus.ts`

Report format:

`mk1_heart_rip_relocation_census_v1`

The module:

1. requires a successful canonical O8 model;
2. fresh-reads and hashes canonical `MK1.EXE`;
3. probes the LE executable layout;
4. re-enumerates Watcom permanent debug classes;
5. validates the `heart_2` 3→4-part mechanical capacity;
6. proves zero in-place growth bytes;
7. derives every structured O8 sequence-cell reference to each of the seven qualified frame records;
8. scans the whole executable byte-by-byte for raw little-endian dword equality with each frame-record Watcom value;
9. classifies each raw hit by physical executable region and whether it is one of the already-qualified semantic cells;
10. records the `MA_KHEART` → `MSU_HEART` same-segment symbol context;
11. scans only runtime-addressable, file-backed LE Object 2 regions for zero runs of at least 20 bytes;
12. annotates each zero run with nearest same-segment Watcom symbols and known-O8-region overlap;
13. deliberately marks every zero run `UNQUALIFIED_ZERO_RUN_ONLY` and `safeForRelocation: false`;
14. exports no writer and performs no binary mutation.

---

## 6. Epistemic boundary

O9 preserves these distinctions:

- grammar capacity ≠ writable topology;
- raw dword equality ≠ pointer identity;
- zero bytes ≠ free space;
- absence of a Watcom symbol ≠ unowned storage;
- physical file space ≠ runtime-addressable object storage;
- runtime-addressable Object 2 bytes ≠ safely allocatable bytes;
- one known semantic inbound reference ≠ proof that no other consumer exists until the whole-file census is examined;
- relocation feasibility ≠ relocation writer.

No candidate range is promoted to safe storage in O9, regardless of zero-run length.

---

## 7. O9 UI / pipeline integration

Added:

`src/components/HeartRipRelocationCensusPanel.tsx`

The quick research pipeline is now **18 stages**. Stage 18 runs the read-only O9 census after O8 and exports:

`mk1_heart_rip_relocation_census_<timestamp>.json`

The panel reports:

- 3→4 part capacity;
- 16→20 byte record growth;
- in-place slack;
- qualified inbound count;
- raw whole-EXE dword match count;
- unexplained raw-equality count;
- number of Object-2 zero-run candidates;
- number promoted safe (**always 0 in O9**).

---

## 8. Smoke command

Added:

`scripts/run-heart-rip-relocation-census.mjs`

Package command:

```bash
npm run smoke:heart-rip-relocation-census -- /path/to/mk1 /path/to/evidence
```

The smoke executes the authentic prerequisite chain through O8, runs O9, and requires:

- O9 `SUCCESS`;
- all O9 checks passed;
- current parts = 3;
- maximum linked objects = 4;
- grown record bytes = 20;
- in-place slack = 0;
- in-place growth false;
- exactly one qualified target semantic inbound cell;
- that cell present in the raw whole-file scan;
- no storage candidate promoted safe;
- no relocation writer established.

---

## 9. Source-level validation completed in this environment

- `heartRipRelocationCensus.ts` targeted TypeScript under project compiler settings: **passed**;
- `HeartRipRelocationCensusPanel.tsx` targeted TypeScript with existing local React declarations: **passed**;
- modified `ResearchQuickActions.tsx` full integration path targeted TypeScript with existing local React/lucide declarations: **passed**;
- `node --check scripts/run-heart-rip-relocation-census.mjs`: **passed**;
- `package.json` / `metadata.json`: structurally valid;
- canonical O8 JSON independently confirms: max linked objects 4, `heart_2` 16 bytes, next record exactly at current end, zero in-place slack, and the PRIMARY[2] semantic inbound cell.

No full npm/Vite/Vitest run is claimed in this source snapshot because it contains no installed `node_modules`.

Direct O9 canonical-fixture execution is not claimed here because raw canonical `MK1.EXE` is not materializable in this chat runtime. The user's browser source can execute the census directly against the untouched installation.

---

## 10. Expected O9 classification

If direct canonical execution passes, the intended bounded verdict is:

`FOURTH_PART_MECHANICALLY_SUPPORTED_IN_PLACE_GROWTH_BLOCKED_RELOCATION_SITE_UNQUALIFIED`

This is a successful research result, not a failure: it establishes why arbitrary add-part authoring must remain disabled and narrows the next structural problem to storage qualification plus controlled pointer rewrite.

Do **not** enable a relocation/add-part writer merely because O9 finds one or more long zero runs.

---

## 11. User interaction needed to close O9

Use the O9 source build with the untouched canonical MK1 directory.

1. Run **What's Needed** through 18/18.
2. Confirm the new **Heart-rip structural growth / relocation census · 1E.3O.9** panel appears.
3. Click **Export Latest**.
4. Return the generated `mk1_heart_rip_relocation_census_*.json`.

No coordinate edit, EXE compilation, bundle download, DOSBox test, or gameplay interaction is required for O9.

After the returned report is independently reconciled, update this handoff to VERIFIED or FAILED/UNRESOLVED and persist it to the project source area.

---

## 12. Canonical-fixture closeout — 2026-09-27

**Final O9 census status: VERIFIED.**

User-returned artifact:

`mk1_heart_rip_relocation_census_2026-09-27T13-05-42-999Z.json`

Canonical provenance:

- source kind: authentic user-loaded directory;
- `MK1.EXE` size: **1,157,222 bytes**;
- SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`;
- synthetic: false;
- O8 prerequisite: successful.

Direct target result:

- `heart_2` Watcom offset: `0x0000B254`;
- current parts: **3**;
- preallocated linked objects: **4**;
- current observed zero-terminated record size: **16 bytes**;
- hypothetical four-pointer-plus-zero form: **20 bytes**;
- additional bytes required for that form: **4**;
- next qualified structure begins exactly at `0x0000B264`;
- in-place slack after the current 16-byte record: **0**.

Whole-executable reference census:

- qualified semantic inbound references to `heart_2`: **1**;
- qualified inbound physical cell: `0x00097C78`;
- raw whole-EXE occurrences of `0x0000B254`: **1**;
- unexplained raw occurrences for the target: **0**;
- all qualified target inbound cells were found by the independent raw scan.

Across all seven frame-record values, one additional raw equality was found for `heart_3` at physical `0x0005BCAF`. It is unaligned, lies in LE Object 1 code, and is not a qualified semantic inbound cell. It remains a numeric coincidence only and is not promoted to pointer identity.

Storage reconnaissance:

- runtime-addressable Object-2 zero runs large enough for 20 bytes: **14**;
- candidates promoted safe: **0**;
- every candidate remains `UNQUALIFIED_ZERO_RUN_ONLY`;
- largest observed candidate: 197 bytes at physical `0x0009F3DF`, between the named `GORO_ANITAB` / `MSU_GORO` symbol context, still not qualified free storage;
- post-module tail length: 453,735 bytes, but it is not promoted as runtime-addressable relocation storage by O9.

Validation:

- O9 report status: `SUCCESS`;
- all **11/11** O9 checks passed;
- no relocation writer was enabled;
- no topology writer was enabled;
- original installation was not modified by the census.

Verified bounded verdict:

`FOURTH_PART_MECHANICALLY_SUPPORTED_IN_PLACE_GROWTH_BLOCKED_RELOCATION_SITE_UNQUALIFIED`

### Important refinement before the next writer pass

O9's measured storage facts are verified. However, the phrase **"relocation required"** is conditional on the current O2 representation rule that a four-part frame must still carry a trailing zero dword after its fourth descriptor.

The already-qualified runtime setup allocates exactly four linked part objects. The next research question must therefore inspect `RESHAPE_MULTI` control flow to determine whether, at full four-object occupancy, the consumer exits when the linked-object chain ends **before attempting to read a fifth/terminator dword**.

If that is mechanically established, a full-capacity frame may fit in the existing 16-byte `heart_2` allocation as four descriptor pointers with no trailing zero, and relocation would not be required for the bounded fourth-part case.

Therefore:

- do **not** begin allocator/free-space qualification yet;
- do **not** enable relocation;
- do **not** write a fourth part yet;
- first qualify full-capacity termination semantics.

Recommended next pass:

**1E.3O.10 — RESHAPE_MULTI Full-Capacity Termination Semantics**

This pass should be read-only and decide whether four linked objects permit a 16-byte four-pointer record without reading beyond the record boundary.
