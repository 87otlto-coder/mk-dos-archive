# MK DOS Archive — O96Z / O97A / O97B Mountain Placement and Conditional Canvas

**Authority date:** 2026-10-09 (SAST)  
**Game:** Mortal Kombat II (original DOS)  
**Status:** SOURCE VERIFIED / INDEPENDENTLY TESTED / MK2 RESEARCH OPEN

## Source basis and limits

- Parent checkpoint: `MK-DOS-Archive-2026-10-09-O96Y-source.zip`.
- Original MK2.EXE SHA-256: `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.
- Original MOUNTAIN.GRA SHA-256: `0dc92ef698a139eacaf57d1b7ebe47b40c8b1c08952251d8274c818be05c2ff6`.
- O96X/Y original evidence and all prior source files have been kept unchanged.
- The executable evidence establishes **conditional mechanisms**; it is not a running emulator trace or proof of observed in-game RGB output.

## O96Z — Serialized setup-pointer adjacency and indirect runtime handoff

Three authenticated Type-7 Object-2 relocations identify:

| Object-2 source | Relocated target | Evidence |
|---|---|---|
| `0x1C302` | `0x77453` | Runtime producer's first row fourth-field pointer / global source |
| `0x1C306` | `0x1C31E` | First (39-entry) Mountain setup record |
| `0x1C312` | `0x1C330` | Second (10-entry) Mountain setup record |

The eight-row producer at physical `0x81BB3` receives a pointer to runtime slot `0x77453`; the bounded code reads that slot at `0x81BD9` and the subsequent setup-like fields with `0x81C53` (`ESI=[EAX]`) and `0x81C55` (`EBX=[EAX+4]`). The object creation path eventually uses `[ESI+0x0E]` for palette selection. **No static proof yet establishes when this runtime slot holds either Mountain setup**. The nearby serialized relationships establish candidates, not observed selection.

## O97A — Executable-derived object coordinate deltas and exact 320×200 grid

The 49 authenticated O96X setup entries supply two signed 16-bit deltas each, a sprite index and palette selection. In the object-creation routine `0x81D92..0x81DAB`, the signed/low-word pairs are added to the two low words of `[0x75A64]` and written to object fields `+0x1A` and `+0x1E`. Therefore the raw control values are **relative coordinate inputs, not independently qualified absolute screen coordinates**. A second bounded path writes the palette allocator result to object field `+0x30`.

- The first Mountain setup, Object-2 `0x1C31E`, selects **39** unique prefix sprites, with raw X deltas from **-8 to 280** and Y deltas from **-48 to 768**. This is not by itself a 320×200 image.
- The second setup, Object-2 `0x1C330`, selects exactly **10** distinct sprites, each **64×100** pixels. The raw deltas are a Cartesian grid: X = **0, 64, 128, 192, 256** and Y = **0, 100**, with each coordinate pair occurring exactly once.
- Independent full rectangle-raster verification proves these ten source rectangles cover **every one of 64,000 positions in 320×200 exactly once**, without rectangle gaps or overlaps.
- The ten underlying sprites have **38,113 opaque source pixels** and **25,887 transparent source pixels**. Rectangle coverage DOES NOT mean the canvas is fully opaque; another layer could be visible through the transparent positions.

## O97B — Lossless indexed canvas reconstruction, explicit palette *candidate* preview

The ten O97A sprites were decoded again directly from original `MOUNTAIN.GRA` bytes and placed by their respective raw deltas to produce:

- `evidence/mk2_mountain_o97b/mountain_10tile_conditional_indices_320x200.bin`: **64,000 bytes**, indexed pixels. SHA-256 `0bad7e7e3afb0120fbdbc499526540cb0a861e4fa984d5e727051ded4c2334d1`.
- `evidence/mk2_mountain_o97b/mountain_10tile_conditional_opacity_320x200.bin`: **64,000 bytes**, alpha flags (0 transparent, 1 opaque). SHA-256 `0199169ab34038e624256d79b90135abe37b17345d6503ce318ab93dfca03fcb`.
- `evidence/mk2_mountain_o97b/mountain_10tile_conditional_palette_candidate.png`: a **320×200 RGBA debug preview**, with opacity exactly from GRA skip commands. Colors use the structurally compatible **207-word** Object-1 palette at `0x2B52A`, using the previously documented MK2 RGB6 derivation and a stated 6-bit-to-8-bit display scaling (`round(v*255/63)`). **This is not an authenticated gameplay screenshot or verified final in-game color pipeline.**

A separate Node verifier independently re-decodes all ten original source streams, reconstitutes every pixel and alpha value, and inflates the PNG to verify its 64,000 palette-candidate RGBA pixels exactly. This is sufficient to qualify lossless indexed source placement under **conditional setup selection**, but not runtime scene activation, camera offset, composite layering, palette-handle assignment, or definitive screen output.

## Validation

- O96Z/O97A separate Python verifier: **65,209 checks / 0 failures**, including full independently reparsed **27,004 LE relocations**, file-backed source control words, 49 descriptor joins, all ten decoded masks, full rectangle occupancy.
- O97B separate Node verifier: **189,285 checks / 0 failures**, independently decoded 10 streams and checked every RGBA pixel in the candidate PNG.
- Existing O96X/Y regression: **93,666 checks / 0 failures**.
- Existing O96V/W regression: **58,159 checks / 0 failures**.
- **5/5 deliberate falsifications rejected:** fabricated runtime selection, rectangle overlaps, transparent-pixel total, fake observed DOS frame, incorrect extracted index SHA.

## Hypothesis ledger and research priority

| Hypothesis | Decision |
|---|---|
| Ten 64×100 source sprites form a lossless 320×200 grid in raw control coordinates | **SUPPORTED** |
| Indexed canvas and transparency export reproduce original 10 image streams | **SUPPORTED** |
| The same 207-entry palette is structurally selectable through each Mountain setup | **SUPPORTED CONDITIONALLY** (O96X/W) |
| The grid is fully opaque | **REJECTED** |
| Runtime ESI definitely selects Mountain setup `0x1C330` in a given scene | **UNPROVEN** |
| These X/Y delta pairs are final absolute video screen coordinates | **UNPROVEN** |
| Candidate PNG is proven RGB gameplay screenshot or full stage | **UNPROVEN** |

**Next O97C:** Follow the upstream stage/setup record installer and runtime global `0x77453` to qualify conditional entry into the two Mountain setups. Independently trace camera offsets and composite ordering for the 39-entry group, and investigate whether another layer fills the 25,887 transparent pixels. If that blocks, move to other MK2 GRA and palette/audio gaps, without prolonging speculative reachability scans.

**MK2 remains OPEN. Research order:** finish MK2 → finish MK1 → finish MK3 → user discussion of UI/usability → build extractor.
