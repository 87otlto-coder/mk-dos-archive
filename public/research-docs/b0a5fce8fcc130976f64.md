# MK DOS Archive — Handoff

## Pass 1E.3N.4 — Shang Tsung Morph Asset / Palette Selection

Date: 2026-09-25

## 1. Status

**IMPLEMENTED / STATIC AUTHENTIC-BINARY QUALIFICATION PASSED / EXISTING RUNTIME OBSERVATION CORROBORATES THE MODEL**

This pass is deliberately read-only. It adds no morph cheat, combat patch, AI patch, animation rewrite, or palette mutation.

The immediate question was prompted by the runtime-qualified 1E.3N.3 Shang palette test. With `YANG_P / EMP_P` edited to magenta, the user observed:

- Shang Tsung is magenta in his own form;
- after morphing, the target fighter appears with the ordinary fighter coloring;
- when Shang unmorphs, the magenta Shang palette returns.

1E.3N.4 statically explains that behavior from the authentic executable.

---

## 2. Fixture authority

Canonical MK1 fixture:

- file: `MK1.EXE`
- size: **1,157,222 bytes**
- SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`
- qualified Segment-1 code file-image base: `0x00050A54`
- qualified Segment-2 static-data file-image base: `0x0008CA54`

The actual DOS binary remains authoritative. Watcom symbol names are used only after generic symbol enumeration and are mechanically reconciled to binary behavior.

---

## 3. Principal result

The recovered morph model is:

```text
Shang Tsung / ID 8
    ↓ choose target
EMP_ANITAB[target + 7] is resolved while object identity is still 8
    ↓
object +0x48 becomes target character ID
    ↓
execute target-specific morph sequence
    ↓
command 6 → target-specific transition-palette callback
    ↓
three target-specific morph descriptors
    ↓
command 6 → PLAYER_NORMPAL callback
    ↓
completed target form uses ordinary fighter palette-selection machinery
    ↓ unmorph
object +0x48 restored to 8
    ↓
PLAYER_NORMPAL
    ↓
