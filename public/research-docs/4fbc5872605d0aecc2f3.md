# MK DOS Archive — Pass 1E.3L Fighter Palette Ownership Scaffold

25 September 2026

## Prior pass closeout

Pass 1E.3K is now **REAL-FIXTURE / RUNTIME VERIFIED AND CLOSED for its bounded claim**.

The returned `mk1_palette_entry_edit_v1` artifact targets `KANO3_P` record 85 at physical `0x0009CC2A..0x0009CC5A`. The supplied edited executable hashes exactly to the artifact's edited SHA-256 (`22cfa422d4f30cc5e3572055ab7c46637722e6d6d44e0cf4d1ddb16c47d39aa8`). All 23 KANO3_P words in that EXE are `0x4E56`; 22 words required actual changes because one source word already matched. There are 44 changed bytes, no unexpected changes, and reversing the reported edits restores the original SHA-256 `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`.

The runtime capture shows Kano versus Kano with the screen-right Kano using the flat edited alternate palette, while the screen-left Kano, stage, and HUD retain their expected appearance. This validates actual KANO3_P alternate use on the already-verified same-character alternate-table path. It does **not** establish a permanent Player-2 ownership rule.

The normal palette appearing "reset" is expected. Each editor export starts from the untouched 1E.3H baseline and applies only the selected target. 1E.3J and 1E.3K edits intentionally do not compound.

---

## 1E.3L bounded question

Can the verified `NORMAL_PALETTES` / `ALTERNATE_PALETTES` mechanism be promoted from a Kano-specific runtime result into a mechanically grounded fighter-slot ownership scaffold, while still avoiding untested roster-wide runtime claims?

The pass must:

1. enumerate all nine verified table slots;
2. tie the table index mechanically to player character identity;
3. recover roster-name alignment without importing external roster ordering;
4. nominate exactly one non-Kano slot for the next runtime edit test.

---

## Implemented evidence

### Nine-slot palette census

The existing verified table pair is enumerated as nine corresponding 23-color palette slots. The first seven normal / alternate pairs are mechanically aligned to the discovered roster names below. Slots 7 and 8 remain represented by their recovered palette symbols without forcing a roster-name claim from the seven-name run.

Known palette pairs include:

- slot 0: `GRIMM_P` / `GRIMM3_P`
- slot 1: `KANO_P` / `KANO3_P`
- slot 2: `RAIDEN_P` / `RAIDEN3_P`
- slot 3: `LUKANG_P` / `LUKANG3_P`
- slot 4: `YNINJA_P` / `YNINJA3_P`
- slot 5: `BNINJA_P` / `BNINJA3_P`
- slot 6: `LIZ_P` / `LIZRED_P`
- slot 7: `GONGORO_P` / `GONGORO_P`
- slot 8: `YANG_P` / `EMP_P` alias record on both sides

### Character identity becomes palette-table index

The 1E.3L implementation independently scans the executable for the relevant initialization chain instead of hard-coding function addresses as proof.

Fixture result:

- `P1_CHAR` load/call sites: `0x0005853A`, `0x000586F5`
- both call wrapper `0x0005A876`
- `P2_CHAR` load/call sites: `0x00058582`, `0x00058701`
- both call wrapper `0x0005A8E7`
- both wrappers preserve EAX and converge on common initializer `0x0005A9A7`
- common initializer restores the original EAX and stores it into object field `+0x48` at `0x0005A9CC`, bytes `5B 58 89 47 48`
- the already-verified palette-selection state machine indexes the normal / alternate palette tables using that same object `+0x48` field

Classification when all gates reproduce:

`VERIFIED_PCHAR_TO_OBJECT_TABLE_INDEX`

This is the key mechanism promotion: the palette-table index is mechanically tied to the character identity value used to initialize the player object.

### Roster-name alignment

A generic bounded scan of pre-NEWPALS static data searches for aligned arrays of pointers to distinct uppercase strings. The unique maximal run is seven DWORDs:

