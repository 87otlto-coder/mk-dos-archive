# MK DOS Archive — Authoritative Continuation Handoff

**Source conversation:** Watcom symbol recovery, address-model qualification, direct implementation trial, and symbol-derived palette ground truth  
**Reconciled:** 2026-09-24 (SAST)  
**Purpose:** preserve the current authoritative MK DOS Archive state after Pass 1E.3D.1 was implemented directly, run against the authentic MK1 fixture in the browser, and independently reviewed.

---

# 1. Read this first

This handoff **supersedes `MK_DOS_Archive_HANDOFF_2026-09-20_B10D_DIRECTION_AND_RECOMPILER_GOAL.md` as the current continuation checkpoint**.

Retain the September 20, September 16, and September 12 handoffs as historical baselines. They remain useful for reconstructing how conclusions evolved, but they no longer describe the current frontier.

Current state:

- **B.1–B.10:** closed. Do not reopen by default.
- **1E.3A.1 — Watcom debug discovery/provenance repair:** real-fixture VERIFIED and closed.
- **1E.3B — blind Watcom permanent-class enumeration:** real-fixture VERIFIED and closed.
- **1E.3C / 1E.3C.1 — Watcom↔LE structural address model:** real-fixture VERIFIED and closed for structural object membership; actual runtime selector/base mapping remains unresolved.
- **Initial 1E.3D implementation:** real-fixture run occurred but result rejected because the implementation used the wrong coordinate contract.
- **1E.3D.1 — static-data file-image base and symbol-derived palette ground truth:** **REAL-FIXTURE VERIFIED AND CLOSED**.
- **Automatic palette ownership/selection tracing:** not yet established.
- **IRQSKYE/index-0 semantics:** not independently established.
- **Runtime address mapping:** not independently established.

Immediate next research question:

> **How does MK1 select `KANO_P`, `KANO3_P`, and other verified NEWPALS palette records for specific animation/rendering states?**

The project has moved from statistical palette hunting to original-symbol-backed palette structures. The next pass should exploit that higher-information evidence without allowing names or external reports to predetermine behavior.

---

# 2. Latest authoritative source and evidence

## Latest source snapshot

Current source package produced by the direct-implementation workflow:

- `mk-dos-archive-direct-1E3D1-r1.zip`

This source includes the UI crash fix discovered during the first browser attempt after direct implementation.

Standing rule:

> The newest source archive actually accepted by the user is authoritative. Archive suffixes are not semantic versions.

## Current real-fixture evidence artifact

Authoritative user-generated browser export:

