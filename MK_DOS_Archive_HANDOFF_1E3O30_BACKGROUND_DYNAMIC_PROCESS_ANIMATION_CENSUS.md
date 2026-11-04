# MK DOS Archive — Handoff — Pass 1E.3O.30 Background Dynamic Process + Animation Census

Date: 2026-09-30

## Status

**VERIFIED / READ-ONLY AUTHENTIC-INSTALL VALIDATION PASSED**

Pass 1E.3O.30 tests a critical export assumption raised explicitly by the user: MK1 backgrounds may contain animation and motion, so a static placement graph must not automatically be treated as the whole scene.

The answer is now definitive for several background families: **yes, canonical MK1 backgrounds include scheduler-driven descriptor animation and positional motion processes.**

## Canonical fixture

- `MK1.EXE` size: **1,157,222 bytes**
- SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`
- authentic user-supplied MK1 installation and GRA resources

## Prerequisites

- O27 background resource graph: verified
- O29 renderer order/camera projection: verified

## Scheduler semantics

Canonical process code establishes a real process/wait mechanism:

- process allocator `0x0001D64D` stores the child callback at process `+0x1C` and initializes wait counter `+0x06` to 1;
- wait/yield routine `0x0001D576/0x0001D577` stores AX at process `+0x06` and the continuation at `+0x1C`;
- scheduler traversal decrements the 16-bit counter and resumes through `+0x1C` when it reaches `<= 0`;
- process removal is at `0x0001D5D0`.

Therefore cadence values below are **scheduler ticks**. No conversion to milliseconds, seconds or FPS is claimed.

## Complete top-level init-callback census

All 24 O27 top-level module records fall into exactly seven init-callback classes:

| Callback | Modules | Count | Classification |
|---:|---|---:|---|
| `0x4680` | `CAVE_MOD`, `CAVE_MOD386` | 2 | conditional descriptor-cycle process |
| `0x4789` | `STRIPPED_MOD`, `STRIPPED_MOD386`, `STRIPPED_MOD486` | 3 | spawns external process; unresolved here |
| `0x4799` | `PIT_MOD`, `PIT_MOD386` | 2 | PIT dynamic process family |
| `0x4850` | `CHOP_MOD`, `STATUE_MOD` | 2 | static extra-object init |
| `0x49FB` | `PILLAR_MOD` | 1 | PILLAR dynamic process family |
| `0x4C9B` | `ARENA_MOD`, `ARENA_MOD386` | 2 | ARENA descriptor-cycle process |
| `0x4CAA` | 12 remaining module records | 12 | no-op init |

**10 / 24** top-level module records therefore use callbacks that directly spawn processes.

## Statically visible process-spawn graph

Eight bounded spawn edges are recorded:

- CAVE `0x4680` → `0x4699` (conditional)
- STRIPPED `0x4789` → `0x276B4` (external/unresolved)
- PIT `0x4799` → `0x4920`
- PIT `0x4799` → `0x494A`
- PIT `0x4799` → `0x4870` (conditional)
- PILLAR `0x49FB` → `0x4A1A`
- PILLAR `0x49FB` → `0x4BB8`
- ARENA `0x4C9B` → `0x4CAB`

## Descriptor-cycle animation families

### CAVE

Child callback `0x4699` creates independently phased objects and cycles descriptor references through a 28-slot table at `0x00000A36`.

- cadence: **8 scheduler ticks**
- slots: **28**
- unique descriptors: **6**
- phase state: object `+0x48`
- initial phase: bounded random selection across the 28-slot range
- target: special object list `0x000563CC`
- resource: `GRAPHICS/FU7HDRS.GRA`, file ID 29
- authentic uGRA decode: **6/6 unique descriptors passed**

### PILLAR

Child callback `0x4BB8` sleeps **4 scheduler ticks** then advances three separate 8-frame descriptor cycles:

1. plane 0 list `0x000563C0`, objects with `+0x18 == 4`, table `0x00000E4A`;
2. plane 1 list `0x000563B4`, objects with `+0x18 == 3`, table `0x00000E2A`;
3. plane 1 list `0x000563B4`, objects with `+0x18 == 2`, table `0x00000E0A`.

Each uses object `+0x44` as a 1..8 wrapping frame state.

- total active slots: **24**
- unique descriptors: **24**
- resource: `GRAPHICS/FU4HDRS.GRA`, file ID 25
- authentic uGRA decode: **24/24 passed**

PILLAR also spawns a separate positional-motion family through callback `0x4A1A`; animation and motion are therefore distinct dynamic axes.

### ARENA

Child callback `0x4CAB` advances a descriptor cycle every **8 scheduler ticks** across object lists for planes 3 and 4.

The locally consumed table is `0x00000F0A`:

- states: **1..6** wrapping
- slots: **6**
- unique descriptors: **6**
- resource: `GRAPHICS/FU2HDRS.GRA`, file ID 24
- authentic uGRA decode: **6/6 passed**

The callback also loads a second six-slot table at `0x00000F22`, containing three unique valid descriptors. However, the locally qualified descriptor-update path indexes the table held in global `0x24B5C`, which is loaded from `0x0F0A`; `0x0F22` is loaded into a different scratch global and is **not promoted to an active animation table** by this pass. It remains `LOADED_BUT_NOT_CONSUMED_BY_QUALIFIED_LOCAL_DESCRIPTOR_UPDATE_PATH`.

## Active dynamic descriptor coverage

Across the qualified CAVE + PILLAR + ARENA cycles:

- active frame slots: **58**
- unique active descriptors: **36**
- authentic GRA decodes: **36/36 passed**
- decode failures: **0**

## PIT and positional motion

`PIT_MOD` is explicitly dynamic even though O30 does not find a PIT descriptor-cycle table analogous to CAVE/PILLAR/ARENA:

- callback `0x4920` continuously recomputes a renderer/camera-related packed bound and yields **1 tick**;
- callback `0x494A` creates an object motion/reset family that reaches a loop with **8-tick** cadence;
- callback `0x4870` is conditionally spawned and creates a moving object with a bounded random initial descriptor, velocity and threshold-based lifetime behavior.

PILLAR callback `0x4A1A` also creates positional motion and reaches the shared 8-tick motion/reset loop.

These are kept separate from descriptor-cycle animation rather than being collapsed into one vague “animated background” label.

## Descriptor swap and palette state

The qualified ARENA direct-swap helper and generic descriptor-swap path update descriptor/dimension/pixel state and coordinate offsets but do **not** write object palette field `+0x28`.

Therefore existing object palette state is preserved across these descriptor swaps.

This does **not** prove the original palette ownership of every animated object. It only proves that the frame-changing mechanism itself does not replace the palette field.

## Verdict

`MK1_BACKGROUND_DYNAMIC_PROCESS_AND_DESCRIPTOR_ANIMATION_SURFACE_ESTABLISHED`

The export consequence is important: a stage cannot generally be modeled as only:

`static placement list + one flattened image`

The safer model is now closer to:

`stage resource graph + planes + placement records + per-plane camera state + dynamic process graph + descriptor-cycle timelines + positional motion + palette state`

A static flattened PNG can still be offered as a convenience snapshot, but it is not sufficient as the canonical lossless reconstruction for dynamic stages.

## Validation performed

- targeted TypeScript smoke compilation: **passed**
- authentic-install execution: **passed**
- all 24 top-level modules classified into seven callback classes: **passed**
- eight bounded process-spawn edges: **passed**
- scheduler tick semantics: **statically verified**
- CAVE 28-slot cycle: **verified**
- PILLAR three 8-slot cycles: **verified**
- ARENA six-state active cycle: **verified**
- active descriptor GRA decode: **36/36 passed**
- second independent run: **semantically identical after stripping run IDs/timestamps**
- wall-clock timing deliberately not claimed
- external STRIPPED child deliberately unresolved
- no write path: **true**

## Recommended next direction

Do not rush directly to a single stage screenshot. The next export-oriented work should build a **time-aware background scene IR** that joins O27/O28/O29/O30: plane, world placement, palette selection, camera projection, dynamic descriptor state and motion state. A bounded stage can then be reconstructed at an explicitly named time/process state rather than manufacturing a timeless composite.
