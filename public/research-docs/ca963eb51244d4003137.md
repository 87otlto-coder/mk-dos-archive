# MK DOS Archive — Checkpoint — Pass 1E.3O.67 MK2 Fixture / Resource / Executable Topology

## Status

**VERIFIED / AUTHENTIC MK2 FOUNDATION ESTABLISHED**

O67 opens the MK2 line independently from MK1. It uses the user-supplied authentic MK2 installation as the only game-data authority and does not import MK1 descriptor, palette, animation, stage, or audio assumptions.

## Canonical fixture

- user archive: `mk2.zip`
- archive SHA-256: `b68d4a6884b927601d34f4a01ed90dcfc31b8f6ea92de75fa9aa8cc736e481f2`
- ZIP integrity: clean
- regular files after extraction: **614**
- total regular-file bytes: **19,921,006**
- root `.GRA`: **124**
- `fx/*.U8`: **312**
- `sound/`: **165** files, exactly **33 each** of `.AWE`, `.GVS`, `.LAP`, `.MID`, `.SBL`
- root `.BIN`: **6**

Canonical executable:

- file: `MK2.EXE`
- byte length: **861,133**
- SHA-256: `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`
- bound DOS/4GW Linear Executable

## Independent LE topology

The actual application LE header is at physical **`0x28F0C`**. Earlier generic `LE`-string hits inside the DOS/4GW loader are not the application header.

Qualified fields:

- CPU: 386 (`2`)
- target OS: `1`
- module flags: `0x200`
- module pages: **113**
- page size: **4096**
- last file-backed page size: **1913**
- EIP: object 1 / `0x3CAA0`
- ESP: object 2 / `0x86660`
- data pages physical offset: **`0x3B600`**
- Object 1: virtual size `0x3EE98`, relocation base `0x10000`, flags `0x2045`, page-map index 1, 63 pages
- Object 2: virtual size `0x86660`, relocation base `0x50000`, flags `0x2043`, page-map index 64, 50 pages
- all 113 LE page-map entries are sequential one-based physical page numbers

The final file-backed LE page ends exclusively at **`0xABD79`**. The remaining **157,268 bytes**, `0xABD79..0xD23CD`, are explicitly classified:

`UNRESOLVED_POST_LE_OVERLAY`

This matters because O68 finds useful descriptor-like records inside that overlay. They must **not** be mislabeled as ordinary file-backed Object-2 data or as a Watcom debug container without additional evidence.

## Executable resource filename pool

A contiguous NUL-delimited filename pool spans physical `0xA0EF1..0xA13A7` and contains **129 entries**:

- 123 `.GRA`
- 5 `.BIN`
- `RM.DRV`

All 123 pooled GRA names exist in the authentic installation. The only root GRA not in this qualified pool is `MONKS.GRA`. The only root BIN not in this pool is `GMI.BIN`.

Pool ordinal **109** is `JC0.GRA`; O68 independently tests that ordinal/resource join against actual descriptor offsets and decoded stream boundaries rather than treating pool order alone as sufficient semantic proof.

## Important divergence from MK1

The MK2 asset layout is already materially different from MK1. MK2 exposes 312 `.U8` effects and five 33-track hardware-specific sound/music families rather than MK1's verified WAV + `SAMPLES.DAT` surface. No MK1 audio model is generalized.

## Verdict

`MK2_AUTHENTIC_FIXTURE_RESOURCE_AND_EXECUTABLE_TOPOLOGY_ESTABLISHED`

O67 is a read-only foundation pass. It establishes fixture identity, executable topology, installation/resource census, the filename pool, and an explicit unresolved post-LE overlay boundary. It does not establish MK2 palettes, gameplay animation naming, audio semantics, or any shared MK-DOS abstraction.
