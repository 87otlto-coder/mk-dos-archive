# Extractor coverage matrix

Current consolidated source checkpoint: P31 on develop, incorporating P27-P30 standalone-component additions, followed by interim P32-P34, 2026-11-07. Main remains P16. Counts are extracted asset representations, not original file counts or completeness percentages.

| Game | Latest verified collection | Graphics and backgrounds | Palette and animation qualification | Audio and unresolved scope |
|---|---:|---|---|---|
| MK1 DOS | 2,656 assets | 2,363 sprite records; 49 bounded stage PNGs including 24 normalized module previews | Qualified character/effect contexts and documented bounded scene outputs; canonical gameplay timing, phase and complete arena assembly remain separate | 244 audio records; broader source and runtime limitations retained |
| MK2 DOS | 5,353 unique representations | Original indexed resources, bounded palette contexts, stage layers, intro frames, Mountain graphics, floor projections, two additional indexed mosaics and 49 CAVE, 30 ARMORY, 20 BATTLE and 15 ARENA source images, plus 16 TOMB and 13 PORTAL newly standalone components already present in mosaics, six mixed-descriptor TOWER originals and 58 FOREST originals (43 linked to five P7 layers, fifteen unlinked to those setups); FOREST indexed streams/native floor partition all original resource bytes; 28 newly standalone PIT components reproduce six P9 layers and join 14 existing bridge streams into complete PIT byte coverage; ARMORY now has 30-stream/native-floor source-byte coverage | Eight original source-order groups / 57 existing frames; user-timed queue and exports; live DAC ownership, native timing and final stage placement remain unknown | 312 original U8 sound-effect exports retained; native score/evidence exports remain available; hardware timbre and completeness are not implied by the asset census |
| MK3 DOS | 9,186 assets | 6,654 sprites, 416 images and 1,046 raw records | Existing preview interpretations retained; no new native animation or stage assignment established | 1,024 audio and 46 music records; zero stage-type records; image-to-stage ownership unresolved |

P31 freshly verifies MK1's 49 stage PNG export/readback paths, MK2's cumulative and focused suites, all eight P22-P30 image families independently, and ten MK3 representative exports across all five kinds. MK1/MK3 decoded visual-plane hashes match P21 and P26. All image planes receive geometry checks. This is headless collection/export verification; it does not establish new original-DOS runtime behavior or real-data browser interaction.

P34 freshly verifies the current MK2 collection, twelve additional ARMORY originals and native byte partition. P33 verifies PIT components/P9 canvases; P32 verifies additional FOREST originals. MK1/MK3 latest full fixture evidence remains P31.

Original-input identity is separately qualified: MK2 directory census and 13 critical hashes, MK1 canonical EXE hash, and recorded MK3 EXE hash. No newly authenticated whole-corpus hash claim is made for MK1 or MK3. Historical detection/inventory support is retained; P21 does not rerun detection qualification.

See [P31 source checkpoint](EXTRACTOR_P31_SOURCE_CHECKPOINT_2026-11-07.md), [current project status](../PROJECT_STATUS.md), and the individual evidence handoffs for interpretation limits.
