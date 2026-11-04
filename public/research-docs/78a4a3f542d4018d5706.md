# MK DOS Archive — Pass 1E.3N.1 Opponent Access Harness

25 September 2026

## Purpose

Pass 1E.3N.1 is a bounded research-convenience pass. It does **not** alter combat, AI, damage, rendering, or stage-selection logic.

Its goal is to recover the original single-player opponent-order data path well enough to make a late-game character the **first encounter** by editing only the first token of the game's original ladder maps. This lets runtime identity/palette tests proceed without requiring a full arcade ladder clear.

The immediate use is the still-pending Pass 1E.3N slot-7 `GONGORO_P` runtime qualification.

Future stage/level access is explicitly deferred until stage-selection mechanics are independently researched. When that phase arrives, use the same principle: patch the smallest verified selection-data layer rather than gameplay code.

---

## Prerequisites carried forward

Canonical original fixture:

- `MK1.EXE`
- size: **1,157,222 bytes**
- SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`

Verified coordinate model used here:

- Segment-1 code file-image base: `0x00050A54`
- Segment-2 static-data file-image base: `0x0008CA54`

Prerequisite reports required by the implementation:

- 1E.3F palette-selection semantics — real-fixture verified;
- 1E.3H no-edit round trip — same authentic executable and exact hash.

The harness re-reads and hashes the selected executable before producing any edit.

---

## Recovered one-player ladder machinery

Exact surviving Watcom symbols include:

- `WHO_IS_NEXT` — Segment 1 offset `0x0000C500`, physical `0x0005CF54`;
- `OFFSET_TO_OCHAR` — Segment 1 offset `0x0000DE1E`, physical `0x0005E872`;
- `MAP_START` — Segment 2 offset `0x00024CC4`;
- `MAP_POSITION` — Segment 2 offset `0x00024CC8`;
- `BATTLE_NUM` — Segment 2 offset `0x00024CCC`;
- `C_GORO_WINS` — Segment 2 offset `0x00024D08`;
- `C_EMP_WINS` — Segment 2 offset `0x00024D0C`.

### Four-map selector

A unique code sequence at physical `0x0005E7F7` selects one of four map pointers and stores it to `MAP_START`.

Map-pointer table:

- Watcom offset: `0x0000A310`
- physical: `0x00096D64`
- four pointers: `0xA2D0`, `0xA2E0`, `0xA2F0`, `0xA300`

The four 16-byte maps begin at:

- `0x00096D24` — original first token `0`
- `0x00096D34` — original first token `5`
- `0x00096D44` — original first token `3`
- `0x00096D54` — original first token `4`

All four terminate with `0xFF` and contain the common tail `..., 6, 7, FF`.

`WHO_IS_NEXT` independently reproduces the single-player data flow that reads the next signed token through `MAP_START` and `MAP_POSITION`.

Classification:

**VERIFIED_FOUR_MAP_SINGLE_PLAYER_LADDER_SELECTOR**

---

## `OFFSET_TO_OCHAR` token mapping

`OFFSET_TO_OCHAR` indexes a seven-pointer table at:

- Watcom offset: `0x0000A35F`
- physical: `0x00096DB3`

The seven selected-fighter rows are nine-byte permutations of character IDs `0..8`:

- row 0: `1,2,3,4,5,6,7,8,0`
- row 1: `0,2,3,4,5,6,7,8,1`
- row 2: `0,1,3,4,5,6,7,8,2`
- row 3: `0,1,2,4,5,6,7,8,3`
- row 4: `0,1,2,3,5,6,7,8,4`
- row 5: `0,1,2,3,4,6,7,8,5`
- row 6: `0,1,2,3,4,5,7,8,6`

Therefore:

- tokens `0..5` are player-relative ordinary opponents;
- **token 6 → character ID 7 in all seven rows**;
- **token 7 → character ID 8 in all seven rows**;
- **token 8 → the currently selected playable character in all seven rows**.

Token 8 is therefore a useful mirror/control route.

Classification:

**VERIFIED_PLAYER_RELATIVE_TOKEN_TO_CHARACTER_ID_TABLE**

---

## Special ID associations

Separate executable code compares a winner/fighter ID against 7 and increments the exact Watcom counter `C_GORO_WINS` when it matches.

A parallel comparison against ID 8 increments `C_EMP_WINS`.

This establishes these bounded code-side associations:

- character ID 7 ↔ `C_GORO_WINS`;
- character ID 8 ↔ `C_EMP_WINS`.

For UI clarity, token 6 is described as **Goro-associated ID 7** and token 7 as **EMP-associated ID 8**.

Do not use `EMP` alone to assert a final human-readable character name until runtime and/or additional direct code evidence closes that identity.

---

## Implemented access patch

The exported access harness patches only the first byte of each of the four recovered ladder maps.

For token 6, the four edits are:

- `0x00096D24`: `00 → 06`
- `0x00096D34`: `05 → 06`
- `0x00096D44`: `03 → 06`
- `0x00096D54`: `04 → 06`

Independent byte reconstruction on the canonical fixture gives:

- exactly **4 changed bytes**;
- no code bytes changed;
- no stage-selection bytes changed;
- reversal restores the original executable byte-for-byte;
- token-6 access-only SHA-256: `92d1c56b6fd7ff2602a9a50efa4a7c7fd597875cc26dab1feeafdf37c62dee8f`;
- token-7 access-only SHA-256: `36927e17a73f2ab78d76e8d9969e2b33701241273584094939fe64d131d4ab37`.

The tool exposes tokens `0..8`, but ordinary tokens remain explicitly labelled player-relative rather than assigned a fixed fighter name.

---

## Combined slot-7 test

For the immediate 1E.3N question, the UI also builds a two-layer composite bundle:

**Access layer**

- four ladder first bytes → token 6.

**Asset layer**

- `GONGORO_P`, record 101, physical `0x0009CF2A..0x0009CF5A`;
- 23 colour words → `0x7C1F` magenta;
- record header remains unchanged.

Independent reconstruction on the canonical fixture gives:

- access changes: **4 bytes**;
- palette changes: **46 bytes**;
- total union: **50 bytes**;
- unexpected changes: **0**;
- composite SHA-256: `a83d3601a98ecae421a7f0dba0ac3a47e41ebc026e1912957695b8c7932ced22`;
- reversing all 50 changes restores the canonical original SHA-256 exactly.

Runtime is still pending. The expected experiment is deliberately phrased without assuming identity from the palette symbol:

> Start one-player mode with any normal selectable fighter. The original game machinery should resolve forced token 6 to character ID 7. Record the actual first opponent and whether that opponent consumes the magenta `GONGORO_P` palette.

If the first opponent is the anticipated Goro encounter and it alone consumes the edited palette, the runtime test can close both the access route and the pending slot-7 palette consumer identity in one observation.

---

## Secret green-ninja route discovered but not exposed

The same bounded executable review found a distinct route involving:

- `F_GNINJA` data flag;
- `GNINJA_P` palette;
- a code path that sets `F_GNINJA = 1`;
- a nearby write installing character ID `4` through a selected-player character pointer;
- `PLAYER_NORMPAL`, which checks the green-ninja state and conditionally selects `GNINJA_P`.

The executable also contains Reptile-related strings elsewhere, but this pass does **not** use those strings to collapse the whole mechanism into a completed encounter model.

Current classification:

**VERIFIED_COMPOSITE_GREEN_NINJA_STATE_PATH_ACCESS_DEFERRED**

The surrounding encounter/stage state has not yet been reduced to a minimal reversible access patch. Therefore no secret-green-ninja shortcut is exposed in 1E.3N.1.

This is intentional: support inaccessible characters only when the original state path is sufficiently qualified, rather than inventing a synthetic character ID.

---

## UI / exports

New panel:

**Opponent access harness · 1E.3N.1**

Capabilities:

- first-encounter token dropdown (`0..8`);
- visible qualified first-byte offsets;
- stable token 6/7 and mirror token 8 mapping evidence;
- access-only ZIP export;
- dedicated **Goro access + GONGORO_P magenta** composite export for the immediate slot-7 test;
- green-ninja evidence shown read-only with access explicitly deferred.

Every export:

- fresh-reads the selected original `MK1.EXE`;
- verifies SHA-256 against the qualification report;
- recomputes the byte edit;
- rejects bytes outside the declared patch offsets;
- hashes the output;
- reverses the edit and requires exact restoration of the original hash;
- leaves runtime as `NOT_TESTED` until the user actually runs it.

`Run What's Needed` now runs eight dependency-aware stages through 1E.3N.1.

