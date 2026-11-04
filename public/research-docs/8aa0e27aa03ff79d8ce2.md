# MK DOS Archive — Handoff — Pass 1E.3O.31 Time-Aware Background Scene IR

Date: 2026-09-30

## Status

**VERIFIED — DIRECT CANONICAL-FIXTURE VALIDATION + INDEPENDENT BYTE-LEVEL AUDIT PASSED**

Pass 1E.3O.31 joins the O27 stage resource graph, O28 placement/palette grammar, O29 nine-plane renderer/camera model and O30 dynamic-process census into one explicit time-aware background scene IR. It is read-only and does not broaden the writer surface.

## Canonical fixture

- `MK1.EXE` size: **1,157,222 bytes**
- SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`
- authentic installation archive remains `mk1.zip`

## New plane-slot qualification

The missing join between O27 top-level scene arrays and O29's planes is now static fact.

`INIT_BAKMODS`:

- loads the destination BAK slot start from top-level header `+0x18`;
- begins reading scene entries at header `+0x1C`;
- writes each BMOD scene-entry pointer with `STOSD`, so the destination advances one 4-byte BAK slot;
- writes literal `1` with the same one-slot `STOSD` advance;
- advances the source by 8 bytes for BMOD entries and 4 bytes for literal-one entries.

`MULTI_PLANE` independently reads the BMOD slot from each 20-byte plane record and treats literal `1` as a deliberate skip marker.

Therefore a top-level module's scene-entry index maps to consecutive BAK planes beginning at its O27 destination slot.

This explains previously disconnected O30 evidence. For example, `ARENA_MOD` begins at `BAK1MODS`; its third and fourth BMOD entries are therefore plane 3 / `ARENA3BMOD` and plane 4 / `ARENA4BMOD`, exactly the two object lists traversed by the qualified ARENA descriptor-cycle process.

## Time-aware scene IR result

Direct authentic-fixture result:

- top-level modules: **24**
- total scene slots: **72**
- BMOD scene slots: **68**
- literal-one skip slots: **4**
- underlying unique BMOD placement records: **2,550**
- instantiated module/plane placement objects: **4,488**
- equal primary+Y sort-key groups retained explicitly: **901**

Every instantiated BAK placement now records:

- exact top-level module;
- exact plane and object list;
- BMOD and placement index;
- local X/Y and world X/Y;
- initial projected screen X/Y from the module's `INIT_BAKMODS` camera words;
- renderer primary and secondary sort keys;
- descriptor ordinal / dimensions / packed GRA reference;
- BAKGND palette selector and palette-record reference;
- palette aliases where multiple selectors point to the same record.

## Dynamic placement bindings

The O30 descriptor-cycle targets are now joined to exact placement objects where the process actually traverses BAK plane lists.

### ARENA

Normal `ARENA_MOD`:

- plane 3 / `ARENA3BMOD`: **8** placement objects;
- plane 4 / `ARENA4BMOD`: **7** placement objects.

`ARENA_MOD386` repeats the same 8 + 7 target counts.

The plane-3 objects use palette selector **11** and the plane-4 objects selector **0**. Both selectors resolve through `FU2PALS` to the same palette record at Watcom offset `0x0000F9E2`.

This is not a compatibility guess. O28 establishes palette selection when BAKGND creates the objects and O30 establishes that ARENA descriptor swaps preserve object `+0x28`.

### PILLAR

The three descriptor-cycle filters now bind to exact normal `PILLAR_MOD` placement objects:

- plane 0, sort/control key 4: **1** object;
- plane 1, key 3: **1** object;
- plane 1, key 2: **2** objects.

`PILLAR_MOD386` uses the O30 no-op init and is not falsely assigned the normal module's cycle process.

### CAVE

CAVE's qualified descriptor cycle targets special process-created list `0x000563CC`, not ordinary BAK placement objects. Its random per-object starting phase remains explicit and it is intentionally not forced into placement IR.

## Timing and renderer boundaries

- dynamic timing unit: **scheduler ticks only**;
- wall-clock duration: **UNKNOWN**;
- canonical absolute phase at arbitrary capture time: **UNKNOWN**;
- exact order inside equal primary+Y ties: **runtime-history dependent / unresolved**;
- static flattened stage image: **not canonical lossless representation**.

## Independent audit

A separate Python audit re-read canonical `MK1.EXE`, checked the seven new `INIT_BAKMODS` / `MULTI_PLANE` instruction signatures, recomputed all scene-slot plane assignments, recomputed the 4,488 instance count, re-parsed ARENA palette selectors and the three PILLAR control-key filters, and matched the O31 report exactly.

Audit verdict: `SUCCESS`.

## New source

Added:

- `src/games/mk1/research/backgroundTimeAwareSceneIr.ts`
- `scripts/run-background-time-aware-scene-ir.mjs`

Normal research workflow integration proceeds as stage **40/41** in the O32 checkpoint source.

## Verdict

`MK1_TIME_AWARE_BACKGROUND_SCENE_IR_ESTABLISHED`

## Next pass within the same two-verification block

Use the now-exact ARENA plane/palette binding to build one bounded animated-scene export package. Export correct-colour state assets and time-aware instance metadata, but do not manufacture a flattened composite if equal-key overlap makes draw order non-canonical.
