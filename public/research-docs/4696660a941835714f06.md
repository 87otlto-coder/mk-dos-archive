# MK DOS Archive — Pass 1E.3O.46 Handoff

## Status

**VERIFIED** — `MK1_FIVE_STAGE_NORMALIZED_DYNAMIC_BACKGROUND_COMPOSITOR_FIXTURES_ESTABLISHED`

Read-only export/compositor pass. Writer/import surface is unchanged.

## Objective

Combine O43/O44 fresh-initial ordinary BAK topology/assets with O45-qualified dynamic/special layers for a small set of deterministic, explicitly normalized background-only compositor fixtures.

## Verified fixtures

Five 320×200 transparent background composites are established:

| Module | Normalized state | Ordinary visible placements | Dynamic treatment | Raw-RGBA SHA-256 |
|---|---|---:|---|---|
| `ARENA_MOD` | state 1 | 91 | 15 cycle targets, 11 visible | `adbb37df37282cfff1e82541ae4eeb39b0958e6d56c50e64074f8c8dae245007` |
| `PILLAR_MOD` | independent track origins | 67 | four cycle targets normalized state 1 (0 visible); 10 cloud parts post-creation/pre-motion | `e6d5ed7a3c565cafe9945ad89fdeaaefde8987711d5e153ef0cf708a96874de7` |
| `PIT_MOD` | persistent post-creation; transient absent | 6 | 13 persistent cloud parts; transient explicitly absent; shadow symbolic | `c0e0dcf5d2d24e463890cedcbb35e59b29a022be7b0053f6eaa886d721af2fe4` |
| `CAVE_MOD` | all six phases explicitly zero | 97 | six first-traversed special-list objects | `feec6d83b3b402e5d94f42db800de6a372febd49d52084c11968c0484d2648f7` |
| `STRIPPED_MOD` | initial camera / BIGEMP selection 3 | 85 | five-part BIGEMP state 3 | `c51a14d6b05524e2ea5f541bfaf59a4faddb3da93a5ac2b0ba651c8a07899798` |

All five rasters are distinct.

## Composition rules consumed

- Ordinary BAK state and exact per-plane fresh draw order come from O43.
- Ordinary source pixels/palette binding come from O44.
- ARENA direct descriptor swap preserves object X/Y and ordinary list topology.
- PILLAR generic descriptor swap applies old-descriptor-offset minus new-descriptor-offset while preserving linked-list topology.
- PILLAR/PIT process-created no-scroll parts use their exact initial screen-space coordinates and established insertion ordering.
- CAVE `BAKLST9` renders before plane 8; the test vector explicitly selects phase zero for all six objects.
- STRIPPED BIGEMP uses selection 3 at initial camera X=405/Y=12 and its explicit primary-sort override.
- PIT shadow list is not rasterized; `SHAD_SCRNTL` remains symbolic.

## Independent pixel audit

A separate Python implementation independently:

- decoded authentic uGRA streams;
- read exact count-prefixed palettes from canonical `MK1.EXE`;
- rebuilt O43 ordinary placement pixels in verified draw order;
- decoded and placed the dynamic descriptors under the O45 normalized-state policies;
- reconstructed BIGEMP selection 3 from the authentic five-reference frame record;
- parsed generated PNGs and compared raw RGBA.

**23/23 audit checks passed and all 5/5 complete 320×200 rasters matched exactly at raw RGBA level.**

## Scope boundary

These files are **normalized compositor test vectors**, not canonical gameplay screenshots. They do not establish:

- canonical RNG state;
- canonical absolute process phase;
- PIT transient generic runtime presence/variant;
- numeric shadow state;
- scheduler tick → display frame / wall-clock conversion;
- later camera/culling history;
- gameplay actors, effects outside the qualified stage background families, HUD or framebuffer state.

## Pause

O45 + O46 complete the required two-major-verification block. Do not start O47 until the checkpoint is persisted.
