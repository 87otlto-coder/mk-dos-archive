# MK DOS Archive — Handoff — Pass 1E.3O.4 Rayden Lightning Persistent Visual Placement Fixture

Date: 2026-09-26

## Status

**REAL-FIXTURE / RUNTIME VERIFIED AND CLOSED**

This pass was introduced because the 1E.3O.3 Kano heart-rip placement edit was runtime-safe but visually difficult to observe: the edited component was a very small, short-lived overlapping sprite. The user specifically identified Rayden's normal lightning projectile as a far better repeatable test fixture.

## Canonical fixture

- `MK1.EXE` size: 1,157,222 bytes
- SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`
- code file-image base: `0x00050A54`
- static-data file-image base: `0x0008CA54`

All authoritative qualification remains bound to this exact executable.

## What 1E.3O.4 establishes

The normal Rayden projectile is reached through the generic MOVES.ASM projectile path whose permanent Watcom symbols include:

- `THROW_LIGHTNING` — segment 1, `0x0001B515`
- `MAKE_PROJECTILE_OBJ` — segment 1, `0x0001B85D`
- `GET_CHAR_ANI` — segment 1, `0x00009CA6`
- `INIT_MULTI` — segment 1, `0x0001931E`
- `RAIDEN_ANITAB` — segment 2, `0x00018498`

Rayden remains mechanically character ID **2** from the earlier roster work.

### Projectile setup selection

Inside the qualified generic throw routine, the projectile setup animation is selected from the character-indexed byte table at Watcom static-data offset `0x0000F305`.

For Rayden / ID 2:

`table[2] = 60`

`RAIDEN_ANITAB[60] = 0x0001951E`

The data at `0x0001951E` is a zero-terminated `INIT_MULTI` setup list:

`[ 0x00019C20, 0 ]`

`0x00019C20` is permanent data symbol **HANDBO22**.

`HANDBO22` is a 16-byte setup descriptor whose first 12 bytes are the normal WITH_XY graphic descriptor and whose `+0x0C` value is `0x0000FBC4`, the permanent symbol **MORPH_P**.

`MORPH_P` is a verified 7-color palette record.

`HANDBO22` packed resource reference has file ID **36**, which is the verified handle-table entry for `GRAPHICS/RAIDEN.GRA`.

### Projectile travel animation selection

A second character-indexed byte table at Watcom static offset `0x0000F30E` selects the travel animation.

For Rayden / ID 2:

`table[2] = 34`

`RAIDEN_ANITAB[34] = 0x00019444`

The recovered stream has two contiguous phases.

Initial phase at `0x00019444`:

- `0x1949E` → `[HANDBO4, 0]`
- `0x194A6` → `[HANDBO5, 0]`
- `0x194AE` → `[HANDBO8, 0]`
- `0x194B6` → `[HANDBO9, 0]`
- `0` terminator

Because the animation cursor is advanced before the terminator return, subsequent `NEXT_ANIRATE` calls continue at `0x00019458`.

Continuation phase:

- `HANDBO10`
- `HANDBO11`
- `HANDBO12`
- `HANDBO13`
- `HANDBO14`
- `HANDBO15`
- `HANDBO16`
- `HANDBO17`
- animation opcode `1` / STREAM_JUMP → `0x00019468`

The jump target is the beginning of the final four continuation records, establishing the persistent loop:

**HANDBO14 → HANDBO15 → HANDBO16 → HANDBO17 → repeat**

This is why the Rayden projectile is a much better placement-validation fixture than the heart-rip component: the edited visual persists through a repeatable move and a repeating animation loop.

All 13 descriptors used by the controlled fixture (`HANDBO22` plus the twelve qualified travel descriptors) resolve to file ID 36 / `GRAPHICS/RAIDEN.GRA`.

## Controlled semantic edit

The controlled O4 runtime fixture changes only the descriptor-local `y` field of the following symbols:

`HANDBO22`, `HANDBO4`, `HANDBO5`, `HANDBO8`, `HANDBO9`, `HANDBO10`, `HANDBO11`, `HANDBO12`, `HANDBO13`, `HANDBO14`, `HANDBO15`, `HANDBO16`, `HANDBO17`.

Each field receives:

`y := y + 24`

Examples:

- `HANDBO22`: `11 → 35`
- `HANDBO4`: `-32 → -8`
- `HANDBO9`: `-21 → 3`
- `HANDBO14`: `-22 → 2`
- `HANDBO15`: `-24 → 0`

No descriptor X values, dimensions, packed GRA references, palette bytes, frame records, stream commands, projectile world coordinates, velocities, collision data, damage values, or move/input code are modified.

## Exact binary result

- original SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`
- edited SHA-256: `44e3b0f1f59a22bbfdd0c576e5bc236470844624d87c232283453a10477c4adf`
- semantic descriptor fields edited: **13**
- actual changed executable bytes: **21**
- unexpected changed bytes: **0**
- reversal restores the original SHA-256 exactly

