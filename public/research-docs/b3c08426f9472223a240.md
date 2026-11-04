# MK DOS Archive — Handoff — Pass 1E.3O.5 Interactive Rayden Lightning Canvas Placement Editor

Date: 2026-09-26

## Status

**IMPLEMENTED / DIRECT CANONICAL-FIXTURE VALIDATION PASSED**

Pass 1E.3O.5 is the first deliberately authoring-facing canvas pass. It promotes the bounded Rayden lightning descriptor-local placement mechanism established in 1E.3O.4 into a real interactive editor while keeping all unsupported animation/compiler operations fail-closed.

The preceding runtime fixture is now closed: the user reported that the 1E.3O.4 +24 descriptor-local Y edit **worked perfectly** in DOSBox while the lightning move otherwise behaved normally. That observation is project-history runtime evidence. The machine-generated O4 artifact still correctly describes only the static qualification it can prove itself.

## Canonical fixture

- `MK1.EXE` size: **1,157,222 bytes**
- SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`
- code file-image base: `0x00050A54`
- static-data file-image base: `0x0008CA54`

All write operations fresh-read and hash-check this canonical executable. Modified/test executables are rejected as authoring sources.

## Qualified authoring scope

The editor is intentionally restricted to the already-qualified normal Rayden lightning visual descriptors:

- setup: `HANDBO22`
- initial travel: `HANDBO4`, `HANDBO5`, `HANDBO8`, `HANDBO9`
- continuation: `HANDBO10`, `HANDBO11`, `HANDBO12`, `HANDBO13`
- persistent loop: `HANDBO14`, `HANDBO15`, `HANDBO16`, `HANDBO17`

Total writable descriptors: **13**.

All point to File ID **36**, `GRAPHICS/RAIDEN.GRA`. The setup path links the 7-colour `MORPH_P` record, and every qualified preview sprite is decoded against that palette.

The only writable fields in this pass are the descriptor-local signed-int16:

- `x` at descriptor `+0x04`
- `y` at descriptor `+0x06`

Everything else remains read-only.

## New semantic editor model

New report format:

`mk1_rayden_lightning_canvas_editor_model_v1`

The model contains:

- canonical provenance;
- O4 prerequisite identity;
- resolved RAIDEN.GRA resource provenance;
- MORPH_P palette words + RGB preview values;
- all 13 descriptor symbols, physical/Watcom locations, width/height, original X/Y, packed GRA reference and decoded-sprite evidence;
- phase membership (`SETUP`, `INITIAL`, `CONTINUATION`, `PERSISTENT_LOOP`);
- a stable common editor canvas around the original descriptor anchor;
- explicit serializer capabilities and blocked operations;
- a no-edit round-trip check.

Preview pixel arrays are retained in-memory for the canvas but omitted from the JSON export.

## No-edit semantic round trip

1E.3O.5 fresh-reads the canonical executable and re-encodes every qualified descriptor's semantic X/Y values into a clone.

Direct canonical-fixture result:

- semantic descriptors rewritten: **13**
- executable mismatch count: **0**
- source SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`
- rebuilt SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`
- exact: **true**

This is the authoring equivalent of the earlier lossless IR principle: editing begins from semantic fields whose no-edit serialization is byte-stable.

## Interactive UI

New component:

`src/components/RaydenLightningCanvasEditor.tsx`

The panel appears after **Run What's Needed** completes 15/15 stages.

It provides:

- descriptor/frame selector;
- decoded sprite rendered on a common anchored canvas;
- visible `(0,0)` descriptor axes;
- translucent yellow ghost of the original position;
- cyan current position/bounds;
- pointer dragging;
- numeric X/Y editing;
- one-pixel nudge controls;
- reset selected / reset all;
- apply selected-frame delta to:
  - persistent loop only;
  - all 12 travel frames;
  - setup + all travel frames;
- dirty-descriptor manifest;
- PNG preview export;
- semantic compile action;
- exact diff/hash result;
- downloadable runtime bundle.

The default selected frame is `HANDBO14`, one of the persistent-loop frames already shown repeatedly by the runtime-verified projectile.

## Writable serializer

New implementation:

`src/games/mk1/research/raydenLightningCanvasEditor.ts`

Edit report format:

`mk1_rayden_lightning_canvas_edit_v1`

The write path:

1. requires the verified O5 editor model;
2. rejects empty edit lists, duplicate symbols and non-int16 coordinates;
3. rejects any descriptor not in the qualified 13-symbol set;
4. fresh-reads canonical `MK1.EXE` and rechecks its SHA-256;
5. verifies each source X/Y still matches the qualified model;
6. writes only changed X/Y words;
7. diffs the whole executable;
8. rejects any changed byte outside the requested X/Y fields;
9. reverses only the observed diff bytes;
10. requires the reverse SHA-256 to be canonical before returning success.

The runtime bundle contains:

- edited `MK1.EXE`;
- exact semantic edit JSON;
- human-readable test instructions.

## Direct edit validation

A direct canonical-fixture validation translated the persistent loop only:

`HANDBO14..HANDBO17: +8 X / -6 Y`

Result:

- descriptors edited: **4**
- actual executable bytes changed: **8**
- unexpected changed bytes: **0**
- edited SHA-256: `29b721bdd21c11dccbd7a42f543009f776ee68d3e862022853b8a1003290c7b1`
- reverse SHA-256: canonical exactly

A sample bundle was also built and `unzip -t` reported no errors. This sample is only packaging validation; the intended workflow is for the user to author coordinates in the O5 UI and compile their own bundle.

## Runtime evidence carried from 1E.3O.4

The actual placement mechanism is no longer visually speculative. The user ran the O4 +24 Y fixture and reported that it **works perfectly**. Therefore:

- descriptor-local X/Y authority over the displayed lightning: **RUNTIME VERIFIED for the qualified mechanism**;
- O5 arbitrary user-authored in-place X/Y serialization: **STATICALLY VERIFIED / uses the same qualified mechanism**;
- every possible future arbitrary coordinate choice: naturally not individually runtime-tested.

This distinction should be preserved.

## Scope boundary

Still unsupported and intentionally blocked:

- descriptor relocation or table growth;
- descriptor width/height editing;
- packed GRA-reference editing;
- uGRA pixel encoding/replacement;
- palette editing inside this canvas panel;
- adding/removing parts;
- animation stream restructuring;
- generic animation allocation;
- projectile world-coordinate edits;
- velocity, collision, damage or move/input changes.

The fact that X/Y is writable does not imply those adjacent structures are writable.

## Source changes

Added:

- `src/games/mk1/research/raydenLightningCanvasEditor.ts`
- `src/components/RaydenLightningCanvasEditor.tsx`
- `scripts/run-rayden-canvas-editor.mjs`
- `MK_DOS_Archive_HANDOFF_1E3O5_INTERACTIVE_CANVAS_PLACEMENT_EDITOR.md`

Updated:

- `src/components/ResearchQuickActions.tsx`
- `src/appMetadata.ts`
- `metadata.json`
- `package.json`
- `README.md`
- `docs/CURRENT.md`
- `docs/RESEARCH.md`
- O4 handoff runtime status

The research workflow is now **15 stages** and ends by constructing the interactive editor model.

## Validation performed

- O5 core TypeScript targeted type-check: **passed**
- O5 component targeted type-check with local React/lucide declaration shims: **passed**
- changed `ResearchQuickActions.tsx` path targeted type-check with declaration shims: **passed**
- `node --check scripts/run-rayden-canvas-editor.mjs`: **passed**
- direct canonical-fixture O5 model execution through CommonJS-transpiled TypeScript: **passed**
- descriptors decoded: **13/13**
- no-edit whole-EXE mismatch: **0**
- no-edit rebuilt hash: canonical exactly
- direct four-loop-descriptor write test: **passed**
- unexpected edit bytes: **0**
- exact reversal: **passed**
- sample runtime ZIP integrity: **passed**

The full Vite/Vitest/npm suite is not claimed because this execution snapshot does not contain installed `node_modules`. The source does contain its normal package manifests; install dependencies in the ordinary development environment before using the full app.

## Recommended next step

Use the O5 UI on the untouched installation and make a deliberately obvious but reversible Rayden placement edit yourself — for example select `HANDBO14`, drag it, then apply that same delta to **all travel frames** or **setup + all travel frames**, compile, and test the resulting bundle.

Once the authoring UI itself has been exercised successfully, the next research milestone should generalize the same editor pattern to a **multi-part composition** whose parts can be selected independently on the canvas, using the 1E.3O.2 heart-rip IR as the bounded structure. Do not add/remove parts yet; first prove interactive per-part placement through the existing lossless multi-part serializer.

That would be the natural Pass **1E.3O.6 — Interactive Multi-Part Composition Placement Editor**.