---

## Reproducibility / validation status

Independent raw-binary checks against the canonical executable reproduce:

- four ladder-map starts and original first tokens;
- unique four-way selector at `0x5E7F7`;
- pointer table at `0x96D64`;
- seven 9-byte `OFFSET_TO_OCHAR` rows;
- token 6 → ID 7, token 7 → ID 8, token 8 → current fighter;
- `C_GORO_WINS` / `C_EMP_WINS` code-side associations;
- token-6 and token-7 four-byte patch hashes;
- 50-byte token-6 + `GONGORO_P` composite diff and exact reversal.

The source snapshot does not contain installed npm dependencies, so a full local Vite/Vitest run is not claimed in this packaging environment. The source includes a new direct smoke command for environments after `npm install`:

`npm run smoke:opponent-access -- /path/to/mk1 /path/to/evidence`

---

## Immediate user test

1. Extract the source ZIP completely.
2. Run `Launch_Source.bat`.
3. Load the **untouched original MK1 installation**.
4. Click **Run What's Needed**.
5. In **Opponent access harness · 1E.3N.1**, leave the target on **Special token 6 · Goro-associated ID 7**.
6. Click **Download Goro access + GONGORO_P magenta bundle**.
7. Put the bundled `MK1.EXE` into a separate full test installation.
8. Start one-player mode and select any normal fighter.
9. Capture the first encounter and report:
   - actual opponent identity;
   - whether the opponent is magenta;
   - whether the match initializes/plays normally;
   - whether fighter/stage/HUD elements outside the target remain normal.
