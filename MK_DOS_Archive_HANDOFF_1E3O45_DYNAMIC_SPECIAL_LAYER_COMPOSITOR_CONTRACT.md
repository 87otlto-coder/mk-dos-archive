# MK DOS Archive — Pass 1E.3O.45 Handoff

## Status

**VERIFIED** — `MK1_DYNAMIC_SPECIAL_LAYER_COMPOSITOR_CONTRACT_ESTABLISHED`

Read-only research pass. Writer/import surface is unchanged.

## Objective

Join the renderer traversal/order/clipping evidence from O29/O41 with the already-qualified ARENA, PILLAR, PIT, CAVE and STRIPPED dynamic mechanisms so later compositors can place each dynamic family on its actual renderer list without inventing absolute time, random state, or shadow state.

## Canonical source

Authentic `MK1.EXE`:

`750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`

## Verified result

The relevant renderer traversal contains 14 list slots:

1. special `0x563CC` (`BAKLST9` / CAVE)
2. plane 8 `0x56398`
3. plane 7 `0x5639C`
4. plane 6 `0x563A0`
5. plane 5 `0x563A4`
6. plane 4 `0x563A8`
7. plane 3 `0x563AC`
8. plane 2 `0x563B0`
9. plane 1 `0x563B4`
10. shadow special `0x563B8`
11. special `0x563BC`
12. plane 0 `0x563C0`
13. special `0x563C4`
14. special `0x563C8`

Eight renderer-facing dynamic contracts are explicit:

- ARENA placement descriptor cycle — ordinary planes 3/4, existing topology retained.
- PILLAR placement descriptor cycles — ordinary planes 0/1, anchor-preserving descriptor swap, no relink.
- PILLAR process clouds — plane 6/no-scroll, default multipart primary sort zero.
- PIT persistent clouds — plane 2/no-scroll, default multipart primary sort zero.
- PIT conditional transient — plane 3/no-scroll, INITOBJ primary sort zero.
- PIT shadow-bound track — `0x563B8`; `SHAD_SCRNTL` remains symbolic.
- CAVE descriptor cycle — first-traversed special list `0x563CC`.
- STRIPPED BIGEMP — plane 4 with explicit multipart primary sort `0x00010000`.

Canonical machine-code anchors directly reverified:

- `INIT_MULTI` initializes multipart object `+0x18` to zero.
- `SET_Z_MULTI` writes caller-supplied primary sort to each multipart part.
- `BIGEMP_PROC` supplies `0x00010000`.
- CAVE special list is traversed first.
- shadow list is traversed after plane 1.
- PIT transient INITOBJ record primary-sort word is zero.

## Normalized compositor candidates

Five deterministic **test-vector states** are qualified:

- `ARENA_MOD` — `ARENA_NORMALIZED_STATE_1`
- `PILLAR_MOD` — `PILLAR_INDEPENDENT_TRACK_ORIGINS`
- `PIT_MOD` — `PIT_PERSISTENT_POST_CREATION_TRANSIENT_ABSENT`
- `CAVE_MOD` — `CAVE_ALL_PHASE_ZERO_TEST_VECTOR`
- `STRIPPED_MOD` — `STRIPPED_INITIAL_CAMERA_BIGEMP_3`

These are explicitly normalized states, not canonical gameplay frames.

## Independent audit

A separate Python audit reread the authentic EXE and independently recovered the complete 14-slot list sequence, sort-key machine-code anchors, PIT transient sort field and all eight layer/list bindings. **20/20 checks passed.**

## Preserved uncertainty

Still not established:

- universal absolute stage/process time;
- scheduler ticks as wall-clock milliseconds or rendered frames;
- CAVE runtime RNG seed / six-object phase vector;
- PIT transient runtime branch/random state;
- numeric runtime `SHAD_SCRNTL` inputs and a qualified stage-background shadow object population;
- arbitrary later camera/cull/recreate history;
- gameplay objects, fighters, HUD or framebuffer state.

## Next pass dependency

O46 may combine these layers only under the explicitly named normalized states above. It must not label the output a canonical gameplay screenshot.
