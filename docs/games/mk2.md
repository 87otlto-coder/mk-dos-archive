# Mortal Kombat II (DOS) Research Notes

## Current status

MK2 now has an independently verified authentic-fixture foundation through **Pass 1E.3O.69**. MK1 structures are not treated as authority for MK2.

Canonical user fixture:

- archive: `mk2.zip`
- archive SHA-256: `b68d4a6884b927601d34f4a01ed90dcfc31b8f6ea92de75fa9aa8cc736e481f2`
- regular files: **614**
- total regular-file bytes: **19,921,006**
- root `.GRA`: **124**
- `fx/*.U8`: **312**
- `sound/`: 33 files each of `.AWE`, `.GVS`, `.LAP`, `.MID`, `.SBL`

Canonical executable:

- `MK2.EXE`
- size: **861,133** bytes
- SHA-256: `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`
- bound DOS/4GW Linear Executable
- application LE header: physical `0x28F0C`
- file-backed LE end: `0xABD79`
- bytes `0xABD79..0xD23CD`: `UNRESOLVED_POST_LE_OVERLAY`

## O67 — fixture/resource/executable topology

O67 independently establishes the two-object LE layout, 113 file-backed pages, installation census, and a 129-entry executable resource filename pool containing 123 `.GRA`, 5 `.BIN`, and `RM.DRV`. `MONKS.GRA` is the only installed root GRA outside that qualified pool.

## O68 — first indexed graphics closure

MK2 Object-1 renderer bytes independently establish transparent-skip, indexed-RLE, and aligned literal-indexed stream commands. A 35-record `JC0.GRA` descriptor chain found in the unresolved overlay tiles all **120,240** authentic resource bytes exactly. O68 exports 35 lossless one-byte index planes plus opacity masks. Opaque indices span **1..63**. Palette ownership and the overlay runtime consumer remain unresolved.

## O69 — broad indexed GRA census

Applying the same MK2-derived decoder with a strict exact-resource tiling gate produces:

- **4,225** grammar-valid overlay descriptor candidates across **109** pooled GRA resources;
- **94** resources / **3,790** streams promoted to exact full-resource tiling;
- **11,385,532** authentic encoded bytes covered exactly;
- **15,953,739** decoded indexed pixels;
- opaque index union **1..175**;
- **15** candidate-bearing resources retained partial/ambiguous;
- **14** pooled resources with no overlay candidate retained unresolved;
- `MONKS.GRA` retained as the single installed out-of-pool root GRA.

Independent O69 audit passes **217/217** checks. Source/UI integration audit passes **23/23**.

## Boundaries

No current MK2 pass establishes palette ownership, game-colour RGBA for the broad corpus, gameplay animation naming, stage reconstruction, audio semantics, the runtime consumer/semantic class of the post-LE overlay, or a shared MK1/MK2 abstraction. The existing MK2 sound layout is materially different from MK1 and remains independently unresolved.

## Pass 1E.3O.70 — Browser indexed graphics package

O70 productizes only the O69 exact-full surface. The browser package preserves 94 authentic GRA files byte-for-byte and exports all 3,790 qualified streams as one-byte index planes plus independent opacity masks. Exact inventory is 7,678 STORE ZIP entries and 48,792,953 bytes. Accepted package SHA-256 is `04902dcd5962d5b9ca708b34ce57735d5215ca64d3be762aa8d0652918dd8e97`.

Palette ownership and correct-colour RGBA remain unestablished. Fifteen partial/ambiguous resources, fourteen zero-candidate pooled resources, and `MONKS.GRA` remain outside whole-resource claims. The descriptor corpus remains in `UNRESOLVED_POST_LE_OVERLAY`; O70 does not establish its runtime consumer or semantic class. Independent package audit passes 109/109 checks.