- physical start: `0x0009A714`
- Watcom static-data offset: `0x0000DCC0`
- target span: 44 bytes
- slot order: `CAGE`, `KANO`, `RAYDEN`, `LIU KANG`, `SCORPION`, `SUB-ZERO`, `SONYA`

The same run has an indexed DWORD use at physical `0x0006782A` with bytes `8B 3C 95 C0 DC 00 00`, i.e. an EDX*4 indexed read of the recovered table.

Classification:

`CORROBORATING_ROSTER_NAME_INDEX_RUN`

The name run is corroborating identity evidence; the stronger mechanism evidence remains P*_CHAR → object +0x48 → palette-table index.

---

## First non-Kano runtime target

Slot 0 is now the bounded next test:

- roster alignment: `CAGE`
- normal palette: `GRIMM_P`
- alternate palette: `GRIMM3_P`

The application exposes a separate **First non-Kano ownership test · GRIMM_P / CAGE · 1E.3L** editor only when the ownership scaffold qualifies.

The exported bundle changes only selected `GRIMM_P` words, rebuilds from the original 1E.3H baseline, verifies exact changed bytes, reparses the palette module, and verifies reversal. `GRIMM3_P` remains unchanged.

### User test

1. Extract the source completely and run `Launch_Source.bat`.
2. Load the untouched original MK1 installation.
3. Click **Run What's Needed**.
4. Confirm the 1E.3L ownership panel succeeds.
5. In the Cage editor, make `GRIMM_P` extremely obvious (a single flat colour is fine for this test).
6. Download the Cage test bundle.
7. Put its `MK1.EXE` in a separate complete MK1 test installation.
8. Run **Johnny Cage against a different fighter**.
9. Return the generated palette-entry JSON, edited EXE, and screenshot with both fighters/stage visible.

Expected bounded observation: Cage changes while the opposing fighter, stage, and HUD remain normal. If that occurs and the bundle mechanically reconciles, slot-0 normal ownership can be promoted to runtime-verified.

---

## Validation performed in this checkpoint

Independent byte-level reconstruction of the authentic original executable from the supplied 1E.3K edited EXE plus its reversible edit report reproduces the canonical original SHA-256.

Against those original bytes, the 1E.3L discovery mechanics independently reproduce:

- unique maximal seven-name pointer run at `0x9A714` / Watcom `0xDCC0`;
- names `CAGE`, `KANO`, `RAYDEN`, `LIU KANG`, `SCORPION`, `SUB-ZERO`, `SONYA`;
- one indexed use at `0x6782A`;
- P1_CHAR sites and wrapper target;
- P2_CHAR sites and wrapper target;
- common initializer `0x5A9A7`;
- restored-EAX store to object `+0x48` at `0x5A9CC`.

The changed research modules and UI paths pass a targeted TypeScript compile using the available TypeScript 5.8.3 compiler and temporary declarations for unavailable UI package typings.

A complete npm/Vite/Vitest run is **not claimed** in this environment. `npm ci` could not complete here and left incomplete dependency directories; these are removed from the distributed source package. `Launch_Source.bat` remains responsible for installing dependencies in the user's normal environment.

---

## Status

- **1E.3J normal KANO_P editor:** runtime corroborated / retained
- **1E.3K alternate KANO3_P editor:** REAL-FIXTURE / RUNTIME VERIFIED — CLOSED for bounded claim
- **1E.3L fighter ownership scaffold:** IMPLEMENTED; static mechanics independently reproduced; user browser artifact + first Cage runtime test pending
- **all-fighter runtime ownership:** NOT ESTABLISHED
- **combined multi-palette export:** NOT IMPLEMENTED; current single-target baseline reconstruction is intentional

## Main new/changed files

- `src/games/mk1/research/fighterPaletteOwnership.ts`
- `src/games/mk1/research/paletteEntryEdit.ts`
- `src/components/CagePaletteEditor.tsx`
- `src/components/ResearchQuickActions.tsx`
- `src/tests/paletteEntryColors.test.ts`
- `docs/CURRENT.md`
- `docs/RESEARCH.md`
- `README.md`

