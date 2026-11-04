# MK DOS Archive — Authoritative Continuation Handoff

**Reconciled:** 2026-09-24 (SAST)  
**Current frontier:** Pass 1E.3G — Palette Setup / Transfer Semantics  
**State:** IMPLEMENTED — direct authentic-fixture smoke VERIFIED — user browser export pending

---

# 1. Read this first

This handoff supersedes `MK_DOS_Archive_HANDOFF_2026-09-24_1E3F_IMPLEMENTED_SELECTION_SEMANTICS.md` as the current continuation checkpoint. Retain all older handoffs as historical evidence.

Current authoritative state:

- **B.1–B.10:** closed.
- **1E.3A.1:** Watcom debug/provenance — real-fixture VERIFIED and closed.
- **1E.3B:** blind Watcom permanent classes — real-fixture VERIFIED and closed.
- **1E.3C.1:** Watcom↔LE structural qualification — real-fixture VERIFIED and closed for structural membership; runtime selector/base mapping remains unresolved.
- **1E.3D.1:** static-data file-image base + palette ground truth — real-fixture VERIFIED and closed.
- **1E.3E:** palette selection reference graph — real-fixture VERIFIED and closed.
- **1E.3F:** same-character palette selection semantics — real-fixture VERIFIED and closed.
- **1E.3G:** palette setup/transfer and bounded renderer-shift bridge — implemented and direct authentic-fixture smoke verified; **user browser artifact still required before formal closeout**.

Immediate next action:

> Load the authentic MK1 directory, click **Run What's Needed**, then **Export Latest**. Independently review the resulting `mk1_palette_setup_transfer_semantics_*.json`. Do not mark 1E.3G closed until that artifact reconciles against original fixture bytes.

---

# 2. Latest source / fixture / UI workflow

Current source after this handoff:

- `mk-dos-archive-direct-1E3G.zip`

Authentic MK1 fixture identity:

