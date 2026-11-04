# MK DOS Archive — Pass 1E.3N.3 Shang Tsung Palette Qualification

25 September 2026

## Status entering this pass

The access/ladder detour is now paying directly back into the asset model.

Runtime observations supplied by the user have established:

- ladder token `6` → character ID `7` → **Goro**;
- ladder token `7` → character ID `8` → **Shang Tsung**;
- shared slot-7 `GONGORO_P` is consumed by Goro;
- the 1E.3N.2 endurance pair table behaves as reconstructed: with Cage selected, forced token `18` predicted Sub-Zero + Sonya and the game produced exactly that endurance sequence.

Treat the bounded Goro identity/palette result and the bounded endurance spot-check as runtime-qualified project evidence. The application still keeps machine-generated runtime fields as `NOT_TESTED`, because the browser does not observe DOSBox directly.

---

## Why 1E.3N.3 exists

The only remaining character-index palette-table slot without direct palette ownership confirmation is slot 8.

The verified 1E.3L table census already established that both sides of slot 8 point to one exact 23-color palette record:

- `NORMAL_PALETTES[8]` → record 93;
- `ALTERNATE_PALETTES[8]` → record 93;
- physical span: `0x0009CDAA..0x0009CDDA`;
- Watcom offset: `0x00010356`;
- aliases at the same address: `YANG_P`, `EMP_P`;
- declared length: 23 colors.

This means `YANG_P` and `EMP_P` are not two separately editable palettes in the fixture. They are two symbol names for the same physical palette record.

The runtime access harness has independently established that token 7 / character ID 8 is Shang Tsung. Therefore the bounded 1E.3N.3 question is:

> Does Shang Tsung actually consume the shared slot-8 `YANG_P` / `EMP_P` palette record?

Do not infer extra meaning from the two aliases yet. In particular, this pass does not claim that one alias means "normal" and the other means "alternate"; both verified palette tables point to the same address.

---

## Implementation changes

### Boss palette editor

The old unresolved-slot-7-only editor has been superseded in the main UI by:

**Boss palette editor · 1E.3N / 1E.3N.3**

It exposes:

1. **Goro · slot 7 · `GONGORO_P`** — retained as the already runtime-qualified special-character palette;
2. **Shang Tsung · slot 8 · `YANG_P / EMP_P`** — new 1E.3N.3 qualification target.

Each target retains the existing exact-difference workflow:

- original 23 words are loaded from the verified 1E.3H IR;
- edits are validated as 15-bit palette words;
- export fresh-reads and hashes the original executable;
- only planned color-word bytes may change;
- record headers remain untouched;
- the edited palette module reparses;
- reversal must restore the original executable hash exactly.

Switching between Goro and Shang Tsung preserves each target's draft independently for the current browser run.

### Opponent-access composite

The existing composite mechanism has been generalized rather than duplicated.

Two explicit boss composites are now supported:

- token 6 + `GONGORO_P` magenta;
- token 7 + shared `YANG_P / EMP_P` record magenta.

The two patch layers remain separately declared:

**ACCESS layer**

- changes only the first byte of each of the four original ladder maps;
- token 7 is written at:
  - `0x00096D24`
  - `0x00096D34`
  - `0x00096D44`
  - `0x00096D54`

**ASSET layer**

- changes only the 23 slot-8 palette words beginning after the two-byte record header at physical `0x0009CDAA`.

The layers are required to be non-overlapping. The composite exporter rejects unexpected byte changes and verifies exact reversal.

The opponent-access UI now shows the runtime-qualified Shang Tsung identity and, when token 7 is selected, offers:

**Download Shang Tsung access + YANG_P / EMP_P magenta bundle**

---

## Independent static reconstruction

Canonical authentic MK1 executable:

`750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`

Independent reconstruction of the 1E.3N.3 magenta composite against those bytes produced:

- slot-8 palette words edited: 23;
- slot-8 palette bytes changed: **46**;
- access bytes changed: **4**;
- total composite changed bytes: **50**;
- unexpected changed bytes: **0**;
- record header changes: **0**;
- edited composite SHA-256:
  `94d903d16bd4d625acebbe90979de34fb7f1a87751a354d17a3998a03157f625`;
- reversal SHA-256:
  `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`.

The original slot-8 record words are:

`0044 10AA 18EA 20C4 2D27 2108 3D48 45CB 45A8 59EB 212E 2D6D 35B0 4210 4A52 560E 66B1 5AB6 76D3 7B57 6739 7B5B 7BDE`

None already equals `0x7C1F`, so a flat-magenta probe changes both bytes of all 23 words.

---

## Validation performed in the packaging environment

Passed:

- changed non-React research modules compile under TypeScript 5.8 with only an external environment shim for Node's `process` global;
- changed React/UI paths compile under TypeScript 5.8 with temporary dependency shims only because this source snapshot does not include `node_modules`;
- `scripts/run-opponent-access.mjs` passes `node --check`;
- the smoke script now includes both the Goro and Shang composite assertions for use on a real installation after dependencies are installed;
- independent byte reconstruction reproduced the exact slot-8 record, four access offsets, 50-byte composite scope, composite hash, and exact reversal.

Not claimed here:

- full `npm run lint` / Vite production build / Vitest suite, because package dependencies are not installed in this packaging environment;
- in-game Shang palette ownership, until the user performs the runtime test.

---

## Immediate user runtime test

Use the untouched original MK1 installation.

1. Extract the 1E.3N.3 source completely.
2. Run `Launch_Source.bat`.
3. Load the untouched MK1 directory.
4. Click **Run What's Needed**.
5. In **Opponent access harness · 1E.3N.1**, select:
   **Special token 7 · Shang Tsung · ID 8**.
6. Click:
   **Download Shang Tsung access + YANG_P / EMP_P magenta bundle**.
7. Put that bundle's `MK1.EXE` into a separate complete test installation.
8. Start ONE PLAYER with any normal fighter.
9. Record whether the first opponent is Shang Tsung and whether Shang Tsung is magenta while the selected fighter, HUD and stage remain otherwise normal.
10. Return the bundle/JSON and a screenshot.

A standalone editable Shang palette export is also available in the Boss palette editor, but the access+palette composite is the cleanest qualification test because it reaches Shang Tsung immediately.

---

## Closeout criterion

If the forced token-7 encounter is Shang Tsung and the `YANG_P / EMP_P` edit affects Shang Tsung without unrelated palette changes, promote:

- slot 8 → character ID 8 → Shang Tsung;
- shared slot-8 record → Shang Tsung fighter palette ownership;
- complete nine-slot NORMAL/ALTERNATE character palette-table identity model → runtime-backed at both boss slots.

Do **not** infer from this alone how Shang Tsung's morphs select palettes for the fighters he transforms into. That is a separate state/asset question.

---

## Recommended direction after closeout

Once slot 8 is runtime-qualified, basic character-index palette ownership should no longer be the default research frontier.

Higher-value next questions include:

- Shang Tsung morph-state asset/palette behavior;
- the separate `F_GNINJA` / `GNINJA_P` secret green-ninja encounter path;
- fighter effects and secondary visual resources (for example Rayden's lightning and independent shadows);
- sprite/animation grouping and editable canvas composition;
- later, stage/background structure and a separately derived stage-access harness;
- audio/music/SFX structure when the visual asset model is sufficiently stable.

The end product remains the full lossless MK-DOS asset compiler/reassembler:

**Binary → structured/lossless IR → editable semantic representation → compiler → Binary**

The access harnesses are research instruments for reaching original engine states; they are not the product goal.
