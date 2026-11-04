# MK DOS Archive — Handoff — Pass 1E.3O.15 Heart-Rip True-Growth Relocation Preflight

Date: 2026-09-29

## Status

**IMPLEMENTED / TARGETED TYPECHECK PASSED / BYTE-EQUIVALENT CANONICAL DEVELOPER VALIDATION PASSED / NORMAL-APP USER-DIRECTORY EXPORT PENDING**

## Source package note

This handoff is included inside the O15 source tree, so it does not embed a self-referential archive hash. The exact current source ZIP name/hash is recorded in the external master handoff and Library manifest. The O14 stale `APP_MILESTONE` defect is fixed; the current banner identifies Pass 1E.3O.15.

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

## Required normal-app validation

Use the untouched canonical MK1 installation.

1. Open the O15 build.
2. Run **What's Needed** through **24/24**.
3. Do not edit or compile anything; O15 is read-only.
4. Export Latest.
5. Return:

`mk1_heart_rip_growth_relocation_preflight_....json`

Acceptance gate:

- canonical source provenance;
- O9 and O14 prerequisites bound correctly;
- `heart_0` 8->12-byte growth fixture reproduced;
- one semantic / one raw direct dword inbound / zero unexplained;
- Watcom target owner = `MKBLOOD.ASM`;
- Object-2 zero-run threshold = 12 bytes;
- all candidates classified, none promoted safe;
- all validation checks pass.

## Next decision after O15

If the user-directory report reproduces the developer result, **do not force a relocation writer**. The pass will have shown that pointer rewriting is no longer the first blocker, while affirmative allocatable storage remains unresolved.

The recommended next high-leverage branch is then **uGRA pixel encoding/import**, unless a new source of affirmative allocation metadata is discovered. Relocation should be reopened only when there is evidence strong enough to qualify actual storage ownership/liveness rather than merely identifying zeros.
