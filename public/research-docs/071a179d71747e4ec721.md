# MK DOS Archive — Handoff — Pass 1E.3O.34 PILLAR Dynamic Scene Export Package

Date: 2026-09-30

## Status

**VERIFIED — direct authentic-fixture export + independent 31-payload RGBA/PNG and motion-timeline audit passed.**

O34 packages the two independently qualified dynamic axes of normal `PILLAR_MOD` without inventing mutual phase or a full-stage flattened raster.

## Descriptor-animation track

O31 binds the O30 PILLAR descriptor-cycle filters to four exact BMOD placement objects:

- `PILLAR_CONTROL_HIGH_4`: plane 0, sort/control key 4, one object, palette selector 9;
- `PILLAR_CONTROL_HIGH_3`: plane 1, key 3, one object, palette selector 9;
- `PILLAR_CONTROL_HIGH_2`: plane 1, key 2, two objects, palette selector 12.

Selectors 9 and 12 both alias Watcom palette record `0x0000FAE0` in `fu4PALS`. That record has 17 colours. O30 established that the descriptor-cycle update path preserves object `+0x28`, so this is BAKGND-selected runtime object palette state rather than a compatibility guess.

Each family contains 8 authentic states at 4 scheduler ticks. O34 exports all **24** state sprites as deterministic transparent RGBA payloads. All opaque indices fit the 17-colour runtime palette.

## Cloud-motion track

O34 incorporates O33's three process-created multipart cloud groups:

- plane 6 / no-scroll;
- seven unique `FU4HDRS.GRA` cloud descriptors;
- directly linked 12-colour `cloud_p` palette;
- root X velocity `0x00006666` signed 16.16;
- process wrap poll every 8 scheduler ticks;
- wrap at signed integer X > 319 by exactly -459 X while preserving velocity/fraction.

All **7** cloud-part sprites are exported as deterministic transparent RGBA payloads.

O34 also exports a normalized display-active process-poll timeline from tick 0 through tick 888 (112 poll snapshots including tick 0), reproducing first wraps at 152 / 616 / 888.

## Time-axis boundary

The descriptor cycles and cloud process use the same scheduler tick unit, but their canonical absolute phase relationship is not independently established. O34 therefore uses two explicit normalized origins:

- descriptor state 1 = relative tick 0 for each cycle track;
- cloud tick 0 = immediately after cloud creation and its initial reset scan.

No wall-clock conversion is made.

## Export result

- 3 descriptor-animation tracks;
- 24 descriptor-cycle RGBA payloads;
- 3 cloud groups;
- 7 cloud-part RGBA payloads;
- **31 total PNG/RGBA payloads**;
- 112 normalized cloud process-poll snapshots;
- zero decode failures;
- zero palette-range failures.

Whole-stage flattening remains blocked because this is a bounded dynamic-component package and absolute track phase / full runtime state remain intentionally unresolved.

## Evidence

Direct report:

- format: `mk1_pillar_dynamic_scene_export_fixture_v1`
- SHA-256 at checkpoint: `a50273a7e36d470e4193781f3172e16cfebb3e06dd0deae1b1c43a73c1e7d1e5`
- verdict: `MK1_PILLAR_BOUNDED_DYNAMIC_SCENE_EXPORT_PACKAGE_ESTABLISHED`

Independent audit:

- format: `mk1_o34_independent_audit_v1`
- SHA-256: `7df6ae629b56c0e41ed59c4d65c25dae109bd226e36371ac7d1b70f256ece9b0`
- independently decoded/colorized all 24 cycle states + 7 cloud parts from authentic bytes and compared raw RGBA to all 31 generated PNGs: **31/31 exact**;
- independently simulated and matched every exported normalized cloud poll through tick 888.

## Explicit non-claims

O34 does not establish canonical absolute phase alignment between the two tracks, wall-clock timing, a full PILLAR stage raster, equal-key history outside the bounded targets, or any new binary writer capability.

## Pause

O33 + O34 satisfy the required two-major-verification cadence. Stop here, report, and refresh the authoritative full master handoff before O35.