- file: `MK1.EXE`
- size: **1,157,222 bytes** (`0x0011A866`)
- SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`

Top toolbar after a real directory is loaded:

- **Run What's Needed** — 1E.3D.1 → 1E.3E → 1E.3F → 1E.3G, dependency ordered and fail-closed.
- **Export Latest** — exports the newest successful quick-run artifact.
- **Export All** — ZIPs successful quick-run artifacts plus a manifest.

Manual tabs remain available, including:

- Palette Ground Truth (1E.3D.1)
- Kano Palette Graph (1E.3E)
- Palette Selection Semantics (1E.3F)
- Palette Setup / Transfer (1E.3G)

---

# 3. Research discipline remains unchanged

Use:

**OBSERVE → RECORD → HYPOTHESIZE → TEST → CLASSIFY CONFIDENCE → GENERALIZE ONLY AFTER REPETITION**

Status vocabulary:

- **VERIFIED** — fixture-derived with reproducible mechanics and independent review.
- **CORROBORATED** — independently VERIFIED plus external agreement.
- **INFERRED** — strong interpretation not mechanically proven.
- **HYPOTHESIS / EXTERNAL LEAD / UNKNOWN** — not authoritative facts.
- **IMPLEMENTED / VALIDATION PENDING** — code exists but authentic browser closeout is incomplete.

The implementation does not certify itself. Synthetic tests validate mechanics only. Authoritative production research must fail closed and preserve provenance.

---

# 4. Key coordinate models now established

## Segment-2 static-data file-image base — VERIFIED

From 1E.3D.1:

- base: **`0x0008CA54`**
- independently derived by handle-table arithmetic and filename/string-area reconstruction.

## Segment-1 code file-image base — VERIFIED

From 1E.3F:

- base: **`0x00050A54`**
- 11 independent bounded continuation anchors agree exactly.

Watcom Segment-1 declared span:

- `0x0003B2D5`

4096-byte aligned span:

- `0x0003C000`

Exact cross-check:

`0x00050A54 + 0x0003C000 = 0x0008CA54`

Classification:

`VERIFIED_ALIGNED_CODE_TO_DATA_BASE_RELATIONSHIP`

Do not conflate these file-image coordinates with unresolved runtime selector/linear semantics.

---

# 5. 1E.3D.1 through 1E.3F — closed chain

The current verified palette dependency chain is:

`NEWPALS palette records → NORMAL/ALTERNATE per-character tables → same-character equality latch → MULTI_SWPAL → FREEPAL/GETPAL → PALSET`

Key closed facts:

- `NEWPALS.ASM`: 123/123 structural records, exact full-module tiling.
- `KANO_P`: Watcom `0x101A6`, physical `0x9CBFA`, 23 colors.
- `KANO3_P`: Watcom `0x101D6`, physical `0x9CC2A`, 23 colors.
- Kano source indices 1..23 exactly fit one-based KANO_P mapping.
- `NORMAL_PALETTES` / `ALTERNATE_PALETTES`: 9 corresponding verified palette entries; Kano at slot 1 in each.
- `ONDECK_2_PROC`: equality/inequality state machine controlling alternate/normal table transitions through `A11`, `P1_CHAR`, and `P2_CHAR`.
- both paths call exact `MULTI_SWPAL`.
- `MULTI_SWPAL`: walks linked objects, frees old palette handles, gets replacement handles, stores them at object `+0x28`.
- `GETPAL`: directly consumes `[u16 length][u16 colors...]` and calls `PALSET`.

“Mirror match” remains an **INFERRED** gameplay name; fixture proof is same-character equality palette switching.

---

# 6. 1E.3F browser closeout and operation-ID repair

Authoritative browser artifact:

`mk1_kano_palette_selection_semantics_2026-09-24T20-36-54-366Z.json`

Independent closeout reproduced:

- 11/11 code-base anchors → `0x50A54`;
- aligned code→data relation → `0x8CA54`;
- exact `A11` / `P1_CHAR` / `P2_CHAR` operands and branch state machine;
- exact `MULTI_SWPAL` / `FREEPAL` / `GETPAL` / `PALSET` boundaries;
- code-side palette record header read and pointer advance;
- all authoritative validation gates passed.

Status:

**1E.3F REAL-FIXTURE VERIFIED — CLOSED**

Minor accepted metadata defect:

- the accepted JSON's `provenance.operationId` inherited a `kano_palette_reference_graph-...` prefix from 1E.3E.
- fixture identity, hash, synthetic flags, raw evidence, report milestone/format, and independent mechanical results were unaffected.
- root cause: 1E.3F returned inherited graph provenance instead of replacing the operation ID.

Current source repair:

- 1E.3F creates fresh `kano_palette_selection_semantics-...` operation provenance;
- authoritative exporter requires the operation-ID prefix to match the milestone;
- authoritative exporter requires `report.operationId === report.provenance.operationId`.

No rerun of the already verified 1E.3F mechanics is required.

---

# 7. Pass 1E.3G — bounded question

Continue only from verified `GETPAL → PALSET`.

Establish:

1. what `PALSET` records/queues;
2. how `GETPAL` represents palette handles and allocates hardware palette ranges;
3. the mechanically reached hardware-transfer routine and its index-0 behavior;
4. the exact color-word transfer arithmetic;
5. only enough renderer-side data flow to determine how the allocated hardware palette start becomes a source-index shift.

Do **not** claim full rasterizer understanding.

---

# 8. PALSET transfer ring — direct authentic-fixture smoke VERIFIED

Exact Watcom function:

- `PALSET`
- `PALL.ASM`
- physical `0x0006E168`

Mechanically derived ring layout:

- queue start: `0x0005A750`
- queue end-exclusive: `0x0005A850`
- entry stride: **8 bytes**
- capacity: **32 entries**
- consumer pointer variable: `0x0005A850`
- producer pointer variable: `0x0005A854`
- changed flag: `0x0005A858`
- post-derivation changed-flag symbol: `bPaletteChanged`

Per-entry fields:

- `+0` dword — palette color-data pointer
- `+4` word — hardware palette start index
- `+6` word — color count

`PALSET` writes all three fields, advances by 8, wraps at queue end, and stores the new producer pointer.

Watcom `PALL.ASM` data span:

- `[0x5A750, 0x5A85C)`
- total `0x10C` bytes

This reconciles exactly as:

- `0x100` queue bytes
- +4 consumer pointer
- +4 producer pointer
- +4 changed flag

Direct-smoke classification:

`VERIFIED_PALETTE_TRANSFER_RING`

---

# 9. GETPAL / PALRAM allocator — direct authentic-fixture smoke VERIFIED

Watcom data symbols:

- `PALRAM` at Segment-2 offset `0x443A8`
- next symbol `IRQSKYE` at `0x44468`

Exact separation:

- `0xC0` bytes = **192 bytes**
- 192 / 8 = **24 entries**

Mechanically established PALRAM entry layout:

- `+0` dword — palette-record pointer
- `+4` word — reference count
- `+6` byte — hardware palette start index
- stride: **8 bytes**
- entries: **24**

`GETPAL` behavior relevant to this pass:

- allocates dynamic hardware palette ranges beginning at hardware index **1**;
- therefore hardware index **0** is not part of normal dynamic allocation;
- returns the PALRAM slot index as the palette handle;
- calls `PALSET` when a palette needs setup/relocation.

Direct-smoke classification:

`VERIFIED_PALETTE_HANDLE_ALLOCATOR`

---

# 10. TRANSFER_PALETTES hardware path — direct authentic-fixture smoke VERIFIED

The immediate Watcom code symbol after `PALSET` resolves to:

- `TRANSFER_PALETTES`
- `PALL.ASM`
- Watcom offset `0x1D73D`
- physical `0x0006E191`
- end physical `0x0006E279`

Mechanics derived from raw fixture code:

- polls port `0x03DA`, mask `0x08`;
- uses `0x03C8` as palette index port;
- uses `0x03C9` as channel-data port;
- drains the same consumer/producer transfer ring used by PALSET;
- reads entry color pointer, start index and count with 8-byte stride;
- clamps any range crossing 256 so writes do not exceed the hardware palette index range;
- wraps the consumer pointer to the queue start;
- writes updated consumer pointer;
- clears `bPaletteChanged` after draining.

Direct-smoke classification:

`VERIFIED_VGA_DAC_PALETTE_TRANSFER`

Supporting process-dispatch evidence:

- `PRCDSP` contains four direct calls to `TRANSFER_PALETTES` at physical `0x6DF43`, `0x6DF6A`, `0x6DF85`, `0x6DF96`;
- `PRCDSP` also tests `bPaletteChanged` on the discovered transfer path at `0x6DF4F`.

This supporting integration is useful but is not required to infer additional scheduler semantics.

---

# 11. Exact 15-bit color → 6-bit output arithmetic

For each 15-bit 5:5:5 source word, raw transfer code emits three channel values:

- source bits `14..10`: `((word >> 9) & 0x3F) | 1`
- source bits `9..5`: `((word >> 4) & 0x3F) | 1`
- source bits `4..0`: `((word << 1) & 0x3F) | 1`

For each 5-bit component this is arithmetically:

`component * 2 + 1`

Observed output range:

- 1..63 per channel

This is VERIFIED for the current MK1 transfer routine in direct fixture smoke. Do not promote it to MK2/MK3 without independent repetition.

---

# 12. IRQSKYE and hardware palette index 0 — external lead now independently reached

`TRANSFER_PALETTES` mechanically references Segment-2 data offset:

- `0x44468`

Only after deriving that operand is it attached to Watcom symbol:

- `IRQSKYE`
- `RAM.ASM`

Inside the transfer routine:

- word `[IRQSKYE]` is tested with mask `0x8000`;
- when bit 15 is **clear**, the code selects palette index **0** through port `0x3C8`;
- the lower 15 bits of IRQSKYE are converted with the same three 5:5:5→6-bit formulas;
- those three values are written through `0x3C9`;
- bit 15 is then ORed into the IRQSKYE word;
- when bit 15 is already set, this index-0 write is skipped.

Current mechanically supported interpretation:

- lower 15 bits = special palette-index-0 color payload;
- bit 15 = transfer-state latch **inside `TRANSFER_PALETTES`**;
- dynamic palette allocation begins separately at index 1.

Do not extend IRQSKYE semantics beyond these observed operations without another bounded pass.

---

# 13. Renderer palette-shift bridge — bounded, not full rasterizer semantics

A mechanically scanned site lies inside post-derivation Watcom function:

- `DMA`
- `DMA.ASM`

The bounded path:

1. obtains a palette handle from AX low 16 bits;
2. indexes `PALRAM + 6` to read the handle's stored hardware start index;
3. on the recovered unflagged path decrements that value;
4. masks the shift to one byte.

Verified formula:

`paletteShift = PALRAM[paletteHandle].hardwareStartIndex - 1`

The same bounded path:

- masks a renderer dispatch selector to `0xFF`;
- indexes a **256-entry** code-offset table at Watcom data offset `0x9024`;
- physical dispatch table: `0x00095A78`.

One mechanically resolved dispatch entry:

- index 2 → raw code offset `0x23F34`
- post-derivation Watcom symbol: `WrtNonZero`
- `RLL_WNZ.ASM`
- physical `0x00074988`

Classification:

`VERIFIED_RENDERER_PALETTE_SHIFT_BRIDGE`

This does **not** mean every renderer mode or the complete WrtNonZero rasterizer has been understood.

---

# 14. TupleTable runtime use and one-based alignment

Inside the reached `WrtNonZero` path:

- code resolves `TupleTable` at Segment-2 offset `0x118B4`;
- physical `0x0009E308`;
- all 256 entries again verify the repeated-byte pattern:

`TupleTable[i] = i * 0x01010101`

A mechanically observed literal-byte path contains:

- repeated-byte tuple derived from source byte;
- repeated-byte palette-shift tuple;
- direct addition of those two values.

Two independently recovered runtime mechanics now meet:

1. `GETPAL` dynamic hardware palette ranges begin at index **1**;
2. renderer shift is `hardwareStartIndex - 1`.

Therefore source index 1 aligns arithmetically with the first hardware entry of the allocated palette range.

This is runtime corroboration of the one-based KANO_P source-index model previously established structurally in 1E.3D.1.

Current decision flag:

- `oneBasedRendererAlignmentCorroborated: true`

Full rasterizer semantics remain false/unresolved.

---

# 15. 1E.3G direct smoke state

The **actual current TypeScript implementation** has been executed against the authentic full MK1 installation after final source changes.

Final direct smoke:

- status: `SUCCESS`
- verdict: `PALETTE_SETUP_TRANSFER_PIPELINE_ESTABLISHED`
- operation ID correctly begins `palette_setup_transfer_semantics-...`
- queue: `VERIFIED_PALETTE_TRANSFER_RING`, capacity 32
- allocator: `VERIFIED_PALETTE_HANDLE_ALLOCATOR`, 24 entries, start index 1
- transfer: `VERIFIED_VGA_DAC_PALETTE_TRANSFER`, ports `0x03C8/0x03C9`
- renderer: `VERIFIED_RENDERER_PALETTE_SHIFT_BRIDGE`
- TupleTable: 256/256 pattern matches
- all authoritative export checks: **PASS**

Independent raw-fixture calculations separately reproduced:

- PALSET queue coordinates;
- PALRAM→IRQSKYE `0xC0` span;
- hardware port constants;
- IRQSKYE operand/latch mask;
- DMA dispatch-table coordinate;
- WrtNonZero physical mapping;
- TupleTable coordinate and 256/256 contents.

Current 1E.3G state remains:

**IMPLEMENTED — DIRECT REAL-FIXTURE SMOKE VERIFIED — USER BROWSER VALIDATION PENDING**

---

# 16. Test/build transparency

Source archive has no installed `node_modules`.

What was successfully run:

- global TypeScript compiler on the non-React research dependency graph;
- final emitted 1E.3G research code executed against the authentic fixture;
- authoritative export creation and all validation gates;
- independent raw-byte calculations;
- ZIP integrity check before handoff.

What is **not** being claimed:

- full Vite production build;
- full Vitest suite;
- clean whole-app `tsc --noEmit`.

Whole-project TypeScript currently reports missing external React/lucide/vitest typings because dependencies are absent, plus inherited historical type noise. New 1E.3G research TypeScript itself compiled/emitted successfully.

---

# 17. 1E.3G closeout requirement

The next user action is operationally simple:

1. run the source locally against the authentic MK1 installation;
2. choose **Run What's Needed**;
3. choose **Export Latest**;
4. return `mk1_palette_setup_transfer_semantics_*.json`.

Then independently verify:

- provenance and operation-ID consistency;
- transfer ring coordinates/layout;
- PALRAM entry count/start index;
- transfer ports and queue linkage;
- IRQSKYE index-0 behavior;
- channel conversion arithmetic;
- renderer shift bridge;
- TupleTable use;
- all fail-closed validation gates.

Only then mark 1E.3G CLOSED.

---

# 18. Hard stops after 1E.3G implementation

Do not yet:

- call the complete `WrtNonZero` rasterizer understood;
- claim every renderer dispatch entry uses identical palette arithmetic;
- generalize the 5:5:5 transfer formula to MK2/MK3 without repetition;
- give IRQSKYE semantics beyond its observed lower-15-bit index-0 color and bit-15 transfer latch in this routine;
- confuse static file-image addresses with unresolved runtime selector/linear addresses;
- promote one MK1 mechanism into a family rule without cross-game validation;
- claim encode/recompile support before lossless serialization and no-edit round-trip are implemented.

---

# 19. Likely next frontier after 1E.3G closeout

Do not start automatically before closeout.

Good bounded candidates are now:

1. **Deeper rasterizer / packed-pixel write semantics** — determine exactly how the verified tuple+shift arithmetic maps source indices into destination bytes across renderer modes.
2. **Palette lifecycle / round-trip IR** — use the now-recovered palette grammar, ownership tables, allocator and transfer semantics to design the first lossless bidirectional palette representation and no-edit reserialization test.

The long-term architecture remains:

**Binary → structured/lossless IR → editable representation → compiler → Binary**

Given how much palette grammar is now independently recovered, a round-trip palette milestone is becoming a realistic near-term option rather than a distant goal.

---

# 20. Current one-sentence state

> **MK1 palette research now forms a fixture-derived pipeline from exact NEWPALS records through per-character normal/alternate ownership, same-character selector semantics, palette-handle rebinding, a 32-entry PALSET transfer ring, a 24-slot PALRAM allocator beginning at hardware index 1, direct TRANSFER_PALETTES writes through the recovered hardware ports, a separate IRQSKYE-driven palette-index-0 path, and a bounded DMA→WrtNonZero→TupleTable palette-shift bridge that independently corroborates one-based source-index alignment; 1E.3G is implemented and direct-fixture smoke verified, but awaits the user's authentic browser export before formal closeout.**
