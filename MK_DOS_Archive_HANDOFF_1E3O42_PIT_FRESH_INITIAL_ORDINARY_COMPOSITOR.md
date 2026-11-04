# MK DOS Archive — Pass 1E.3O.42 PIT Fresh-Initial Ordinary BAK Compositor Handoff

**Status:** VERIFIED (bounded read-only export fixture)  
**Verdict:** `MK1_PIT_FRESH_INITIAL_ORDINARY_BAK_COMPOSITOR_FIXTURE_ESTABLISHED`

## Scope

O42 consumes O41's precisely defined fresh-initial PIT state. It does **not** claim a canonical gameplay screenshot or complete PIT frame. The fixture contains only ordinary BAK placements after empty-state initialization, PIT's known initial camera and the first ordinary-background population pass.

Excluded: O35/O36 process-created persistent cloud groups, the conditional transient, shadow/special lists, later cull/recreate camera history, fighters, HUD and framebuffer state.

## Deterministic composition

Canvas: transparent RGBA, 320x200.  
Camera: X=211, Y=35.  
Visible ordinary placements: six.  
Exact plane-1 head-to-tail draw order:

`169 -> 124 -> 72 -> 143 -> 75 -> 58`

Only two O28 correct-colour source variants are needed:

- descriptor 30 / palette selector 1 — 128x26;
- descriptor 35 / palette selector 1 — 86x21.

Viewport clipping is applied while compositing. The resulting transparent ordinary-BAK layer contains **10,278 opaque pixels**. Its raw RGBA SHA-256 is:

`a0d3f10adf58c9a22dc53898ed618ad07fbb1e5bc0c5a56ce1b877f7d6dbe4bc`

The exact-equal placement pair 169/124 shares 26 opaque overlap pixels, and 22 of those pixels have different colours depending on which instance is on top. This independently demonstrates that O41's bounded fresh tie-order proof is materially required for the raster.

## Export package

O42 exports three PNG/RGBA payloads:

1. descriptor 30 / palette 1 source asset;
2. descriptor 35 / palette 1 source asset;
3. the 320x200 fresh-initial ordinary PIT BAK composite.

A manifest records the six placement instances, source variants, camera and exclusions.

## Independent validation

A separate Python implementation did not consume the TypeScript payloads as ground truth. It:

- re-read canonical `MK1.EXE` and `GRAPHICS/FU5HDRS.GRA`;
- resolved `FU5PALS` selector 1 directly to palette record `0x10850` (26 colours);
- re-read descriptor-table ordinals 30 and 35 and independently decoded their uGRA streams;
- directly reparsed `bridge1BMOD` placement records;
- re-derived the six visible placements and fresh draw order;
- independently rendered the 320x200 transparent composite;
- compared raw RGBA against all three generated PNGs.

Result: **3/3 exact RGBA matches**, identical composite SHA-256, identical 10,278 opaque-pixel count, and identical 26/22 overlap-sensitivity measurement.

## Boundary

This fixture is deterministic only under the stated fresh-initial ordinary-BAK contract. O41 proves that later equal-key order can change through cull/recreate history. O42 therefore must not be generalized into a canonical arbitrary-time PIT screenshot.
