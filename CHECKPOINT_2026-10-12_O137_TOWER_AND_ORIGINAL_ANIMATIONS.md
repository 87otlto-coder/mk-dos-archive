# MK2 — O137: Original effect-frame extraction, Tower extension and asset bundle

**Date:** 2026-10-12. **Development focus:** recover source-authenticated stage animation frames without sacrificing full-width independent artwork. **Prior source checkpoint:** O135. This session combines O136 + O137 without artificial per-checkpoint stopping. **Status:** original ordered frames SOURCE VERIFIED; real-time playback and world placement NOT VERIFIED.

## Material achievement

The original MK2.EXE includes six ordered source frame lists associated with three stages. Their 43 distinct original `.GRA` sprite streams have been decoded and exported as individual transparent PNGs plus exact 8-bit palette-index and opacity-mask planes. These are not AI-generated, reauthored or interpolated. Frame ordering and byte ranges are authenticated from original LE relocation-backed pointers and original sprite descriptors.

| Stage | Original source-ordered list | Native source frames | Graphic source byte span | Termination / loop marker |
|---|---|---:|---|---|
| Tomb | Object-2 `0x17814` | 8 | `TOMB.GRA 0xEADC–0xF920` | 1 + relocated list back-pointer |
| Tomb | Object-2 `0x177EC` | 8 | `TOMB.GRA 0xD438–0xEADC` | 1 + relocated list back-pointer |
| Portal | Object-2 `0x164B4` | 7 | `PORTAL.GRA 0x8C48–0xC8D0` | 1 + relocated list back-pointer |
| Portal | Object-2 `0x164D8` | 7 | `PORTAL.GRA 0xC8D0–0xD9E4` | Zero terminator |
| Portal | Object-2 `0x164F8` | 6 | `PORTAL.GRA 0xD9E4–0xDE54` | Zero terminator |
| Tower | Object-2 `0x16490` | 7 | `TOWER.GRA 0x9F48–0xDBCC` | 1 + relocated list back-pointer |

Source frames include native width/height, signed descriptor-local XY, source-offset bounds and source-ordered sequence numbers. Effects appear as Tomb flying elements, Portal hanging/swaying and electric elements, and Tower's hanging figure. This is a **visual description** of the independently decoded original art, not an identified in-game trigger or timing measurement.

## Code origin / behavior graph

- Tomb routines, already authenticated in O134/O135, write original source list pointers at physical instructions `0x82D51` and `0x82DB3`.
- Portal's `0x164B4` list is assigned through *nested helper construction*: code physical `0x82746`, `0x82764`, helper `0x827DF`, object field `+0x5C`, and resume at `0x8280C`. The other two lists are directly assigned via code `0x828FF` and `0x82994`.
- The Tower initializer (physical `0x82E38`) writes `0x16490` at `0x82E6C` and calls the same nested helper. The original file registry maps sprite resource ID **30 to TOWER.GRA**, proving that this adjacent animation list is NOT part of Portal. The authenticated `TOWER.GRA` SHA-256 is `7b5cd966d05df8d228905a139196b85879f19f74cb1e47f1cda9335838b70bb8`.
- Tower has a source-linked 80-color palette record at EXE physical `0x89468`, through setup Object-2 `0x1795C` and pointer table `0x17A18`. Seven typed palette pointer fixups were checked. **This source-palette association is conditional**: unlike Tomb/Portal, no DOSBox perturbation test has verified Tower's palette use during actual gameplay.
- Original list interpreter physical `0x86CC5` advances frame pointer entries and branches at `0x86D14` for an original `1` command with loop back-reference. A zero marker terminates other lists. These static semantics don't establish a wall-clock frame rate, trigger, layer placement or parallax behavior.

## Export model and preservation

`tools/mk2_animation/` contains O136 original Tomb/Portal sprite exporter, independent verifier, hostile tests. `tools/mk2_tower_animation/` contains the Tower equivalent. `tools/mk2_animation_bundle/` packages the complete previously verified O135 Tomb/Portal native scene export with all 43 newly authenticated effect frames, preserving each asset as an independent original sprite.

The combined bundle exports **158 PNGs** (115 original full-source layers + 43 distinct ordered original effect frames) and an additional **86 raw effect-index and effect-opacity planes** (43 each). Its manifest preserves SHA-256 per file and rejects inferred FPS, world placement or camera/parallax figures. Full-width source floors remain 896 pixels across and are never reduced to a 320-pixel camera sample by the exporter.

The MK DOS Archive MK2 indexed-layer UI now has source-backed Tomb and Portal effect-frame selectors, native transparent previews and individual PNG export. Tower frame extraction currently uses the Python original-source tool, not the browser stage picker. The full React app build is not yet verified; the source-only decoder passes its independent browser/Python bridge.

## Verification (honest scopes)

- O136 independent source/frame/pixel assertions: **40,259 passed**; 36 Tomb/Portal frames and 109 exported files (including source manifest).
- O137 independent Tower source/frame/pixel assertions: **169 passed**; seven additional source frames and 22 exported files (including source manifest).
- O136 Python adversarial cases: **24 passed**. O137 Tower adversarial cases: **20 passed**.
- Source-only Tomb/Portal TypeScript vs Python parity: **423 comparisons passed**. Original TS module typechecked standalone.
- Inherited Python O130–O135 regression suites: **195 tests passed** (36+36+44+21+24+34).
- Combined export independent ZIP audit: **247 payload hashes match**, all **116 native layer entries** are byte-identical to the inherited O135 full-source export, and total original PNG count is **158**.
- Original `.EXE` and `.GRA` game files are required at extraction time but **excluded from the development-source ZIP**. The optional extracted asset bundle includes original image content and should be retained/used in the appropriate rights context.

## Explicit open questions

**Do not claim verified:** native game frame rate or per-frame duration; when these effects start/stop in a fight; original sprite object world positions; per-layer draw order or collision/occlusion; live palette allocator handle, DAC bank; or the exact relation between stage-specific movement inputs and these animated sprites. Future work should follow original sequence-runner delay arguments and object render registration in `MK2.EXE`, then corroborate any candidate timing/placement with DOSBox before publishing real-time animation playback metadata. Never flatten these original animated assets into one static scene export.

## Reproduction from user-supplied original data

```sh
python tools/mk2_animation/export_o136_original_sequences.py --exe /original/MK2.EXE --game-zip /original/mk2.zip --out /new/tomb_portal_frames
python tools/mk2_animation/verify_o136_independent.py --exe /original/MK2.EXE --game-zip /original/mk2.zip --folder /new/tomb_portal_frames
python tools/mk2_tower_animation/export_o137_tower_effect.py --exe /original/MK2.EXE --game-zip /original/mk2.zip --out /new/tower_frames
python tools/mk2_tower_animation/verify_o137_tower_independent.py --exe /original/MK2.EXE --game-zip /original/mk2.zip --folder /new/tower_frames
python tools/mk2_animation_bundle/package_o137_animation_bundle.py --layer-zip /O135/full_source_layers.zip --tomb-portal /new/tomb_portal_frames --tower /new/tower_frames --out /new/combined.zip
python tools/mk2_animation_bundle/verify_o137_bundle_independent.py --archive /new/combined.zip --original-layers /O135/full_source_layers.zip
```

The O135 original-source layers can be regenerated from the existing O132–O135 exporter using the original game files; the `--layer-zip` example above accepts that output. No patched game binary or runtime emulator is needed to perform these source extractions.