- `mk1_watcom_data_image_palette_ground_truth_2026-09-24T19-18-41-962Z.json`
- schema: `mk1_watcom_data_image_palette_ground_truth_v2`
- milestone: `Pass 1E.3D.1`
- fixture: `MK1.EXE`
- size: `1,157,222` bytes (`0x0011A866`)
- SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`
- `sourceKind: user-loaded-directory`
- `synthetic: false`
- `artifactGeneratedByTest: false`
- final validation: `allChecksPassed: true`
- decision: `STRUCTURAL_GROUND_TRUTH_ESTABLISHED`

## Rejected 1E.3D artifact retained historically

- `mk1_watcom_data_image_palette_ground_truth_2026-09-24T18-45-01-456Z.json`

Its provenance was genuine, but its research conclusions are rejected because the implementation did not follow the intended coordinate contract. Do not delete this historical artifact; it documents a useful fail-closed implementation error.

---

# 3. Long-term project goal

The product goal remains:

> **Build a reproducible MK-DOS asset research, extraction, reconstruction, editing, and recompilation toolchain.**

Target architecture:

**Binary → structured/lossless IR → editable representation → compiler → Binary**

Extraction is a means of learning the serialization grammar, not the destination.

The eventual system should support:

- deterministic graphics extraction;
- automatic palette association;
- sprite/animation/group reconstruction;
- stage/background reconstruction;
- executable-resident metadata recovery;
- Watcom symbol/debug recovery where present;
- resource/dependency graph reconstruction;
- editable semantic representations;
- lossless preservation of unknown fields and raw bytes;
- no-edit round-trip compilation;
- controlled asset replacement;
- stage/map editing and recompilation;
- independent MK2 and MK3 validation before promoting repeated behavior into shared MK-DOS semantics.

---

# 4. Research discipline and evidence authority

Use:

**OBSERVE → RECORD → HYPOTHESIZE → TEST → CLASSIFY CONFIDENCE → GENERALIZE ONLY AFTER REPETITION**

Confidence vocabulary:

- **VERIFIED** — independently derived from authentic fixture bytes/files using reproducible mechanics.
- **CORROBORATED** — independently VERIFIED and also consistent with an external source.
- **INFERRED** — strong interpretation, not mechanically proven.
- **HYPOTHESIS** — proposed explanation awaiting testing.
- **EXTERNAL LEAD** — externally reported, not independently established.
- **UNKNOWN** — insufficient evidence.
- **IMPLEMENTED / VALIDATION PENDING** — implementation exists but authentic fixture validation is incomplete.

Evidence hierarchy:

1. authentic fixture bytes / directly reproduced behavior;
2. structured evidence exported from authentic fixture runs;
3. independent verification calculations over original fixture bytes;
4. independently inspected implementation source;
5. tests with known provenance;
6. project docs/handoffs;
7. implementation-agent completion prose;
8. external research for truth claims.

Never equate:

- passing synthetic tests with real-fixture verification;
- symbol name with semantic behavior;
- Watcom segment/object structural membership with runtime selector mapping;
- palette compatibility with ownership;
- numeric equality with pointer identity;
- external documentation with fixture truth.

---

# 5. Implementation/provenance operating rule

The project now uses a strict three-stage model:

1. **IMPLEMENTED** — code exists.
2. **REAL-FIXTURE RUN** — the user/browser ran against authentic data.
3. **INDEPENDENTLY VERIFIED** — key results were recomputed from the original fixture outside the implementation path.

Only stage 3 enters the authoritative research record.

Important historical lesson:

- The original 1E.3A artifact was generated by a synthetic test that wrote production-looking JSON. That artifact remains rejected.
- Synthetic tests must never write authoritative research artifacts.
- Production research exports must originate from actual user-loaded bytes and fail closed on synthetic/test provenance.
- Coding/implementation completion prose is not evidence.

Direct implementation by ChatGPT does **not** remove the need for independent validation. The implementation still does not certify itself.

---

# 6. Authentic MK1 fixture identity

Authoritative executable:

- file: `MK1.EXE`
- size: `1,157,222` bytes (`0x0011A866`)
- SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`

Authoritative Kano resource:

- `GRAPHICS/KANO.GRA`
- size: `595,504` bytes (`0x00091630`)
- SHA-256: `5b32513ed4fd5363f6aab56a9f2493b96ffbe331593297a277d4aac5fbbd9390`

---

# 7. Core LE executable topology

Embedded LE header:

- physical offset: `0x000292E4`
- CPU: 386
- page size: 4096
- module pages: 130
- objects: 2

Object 1:

- object number: 1
- relocation base: `0x00010000`
- virtual size: `0x0003B2D5` (242,389)
- capabilities: R-X / 32-bit
- page map index: 1
- page map entry count: 60
- initial code object: yes

Object 2:

- object number: 2
- relocation base: `0x00050000`
- virtual size: `0x0005D140` (381,248)
- capabilities: RW- / 32-bit
- page map index: 61
- page map entry count: 70
- auto-data object: yes
- initial stack object: yes

Half-open file topology:

- final actual file-backed LE byte: `0x000ABBFE`
- first post-module byte: `0x000ABBFF`
- Watcom debug container begins: `0x000D2253`
- unresolved interval: `0x000ABBFF..0x000D2253`
- unresolved length: `157,268` bytes
- classification: **UNKNOWN POST-MODULE / PRE-DEBUG DATA**

Do not investigate that unknown interval unless a later bounded question makes it relevant.

---

# 8. Watcom debug container — VERIFIED

Authentic EOF master-header bytes establish:

- master header: `0x0011A858`
- signature: `0x8386`
- EXE version: 3.0
- OBJ version: 1.0
- language table size: 6
- segment table size: 4
- debug size: `0x00048613` = 296,467 bytes
- debug container: `0x000D2253..0x0011A866`

Root section:

- start: `0x000D225D`
- `mod_offset = 0x00033BDE`
- `gbl_offset = 0x000351FD`
- `addr_offset = 0x00047EE3`
- `section_size = 0x000485FB`
- `section_id = 0`
- root section tiles exactly to the master-header boundary.

Language table bytes decode structurally as two NUL-terminated entries:

- `C`
- `CPP`

Segment-address table contains two entries.

---

# 9. Watcom permanent classes — VERIFIED

Pass 1E.3B blind enumeration independently established:

