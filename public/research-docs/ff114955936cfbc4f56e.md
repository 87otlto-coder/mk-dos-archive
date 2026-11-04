# MK DOS Archive — Authoritative Continuation Handoff

**Reconciled:** 2026-09-24 (SAST)  
**Current frontier:** Pass 1E.3F — Kano Palette Selection Semantics  
**State:** IMPLEMENTED — direct authentic-fixture smoke VERIFIED — user browser export pending

---

# 1. Read this first

This handoff supersedes `MK_DOS_Archive_HANDOFF_2026-09-24_1E3D1_VERIFIED_PALETTE_GROUND_TRUTH.md` as the current continuation checkpoint. Retain all older handoffs as historical evidence.

Current authoritative state:

- **B.1–B.10:** closed.
- **1E.3A.1:** Watcom debug/provenance — real-fixture VERIFIED and closed.
- **1E.3B:** blind Watcom permanent classes — real-fixture VERIFIED and closed.
- **1E.3C.1:** Watcom↔LE structural qualification — real-fixture VERIFIED and closed for structural membership; runtime selector/base mapping remains unresolved.
- **1E.3D.1:** static-data file-image base and symbol-derived palette ground truth — real-fixture VERIFIED and closed.
- **1E.3E:** Kano palette selection reference graph — real-fixture VERIFIED and closed.
- **1E.3F:** Kano palette selection semantics — implemented and direct-fixture smoke verified; **user browser artifact still required before formal closeout**.

Immediate next action:

> Load the authentic MK1 directory, use **Run What's Needed**, then **Export Latest**. Independently review the resulting `mk1_kano_palette_selection_semantics_*.json`. If it reconciles, close 1E.3F before opening hardware-transfer/index-0 work.

---

# 2. Latest source / fixture / UI workflow

Current source snapshot after this handoff:

- `mk-dos-archive-direct-1E3F.zip`

Authentic MK1 fixture identity:

