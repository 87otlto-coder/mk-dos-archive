# Mortal Kombat 3 (DOS) Research Notes

## Status
- **Milestone 0B / 1A**: Real-Game Validation & Executable Investigation.
- **Detection Status**: VERIFIED (Verified evidence clusters from DOS installation fixtures).

## Verified Fixture Evidence (Observed Installation)
- **Primary Executable**: `MK3.EXE` (1,496,497 bytes, classified as `DOS MZ Executable` by direct fixture headers).
- **Total Files**: 85 files.
- **Core Resource Containers**:
  - `DATA.MK3`: Core game container beginning with `FORM` container magic.
  - Fighter Containers (`*.FTR`): Each beginning with `MFIL` container magic:
    `BLADE.FTR`, `INDIAN.FTR`, `JAX.FTR`, `KAHN.FTR`, `KANG.FTR`, `KANO.FTR`, `LAO.FTR`, `LIA.FTR`, `MISC.FTR`, `MOTARO.FTR`, `ROBO.FTR`, `SHANG.FTR`, `SHEEVA.FTR`, `STANCES.FTR`, `SWAT.FTR`, `TURK.FTR`, `TUSK.FTR`.
- **Distribution Wrappers**:
  - GOG / CD images include `IMAGE/MK3.cue` and `IMAGE/Track02.ogg` through `Track13.ogg`.
  - These CD wrapper files are distribution packaging and are NOT required for game detection.

## Executable Structure & Payload Status
- **External Research Reference**: Independent published research identifies MK3 DOS as a 32-bit DOS extender application (DOS4GW / Causeway / PMODE).
- **Fixture Verification Status**: INFERRED / EXTERNAL REFERENCE.
- Generic two-stage signature analysis successfully verifies standalone utilities like `SETSOUND.EXE` as LE, while the main `MK3.EXE` runtime payload encapsulation is UNDER INVESTIGATION.

## Detection Strategy
- High confidence requires primary executable (`MK3.EXE`) plus `DATA.MK3` (`FORM`) and multiple `.FTR` files (`MFIL`).
- Single executable alone without container cluster yields medium confidence.
