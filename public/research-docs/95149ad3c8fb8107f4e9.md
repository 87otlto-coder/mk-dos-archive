# MK DOS Archive — Handoff — Pass 1E.3O.11 Controlled Heart-Rip Fourth-Part Topology Write

Date: 2026-09-27

## Status

**IMPLEMENTED / SOURCE-LEVEL STATIC VALIDATION PASSED / DIRECT CANONICAL-FIXTURE EXECUTION PENDING**

Pass 1E.3O.11 is the first deliberately bounded topology-writing pass in the MK1 animation compiler path.

It follows the canonical-fixture VERIFIED O10 result:

`FULL_CAPACITY_CHAIN_EXHAUSTION_ESTABLISHED_FOURTH_PART_FITS_IN_PLACE`

O10 proved that when all four preallocated heart objects are occupied, `RESHAPE_MULTI` advances the linked-object chain after the fourth non-zero descriptor and returns when that chain is exhausted. It does not read a fifth descriptor dword. Therefore the existing 16-byte `heart_2` allocation can hold four descriptor pointers with no trailing zero.

O11 uses only that bounded fact. It does not generalize topology editing beyond the controlled fixture.

---

## 1. Canonical fixture contract

Canonical `MK1.EXE`:

- size: **1,157,222 bytes** (`0x0011A866`)
- SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`

Every O11 write fresh-reads and hashes the canonical executable. Synthetic or already-modified executable input is rejected.

The untouched installation is never overwritten in place.

---

## 2. Controlled topology change

Target frame:

- frame key: `heart_2`
- Watcom record offset: `0x0000B254`
- physical record start: `0x00097CA8`
- existing allocation: **16 bytes**

Canonical layout:

`[KHEART3A, KHEART3B, KHEART3C, 0]`

Controlled O11 layout:

`[KHEART3A, KHEART3B, KHEART3C, KHEART5B]`

Fourth slot:

- Watcom: `0x0000B260`
- physical EXE: `0x00097CB4`
- before dword: `0x00000000`
- after dword: `KHEART5B = 0x0001BC64`

The following `heart_3` record still begins at Watcom `0x0000B264` / physical `0x00097CB8` and must remain byte-identical.

Expected changed bytes for the controlled pointer write:

- `0x00097CB4`: `00 -> 64`
- `0x00097CB5`: `00 -> BC`
- `0x00097CB6`: `00 -> 01`
- `0x00097CB7` remains `00`

Expected whole-executable changed-byte count: **3**.

---

## 3. Why `KHEART5B`

O11 deliberately reuses an already-qualified descriptor rather than introducing new descriptor or pixel storage.

`KHEART5B` is already part of the verified O8 heart-rip model:

- descriptor Watcom offset: `0x0001BC64`;
- File ID 2 / `GRAPHICS/MISC.GRA`;
- uGRA decode successful;
- `BLOOD_P` palette fit successful;
- existing use in the heart-rip beat loop.

O11 changes only one frame-record pointer. It does not edit the `KHEART5B` descriptor itself.

---

## 4. New bounded serializer extension

Added:

`src/games/mk1/research/heartRipFourthPartTopologyWriter.ts`

New report format:

`mk1_heart_rip_fourth_part_topology_edit_v1`

O2's `serializeMK1BoundedAnimationIr` remains unchanged and authoritative for established under-capacity pointer-list + zero encoding.

O11 adds a bounded wrapper:

`serializeMK1HeartRipFourthPartIr`

It:

1. requires `heart_2` to contain exactly four structural parts;
2. requires `maxPartObjects === 4`;
3. requires structural indices `0..3` with no gaps;
4. uses the O2 serializer for every other qualified semantic region;
5. encodes only `heart_2` as exactly four descriptor dwords / 16 bytes;
6. emits no trailing zero for that O10-qualified full-capacity record;
7. rejects any change in allocation size.

This does not alter the O2 grammar globally. It is an explicit O10-qualified bounded extension.

---

## 5. Controlled writer contract

`executeHeartRipFourthPartTopologyWrite`:

1. requires successful canonical O8 and O10 prerequisites;
2. fresh-reads and hashes canonical `MK1.EXE`;
3. reruns the O8 no-edit 22-region semantic round trip and requires zero mismatch / canonical hash;
4. verifies canonical `heart_2` is exactly `KHEART3A/B/C` plus zero;
5. verifies `KHEART5B` remains an already-qualified decoded descriptor with no palette-range failure;
6. verifies the O10 fourth-slot identity and current zero dword;
7. clones the semantic IR and appends `KHEART5B` as structural index 3;
8. serializes through the O11 bounded full-capacity serializer;
9. independently calculates expected changed bytes from `0x00000000 -> 0x0001BC64`;
10. diffs the entire executable and requires actual changes to equal that expected set exactly;
11. reparses the fourth dword and requires `0x0001BC64`;
12. requires the following `heart_3` record to remain byte-identical;
13. reverses only the observed diff bytes;
14. requires exact canonical SHA-256 restoration.

---

## 6. Deliberate safety boundary

Still unsupported and fail-closed:

- arbitrary descriptor selection for newly added parts;
- adding a fifth object;
- increasing `MSU_HEART` object count;
- removing parts;
- inserting parts into under-capacity records generically;
- frame-record allocation growth;
- relocation/free-space allocation;
- sequence-pointer rewrite;
- descriptor relocation;
- width/height editing;
- packed GRA-reference editing;
- uGRA pixel encoding/replacement;
- palette changes;
- collision/contact/world coordinates;
- velocity, damage or gameplay/input changes.

O11 proves one controlled existing-storage topology mutation, not a generic animation topology compiler.

---

## 7. UI / runtime bundle

Added:

`src/components/HeartRipFourthPartTopologyPanel.tsx`

The panel reports:

- before/after semantic frame topology;
- exact fourth-slot location;
- unchanged 16-byte allocation;
- chain-exhaustion termination;
- changed-byte / unexpected-byte result;
- semantic reparse;
- exact reversal;
- runtime status.

It can produce an isolated runtime-test ZIP containing:

- edited `MK1.EXE`;
- exact O11 report;
- test instructions.

Runtime expectation:

During the qualified three-part heart burst frame, the fourth linked heart object should display `KHEART5B`. The rest of the heart-rip sequence should remain structurally unchanged.

Runtime is not claimed until directly observed.

---

## 8. Pipeline integration

The research quick-run pipeline is now **20 stages**.

Stage 20:

`1E.3O.11 — Compiling controlled heart-rip fourth-part topology write`

The final exported artifact is:

`mk1_heart_rip_fourth_part_topology_edit_<timestamp>.json`

Package smoke command:

`npm run smoke:heart-rip-fourth-part-topology -- <MK1_DIRECTORY> <OUTPUT_DIRECTORY>`

---

## 9. Source-level validation performed

Completed before packaging:

- O11 core targeted TypeScript under the project's compiler contract: **passed**;
- O11 panel targeted TypeScript with local React/lucide declarations: **passed**;
- modified `ResearchQuickActions.tsx` full integration path targeted TypeScript: **passed**;
- `node --check scripts/run-heart-rip-fourth-part-topology.mjs`: **passed**;
- `package.json` and `metadata.json` parse: **passed**;
- source delta against untouched O10 snapshot: **clean** — four O11 additions plus the expected O10 closeout / quick-run / metadata / docs changes only;
- pipeline numbering: **20/20** present; no duplicated reset state remains.

The present execution environment does not have the canonical installation bytes available to the source process, so direct O11 canonical-fixture execution is not claimed. That step remains pending until this O11 build runs against the user's untouched installation.

---

## 10. Closeout criteria

O11 can be statically VERIFIED if the returned canonical report establishes:

- source SHA-256 canonical;
- O10 prerequisite verified;
- no-edit round trip mismatch 0;
- before topology exactly 3 parts + zero;
- after topology exactly 4 pointers with `KHEART5B` in slot 3;
- allocation remains 16 bytes;
- changed-byte count exactly 3;
- unexpected byte changes 0;
- semantic reparse matches `KHEART5B`;
- following `heart_3` remains unchanged;
- no relocation / sequence rewrite;
- exact reversal to canonical SHA-256.

Because this is the first structural add-part mutation, runtime observation of the generated bundle is strongly useful after static closeout, but should be recorded separately from compiler byte-correctness.
