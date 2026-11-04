# MK DOS Archive — Handoff — Pass 1E.3O.29 Background Renderer Order + Camera Projection

Date: 2026-09-30

## Status

**VERIFIED / READ-ONLY AUTHENTIC-INSTALL VALIDATION PASSED**

Pass 1E.3O.29 follows the O27/O28 background objects into the canonical MK1 renderer. It closes the broad plane traversal and camera-projection questions without pretending that a single static image is the whole stage model.

## Canonical fixture

- `MK1.EXE` size: **1,157,222 bytes**
- SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`
- code file-image base: `0x00050A54`
- qualified Watcom static-data file-image base: `0x0008CA54`
- source: authentic user-supplied MK1 installation

## Prerequisites

- O27 verdict: `MK1_BACKGROUND_MODULE_RESOURCE_GRAPH_ESTABLISHED`
- O28 verdict: `MK1_BACKGROUND_PLACEMENT_AND_PIT_SCENE_EXPORT_IR_ESTABLISHED`

## Nine-plane model

`MULTI_PLANE` starts from a canonical 20-byte record table at Watcom Segment-2 offset `0x000006FC` and advances exactly `0x14` bytes per record. Nine populated records are followed by a zero first dword terminator.

Each record binds:

1. runtime object-list head address;
2. occupancy-bit array;
3. shared 16.16 scroll accumulator pointer (`0x0005634C` for all nine);
4. plane-specific 16.16 scroll accumulator pointer;
5. `BAKxMODS` destination list pointer.

The exact bindings are:

| Plane | Object list | Plane scroll | BMOD list |
|---:|---:|---:|---:|
| 0 | `0x000563C0` | `0x00056394` | `BAK0MODS` `0x00049CA0` |
| 1 | `0x000563B4` | `0x00056390` | `BAK1MODS` `0x00049CA4` |
| 2 | `0x000563B0` | `0x0005638C` | `BAK2MODS` `0x00049CA8` |
| 3 | `0x000563AC` | `0x00056388` | `BAK3MODS` `0x00049CAC` |
| 4 | `0x000563A8` | `0x00056384` | `BAK4MODS` `0x00049CB0` |
| 5 | `0x000563A4` | `0x00056380` | `BAK5MODS` `0x00049CB4` |
| 6 | `0x000563A0` | `0x0005637C` | `BAK6MODS` `0x00049CB8` |
| 7 | `0x0005639C` | `0x00056378` | `BAK7MODS` `0x00049CBC` |
| 8 | `0x00056398` | `0x00056374` | `BAK8MODS` `0x00049CC0` |

## Renderer traversal

The canonical renderer invokes the linked-list draw routine over the BAK planes in exact order:

**8 → 7 → 6 → 5 → 4 → 3 → 2 → 1 → 0**

Five additional non-BAK object lists are interleaved around that traversal. They are preserved as special lists and are not semantically renamed by this pass.

This establishes the **BAK plane traversal order**, not an invented arcade-layer vocabulary.

## Intra-list ordering

Canonical insertion routine `0x00011325` maintains each list ascending by:

1. primary key: object `+0x18`;
2. secondary key: signed 16.16 object Y at `+0x14`.

The renderer traverses each list head-to-tail.

For exact-equal primary and secondary keys, a newly inserted object is placed before an existing equal-key object. Therefore exact relative order among equal-key objects can depend on runtime insertion/culling history. O29 records this boundary explicitly rather than pretending the two sort keys create a total history-independent order.

## Coordinate-axis qualification

O28 had deliberately called the two placement words coordinate 0 / coordinate 1.

The renderer now closes their axes:

- object 16.16 position at `+0x10`, integer high word `+0x12`: **X**;
- object 16.16 position at `+0x14`, integer high word `+0x16`: **Y**;
- descriptor dimensions at object `+0x24`: low 16 bits = **width**, high 16 bits / `+0x26` = **height**.

Renderer clipping combines the first coordinate with width and the second with height. O28 coordinate0/coordinate1 can therefore be promoted to **X/Y** for this background object path.

## Camera / scroll projection

For ordinary objects, the renderer tests object flag `0x4000`. If the bit is clear, it computes:

- `screenX = worldX - currentPlaneScrollX`
- `screenY = worldY - sharedScrollY`

The bounded BAKGND placement-control transform used by O28 can set only low object-flag bits and cannot produce `0x4000`. Therefore the O28 placement-created background objects always use this camera subtraction path.

The default view bounds reset to packed `0x00C80140`, i.e. **320 × 200** with minimum `(0,0)`.

## PIT_MOD initial projection

`INIT_BAKMODS` proves that top-level module header word at `+0x08` seeds the shared scroll integer and `+0x0A` seeds all nine plane horizontal 16.16 accumulators.

For `PIT_MOD`:

- destination: `BAK0MODS` → **plane 0**;
- initial plane scroll X: **211**;
- initial shared scroll Y: **35**;
- O28 placements projected: **358**.

Thus the bounded initial projection for PIT background placements is:

- `screenX = worldX - 211`
- `screenY = worldY - 35`

O29 records all 358 exact projected coordinates in the machine report.

## Equal-key boundary

Within the 358 PIT placements:

- equal primary+Y sort-key groups: **85**;
- objects participating in those groups: **295**;
- largest equal-key group: **22**.

The renderer key hierarchy is verified, but exact ordering inside those ties remains runtime insertion/culling-history dependent.

## Verdict

`MK1_BACKGROUND_RENDER_ORDER_AND_CAMERA_PROJECTION_ESTABLISHED_EQUAL_KEY_TIES_AND_DYNAMICS_PENDING`

The important correction to O28 is that renderer plane order, X/Y axes, camera subtraction and default viewport are no longer unknown. What remains is not a generic “we do not know how the renderer works” problem; it is specifically:

- exact equal-sort-key insertion history where needed;
- dynamic background processes and animation;
- time-aware stage state;
- only then a canonical flattened frame/view if the requested export format needs one.

## Validation performed

- targeted TypeScript smoke compilation: **passed**
- authentic-install execution: **passed**
- canonical provenance: **passed**
- nine plane records + terminator: **passed**
- exact BAK0..BAK8 bindings: **passed**
- exact renderer BAK-plane traversal: **passed**
- insertion sort keys: **statically verified**
- X/Y axis interpretation: **statically verified**
- camera subtraction: **statically verified**
- default 320×200 bounds: **statically verified**
- PIT plane/initial scroll: **verified**
- second independent run: **semantically identical after stripping run IDs/timestamps**
- no write path: **true**

## Next pass

Pass 1E.3O.30 should explicitly investigate dynamic background processes and descriptor animation before any attempt to call one flattened image the canonical stage.