10. Return the composite ZIP or JSON plus a screenshot.

After that, token 7 can be used as an access-only test for character ID 8 / `C_EMP_WINS` without requiring another implementation pass.

---

## Current status

- selectable-roster normal/alternate palette mechanism — strongly supported by repeated runtime evidence;
- 1E.3N slot 7 `GONGORO_P` — static edit verified; runtime identity still pending;
- **1E.3N.1 opponent access harness — IMPLEMENTED / BINARY-MECHANICS QUALIFIED / USER RUNTIME PENDING**;
- token 6 → ID 7 / `C_GORO_WINS` — mechanically qualified;
- token 7 → ID 8 / `C_EMP_WINS` — mechanically qualified;
- token 8 → current playable character — mechanically qualified;
- green-ninja composite state path — mechanically observed; access patch intentionally deferred;
- stage/level access harness — deferred until stage-selection research.

## Main new/changed files

- `src/games/mk1/research/opponentAccessHarness.ts`
- `src/components/OpponentAccessHarness.tsx`
- `src/components/ResearchQuickActions.tsx`
- `scripts/run-opponent-access.mjs`
- `package.json`
- `src/appMetadata.ts`
- `metadata.json`
- `README.md`
- `docs/CURRENT.md`
- `docs/RESEARCH.md`

---

## Runtime closeout added after original 1E.3N.1 handoff

The user subsequently ran both special access routes in DOSBox.

- Token 6 / ID 7 produced **GORO** as the first opponent.
- The token-6 + `GONGORO_P` magenta composite visibly recolored Goro while the selected fighter remained normally colored.
- Token 7 / ID 8 produced **SHANG TSUNG** as the first opponent.

These observations close the runtime identities of the two special IDs and close the bounded slot-7 `GONGORO_P` consumer question. The screenshots are runtime observations rather than cryptographic proof of the executable loaded at capture time; the original machine-generated reports therefore remain unchanged.

The user's gameplay context confirms that the final endurance encounter, Goro, and Shang Tsung normally take place in Goro's Lair. Both forced boss routes also used that stage. Preserve this as useful stage/progression evidence, but defer the exact stage-selection mechanism to a dedicated future stage pass.

Continuation moved to **Pass 1E.3N.2 — Single-Player Ladder Grammar**.