- source languages: **2**;
- Watcom segment-address entries: **2**;
- modules: **192**;
- global symbols: **3,915**;
- address-information segment records: **2**.

Every permanent class tiles exactly to its declared boundary and all real-fixture cross-class references reconcile.

The parser did not search for known Mortal Kombat names during enumeration.

Only after blind enumeration were external-name comparisons performed.

Post-discovery symbol existence now independently VERIFIED includes:

- `_handleTable`;
- `IRQSKYE`;
- `TRANSFER_PALETTES`;
- `WrtNonZero`;
- `TupleTable`;
- `KANO_P`;
- `KANO3_P`;
- `KANO_ANITAB`;
- many other original Watcom symbols/modules.

Where external sources also reported the same names, existence is **VERIFIED + CORROBORATED**. Their reported semantics remain separate questions unless independently tested.

---

# 10. Watcom↔LE structural address model — VERIFIED, runtime mapping unresolved

Passes 1E.3C/1E.3C.1 established:

## Watcom Segment 1

- global symbols: 1,228;
- CODE symbols: 1,228;
- DATA symbols: 0;
- address-info coverage: `0x0003B2D5`;
- exact match to LE Object 1 virtual size `0x0003B2D5`;
- structural relationship: **Watcom Segment 1 ↔ LE Object 1 VERIFIED**.

## Watcom Segment 2

- global symbols: 2,687;
- CODE symbols: 0;
- DATA symbols: 2,687;
- address-info coverage: `0x0005C140`;
- LE Object 2 virtual size: `0x0005D140`;
- Segment 2 fits Object 2 and does not fit Object 1;
- structural relationship: **Watcom Segment 2 ↔ LE Object 2 VERIFIED**.

Important boundary:

> Structural Watcom-segment↔LE-object membership does **not** prove the actual DOS/4GW runtime selector/base/offset mapping.

`runtimeAddressVerified` remains false.

Do not call `relocationBase + Watcom offset` an actual runtime address unless a later pass establishes the loader/debugger mapping mechanically.

---

# 11. Graphics handle-table baseline — VERIFIED

Graphics handle table:

- physical range: `0x000B0C5C..0x000B11CC`;
- entries: 58;
- stride: 24;
- independently reconstructed filename/string base: `0x0008CA54`;
- directory-reconciled entries: 57;
- reconstruction status: VERIFIED fixture evidence.

Examples:

- File ID 4 → `GRAPHICS/JCATT.GRA`;
- File ID 35 → `GRAPHICS/KANO.GRA`.

Watcom `_handleTable` symbol:

- segment: 2;
- map offset: `0x00024208`;
- module: `C:\KOMBAT1\kombat.cpp`;
- Watcom kind: DATA.

---

# 12. Static-data file-image base — VERIFIED

Pass 1E.3D.1 derived the Segment-2 static-data **file-image** base using two independent fixture-derived methods.

Method A:

`physicalHandleTableStart - _handleTable.watcomMapOffset`

`0x000B0C5C - 0x00024208 = 0x0008CA54`

Method B:

- independently reconstructed executable filename/string-area base = `0x0008CA54`.

Results:

- candidate Base A: `0x0008CA54`;
- candidate Base B: `0x0008CA54`;
- exact equality: yes;
- `_handleTable` anchor round-trip: yes;
- classification: **QUALIFIED_STATIC_DATA_FILE_BASE / VERIFIED**.

For this qualified Segment-2 static-data file-image model:

`physical file offset = 0x0008CA54 + Watcom Segment-2 map offset`

This is a verified **file-image** coordinate relationship for the tested static-data context. It is not automatically the DOS/4GW runtime selector mapping.

## Competing LE page-map model

Direct LE Object-2 page-map translation of the `_handleTable` Watcom offset yields a different physical coordinate (`0x0008A608`).

That disagreement is real and is preserved as evidence.

It does **not** veto the independently qualified static-data file-image base.

Therefore:

> Watcom static-data file-image coordinates and direct LE page-map object coordinates are not automatically interchangeable.

---

# 13. NEWPALS.ASM — VERIFIED palette module

After blind Watcom enumeration and static-data-base qualification, exact module `NEWPALS.ASM` was inspected.

Module evidence:

- module index: 32;
- Watcom segment: 2;
- span: `0x0000F3A4..0x00010914`;
- byte length: `0x1570` = 5,488 bytes;
- DATA symbols: 173;
- unique symbol offsets: 123.

Discovery rules:

- exact module name selected only after generic enumeration;
- all Segment-2 DATA symbols in the module participated;
- no `_P` suffix or character-name filter was used to discover records;
- aliases were grouped by identical Watcom offset;
- structural record parser used only:
  - `u16 length`;
  - `u16 colors[length]`;
  - `2 <= length < 256`;
  - executable bounds;
  - every color word `< 0x8000`.

Real-fixture result:

- unique offsets: **123**;
- successfully parsed records: **123/123**;
- first record begins exactly at module start: yes;
- every record end equals the next record start: yes;
- final record ends exactly at module end: yes;
- gaps: **0**;
- overlaps: **0**;
- parse failures: **0**;
- accounted bytes: **5,488 / 5,488**;
- classification: **VERIFIED_PALETTE_MODULE**.

This is now stronger ground truth than the older brute-force palette catalogue.

---

# 14. Kano palette ground truth — VERIFIED

`KANO_P`:

- module: `NEWPALS.ASM`;
- Watcom segment: 2;
- Watcom offset: `0x000101A6`;
- derived physical offset: `0x0009CBFA`;
- declared length: **23**;
- record size: 48 bytes (`2 + 23×2`);
- record end: `0x0009CC2A`.

`KANO3_P`:

- module: `NEWPALS.ASM`;
- Watcom segment: 2;
- Watcom offset: `0x000101D6`;
- derived physical offset: `0x0009CC2A`;
- declared length: **23**;
- record end: `0x0009CC5A`.

Relationship:

- `KANO_P` end == `KANO3_P` start;
- the records are structurally adjacent;
- both are independently established palette records by full NEWPALS module tiling, not by their names.

Classification:

- `KANO_P` = **VERIFIED palette record**;
- `KANO3_P` = **VERIFIED palette record**.

What remains unresolved:

- the precise gameplay/animation/rendering rule that selects KANO_P versus KANO3_P;
- whether either is transformed before final display;
- relationship to palette-shift code and IRQSKYE/index 0.

---

# 15. Kano palette indexing — one-based model VERIFIED for observed KANO_P sprite indices

Authoritative Kano sprite evidence:

- successful sprite decodes: 187;
- aggregate opaque source-index set: **1..23**;
- distinct opaque source indices: 23;
- opaque source index 0 observed: no.

`KANO_P` length: 23.

Zero-based model:

`source index n → palette[n]`

Result:

- mapped: 22;
- out of range: source index 23;
- unused palette slot: 0;
- fit: `PARTIAL_OVERFLOW`.

One-based model:

`positive source index n → palette[n - 1]`

Result:

- mapped: 23;
- out of range: 0;
- unused palette slots: 0;
- fit: `EXACT_FULL_FIT`.

Classification:

> **VERIFIED for KANO_P and the observed authoritative Kano sprite-index set: the one-based mapping is the only complete fit.**

Important restraint:

- do not generalize this automatically to every MK1 palette;
- do not use IRQSKYE to explain index 0 in this result;
- index 0 was not present in the tested opaque Kano source-index set.

External reports of one-based MK palette behavior are now **CORROBORATED for this specific KANO_P relationship**, not universally proven.

---

# 16. TupleTable — VERIFIED + CORROBORATED

Watcom symbol:

- name: `TupleTable`;
- segment: 2;
- map offset: `0x000118B4`;
- module: `RLL_WNZ.ASM`.

Using the independently qualified static-data file-image base:

- physical offset: `0x0009E308`.

Validation:

- entries requested: 256;
- entries checked: 256;
- expected entry `i`:
  `i | (i << 8) | (i << 16) | (i << 24)`;
- matching entries: 256;
- mismatches: 0;
- classification: **VERIFIED**.

Because this independently reproduced the structure previously described externally, that external description is now **CORROBORATED**.

TupleTable was not used to derive the static-data base.

---

# 17. Legacy brute-force palette catalogue — demoted to comparison evidence

Old catalogue baseline:

- raw length candidates: 110,605;
- 15-bit valid: 40,146;
- structural/final physical: 29,516;
- research candidates: 1,541;
- unique contents: 22,315;
- duplicates: 7,201.

Previously interesting Kano-compatible candidate:

- `MK1.EXE:0x0009C914`;
- length 32;
- score 80;
- visually plausible but ownership not established.

The symbol/module-derived NEWPALS evidence now outranks heuristic palette ranking.

Important consequence:

> A palette record is not invalid merely because the old heuristic scanner ranked it poorly or considered its bytes text-like.