The byte count is 21 rather than 26 because several signed-int16 edits retain the same high byte and therefore change only one physical byte.

## New source

Added:

- `src/games/mk1/research/raydenLightningPlacementFixture.ts`
- `src/components/RaydenLightningPlacementPanel.tsx`
- `scripts/run-rayden-lightning.mjs`

Updated:

- `src/components/ResearchQuickActions.tsx`
- `src/appMetadata.ts`
- `metadata.json`
- `package.json`
- `README.md`
- `docs/CURRENT.md`
- `docs/RESEARCH.md`

The research workflow is now 14 stages and ends with 1E.3O.4.

The new panel reports the qualified route, persistent four-frame loop, all before/after local Y values, binary diff count, and provides a runtime bundle.

## Runtime test

Use a separate copy of the MK1 installation and replace only `MK1.EXE` with the bundled O4 executable.

Then:

1. Play as Rayden.
2. Perform his normal lightning projectile move repeatedly.
3. Compare the visual to the normal game.

Expected result:

> The lightning visual should travel visibly lower than normal by roughly 24 descriptor pixels, while the gameplay path/collision and move behavior remain normal.

This is intentionally much easier to repeat and visually inspect than Kano's fatality.

A screenshot or short video is ideal. If gameplay remains normal but the visual displacement is not clear, record that distinction rather than promoting the placement effect to runtime-verified.

## Validation performed in implementation environment

- authoritative O4 qualification executed against canonical `MK1.EXE`: **passed**
- report status: `STATIC_VALIDATION_PASSED_RUNTIME_PENDING`
- changed bytes: **21**
- unexpected changes: **0**
- reverse hash: canonical hash exactly
- persistent loop: `HANDBO14..17` mechanically qualified
- targeted TypeScript validation for O4 core module: **passed**
- `node --check scripts/run-rayden-lightning.mjs`: **passed**

The full npm/Vite/Vitest suite was not claimed because the supplied source snapshot does not contain installed `node_modules` in this execution environment.

## Evidence discipline

Current confidence:

- Rayden ID 2: **VERIFIED from prior roster work**
- normal projectile generic route: **VERIFIED static dataflow**
- animation index 60 setup binding: **VERIFIED**
- `HANDBO22` setup descriptor / `MORPH_P` link: **VERIFIED**
- animation index 34 HANDBO travel binding: **VERIFIED**
- persistent `HANDBO14..17` loop: **VERIFIED**
- +24 local-Y binary write-back and exact reversal: **VERIFIED static**
- visible in-game displacement: **RUNTIME VERIFIED by user observation on 2026-09-26**

Do not collapse the last two into one claim.

## Recommended next step

The O4 DOSBox observation succeeded: the lightning was visibly displaced while gameplay otherwise remained normal. 1E.3O.4 is therefore closed and the bounded local placement operation is promoted into the first user-editable descriptor placement UI in Pass 1E.3O.5.

The promoted editor boundary is:

- select a qualified descriptor/frame;
- drag or enter X/Y;
- preview before/after;
- serialize through the semantic model;
- show exact diff/provenance;
- export a patched test bundle;
- remain fail-closed for relocation, resizing, add/remove parts, or uGRA pixel replacement.

Pass 1E.3O.5 implements this bounded editor while preserving the same fail-closed restrictions.
