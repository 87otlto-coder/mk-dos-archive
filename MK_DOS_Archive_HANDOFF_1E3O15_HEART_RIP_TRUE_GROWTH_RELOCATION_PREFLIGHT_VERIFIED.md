# MK DOS Archive — Handoff — Pass 1E.3O.15 Heart-Rip True-Growth Relocation Preflight

Date: 2026-09-29

## Status

**VERIFIED / READ-ONLY PREFLIGHT COMPLETE / RELOCATION WRITER NOT ESTABLISHED**

## Authoritative source snapshot

- archive: `MK-DOS-1E3O15-source.zip`;
- SHA-256: `61a57e4f486664bbd1144eb61b22bc91268d71d3ca9796b1a30995160c3cd689`;
- ZIP integrity: passed.

This O15 package supersedes the corrected O14 package as the current development source snapshot. The O14 stale `APP_MILESTONE` defect is fixed; the current banner identifies Pass 1E.3O.15.


Pass 1E.3O.15 is a read-only compiler-leverage pass. It does **not** relocate anything and does **not** introduce a writer. It asks two narrow prerequisites for future true record growth:

1. for the cleanest first growth fixture, can the direct dword inbound reference surface be closed mechanically?;
2. can any file-backed Object-2 zero run be promoted to safe allocatable storage under stronger Watcom ownership evidence?

The pass deliberately preserves the project's rule that **zero bytes are not free storage**.

## Verified prerequisite carried forward

O14 is now closed as:

`FULL_HEART_RIP_FIXED_LAYOUT_COMPOSITION_AUTHORING_VERIFIED`

The final normal-app transaction changed exactly 8 expected executable bytes, changed 0 unexpected bytes, reparsed all seven qualified frame records and the requested descriptor placement, reported aliasing correctly, and reversed exactly to canonical MK1 SHA-256.

O9 remains authoritative as a historical relocation census, but its old 20-byte fourth-part assumption was superseded by O10 for `heart_2`. O15 therefore uses a **genuine** growth case instead of reusing the superseded O9 target.

## O15 true-growth fixture

Target:

`heart_0`

Current record:

- Watcom offset: `0x0000B244`;
- physical: `0x00097C98`;
- allocation: 8 bytes;
- current semantic form: `[KHEART1, 0]`;
- current part count: 1.

Proposed research-only growth form:

`[p0, p1, 0]`

This requires 12 bytes.

The immediately following `heart_1` record starts at Watcom `0x0000B24C`, exactly 8 bytes after `heart_0`, so:

- growth bytes required: 4;
- bytes available in place: 0;
- in-place growth: rejected.

The already-qualified `MSU_HEART` setup has four linked part objects, so a two-part target is within the established object-count capacity. O15 does **not** claim a relocated two-part `heart_0` has been runtime tested.

## Direct inbound rewrite surface

O15 reuses the O9 semantic sequence census and independently rescans canonical executable bytes for the little-endian dword value of `heart_0`'s frame-record offset.

Developer validation result:

- qualified semantic inbound references: 1;
- sequence: `PRIMARY`;
- sequence frame index: 0;
- sequence cell Watcom offset: `0x0000B21C`;
- sequence cell physical offset: `0x00097C70`;
- raw whole-EXE dword occurrences of `0x0000B244`: 1;
- unexplained raw occurrences: 0;
- the raw occurrence is exactly the qualified sequence cell.

O15 therefore establishes the bounded **direct dword inbound surface** for this fixture.

Important boundary:

This does **not** prove that no computed/derived runtime reference could ever exist. The report wording is intentionally limited to direct little-endian dword occurrences and the qualified semantic sequence cell.

## Stronger storage ownership reconnaissance

O9 scanned file-backed LE Object-2 zero runs at a 20-byte threshold and refused to promote any run to safe storage.

O15 corrects the threshold for the actual `heart_0` growth problem:

- required relocated record bytes: 12;
- file-backed Object-2 zero-run candidates >=12 bytes: **70**.

O15 then overlays Open Watcom Segment-2 address-info ownership. The address-info record has **136** module ranges and covers the relevant static-data span by cumulative linked-module ranges.

Developer validation result:

- zero-run candidates: 70;
- candidates intersecting module-owned ranges: 70;
- candidates unassigned by Watcom Segment-2 address info: 0;
- candidates fully contained by one module range: 70;
- candidates in the target module: 0;
- safe candidates promoted: 0.

The `heart_0` record itself is owned by:

- module: `MKBLOOD.ASM`;
- module index: 14;
- Watcom range: `0x0000B070..0x0000B298`;
- range length: 552 bytes.

No >=12-byte zero-run candidate exists inside that target module range. All 70 current candidates belong to other linked module ranges.

Some candidate-start values also occur elsewhere as raw dwords. O15 reports those counts as additional caution, but absence of such a reference is **not** treated as proof of free space.

## Storage interpretation

O15 uses three fail-closed candidate labels:

- `QUALIFIED_SEMANTIC_REGION_ZERO_RUN_UNQUALIFIED`;
- `MODULE_OWNED_ZERO_RUN_UNQUALIFIED`;
- `UNASSIGNED_ZERO_RUN_UNQUALIFIED`.

Every candidate has:

`safeForAllocation: false`

Reasoning:

- module ownership proves the run belongs to a linked module address range, not that the bytes are free;
- internal module padding would require affirmative module-specific padding/liveness evidence before reuse;
- an unassigned run, if one existed, would still not be safe merely because address-info did not assign it;
- zero fill, lack of a global symbol, or lack of a raw reference is not sufficient allocation proof.

## Machine verdict

Expected O15 verdict:

