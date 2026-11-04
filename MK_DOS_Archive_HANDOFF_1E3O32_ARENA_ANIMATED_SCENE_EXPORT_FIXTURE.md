# MK DOS Archive — Handoff — Pass 1E.3O.32 ARENA Animated Scene Export Fixture

Date: 2026-09-30

## Status

**VERIFIED — DIRECT CANONICAL-FIXTURE VALIDATION + INDEPENDENT uGRA/RGBA/PNG AUDIT PASSED**

Pass 1E.3O.32 is the second and final major verification in the current pause block. It turns O31's time-aware placement/process join into the first bounded dynamic-background export fixture with affirmative runtime-state palette binding.

## Fixture

- top-level module: `ARENA_MOD`
- resource: `GRAPHICS/FU2HDRS.GRA`
- File ID: **24**
- initial all-plane X scroll: **292**
- initial shared Y scroll: **31**
- dynamic target planes: **3 and 4**
- target placement objects: **15** total
  - plane 3 / `ARENA3BMOD`: 8
  - plane 4 / `ARENA4BMOD`: 7

## Qualified updater

Canonical code proves that ARENA:

1. spawns child `0x4CAB`;
2. selects active descriptor table `0x0F0A`;
3. traverses every object in plane-3 list `0x563AC`;
4. traverses every object in plane-4 list `0x563A8`;
5. maintains object `+0x44` as a `1..6` wrapping frame state;
6. selects one of six active descriptor references;
7. yields **8 scheduler ticks** between updates;
8. changes descriptor/image state without replacing object palette field `+0x28`.

The auxiliary table `0x0F22` remains outside the qualified local descriptor-update path and is still not promoted.

## Runtime-state palette binding

O31 establishes:

- plane 3 objects use palette selector **11**;
- plane 4 objects use selector **0**;
- both selectors alias `FU2PALS` record `0x0000F9E2`.

The aliased record contains **49 colours**.

All six ARENA dynamic descriptors use opaque indices no greater than 49. Because the actual BAKGND-created object palette is preserved by the runtime updater, this establishes the bounded correct-colour relationship affirmatively; it is not inferred from `FU2HDRS.GRA` identity or visual plausibility.

## Exported six-state sequence

The pass exports one deterministic transparent RGBA sprite for each active state:

| State | Normalized relative tick | Descriptor | Size | RGBA FNV-1a |
|---|---:|---|---|---|
| 1 | 0 | `0x0000198C` | 82×32 | `952a82ef` |
| 2 | 8 | `0x0000199C` | 81×32 | `9e5e7284` |
| 3 | 16 | `0x000019AC` | 82×32 | `65368091` |
| 4 | 24 | `0x000019BC` | 82×32 | `8fe804d9` |
| 5 | 32 | `0x000019CC` | 82×32 | `7596a040` |
| 6 | 40 | `0x000019DC` | 81×32 | `a836e0c9` |

The tick sequence is **normalized relative to state 1**, not claimed as the canonical absolute stage phase. Wall-clock conversion remains unknown.

## Why no flattened ARENA composite is exported

All eight plane-3 target objects share one exact primary+Y sort key. All seven plane-4 target objects share another exact key. Their horizontal spacing is roughly 69–70 pixels while the animated sprites are 81–82 pixels wide, so the target sprites overlap.

O29 already established that exact-equal linked-list order can depend on insertion/culling history. A flattened raster would therefore have to invent visible overlap ordering. O32 deliberately exports:

- the six exact RGBA state sprites;
- exact per-object world/screen positions;
- plane/list identities;
- sort keys;
- palette state;
- normalized scheduler-tick state;
- the unresolved tie-order constraint.

This is stronger than a visually plausible but non-canonical screenshot.

## Independent audit

A separate Python implementation independently decoded all six uGRA streams from authentic `FU2HDRS.GRA`, independently applied the 49-colour palette from canonical `MK1.EXE`, recomputed all six RGBA checksums, and decoded the emitted PNG files.

Results:

- independent uGRA decodes matched: **6/6**;
- opaque palette indices in range: **6/6**;
- generated PNG RGBA bytes exactly matched independent reconstruction: **6/6**;
- plane target counts independently confirmed: **8 + 7**;
- two equal-key target groups independently confirmed.

## New source

Added:

- `src/games/mk1/research/arenaAnimatedSceneExportFixture.ts`
- `scripts/run-arena-animated-scene-export-fixture.mjs`

Normal research workflow integration is stage **41/41**.

## Verdict

`MK1_ARENA_BOUNDED_ANIMATED_SCENE_EXPORT_FIXTURE_ESTABLISHED`

## Pause

This is the second major verification after O31. **Stop here.** Refresh the full master handoff and package source/evidence before any O33 research.
