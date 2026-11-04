# MK DOS Archive — O96X / O96Y Full MOUNTAIN.GRA Indexed Reconstruction

**Date:** 2026-10-09 (SAST)  
**Game:** Mortal Kombat II DOS  
**Status:** PRODUCER PASS / INDEPENDENTLY VERIFIED / MK2 RESEARCH OPEN

## Authority

- Parent archive: `MK-DOS-Archive-2026-10-09-O96W-source.zip` (SHA-256 `95cf3cec90e17a839b8a78453ed9d4324e5edd4a52ba4208ab457c531b10d0c2`).
- Canonical original `MK2.EXE`: SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.
- Canonical original `MOUNTAIN.GRA`: SHA-256 `0dc92ef698a139eacaf57d1b7ebe47b40c8b1c08952251d8274c818be05c2ff6`.
- O96S, O96T, O96U, O96V and O96W remain frozen historical evidence. Authentic game fixture files were not modified.

## O96X — Two setup records exhaustively select 49 prefix descriptors and palette slot 2

At Object-2 offsets `0x1C31E` and `0x1C330` are two independently relocated 18-byte setup records. Their `+0x04` words are **39** and **10** respectively. Their `+0x06` pointers lead to disjoint 8-byte control-entry sequences at `0x1C5DC` and `0x1C716`; their `+0x0A` pointers alias the same 8-byte sprite descriptor array at `0x1C344`; their `+0x0E` pointers alias the eight-entry palette table at `0x1C5BC`. These pointer fields are authenticated Object-2 Type-7 LE fixups.

Every one of the 49 control entries starts with WORD `0x4042`. The bounded consumer in file-backed machine code computes:

- Sprite descriptor pointer: `setup[+0x0A] + ((entry[+0x06] & 0x0FFF) << 2)` (`0x81CDE..0x81CE9` / corresponding alternate branch).
- Palette table slot: `(entry[+0x00] & 0x000F) | ((entry[+0x06] & 0xF000) >> 8)` (`0x81DAF..0x81DD8`).

For all 49 authenticated control records, the descriptor expression selects one **distinct** 8-byte record within `0x1C344..0x1C4CC` (exclusive); the union is the entire **49-element** descriptor array, with no duplicates and no omissions. The palette slot expression is **exactly 2** every time, pointing via a Type-7 Object-1 relocation to the same 207-colour record at `0x2B52A` qualified in O96V. The allocator consumer call `0x81DDA` and object palette-handle field write `0x81DDF` are authenticated.

**Qualification boundary:** all of the above is a verified *conditional setup-record to descriptor/palette consumer contract*. We have not proven that the runtime register ESI actually contains either setup record during a specific game scene. Thus the correct-color runtime binding is **not** promoted to VERIFIED, despite the exact slot calculation.

## O96Y — 64 lossless indexed streams exactly tile MOUNTAIN.GRA

The newly connected 49 prefix sprite descriptors occupy `0x1C344..0x1C4CC` and use the standard 8-byte `[u16 width][u16 height][u32 packed resource]` format. All 49 use resource File ID 37, authenticated by the original MK2 resource filename pool as `MOUNTAIN.GRA`. Their starts, decoding lengths, and ends join exactly from **byte 0 to 168,724** (`0x29314`).

These join O96T's **15** 16-byte extended descriptors at `0x1C4CC..0x1C5BC`, which decode exactly from **168,724 to 191,748**, the authentic EOF. Therefore **all 191,748 bytes** of `MOUNTAIN.GRA` are covered with no gap, overlap, opaque leftover, or guessed extent. Each of the **64** decoded indexed pixel buffers has a distinct SHA-256. The executable-connected prefix supplies **49** new per-sprite decode witnesses; O96T's 15 prior suffix witnesses are verified unchanged.

Overall:

| Property | Result |
|---|---:|
| Prefix eight-byte descriptors | 49 |
| Suffix extended sixteen-byte descriptors | 15 |
| Total images | **64** |
| Encoded resource bytes | **191,748 / 191,748** |
| Decoded indexed pixels | **238,751** |
| Opaque pixels | **172,626** |
| Transparent pixels | **66,125** |
| Indexed-RLE commands | **4,184** |
| Aligned literal commands | **7,513** |
| Transparent skip commands | **3,759** |
| Highest observed source index | **206** |
| Compatible palette record length | **207** |
| Distinct decoded image buffers | **64** |

The full source index domain fits the authenticated 207-colour record exactly (highest observed index 206). Compatibility alone does not prove observed palette ownership, final RGB appearance, runtime object placement, or complete stage reconstruction.

**Coverage reconciliation:** O69's historical report is frozen at 94/124 exact-full resources and previously listed `MOUNTAIN.GRA` as partial. O96Y supplies independent exact-full evidence for one additional resource. The *new supported research coverage* is therefore **95/124**, while the older O69 artifact remains unchanged and must not be represented as having originally produced 95/124.

## Hypothesis decisions

| Interpretation | Verdict |
|---|---|
| The 39+10 setup entries address 49 separate prefix descriptors | **SUPPORTED** exactly, conditional setup path |
| All 49 setup entries calculate palette table slot 2 | **SUPPORTED** exactly, conditional setup path |
| Prefix bytes hold 49 valid sprites covering `0..0x29314` | **SUPPORTED** independently decoded |
| The existing 15 suffix sprites follow without a gap | **SUPPORTED** independently reconfirmed |
| Every indexed pixel can address the 207-colour record | **SUPPORTED structurally** |
| Final RGB scene is correct and its palette handle observed at runtime | **UNPROVEN** |
| The game uses both setup records in a known scene | **UNPROVEN** |
| The 64 images constitute a complete composited background | **UNPROVEN** |

## Verification

- TypeScript/Node fixture producer: **PASS**; independent full LE relocation reconstruction: **27,004 records**.
- Separate Python verifier: **93,666 checks / zero failures**; full independent LE fixup parsing, setup-join evaluation, indexed sprite decoding, per-sprite pixel/mask SHA-256, exact file coverage.
- Regression: O96V/W **58,159/0**, O96T **4,007/0**, O96U **957/0**.
- Negative controls: wrong palette slot/descriptor derivation, changed sprite pixel hash, fabricated observed RGB palette ownership, false exact-full flag — all independently **REJECTED**.

Evidence files:

- `mk2_mountain_setup_palette_49_entries_o96x_2026-10-09.json`
- `mk2_mountain_exact_full_64_indexed_images_o96y_2026-10-09.json`
- `scripts/run-mk2-o96x-o96y-mountain-full.mjs`
- `scripts/verify-mk2-o96x-o96y-mountain-full.py`

## Next — O96Z

Follow runtime ESI binding to the two setup records and the exact object palette handle, or proceed with stage composition coordinates and layer-order mechanisms. Test each hypothesis; do not confuse a correct and lossless indexed source export with a runtime-correct composed stage. If the setup binding remains unprovable, move on to remaining partial GRA families, remaining palette selector contexts, non-MID audio validation and animation reachability blockers rather than repeating indirect scans.

**MK2 research remains OPEN. Required sequence:** finish MK2 → finish MK1 → finish MK3 → user discussion of UI/usability → build the extractor.
