# Mortal Kombat (DOS) Research Notes

## Status
- **Milestone 1 — Pass 1B**: Full MK1 GRA Handle Table Reconstruction.
- **Detection Status**: VERIFIED (Verified evidence clusters from DOS installation fixtures).

## Verified Fixture Evidence (Observed Installation)
- **Primary Executable**: `MK1.EXE` (1,157,222 bytes, classified as `DOS MZ Executable` by direct fixture headers).
- **Total Files**: 325 files.
- **Graphic Subsystem**: 58 `.GRA` files located in the `GRAPHICS/` directory (e.g., `ACT1HDRS.GRA`, `KANO.GRA`, `RAIDEN.GRA`, `NINJA.GRA`, `JCATT.GRA`, `T1HDRS.GRA`, `T2HDRS.GRA`, `GORO.GRA`, `TSUNG.GRA`, `REPTILE.GRA`, `CAGE.GRA`, `SONYA.GRA`, `LIUKANG.GRA`).
- **Audio & Subsystems**: `SFX/` directory with sound resources, `SAMPLES.DAT` audio package.
- **Extender & Configuration Utilities**: `DOS4GW.EXE`, `SETSOUND.EXE`.

## Verified GRA Handle Table (Observed Fixture)
- **Verification Status**: VERIFIED for this installation fixture.
- **Table Disk Offset**: `0x000B0C5C`
- **Record Stride**: 24 bytes (`0x18`)
- **Anchor Resource (`JCATT.GRA`)**:
  - File Size: 49,402 bytes (`0x0000C0FA`)
  - FileEntry Offset: `0x000B0CBC`
  - File ID: `4`
  - Validation: 7/7 rules passed
- **Initial Table Ordering (Empirically Recovered)**:
  - ID 0: `0x0002DA78` (187,000 bytes) → `GRAPHICS/STANCE.GRA`
  - ID 1: `0x0001E5A8` (124,328 bytes) → `GRAPHICS/FONTS.GRA`
  - ID 2: `0x000197FC` (104,444 bytes) → `GRAPHICS/MISC.GRA`
  - ID 3: `0x00006308` (25,352 bytes) → `GRAPHICS/VICTORY.GRA`
  - ID 4: `0x0000C0FA` (49,402 bytes) → `GRAPHICS/JCATT.GRA`
  - ID 5: `0x00008110` (33,040 bytes) → `GRAPHICS/KATT.GRA`
  - ID 6: `0x0000F3BA` (62,394 bytes) → `GRAPHICS/LKATT.GRA`
  - ID 7: `0x0000CD4E` (52,558 bytes) → `GRAPHICS/RDATT.GRA`
  - ID 11: matching `GORO1.GRA`
  - ID 12: matching `MKTITLE1.GRA`
- **String Offset Observation**: Relative deltas between `rawFilenameOffset` values match the length of corresponding DOS ASCII paths (e.g. `GRAPHICS\STANCE.GRA\0` = 20 bytes).

## Detection Strategy
- High confidence requires primary executable (`MK1.EXE` or `MK.EXE`) plus verified `GRAPHICS/*.GRA` character/scene resource cluster.
- Single executable alone without resource cluster yields medium confidence.
