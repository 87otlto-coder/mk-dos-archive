# MK DOS Archive — Pass 1E.3O.2 Handoff

## Multi-Part Frame Grammar + Bounded Lossless Animation IR

Status: **IMPLEMENTED / DIRECT CANONICAL-FIXTURE VALIDATION PASSED / AUTHENTIC USER BROWSER EXPORT PENDING**

This handoff supersedes 1E.3O.1 as the current project checkpoint. Earlier handoffs remain historical evidence.

---

## 1. Long-term product direction

The project goal remains a fully fledged MK-DOS asset compiler rather than a viewer or cheat utility:

**binary → structured/lossless IR → editable assets/canvas → deterministic compiler → binary**

Target outputs include PNG/GIF and other media exports, editable animation/stage composition, deterministic write-back where the original format is understood, and later qualified music/SFX workflows. MK1 remains the proving ground before independent MK2/MK3 validation.

Research discipline remains:

**OBSERVE → RECORD → HYPOTHESIZE → TEST → CLASSIFY CONFIDENCE → GENERALIZE ONLY AFTER REPETITION**

---

## 2. Prerequisite closed

1E.3O.1 is now closed from the user's authentic browser artifact:

- canonical `MK1.EXE` size: `1,157,222` bytes
- SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`
- verdict: `MORPH_ANIMATION_STREAM_AND_FRAME_COMPOSITION_ESTABLISHED`
- all 10 1E.3O.1 validation checks passed
- 8 Shang morph streams parsed
- 24/24 controlled sprites decoded from `GRAPHICS/EMP.GRA`

1E.3O.2 uses that verified animation groundwork but deliberately moves to a different fixture containing genuine variable-part frame records.

---

## 3. Controlled fixture: Kano heart-rip

The exact Watcom symbol/data route establishes the fixture:

- `KANO_DEATH_BLOW` reaches the multi-object heart setup
- `A5 = MSU_HEART`
- `KANO_ANITAB[67] = MA_KHEART`
- animation index 67 is requested through the qualified character-animation path
- the fatality path uses `DOUBLE_MFRAMEW`

Key static-data symbols:

- `MSU_HEART` — Watcom `0x0000B284`
- `MA_KHEART` — Watcom `0x0000B21C`
- `BIGBLD1` — Watcom `0x0001BB7C`
- `BLOOD_P` — Watcom `0x0001001A`

`MSU_HEART` is:

`[BIGBLD1, BIGBLD1, BIGBLD1, BIGBLD1, 0]`

This creates a four-object linked multi setup. `BIGBLD1` is a palette-linked setup descriptor whose `+0x0C` field points to `BLOOD_P`.

---

## 4. Mechanically qualified multi-object grammar

Exact symbols used:

- `INIT_MULTI` — Watcom `0x0001931E`, physical `0x00069D72`
- `RESHAPE_MULTI` — Watcom `0x000167C0`, physical `0x00067214`
- `PRCDSP` — Watcom `0x0001D4A8`, physical `0x0006DEFC`
- `INSERT_MULTI` — Watcom `0x0001937D`
- `INSOBJ`
- `A5`
- `NULL_IMAGE`

### `INIT_MULTI`

The code loads global `A5`, reads dword descriptor pointers sequentially, advances by four bytes, and terminates on zero. It allocates and links one object for each descriptor entry. The controlled setup list independently contains four descriptor references plus zero.

### `RESHAPE_MULTI`

The code reads the root object's frame-record pointer from object `+0x40`, then reads descriptor pointers sequentially while walking the linked object chain through object `+0x04`.

A zero descriptor terminates the active record. If linked objects remain after that terminator, the code assigns exact symbol `NULL_IMAGE` to the remainder.

The mechanically supported frame-record grammar is therefore:

`[descriptor pointer 0, descriptor pointer 1, ... , 0]`

Descriptor-pointer position maps to structural linked-object position.

### `PRCDSP` / `INSERT_MULTI`

`PRCDSP` calls `RESHAPE_MULTI` during display processing. `INSERT_MULTI` walks the linked object chain and sends each object through `INSOBJ`.

Important boundary: pointer-list order is verified as **structural object-chain order**, not a universal final pixel z-order rule. Display-list ordering can depend on runtime object fields, so 1E.3O.2 does not promote record order into a general final draw-order claim.

---

## 5. `MA_KHEART` frame structure

`MA_KHEART` contains a five-record primary sequence followed by a three-record beat loop.

Qualified unique frame records:

- `0x0000B244` → `[KHEART1, 0]`
- `0x0000B24C` → `[KHEART2, 0]`
- `0x0000B254` → `[KHEART3A, KHEART3B, KHEART3C, 0]`
- `0x0000B264` → `[KHEART4, 0]`
- `0x0000B26C` → `[KHEART5A, 0]`
- `0x0000B274` → `[KHEART5B, 0]`
- `0x0000B27C` → `[KHEART5C, 0]`

Primary sequence:

`B244 → B24C → B254 → B264 → B26C → 0`

Beat loop:

`B274 → B27C → B26C → 0`

The `B254` record is the first mechanically qualified genuine multi-part frame. The mixture of one-part and three-part records within the same setup independently establishes variable part count and explains why `NULL_IMAGE` padding exists.

---

## 6. Graphics / palette qualification

All nine `KHEART*` descriptors target File ID 2, resolved through the existing handle model to:

`GRAPHICS/MISC.GRA`

All nine decode successfully with the established uGRA decoder.

Descriptor symbols:

- `KHEART1`
- `KHEART2`
- `KHEART3A`
- `KHEART3B`
- `KHEART3C`
- `KHEART4`
- `KHEART5A`
- `KHEART5B`
- `KHEART5C`

`BLOOD_P` declares 15 colours. Every opaque index used by the nine decoded heart descriptors fits that palette; no out-of-range opaque index is present.

The preview canvas is intentionally described as a **structural composition preview**. It aligns descriptor-local X/Y values on a common origin, but 1E.3O.2 does not claim to reproduce later object-specific runtime motion or a universal final z-order.

---

## 7. First bounded animation IR

New format:

`mk1_animation_ir_v1`

For the Kano-heart fixture it now explicitly contains:

- source SHA-256 and owner/semantic identity
- `KANO_ANITAB[67]` table binding
- `MSU_HEART` setup-list offset and four descriptor references
- semantic `BIGBLD1` setup descriptor fields, including its palette reference
- primary and beat-loop offsets / frame-record references
- seven unique frame records
- per-part descriptor references and structural indices
- nine semantic sprite descriptors (`width`, `height`, `x`, `y`, packed GRA reference)
- `BLOOD_P` palette words
- raw source hex retained as provenance
- explicit capability boundaries: no relocation, no uGRA encoding

The no-edit serializer is generated from the **IR fields themselves**. Raw hex is retained for evidence/provenance and is not replayed as the serializer's source.

---

## 8. Bounded lossless round trip

The IR serializer re-encodes 22 semantic regions:

- 1 animation-table cell
- 2 sequence pointer lists
- 7 frame records
- 1 multi-object setup list
- 1 palette-linked setup descriptor
- 9 KHEART descriptors
- 1 palette record

Direct validation against the canonical MK1 installation produced:

- every encoded region byte-exact
- whole-executable mismatch count: **0**
- rebuilt SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`
- original SHA-256 restored exactly
- verdict: `MULTI_PART_FRAME_AND_BOUNDED_LOSSLESS_IR_ESTABLISHED`

