# MK DOS Archive — Handoff — Pass 1E.3O.33 PILLAR Cloud Motion / Reset Qualification

Date: 2026-09-30

## Status

**VERIFIED — direct authentic-fixture qualification + independent byte/decode/timeline audit passed.**

O33 resolves the positional-motion family that O30 had bounded only as `PILLAR_MOD` child callback `0x00004A1A`.

## Canonical fixture

- `MK1.EXE`: 1,157,222 bytes
- SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`
- authentic resource: `GRAPHICS/FU4HDRS.GRA`, File ID 25

## Qualified object family

The PILLAR init callback spawns two independent children: `0x4A1A` (cloud motion) and `0x4BB8` (the descriptor cycles already qualified by O30). The motion child creates three multipart cloud groups:

- cloud1 descriptor list `0x00000DE6`: `cloud1a`, `cloud1b`, `cloud1c`, animation anchor `(16,28)`;
- cloud2 descriptor list `0x00000DF6`: `cloud2a`, `cloud2b`, `cloud2c`, `cloud2d`, animation anchor `(157,28)`;
- cloud1 descriptor list reused, animation anchor `(311,28)`.

The seven descriptors are authentic File-ID-25 `FU4HDRS.GRA` descriptors. Setup descriptors `cloud1a` and `cloud2a` directly link `cloud_p` at Watcom data offset `0x0000FB04`. `cloud_p` contains 12 colours. All 7/7 sprites decode successfully and their maximum opaque palette index is <= 12.

## Placement / projection

Creation calls `SET_MULTI_ANIY`, `SET_MULTI_ANIX`, `SET_MULTI_NS`, `ADD_TO_MASTER_LIST`, then inserts the multipart object through the callback at `0x4B9A`. That callback selects `BAKLST6` (`0x000563A0`), which O29 maps to renderer plane 6.

`SET_MULTI_NS` sets object flag `0x4000` on every linked part. O29's qualified renderer tests that bit and bypasses plane-scroll X and shared-scroll Y subtraction. The cloud family is therefore a **plane-6, screen-space/no-scroll** family.

Derived initial integer positions after the animation-anchor setters:

- group 1 root `cloud1a`: `(-33,24)`;
- group 2 root `cloud2a`: `(74,30)`;
- group 3 root `cloud1a`: `(262,24)`.

Every other multipart part preserves the descriptor-local offset around its group's requested anchor.

## Motion

Every root receives X velocity `0x00006666`, Y velocity remains zero. `ADD_TO_MASTER_LIST` registers the roots; `DISPLAY_ALL` walks that master list and helper `0x11003` copies each root's X/Y velocity to every linked multipart part. The object update path then adds velocity fields `+0x08/+0x0C` into signed 16.16 positions `+0x10/+0x14`.

Qualified X rate:

`0x6666 / 65536 = 0.399993896484375 pixels per DISPLAY_ALL update`

This is **not** converted to FPS or milliseconds.

## Wrap/reset rule

The process polls all three roots, then sleeps 8 scheduler ticks. On each wake:

- signed integer root X at object `+0x12` is compared against `319`;
- reset triggers only for `X > 319`;
- X velocity is saved and temporarily zeroed;
- `MULTI_ADJUST_XY` shifts the full multipart object by `-459 X / 0 Y`;
- the prior X velocity is restored.

The fractional 16.16 component survives the wrap.

On the specifically bounded display-active `PRCDSP` path, `DISPLAY_ALL` executes before the process scheduler traversal. With tick 0 normalized immediately after creation/initial reset scan, first wrap polls are:

- group 3: tick **152**;
- group 2: tick **616**;
- group 1: tick **888**.

A `PRCDSP` path also exists that reaches scheduler traversal without `DISPLAY_ALL`. Therefore O33 does **not** claim a universal scheduler-tick-to-display-update ratio.

## Evidence

Direct report:

- format: `mk1_pillar_cloud_motion_reset_qualification_v1`
- SHA-256 at checkpoint: `5f1215c8a136f41cee95de535acaa51b1cba4b14e670362a3466ecf61d952a9d`
- verdict: `MK1_PILLAR_CLOUD_MOTION_AND_WRAP_SEMANTICS_ESTABLISHED`

Independent audit:

- format: `mk1_o33_independent_audit_v1`
- SHA-256: `9405aa18fd5db140fd1125235e78dfc72ab4e916f45998ea81163c0cda5300f6`
- independently rechecked selected canonical code bytes, both cloud pointer lists, all seven uGRA decodes/checksums/palette limits, initial roots and all three first-wrap ticks.

## Explicit non-claims

O33 does not establish wall-clock speed, a universal scheduler/display ratio, generic MK1 cloud semantics, a complete PILLAR stage raster, or any write/import capability.
