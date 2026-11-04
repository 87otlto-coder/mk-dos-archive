# MK DOS Archive — O96G/O96H Renderer-Index Boundary and Control-Cursor Pointer-Pair Lists

**Date:** 2026-10-08 (SAST)  
**Game:** Mortal Kombat II DOS  
**Research status:** BOUNDED VERIFIED / MK2 RESEARCH REMAINS OPEN

## Authority and scope

Starting authority: `MK-DOS-Archive-2026-10-08-O96F-source.zip`, SHA-256 `952b5aaf87e9214dd7c2a8c3c1f64c03f7283f7ce6823e1872525f625fcb65f4`. Authentic original `MK2.EXE`: SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`. The original game fixture was read-only.

These passes separately investigate (1) exact direct machine operands and immediate continuations of the index writer, and (2) LE-relocation-backed Object-2 records that supply the control-cursor source global `0x75CF6`. Structural evidence is not promoted to guaranteed gameplay execution.

## O96G — bounded index-global direct-operand and post-writer continuations

Exact occurrence census of the DWORD address `0x7747F` within **file-backed Object 1**, physical `0x61C54..0xA0C54`, finds exactly two direct operand positions:

| Operand physical | Opcode | Authenticated local action |
|---|---|---|
| `0x82327` | `A3` | EAX stored to `[0x7747F]` in index writer `0x82321` |
| `0x9E166` | `A1` | EAX loaded from `[0x7747F]` in the O96A renderer at `0x9E165` |

This is an **exact-direct-address occurrence census**, not a proof that indirect aliases or memory writes cannot exist. It is not an interprocedural runtime-state join.

Each of the five O96F literal-writer callers is independently instruction checked through its immediate post-call action:

| Caller | Literal | Immediate continuation |
|---|---:|---|
| `0x771E6` | 7 | call `0x81455` |
| `0x77A08` | 6 | `MOV EDI,0x92CC` |
| `0x77D8B` | 5 | call `0x650CE` |
| `0x84EEE` | 30 | `POP DWORD PTR [0x75A80]` (the prior value was pushed at `0x84EDE`) |
| `0x85FAE` | 13 | `MOV EAX,5`, then later code continues |

The input 30 is demonstrably **temporary for source global `0x75A80`**, which is restored immediately after the writer call. The writer's independent store to `0x7747F` remains established on the local code path, but its persistence to any later row-renderer invocation is not authenticated.

Evidence: `mk2_index_global_direct_operand_and_postcaller_boundary_o96g_2026-10-08.json`. Producer: `scripts/run-mk2-o96g-index-producer-consumer-boundary.mjs`. Independent verifier: `scripts/verify-mk2-o96g-index-producer-consumer-boundary.py`. **65 checks / 0 failures**.

## O96H — static control-cursor source-list records

The exact address `0x75CF6` appears at eight code operand positions in file-backed Object 1: **five relocation-backed immediate pointer assignments**, one zero assignment, one dynamic value assignment from a dereferenced `[EAX]`, and one source read at `0x93500`. This is limited to these direct address occurrences.

Five `MOV EAX,imm32; MOV [0x75CF6],EAX` instruction pairs point to three distinct **file-backed Object-2** records. The immediate pointer operands are Type-7 LE relocations into Object 2:

| Source code physical | Object-2 record offset | Original serialized form |
|---|---|---|
| `0x80190` | `0x13CEC` | 10 pointer pairs + zero DWORD |
| `0x805C4` | `0x1410C` | 4 pointer pairs + zero DWORD |
| `0x84C90` | `0x15D60` | 10 pointer pairs + zero DWORD |
| `0x9882D` | `0x15D60` | same record |
| `0x98A4A` | `0x15D60` | same record |

All **48 pointer DWORDs in 24 pair instances** independently match type-7 Object-2 relocations. The paired values reference unbacked Object-2 virtual locations, with first-field offsets in `0x84334..0x84360` and second-field offsets in `0x84312..0x8432E`. The original record terminators are literal zero DWORDs without relocation records.

The two ten-pair records contain **identical pair contents**, but are separate physical instances. The four-pair record uses the same first-field pointer sequence as the last four pairs of the ten-pair records; its **first second-field pointer is `0x8432E` instead of `0x8432A`**. This difference is material and retained explicitly.

The control routine at `0x93500` copies `[0x75CF6]` into cursor `[0x75A98]`. A nonzero *positive* DWORD token branches at `0x93559` to `0x9358C`, reads a second pointer and its leading word, then calls `0x93390`, which dereferences the first pointer to obtain a runtime object-chain head and branches onward only when nonzero. This qualifies the **positive-token pointer-pair consumption path**. The `-1` token path at `0x93585` calls the packed-row renderer separately; the original three pointer lists contain no `-1` token and do **not** themselves prove a row-renderer invocation.

The referenced unbacked virtual slots, and any nonzero object-chain values they may contain during gameplay, are **not serialized control records in MK2.EXE**. Their runtime population, when the static lists are used, and subsequent rendering semantics remain unproven.

Evidence: `mk2_control_cursor_file_backed_positive_pointer_pair_lists_o96h_2026-10-08.json`. Producer: `scripts/run-mk2-o96h-control-source-lists.mjs`. Independent verifier: `scripts/verify-mk2-o96h-control-source-lists.py`, which independently reparses all **27,004** LE relocations. **27,414 checks / 0 failures**.

## Independent verification and regression

- O96G: **65 / 0**
- O96H: **27,414 / 0**
- Combined new: **27,479 / 0**
- Regression O96F: **34 / 0**
- Regression O96E: **27,174 / 0**
- Regression O96D: **33 / 0**
- Regression O96B: **27,150 / 0**
- Negative controls: **3/3 correctly rejected**: fabricated O96G renderer persistence, mutated O96H pointer field, falsely claiming O96H's existing lists already show a `-1` renderer route.

All counts are actual fresh verifier executions on the canonical MK2 fixture. No game EXE was patched or rewritten.

## Next bounded research

**O96I:** trace actual runtime population and consumption of the slot values `0x84334..0x84360` and the linked-object chain under `0x931E4/0x93390`. Identify bounded writes to specific slots or proved producer→consumer ordering. Keep the `-1` row-renderer branch separate from positive-token object records; if no runtime proof emerges, pivot to MK2 palette/GRA/audio closure blockers instead of repeating structural scans.

The prior totals **do not change**: seven bounded fixed-identity animations, 210/253 strict terminal and 239/253 strong-consumer selected-pointer routes, 14 held, 9/17 qualified correct-color palette slots, and 94/124 exact-full `.GRA` resources. No additional stage, animation, palette, clock, or universal grammar is qualified. **MK2 remains research OPEN**.

Fixed user order: **finish MK2 → finish MK1 → finish MK3 → discuss UI/usability → implement extractor**.
