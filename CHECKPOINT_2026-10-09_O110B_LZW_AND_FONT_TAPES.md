# MK DOS Archive — O110B: Probe/Acclaim native LZW graphics recovery

**2026-10-09 · DOS Mortal Kombat II · researched from original MK2.EXE and source GRA assets · MK2 REMAINS OPEN**

## Most important promotion: actual compressed images, not unknown binaries

- **`PROBE.GRA` (327,672 bytes): 30 source-order images of exactly 320×200 indexed pixels**, with GIF-style 8-bit-minimum-code-size LZW inside length-prefixed subblocks. Decoded frame progression visibly transforms the Probe wordmark into the Mortal Kombat dragon emblem. The original header contains a 16-bit candidate RGB555 palette table; the exported PNG uses a *candidate* five-bits-per-channel palette and is not claimed to be traced through VGA DAC writes.
- **`ACCLAIM.GRA` (2,036 bytes): one 320×200 indexed image** of the Acclaim Entertainment intro logo using the same GIF-compatible LZW subblock grammar and source palette word table. The exported candidate RGB555 PNG visually matches the logo.
- Both resources have **complete byte coverage**, including headers, palette words, frame descriptors, length-prefixed compressed blocks and inter-frame zero separators. The original `*.GRA` files are included unchanged.
- Probe images start at offsets 520, 6,230, 12,654 ... through 316,934. Exactly 30 image headers are present. The last frame contains a real LZW end code and decompresses to all 64,000 pixels, but lacks the trailing *zero-length subblock byte* seen in the first 29 images. A GIF-compatible diagnostic wrapper may supply this formatting byte **outside the original file**; there is no need to alter or pad original source bytes.
- LZW bit-depth growth and clear commands were independently reimplemented, and **every source-derived frame agrees pixel-for-pixel with Pillow's separately implemented GIF decoder**.
- Scope: exact indexed pixels and file-order frames are now independently established. Authentic display timing, the exact runtime DAC conversion, screen transitions and interstitial compositing are **not** established.

## Ancillary bounded recoveries: previous five unqualified intervals

- `FONTS.GRA`'s **103,840-byte prefix** is now tokenized end-to-end into **13,981 valid MK2 sprite bitfield commands** (5,968 transparent skip, 5,280 literal, 2,733 repeated index), producing a lossless-order **135,716-pixel index/mask tape**. All command lengths, literal padding and source end boundaries parse perfectly. **Sprite/glyph widths, heights, character mapping and font conversion remain unqualified**; do not use a convenient made-up image width to claim a font.
- `CAVE.GRA`'s previously held 120-byte prefix parses as **18 sprite-grammar commands producing 46 indexes and opacity flags**; owner and dimensions still unknown.
- `MONKS.GRA` contains **608 odd little-endian DWORD opcodes**; these are **syntactically compatible with transparent skip commands** and form ten repeated-value runs. The source does not authenticate an owner, sprite geometry, or whether these are intentionally blank graphic frames. Remain semantic-unknown, not full indexed art.
- O110A's five byte-level “unqualified” regions can now be completely *structurally represented* as LZW data, source-index grammar tokens or scalar runs. **Complete syntactic partition is not proof of final graphic interpretation.**

## Coverage and editorial rules

- The previous **110/124 exact-full indexed-resource** claim is unchanged: O110B adds **two complete LZW-based, image-bearing resources** in a *separate format class*. It does not retroactively classify the 14 held files as all exact-full indexed.
- The native Probe LZW frames are 30 distinct chronological frames, **not 30 independently verified gameplay animations or frame timing**.
- Indexed frame planes (`.idx8`), native packed RGB555 candidate palette words (`.bin`), PNG previews, original GRA files, and a contact sheet are provided. A looping diagnostic GIF is optional and its preview speed is arbitrary.
- Further MK2 blockers: seven mixed stage raw-row resources need authentic palette/render origins and composition; VFRAME/PLAYSTA competing descriptors need consumer ownership; FONTS glyph mapping remains optional low-priority. Fixed-identity combat animation routes are still bounded, not extrapolated.

## Reproduction and adversarial verification

```bash
python scripts/run-mk2-o110b-lzw-graphics-and-font-commands.py "$MK2" /tmp/o110b
python scripts/verify-mk2-o110b-lzw-graphics-and-font-commands.py "$MK2" /tmp/o110b/MK2_LZW31_AND_FONT_OPCODE_TAPE_O110B.zip
python scripts/test-mk2-o110b-lzw-graphics-negatives.py "$MK2" /tmp/o110b/MK2_LZW31_AND_FONT_OPCODE_TAPE_O110B.zip scripts/verify-mk2-o110b-lzw-graphics-and-font-commands.py
```

The independent verifier recreates native image headers/subblocks, builds separately decoded GIF-compatible images, verifies all **1,984,000 index pixels** (31×64,000), matches source-derived palette RGB values for every preview pixel, and rechecks every FONTS/CAVE/MONKS token against the original game files. **4,640,455 independent checks, zero failures.** Five falsified outputs (including rehashed pixel and mask data, faked terminal padding and a forged semantics assertion) were rejected. Clean output was rechecked afterward.

## User requirement and research order

An eventual extractor will provide a basic default soundbank and optionally allow the user to load their own soundbank / mapped samples. Font conversion to TTF/OTF is an *optional low-priority enhancement* only after reliable glyph metrics/mapping. No side quest to diagnose the user's DOSBox Sound Blaster setup. Continue **MK2 graphics/palette/animation → MK1 → MK3 → UI/usability → extractor**. Source audio extraction is provisionally complete with known hardware-timbre fidelity limitations.