This is the first animation-level bounded semantic IR/no-edit serializer in the project.

It is **not yet** a general writable animation compiler.

---

## 9. New UI

New panel:

**Multi-part frame / bounded lossless animation IR · 1E.3O.2**

It supports:

- PRIMARY / BEAT_LOOP selection
- manual frame stepping
- structural multi-part preview
- optional part bounding boxes
- current frame PNG export
- aligned sequence-sheet PNG export
- lossless IR JSON export
- display of current frame record / component symbols
- palette/resource inspection
- explicit z-order and compiler-boundary warnings

No source installation is overwritten.

---

## 10. Validation performed in implementation environment

Passed:

- targeted TypeScript validation for `multiPartFrameLosslessIr.ts`
- targeted TypeScript validation for the new panel and `ResearchQuickActions.tsx` using local type shims
- `node --check scripts/run-multi-part-ir.mjs`
- direct execution of the compiled TypeScript 1E.3O.2 core against the canonical untouched MK1 directory and the user's authentic 1E.3O.1 prerequisite artifact
- result: `SUCCESS`
- 22 semantic regions exact
- whole-executable mismatch count: 0
- canonical SHA-256 restored exactly

Environment limitation:

The source snapshot does not contain `node_modules`, and the local environment does not have the project's `esbuild` package installed. Therefore the packaged `npm run smoke:multi-part-ir` script could not be executed here as an npm-script smoke. The underlying TypeScript core was compiled with the available TypeScript compiler and executed directly against the canonical fixture instead. Do not claim the full Vite/Vitest suite was run.

---

## 11. Required user closeout

Use an untouched MK1 installation whose `MK1.EXE` SHA-256 is:

`750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`

Then:

1. Load the directory into the new build.
2. Run **What's Needed**.
3. Scroll to **Multi-part frame / bounded lossless animation IR · 1E.3O.2**.
4. Inspect PRIMARY frame 3, which should report three structural parts: `KHEART3A`, `KHEART3B`, `KHEART3C`.
5. Optionally export the frame PNG / sequence sheet / IR JSON.
6. Return the generated `mk1_multi_part_frame_lossless_ir_*.json`.

No DOSBox runtime test is required to close 1E.3O.2 because this pass is structural/read-only plus no-edit serialization. Runtime modification belongs in the next pass.

---

## 12. Recommended next pass

**1E.3O.3 — Controlled Multi-Part XY Edit + Lossless Write-Back**

The next bounded step should:

- edit one already-qualified KHEART descriptor X or Y field through `mk1_animation_ir_v1`;
- rebuild from the authentic original;
- prove the exact expected 2-byte change only;
- prove exact reversal to the canonical SHA-256;
- package a DOSBox test bundle;
- runtime-check that the intended heart component moves while unrelated animation data remains unchanged.

Do **not** add/remove frame parts yet. Record growth requires a qualified relocation/space-allocation strategy first.

This keeps us on the path toward the eventual canvas editor: move/edit existing elements first, then qualify safe structural growth, then add/remove elements.