shared slot-8 YANG_P / EMP_P base palette
```

This means Shang does **not** require a separate final copy of every fighter palette within the qualified path. The completed morph reuses the already-established fighter palette selector keyed by current object identity.

There **are**, however, eight distinct transition palettes used during the morph effect itself.

---

## 4. Target selection

### `EMP_MORPH_SANS_GORO`

Watcom code offset / physical:

- `0x00011FB8` / `0x00062A0C`

The routine mechanically performs:

1. `RANDU(7)`;
2. decrement result;
3. candidate range becomes IDs `0..6`;
4. call `IsFighterLoaded_`;
5. reject/retry unavailable candidates;
6. fall into the general `EMP_MORPH` path once a loaded target is accepted.

Classification:

`VERIFIED_RANDOM_LOADED_PLAYABLE_TARGET_0_TO_6`

### Goro

The random path excludes ID 7, but a separate direct site at physical `0x0006217C` loads character ID `7` and jumps into `EMP_MORPH`.

Therefore the general morph routine supports Goro through a special direct route.

Classification:

`VERIFIED_DIRECT_ID7_EMP_MORPH_PATH`

---

## 5. `EMP_MORPH` ordering is important

`EMP_MORPH`:

- Watcom offset: `0x00011FD7`
- physical: `0x00062A2B`

Critical sequence begins at physical `0x00062A44`:

- preserve target EAX;
- write target into `A9`;
- add `7`;
- call `GET_CHAR_ANI`;
- restore target EAX;
- store target into object field `+0x48`;
- continue into `MFRAMEW`.

The key semantic point is the ordering:

> `GET_CHAR_ANI` is called **before** object identity changes from Shang ID 8.

Therefore the lookup resolves through Shang's `EMP_ANITAB`, using index `target + 7`. Only after that morph-sequence pointer is acquired does object identity become the target fighter.

Classification:

`VERIFIED_EMP_TARGET_INDEXED_MORPH_SEQUENCE`

---

## 6. Animation command 6 is a callback opcode

`DO_NEXT_A9_FRAME`:

- Watcom offset `0x000194E1`
- physical `0x00069F35`

It dispatches animation command values `1..6` through a table at Watcom data offset `0x0000F27C`.

Command 6 resolves to Watcom code offset `0x00019506`. Its handler:

- reads `A9`;
- advances `A9` by four bytes;
- performs `call [edx]` on the dword just consumed;
- returns to animation-stream processing.

Therefore animation stream value `6` is mechanically established as:

> **call the next dword as a code callback**.

Classification:

`VERIFIED_ANIMATION_CALLBACK_OPCODE_6`

This is what allows the Shang morph animation streams to invoke palette behavior inline.

---

## 7. The two morph palette callbacks

All eight target-indexed `EMP_ANITAB` morph sequences share the same first and final callback identities.

### Transition-palette callback

- Watcom code offset: `0x000276A2`
- physical: `0x000780F6`

It walks the active morph-frame structure to obtain its palette pointer and jumps to `PLAYER_SWPAL`.

Classification:

`VERIFIED_MORPH_TRANSITION_PALETTE_CALLBACK`

### Completed-form palette callback

- Watcom code offset: `0x00027690`
- physical: `0x000780E4`

The routine:

- pushes/preserves `A9`;
- directly calls `PLAYER_NORMPAL`;
- restores `A9`;
- returns.

Classification:

`VERIFIED_MORPH_TARGET_GENERIC_PALETTE_CALLBACK`

This is the central answer to the user's runtime observation: after the transition frames, the morph path explicitly returns to the generic fighter palette selector.

---

## 8. Eight target-specific morph asset routes

`EMP_ANITAB` is at Watcom data offset `0x00012388`, physical `0x0009EDDC`.

For target character ID `t`, the qualified morph sequence uses `EMP_ANITAB[t + 7]`.

| Target ID | Target | EMP sequence | Morph descriptors | Transition palette |
|---:|---|---:|---|---|
| 0 | Cage | `0x12702` | `VDMORPH1`, `VDMORPH2`, `VDMORPH3` | `VDMORPH_P` |
| 1 | Kano | `0x12692` | `KAMORPH1`, `KAMORPH2`, `KAMORPH3` | `KMORPH_P` |
| 2 | Rayden | `0x126CA` | `RDMORPH1`, `RDMORPH2`, `RDMORPH3` | `RDMORPH_P` |
| 3 | Liu Kang | `0x1265A` | `HOMORPH1`, `HOMORPH2`, `HOMORPH3` | `HOMORPH_P` |
| 4 | Scorpion | `0x1273A` | `SCMORPH1`, `SCMORPH2`, `SCMORPH3` | `SCORPMO_P` |
| 5 | Sub-Zero | `0x127B2` | `SZMORPH1`, `SZMORPH2`, `SZMORPH3` | `SUBMO_P` |
| 6 | Sonya | `0x127EA` | `LZMORPH1`, `LZMORPH2`, `LZMORPH3` | `LZMORPH_P` |
| 7 | Goro | `0x12772` | `GOMORPH1`, `GOMORPH2`, `GOMORPH3` | `GOMORPH_P` |

Every listed transition palette:

- is a Segment-2 Watcom data symbol;
- declares exactly **23 colors**;
- is linked by the matching first morph descriptor at `MORPH1 + 0x0C`;
- is reached from the corresponding target-indexed `EMP_ANITAB` sequence.

Transition palette offsets:

- `HOMORPH_P` `0xF418`
- `KMORPH_P` `0xF448`
- `RDMORPH_P` `0xF478`
- `VDMORPH_P` `0xF4A8`
- `SCORPMO_P` `0xF4D8`
- `GOMORPH_P` `0xF508`
- `SUBMO_P` `0xF538`
- `LZMORPH_P` `0xF568`

These should eventually be represented as distinct semantic assets in the compiler IR rather than being conflated with the target fighter's final palette.

---

## 9. Completed morph reuses generic fighter palette selection

`PLAYER_NORMPAL`:

- Watcom code offset `0x000193E1`
- physical `0x00069E35`

The qualified path retains the already-established semantics:

- default table: `NORMAL_PALETTES` at `0xF1CC`;
- same-character condition can switch to `ALTERNATE_PALETTES` at `0xF1F0`;
- `GET_CHAR_LONG` reads object character identity from `+0x48` and indexes the selected table;
- the previously identified green-ninja override also remains part of `PLAYER_NORMPAL`.

Important nuance:

> The correct statement is not “Shang always uses the target's normal palette.”

The correct statement is:

> **The completed morph reuses the generic fighter palette-selection rule.**

Therefore if the existing same-character rule is triggered, the target's alternate palette can be selected exactly as it would for ordinary fighter rendering.

This preserves the distinction between observed runtime appearance and the actual underlying mechanism.

---

## 10. Unmorph restoration

`EMP_UNMORPH`:

- Watcom offset `0x00012055`
- physical `0x00062AA9`

The routine:

- captures the current morph-target identity from object `+0x48`;
- stores character ID `8` back into object `+0x48` at physical `0x00062ABE`;
- later directly calls `PLAYER_NORMPAL` at physical `0x00062B27`.

Pass 1E.3N.3 already established that slot 8 NORMAL and ALTERNATE both resolve to the same shared `YANG_P / EMP_P` 23-color record.

Therefore unmorph naturally returns to Shang's base palette. This explains why the user's magenta edit reappeared immediately after Shang returned to his own form.

Classification:

`VERIFIED_EMP_UNMORPH_RESTORES_ID8_PALETTE`

---

## 11. Runtime evidence status

No new difficult runtime experiment is required to make this pass useful.

Existing user observation already matches the qualified static mechanism:

```text
magenta Shang
→ morph target appears with generic fighter palette behavior
→ unmorph
→ magenta Shang returns
```

The static pass does more than the visual observation alone: it establishes the target-indexed animation route, transition palettes, callback semantics, generic final palette call, and ID-8 restoration path.

A future runtime regression may be useful if transition palettes themselves are made editable, but that is not a prerequisite for the current semantic model.

---

## 12. Source changes

Added:

- `src/games/mk1/research/shangMorphSelection.ts`
- `src/components/ShangMorphSelectionPanel.tsx`
- `scripts/run-shang-morph.mjs`
- `MK_DOS_Archive_HANDOFF_1E3N4_SHANG_MORPH_SELECTION.md`

Modified:

- `src/components/ResearchQuickActions.tsx`
- `src/components/BossPaletteEditor.tsx`
- `src/appMetadata.ts`
- `package.json`
- `metadata.json`
- `README.md`
- `docs/CURRENT.md`
- `docs/RESEARCH.md`

`Run What's Needed` now includes a tenth read-only stage and exports `mk1_shang_morph_selection_v1` when all prerequisite gates pass.