- file: `MK1.EXE`
- size: **1,157,222 bytes** (`0x0011A866`)
- SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`

Top toolbar after a real directory is loaded:

- **Run What's Needed** — currently runs 1E.3D.1 → 1E.3E → 1E.3F in dependency order and fails closed.
- **Export Latest** — exports the newest successful quick-run research artifact.
- **Export All** — ZIPs all successful quick-run artifacts plus a manifest.

Manual tabs remain available, including:

- Palette Ground Truth (1E.3D.1)
- Kano Palette Graph (1E.3E)
- Palette Selection Semantics (1E.3F)

---

# 3. Research and evidence rules remain unchanged

Use:

**OBSERVE → RECORD → HYPOTHESIZE → TEST → CLASSIFY CONFIDENCE → GENERALIZE ONLY AFTER REPETITION**

Status vocabulary:

- **VERIFIED** — fixture-derived with reproducible mechanics and independent review.
- **CORROBORATED** — VERIFIED plus independent external agreement.
- **INFERRED** — strong interpretation not mechanically proven.
- **HYPOTHESIS / EXTERNAL LEAD / UNKNOWN** — not authoritative facts.
- **IMPLEMENTED / VALIDATION PENDING** — code exists but authentic browser closeout is incomplete.

Implementation never certifies itself. Synthetic tests validate mechanics only. Production research must fail closed and preserve provenance.

---

# 4. 1E.3D.1 palette ground truth — VERIFIED and closed

Authoritative browser artifact:

`mk1_watcom_data_image_palette_ground_truth_2026-09-24T19-18-41-962Z.json`

Verified:

- Segment-2 static-data file-image base: **`0x0008CA54`** from two independent fixture anchors.
- Direct LE page-map coordinates are a distinct model and do not qualify/veto the static-data file-image mapping.
- `NEWPALS.ASM`: span `0xF3A4..0x10914`, 173 DATA symbols, 123 unique offsets, 123/123 structural palette records, exact 5,488-byte tiling, no gaps/overlaps.
- `KANO_P`: Watcom `0x101A6`, physical `0x9CBFA`, 23 colors.
- `KANO3_P`: Watcom `0x101D6`, physical `0x9CC2A`, 23 colors, immediately adjacent.
- Kano opaque source indices 1..23 fit KANO_P one-based mapping exactly; zero-based overflows at 23. This is verified for this Kano relationship only.
- `TupleTable`: physical `0x9E308`, 256/256 repeated-byte DWORDs verified.

---

# 5. 1E.3E reference graph — VERIFIED and closed

Authoritative browser artifact:

`mk1_kano_palette_selection_reference_graph_2026-09-24T19-56-58-522Z.json`

Verified paired tables in `MKUTIL.ASM`:

## NORMAL_PALETTES

- Watcom offset `0xF1CC`
- physical `0x9BC20`
- 9 DWORD entries
- 9/9 verified NEWPALS palette starts
- KANO_P at slot 1

## ALTERNATE_PALETTES

- Watcom offset `0xF1F0`
- physical `0x9BC44`
- 9 DWORD entries
- 9/9 verified NEWPALS palette starts
- KANO3_P at slot 1

All corresponding entries are palette-to-palette pairs. Classification:

`VERIFIED_PARALLEL_PALETTE_TABLES`

Executable cluster:

- physical `0x586C7`: `MOV EAX,[EBX*4+0xF1F0]`
- physical `0x586E7`: `MOV EAX,[EBX*4+0xF1CC]`
- same EBX index; 32-byte separation

Classification:

`VERIFIED_SHARED_INDEX_TABLE_CLUSTER`

1E.3E decision:

`PALETTE_SELECTION_REFERENCE_GRAPH_ESTABLISHED`

It deliberately did not decide the gameplay trigger.

---

# 6. 1E.3F — implemented mechanics and direct fixture smoke

## Bounded question

Determine the exact state/branch logic choosing NORMAL versus ALTERNATE, qualify the code file-image coordinate model necessary to attach Watcom code symbols, and follow the common downstream path only far enough to prove palette rebinding/acquisition semantics.

Do **not** yet enter `TRANSFER_PALETTES`, `WrtNonZero`, IRQSKYE, index-0 or hardware-transfer semantics.

## Segment-1 code file-image base

The pass scans a bounded window around the already verified 1E.3E cluster for the compiler/coroutine continuation shape:

`LEA EBP,[EBP-4] ; MOV [EBP],imm32 ; JMP rel32`

For each occurrence:

`candidate code base = physical fall-through after JMP - stored imm32`

Authentic-fixture direct smoke result:

- agreeing anchors: **11**
- distinct qualified base count: 1
- Segment-1 code file-image base: **`0x00050A54`**

No Watcom symbol name participates in deriving this base.

## Aligned code→data base relationship

Watcom Segment-1 declared span:

- `0x0003B2D5`

4096-byte alignment:

- `0x0003C000`

Exact relation:

`0x00050A54 + 0x0003C000 = 0x0008CA54`

The result equals the independently verified Segment-2 static-data base and the physical-minus-Watcom base independently obtained from both palette tables.

Classification:

`VERIFIED_ALIGNED_CODE_TO_DATA_BASE_RELATIONSHIP`

Do not overstate this as a claim that every byte between bases is one homogeneous semantic image.

---

# 7. Verified palette selector state machine

The bounded selector block maps post-derivation into Watcom `ONDECK_2_PROC` in `drone.ASM`.

Mechanically decoded absolute data operands resolve afterward to:

- `0x24B5C` → `A11`
- `0x24BD8` → `P1_CHAR`
- `0x24C3C` → `P2_CHAR`

Raw control logic establishes:

## A11 == 0, P1_CHAR == P2_CHAR

- write `A11 = 1`
- obtain object/character index from `[EDI+0x48]`
- load `ALTERNATE_PALETTES[index]`
- call common downstream target

## A11 == 0, P1_CHAR != P2_CHAR

- no palette-table transition

## A11 != 0, P1_CHAR == P2_CHAR

- no palette-table transition

## A11 != 0, P1_CHAR != P2_CHAR

- load `NORMAL_PALETTES[index]`
- call same downstream target
- following loop path clears `A11 = 0`

Classification:

`VERIFIED_EDGE_TRIGGERED_CHARACTER_EQUALITY_PALETTE_LATCH`

The phrase **mirror match** is currently only **INFERRED**. The verified fact is same-character equality/inequality controlling the alternate/normal palette latch.

---

# 8. Common downstream palette path

Both selector paths call physical:

`0x00069E89`

With code base `0x50A54`, this maps exactly to Watcom Segment-1 offset `0x19435`:

`MULTI_SWPAL` — `MKUTIL.ASM`

The immediately preceding symbols also align exactly to physical boundaries:

- `PLAYER_SWPAL` `0x193D6`
- `PLAYER_NORMPAL` `0x193E1`
- `MULTI_SWPAL` `0x19435`

`MULTI_SWPAL` mechanically:

- walks an EDI-linked object list using field `+0x04`;
- reads old u16 palette handle at object field `+0x28`;
- calls exact Watcom `FREEPAL`;
- calls exact Watcom `GETPAL` for the selected palette record;
- stores returned AX back to field `+0x28`.

Classification:

`VERIFIED_MULTI_OBJECT_PALETTE_REBIND`

---

# 9. GETPAL independently consumes the verified palette grammar

Physical targets resolve exactly to:

- `GETPAL` — `PALL.ASM`, Watcom `0x1D866`, physical `0x6E2BA`
- `FREEPAL` — `PALL.ASM`, Watcom `0x1D92A`, physical `0x6E37E`
- `PALSET` — `PALL.ASM`, Watcom `0x1D714`, physical `0x6E168`

On the new-record acquisition path, `GETPAL` contains:

- `MOV BX, WORD [EAX]` — reads the leading palette u16 length;
- `ADD EAX, 2` — advances to palette color words;
- call to exact Watcom `PALSET`.

This is an independent code-side consumption of the `[u16 length][u16 colors...]` format structurally established in 1E.3D.1.

Classification:

`VERIFIED_PALETTE_RECORD_ACQUIRE`

`TRANSFER_PALETTES` exists as the next nearby code symbol after PALSET but is deliberately outside 1E.3F semantics.

---

# 10. 1E.3F direct smoke state

The actual TypeScript research module was executed against the authentic full MK1 fixture.

Direct smoke result:

- report status: `SUCCESS`
- verdict: `SAME_CHARACTER_PALETTE_SWITCH_SEMANTICS_ESTABLISHED`
- 11 agreeing continuation anchors → code base `0x50A54`
- aligned code→data relation → `0x8CA54`
- A11/P1_CHAR/P2_CHAR exact symbol resolution
- selector function `ONDECK_2_PROC`
- common target `MULTI_SWPAL`
- exact downstream `FREEPAL` / `GETPAL`
- GETPAL palette-header read + pointer advance + call to `PALSET`
- all 1E.3F authoritative export gates passed in direct smoke

This remains **IMPLEMENTED / USER BROWSER VALIDATION PENDING**, not formally CLOSED.

Environment limitation: the supplied source archive does not contain `node_modules`, so a complete npm/Vite/Vitest run is not claimed. The non-React research TypeScript subset was emitted/executed successfully against the real fixture, and pure helper smoke tests passed.

---

# 11. Next likely research frontier after 1E.3F closeout

Do not begin until the user browser artifact independently passes.

The natural next bounded phase is the palette-transfer/render boundary, likely in small passes rather than one broad disassembly exercise:

1. Establish exactly what `PALSET` records/queues and which structure fields it mutates.
2. Reach `TRANSFER_PALETTES` mechanically from verified calls/data flow rather than by name alone.
3. Derive the color conversion/transfer format from fixture code.
4. Only then inspect how `WrtNonZero`, `TupleTable`, palette shift and source-index 0 interact.
5. Keep IRQSKYE as unresolved until its role is mechanically reached.

External descriptions remain corroboration only.

---

# 12. Hard stops

Do not:

- call “mirror match” VERIFIED solely from same-character equality;
- treat A11's human meaning as established beyond its mechanically verified latch behavior;
- use `TRANSFER_PALETTES`, `WrtNonZero` or IRQSKYE semantics from external sources as fixture facts;
- generalize KANO_P one-based behavior to every MK1 palette without testing;
- conflate static file-image coordinates with runtime linear/selector addresses;
- reopen B.10 without new evidence;
- broaden to MK2/MK3 before current MK1 palette mechanics are stable;
- discard unknown/raw information from future IR;
- claim recompilation support before no-edit round-trip infrastructure exists.

---

# 13. Long-term product direction remains unchanged

Target architecture:

**Binary → structured/lossless IR → editable representation → compiler → Binary**

Every newly understood structure should eventually support decode and encode, preserve unknown bytes/ordering/alignment/provenance, and be tested by no-edit round-trip before destructive editing.

Automatic palette ownership should come from the recovered dependency graph rather than user selection or heuristic visual matching.

---

# 14. Current one-sentence state

> **MK1 palette research has progressed from heuristic candidates to a verified NEWPALS palette module, verified normal/alternate per-character palette tables, and now an implemented fixture-derived state machine in `ONDECK_2_PROC` that switches those tables on same-character equality transitions and funnels both paths through `MULTI_SWPAL → FREEPAL/GETPAL`, with GETPAL independently consuming the proven palette-record grammar; the only remaining requirement before formal 1E.3F closeout is the user's authentic browser export and independent reconciliation.**
