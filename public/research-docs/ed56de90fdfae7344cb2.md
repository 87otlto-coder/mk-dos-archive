# MK DOS Archive — Pass 1E.3O.35 PIT Dynamic Motion / Shadow-Bound Qualification

Date: 2026-09-30

## Status

**VERIFIED — `MK1_PIT_DYNAMIC_MOTION_SHADOW_BOUND_AND_TRANSIENT_LIFECYCLE_ESTABLISHED`**

O35 follows the three PIT child callbacks identified by O30 and replaces the earlier conservative “camera or render-bound” label with exact bounded semantics.

## Canonical fixture

- `MK1.EXE`: 1,157,222 bytes
- SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`
- dynamic graphics resource: File ID 27 / `GRAPHICS/FU5HDRS.GRA`
- dynamic palette: 14-colour `dcloud_p` / `MOON_p` at Watcom `0x0000FB6E`

## Shadow-bound updater (`0x4920`)

The callback writes `SHAD_SCRNTL`, not PIT camera state:

`SHAD_SCRNTL = (2 * CEILING_Y - signedHighWord(WORLDTLY) + 126) << 16`

It repeats every scheduler tick. `DISPLAY_ALL` consumes this bound for the special shadow list. The callback does not write the established scroll/camera globals, so O30's prior broad classification is refined to a shadow/render-bound updater.

## Persistent PIT moving family (`0x494A`)

Ten always-created multipart/no-scroll groups are instantiated from a ten-row setup table at Watcom `0x0CFA`. They are inserted on plane/list 2 and use three exact X-velocity classes:

- `0x6666` = 0.399993896484375 px per display-active update — 2 groups;
- `0x4CCC` = 0.29998779296875 px/update — 3 groups;
- `0x3333` = 0.1999969482421875 px/update — 5 groups.

Every eight scheduler ticks the process tests signed integer root X. If X > 319 it shifts the entire multipart object by -459 X while preserving fractional X and restoring the velocity.

Normalized first wraps on the explicitly display-active path:

- group 05: tick 208
- group 10: tick 328
- group 02: tick 504
- group 09: tick 648
- group 04: tick 672
- group 01: tick 1128
- group 03: tick 1168
- group 08: tick 1224
- group 07: tick 1608
- group 06: tick 2112

The eight unique persistent descriptors all decode from authentic `FU5HDRS.GRA` and remain within the 14-colour `dcloud_p` palette.

## Conditional transient family (`0x4870`)

The PIT init spawn gate is preserved exactly, including the `GSTATE` and DIP/silhouette conditions. The child waits 32 scheduler ticks before local object creation, chooses one of eight authentic silhouette descriptors, creates a no-scroll object at (-80,37), and assigns X velocity `0x19999` (1.5999908447265625 px per display-active update).

On an object-local normalized display-active timeline:

- first X>=319 threshold: tick 250;
- reset X to -80, velocity to 0;
- pause: 288 scheduler ticks;
- velocity restored: tick 538;
- second X>=319 threshold and deletion: tick 788.

Absolute stage spawn phase is not established and is not invented.

## Validation

- canonical source identity: passed;
- all required code signatures/tables: passed;
- 16/16 unique dynamic descriptors independently decoded;
- all opaque palette indices in range;
- ten persistent group setup rows and velocity classes reproduced;
- all ten normalized first-wrap ticks reproduced;
- transient 250 / 288 / 788 lifecycle reproduced;
- no write path introduced.

An independent Python audit reread canonical bytes and reproduced the descriptor checksums, tables and timelines. The final integrated-source rerun is semantically identical to that independently audited output after excluding timestamps/operation IDs.

## Boundary

Scheduler ticks, display-active object updates and wall-clock time remain distinct. PIT camera evolution is not attributed to the `0x4920` background callback. O35 is read-only.