The catalogue remains useful for diagnostics, duplicate analysis, and measuring heuristic false negatives. It is not the authority for symbol-derived palette structures.

---

# 18. External-symbol semantics status

The following names exist in the authentic binary and are VERIFIED as Watcom symbols:

- `_handleTable`;
- `IRQSKYE`;
- `TRANSFER_PALETTES`;
- `WrtNonZero`;
- `TupleTable`;
- `KANO_P`;
- `KANO3_P`;
- `KANO_ANITAB`.

Current semantic status:

- `_handleTable` → relationship to the independently recovered handle table is VERIFIED.
- `TupleTable` → repeated-byte 256-DWORD structure is VERIFIED + CORROBORATED.
- `KANO_P` / `KANO3_P` → palette-record identity is VERIFIED.
- `IRQSKYE supplies palette/index 0` → still **EXTERNAL LEAD / NOT INDEPENDENTLY VERIFIED**.
- precise `TRANSFER_PALETTES` behavior → not independently established.
- precise `WrtNonZero` renderer/palette-shift behavior → not independently established.
- `KANO_ANITAB` semantic structure → symbol exists, detailed interpretation not yet established in this chain.

Do not let legacy comments/tests promote unresolved external semantics into fixture facts.

---

# 19. Direct implementation workflow trial

Pass 1E.3D.1 was the first substantial research-critical pass implemented directly by ChatGPT rather than delegated to the separate coding agent.

Workflow used:

1. take latest source archive;
2. unpack and inspect existing architecture;
3. implement the pass directly;
4. perform source-level and available runtime checks;
5. run a direct real-data smoke test against the original MK1 fixture available in the project context;
6. package source for the user;
7. user runs browser application against authentic local MK1 installation;
8. user exports authoritative JSON;
9. independent review compares the browser artifact against original fixture evidence.

Observed outcome:

- one UI compatibility bug occurred (`derivedPalettes.length` vs new `paletteRecords`) and failed loudly through the diagnostic logger;
- the UI bug was corrected in `mk-dos-archive-direct-1E3D1-r1.zip`;
- the underlying research implementation reproduced the intended independent results;
- the subsequent real browser export passed every authoritative validation gate;
- 1E.3D.1 is now independently VERIFIED.

Environment limitation during direct implementation:

- supplied source archive did not include `node_modules`;
- dependency installation in the model environment timed out;
- therefore a full local `npm test` / Vite production build was not claimed;
- the real browser run by the user provided the decisive integration validation.

Current recommendation:

> Direct implementation is viable for research-critical mechanics where exact adherence to the reasoning contract matters. A separate coding agent may still be useful for bulk UI/refactor work, but it is no longer a required part of the MK DOS workflow.

Regardless of implementer, evidence must still be independently validated.

---

# 20. Immediate next research direction

The next useful problem is **palette ownership/selection tracing**, not palette discovery.

The concrete question is:

> How does MK1 select `KANO_P`, `KANO3_P`, and other verified palette records for specific character/animation/rendering states?

A future Pass 1E.3E should probably investigate the dependency path from:

`character / animation state → palette symbol/reference → transfer/state logic → renderer`

Useful verified anchors now available:

- `KANO_P` and `KANO3_P` exact structures and physical coordinates;
- `KANO_ANITAB` symbol existence;
- complete original Watcom module/global-symbol inventory;
- qualified Segment-2 static-data file-image base;
- 187 authoritative Kano sprite descriptors and their source-index usage;
- verified one-based KANO_P index fit;
- `TRANSFER_PALETTES`, `WrtNonZero`, and `IRQSKYE` as post-discovery semantic test targets;
- `TupleTable` as a now-verified renderer-adjacent data structure.

Recommended research order:

1. derive references/relationships to KANO_P and KANO3_P from fixture/code structures without assuming external semantics;
2. determine whether named animation/state tables carry palette identifiers, pointers, offsets, or shift state;
3. trace the minimal bounded code/data chain that selects or transforms the palette;
4. compare discovered behavior to external descriptions only afterward;
5. avoid implementing global automatic ownership until at least one complete Kano path is mechanically demonstrated.

Do not jump directly to “assign every `_P` symbol to sprites.”

---

# 21. Important unresolved questions

Still unresolved:

- actual DOS/4GW runtime selector/base mapping for Watcom map addresses;
- semantic reason direct LE page-map coordinates differ from the verified Segment-2 static-data file-image model;
- IRQSKYE's precise role and any index-0 behavior;
- exact semantics of TRANSFER_PALETTES;
- exact renderer/palette-shift semantics of WrtNonZero;
- palette-selection rules for KANO_P versus KANO3_P;
- broader palette ownership across other fighters/objects;
- semantic structure of KANO_ANITAB;
- unknown `0xABBFF..0xD2253` post-module/pre-debug region;
- eventual serializer/encoder for executable-resident palettes and related symbol-backed structures.

Unknowns must remain explicit. Do not fill them with ReWolf-derived behavior.

---

# 22. Round-trip/recompiler direction remains mandatory

For every newly understood format, plan both:

**decode** and **encode**.

Desired lifecycle:

`Binary → lossless IR → Binary`

For NEWPALS palette records, future serializer design should preserve:

- record ordering;
- original Watcom/module offsets;
- physical file-image offsets;
- declared length;
- all raw 15-bit color words;
- aliases / duplicate symbol starts;
- duplicate content relationships;
- module span provenance;
- unknown surrounding relationships;
- exact original bytes for no-edit round-trip.

The first compiler milestone for any format should be:

1. parse original;
2. serialize to lossless IR;
3. encode without edits;
4. compare output bytes to original;
5. require byte identity or a fully explained difference.

Do not build extraction-only representations that throw away information needed for reconstruction.

---

# 23. Generic architecture rule

Keep these boundaries:

## Generic mechanics

- MZ/LE parsing;
- LE object/page/fixup mechanics;
- Watcom debug-format parsing;
- provenance;
- bounded binary decoding;
- dependency/reference graph mechanics;
- lossless IR/round-trip infrastructure;
- binary diffing.

## MK-DOS family

Promote behavior only after independent repetition across multiple MK DOS games.

## MK1-specific interpretation

- handle table;
- sprite descriptors;
- Segment-2 static-data file-image reconciliation;
- NEWPALS palette module;
- Kano palette/animation relationships;
- other fixture-derived semantics.

Rule:

> **Generic in mechanics, specific in interpretation.**

---

# 24. Stop conditions for the next phase

Do not:

- treat every `_P` symbol as automatically assigned to a sprite/animation;
- assume KANO_P/KANO3_P selection semantics from their names;
- use IRQSKYE to explain source index 0 before deriving its role;
- use external WrtNonZero/TRANSFER_PALETTES descriptions as implementation rules;
- conflate static-data file-image coordinates with runtime addresses;
- discard aliases/duplicate relationships from palette IR;
- reopen B.10 without new direct evidence requiring it;
- investigate the unknown pre-debug tail without a bounded reason;
- generalize KANO_P one-based indexing to all MK1 palettes before testing;
- start MK2/MK3 before the current MK1 palette-selection path is sufficiently stable;
- begin destructive recompilation before no-edit round-trip infrastructure exists.

---

# 25. Current one-sentence state

> **MK1's surviving Watcom debug information has moved the project from heuristic palette hunting to verified structural ground truth: Segment-2 static data has a reproducible file-image base, exact `NEWPALS.ASM` is a fully tiled 123-record palette module, `KANO_P` and `KANO3_P` are verified adjacent 23-color palettes, KANO_P's observed sprite indices fit a one-based model exactly, and the next task is to derive the engine's actual palette ownership/selection path without importing unresolved external semantics.**

---

# 26. Continuation note — Pass 1E.3E implemented after this checkpoint

Direct implementation has begun on the next bounded pass, **1E.3E — Kano Palette Selection Reference Graph**. This does not supersede the verified 1E.3D.1 facts above.

Current implementation state:
- 1E.3E source exists and has been smoke-run against the authentic full MK1 fixture available in the project environment.
- It mechanically discovers two corresponding 9-entry all-palette tables containing KANO_P/KANO3_P at the same slot; original Watcom labels are `NORMAL_PALETTES` and `ALTERNATE_PALETTES`.
- It finds a nearby pair of indexed DWORD loads referencing those two table bases with the same EBX*4 index.
- The direct smoke export passes its internal authoritative gates.
- This remains **IMPLEMENTED / USER BROWSER VALIDATION PENDING** until a new user-generated JSON is independently reviewed.
- The gameplay condition selecting normal vs alternate remains UNKNOWN.

UI additions in this implementation:
- `Run What's Needed`
- `Export Latest`
- `Export All`

The quick-run path is dependency-aware and fail-closed; manual research controls remain available.