The new UI panel presents:

- target selection behavior;
- Goro special-path support;
- the eight target → morph descriptor → transition palette relationships;
- the generic completed-form palette rule;
- the unmorph return to `YANG_P / EMP_P`.

---

## 13. Validation performed in this implementation environment

Performed:

- targeted TypeScript compile of `shangMorphSelection.ts`: **PASS**;
- targeted TypeScript/TSX compile of changed UI paths using temporary React/lucide type shims: **PASS**;
- `node --check scripts/run-shang-morph.mjs`: **PASS**;
- generic Watcom permanent-symbol enumeration directly against the canonical MK1 executable: **PASS**;
- independent raw-binary checks against canonical SHA-256 `750792...41b14`: **PASS**;
- all eight `EMP_ANITAB[target+7]` sequence offsets independently reproduced;
- all 24 morph descriptor references independently reproduced;
- all eight `MORPH1 + 0x0C` transition-palette links independently reproduced;
- all eight transition palette lengths independently reproduced as 23;
- shared callbacks `0x276A2` and `0x27690` independently reproduced;
- transition callback → `PLAYER_SWPAL` and final callback → `PLAYER_NORMPAL` independently reproduced;
- direct ID-7 → `EMP_MORPH` site independently reproduced;
- unmorph ID-8 store and direct `PLAYER_NORMPAL` call independently reproduced.

Not claimed:

- a full Vite/Vitest run in this environment;
- execution of the complete browser prerequisite chain against a full MK1 installation directory here.

The local environment has the canonical EXE but not the complete installed resource directory needed by earlier handle-table / GRA reconciliation prerequisites. The authoritative browser export should therefore still be generated through `Run What's Needed` on the user's complete untouched MK1 installation.

---

## 14. Recommended project direction after 1E.3N.4

Do **not** turn the next milestone into open-ended Shang combat archaeology.

The morph investigation has already given the compiler-important result:

- eight dedicated transition palettes;
- target-specific morph descriptor groups;
- an explicit animation callback mechanism;
- reuse of generic fighter palette ownership;
- clean restoration of Shang base state.

A small future editor pass could expose the eight morph-transition palettes because they are now bounded semantic assets. After that, the higher-value direction is to move toward **animation/group reconstruction and editable canvas composition**, then stage/background reconstruction and media export, because those directly serve the stated fully fledged asset-compiler goal.

The secret green-ninja/Reptile route remains a separate qualified-but-access-deferred research lead. Stage access should still wait for a bounded stage-selection grammar pass.

---

## 15. One-sentence state

**MK1 now has runtime-backed base palette ownership for all nine character slots, a runtime-verified ladder/endurance grammar, and a statically qualified Shang Tsung morph model in which eight target-specific transition asset sets feed back into the ordinary fighter palette selector before unmorph restores the shared Shang `YANG_P / EMP_P` base record.**