`HEART0_DIRECT_DWORD_INBOUND_SURFACE_ESTABLISHED_STORAGE_ALLOCATION_NOT_ESTABLISHED`

Interpretation:

- a clean first true-growth fixture is established;
- in-place growth is impossible;
- the bounded direct sequence-pointer rewrite surface is mechanically clean;
- safe destination storage is still **not established**;
- therefore relocation remains blocked on allocation/storage qualification, not on the direct pointer census.

## New source

Added:

- `src/games/mk1/research/heartRipGrowthRelocationPreflight.ts`
- `scripts/run-heart-rip-growth-relocation-preflight.mjs`
- `MK_DOS_Archive_HANDOFF_1E3O15_HEART_RIP_TRUE_GROWTH_RELOCATION_PREFLIGHT.md`
- `MK_DOS_Archive_HANDOFF_1E3O14_FULL_HEART_RIP_FIXED_LAYOUT_COMPOSITION_AUTHORING_VERIFIED.md`

Updated:

- `src/components/ResearchQuickActions.tsx`
- `src/appMetadata.ts`
- `metadata.json`
- `package.json`
- `README.md`
- `docs/CURRENT.md`
- `docs/RESEARCH.md`

The normal research workflow now ends at **24/24**.

## Validation already performed

### Source-level

- O15 core targeted TypeScript typecheck: passed;
- changed `ResearchQuickActions.tsx` syntax/transpile check: passed;
- O15 smoke-script `node --check`: passed;
- metadata/package JSON parse: passed.

The packaged source snapshot does not include installed `node_modules`, so the esbuild-based full smoke command itself is not claimed to have run inside this packaging environment.

### Developer canonical-byte validation

A canonical byte image was reconstructed by reversing the already-verified O14 user bundle's exact eight changed bytes. The result hashes exactly to the canonical MK1 SHA-256:

`750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`

This was used only as a byte-equivalent developer validation fixture, **not** as a substitute for the final user-directory provenance gate.

The O15 core executed successfully against that byte image plus authentic returned O9/O14 model evidence:

- status: `SUCCESS`;
- all 12 checks passed;
- direct dword inbound surface: closed for `heart_0`;
- 70 Object-2 zero-run candidates at the 12-byte threshold;
- 70/70 Watcom module-owned;
- 0 unassigned;
- 0 in `MKBLOOD.ASM`;
- 0 promoted safe;
- no relocation writer enabled.

## Returned normal-app user-directory validation

The user completed the required read-only 24/24 run against the untouched canonical installation and returned:

`mk1_heart_rip_growth_relocation_preflight_2026-09-29T16-06-16-269Z.json`

Artifact SHA-256:

`81e6912d6906b579c6c88a85ed62ab81b4de19bd4699011953cd68fb2e6f06c5`

Canonical provenance in the returned report:

- source kind: `user-loaded-directory`;
- filename: `MK1.EXE`;
- byte length: 1,157,222;
- SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`;
- synthetic: false;
- artifactGeneratedByTest: false.

The user-directory result reproduces the developer prediction exactly:

- `heart_0`: current 1 part / 8 bytes; proposed 2 parts / 12 bytes; growth required 4 bytes; in-place bytes available 0;
- one qualified semantic inbound cell at `PRIMARY:0`, physical `0x00097C70`;
- one raw whole-EXE occurrence of the `heart_0` record value;
- zero unexplained raw occurrences;
- direct dword inbound surface closed for the bounded fixture;
- Watcom Segment 2 target owner: `MKBLOOD.ASM`, range `0x0000B070..0x0000B298`;
- 70 file-backed Object-2 zero runs >=12 bytes;
- 70/70 fully contained in linked-module-owned ranges;
- 0 unassigned;
- 0 in `MKBLOOD.ASM`;
- 0 promoted safe;
- all 12 validation checks pass;
- status: `SUCCESS`.

Returned verdict:

`HEART0_DIRECT_DWORD_INBOUND_SURFACE_ESTABLISHED_STORAGE_ALLOCATION_NOT_ESTABLISHED`

This closes O15.

## Final O15 classification

**VERIFIED / READ-ONLY PREFLIGHT COMPLETE / RELOCATION WRITER NOT ESTABLISHED**

O15 establishes a useful negative boundary: direct pointer census is tractable for the chosen fixture, but there is still no affirmative safe-storage proof. No writer should be added merely because candidate bytes are zero-filled.

## Product-direction clarification after O15

The user clarified the project goal on 2026-09-29: the end product is primarily about **extracting, reconstructing, and exporting assets correctly**, not importing arbitrary new content back into the original EXE.

The extensive write-back work remains valuable because it produced localized proof of composition, placement, palette ownership, topology, and aliasing. Going forward:

- retain exact no-edit serialization and bounded writers as internal validation instruments where useful;
- do not make arbitrary EXE relocation or general import/recompilation a required end-user feature;
- prioritize broadening MK1 understanding and exportability;
- preserve the distinction between localized proof and universal grammar;
- later validate MK2/MK3 independently rather than assuming MK1 structures transfer.

## Recommended next pass

Proceed to a read-only **Pass 1E.3O.16 — MK1 Animation Exportability Census**, beginning with Kano because the existing heart-rip evidence gives the strongest ground truth. Enumerate animation-table entries, resolve known structures fail-closed, classify exportable versus partially understood versus unknown grammar, track aliases/shared storage, and identify the unknown structures whose resolution would unlock the most export coverage.

Do not pursue relocation further unless extraction/reconstruction actually requires it or affirmative allocation/liveness evidence appears. Do not pursue uGRA encoding/import merely as a product feature; investigate encoding only if it is needed to validate the decoder or answer a concrete research question.

