# MK DOS Archive — O110E: original intro palette-bank records and source-backed VGA DAC6 colors

**2026-10-09 · Original MK2 DOS fixture · MK2 remains OPEN · O110E supersedes RGB555 visual interpretations in O110B/O110D, not their recovered pixel/timing data.**

## High-value findings

- `MK2.EXE` original image consumer `0x98C56–0x98CAE` reads a `uint16` **palette record count**, followed by **per-record** `uint16` word counts and 16-bit color words. Each palette record calls `0x7B439` to register a palette entry. The consumer subsequently looks up the base palette index via `0x75B06 + handle*8` before invoking the `0x627A4` LZW pixel decoder. Therefore, treating the resource's first 512 bytes after byte 4 as an unconditional contiguous 256-word RGB555 table is not source-supported and is superseded for color extraction.
- `PROBE.GRA` contains exactly **four** counted palette records: **64 + 64 + 64 + 63 = 255** original 16-bit words. Their source spans are **[4,132), [134,262), [264,392), [394,520)**, with count words at 2, 132, 262 and 392. The first original compressed frame begins **at byte 520**. `ACCLAIM.GRA` contains **one** palette record of **40** 16-bit words in source span **[4,84)** and its only compressed image begins **at byte 84**. No pixel bytes or palette words are synthesized.
- The game's actual queued VGA palette emitter at executable physical `0x7B381–0x7B3D4` obtains each 16-bit color using `66 AD` and emits exactly three 6-bit DAC byte values through `OUT 0x3C9`. For original word `w`, the native **six-bit channel values** are:

```
R6 = ((w >> 9) & 63) | 1
G6 = ((w >> 4) & 63) | 1
B6 = ((w << 1) & 63) | 1
```

The channel calculation is **not** RGB555; notably the source arithmetic performs `OR 1` on each DAC output, and green/red shifts do not equal simple 5-bit-to-8-bit expansion. These exact `R6,G6,B6` bytes are losslessly exported in source order for all **295** palette words.

- Conditional presentation: the executable palette registrar at `0x7B439` starts color-bank allocations from index **1**, and the intro decoder looks up the first registered palette-bank base. **A fresh one-based bank assignment is used for diagnostic image previews only.** The source art has index0 background extensively: **1,336,634** source pixels across Probe's 30 frames plus **60,531** in Acclaim. Index0 has separate VGA initialization from global state in routine `0x7B33A`, and live bank state was not observed. Color at index0 remains unqualified. The diagnostic versions show unknown pixels **magenta** or **black** explicitly, with a separate binary known-color mask. All 31 original indexed image planes are left unchanged.
- The export also includes explicitly **view-selected** 8-bit per-channel samples computed by `floor(DAC6 * 255 / 63)` solely to display native 6-bit colors using PNG/GIF. This mapping is display-expansion arithmetic, not the raw DAC data.

## What is fully verified vs. not yet qualified

**Verified:** source `.GRA` palette record framing and counts; physical image start offsets; source word preservation; exact machine-code VGA DAC channel arithmetic; source-to-derived palette checksum; all original LZW pixel-index planes from O110B; indexed-pixel color export conditional on a one-based bank; per-pixel color-known mask and unknown counts; full original 30-frame source sequence; O110D 229 nominal scheduler ticks in its bounded intro code path.

**Not verified:** actual RGB8 values of a real VGA display, index0 live source value, runtime palette allocator state when a specific screen is presented, real-time tick frequency, the original user-visible framerate and graphics mode effects. The black-index0 preview is plausible and recognizable **but not a full runtime screenshot**. No generalization from these intro palettes to the seven packed stage-resource palette banks is warranted.

## Files delivered

`MK2_PROBE_ACCLAIM_SOURCE_DAC6_PALETTES_O110E_2026-10-09.zip` contains the 295 source palette words, direct DAC6 and viewer RGB8 values for both files; **31** 320×200 diagnostic PNGs with unqualified pixels magenta; **31** black-at-index0 optional previews; **31** lossless masks; provenance JSON with every frame and source offset; and a Probe GIF scaled for portability at **20ms per scheduler tick** (viewer choice, **not a measured DOS tick**).

`MK2_PROBE_30_FRAMES_SOURCE_DAC6_CONDITIONAL_CONTACT_O110E.png` gives a visual 30-frame grid with color0 deliberately black. Source-index frames and exact LZW compressed source files remain in O110B's separate resource export; O110E consumes those original verified data. O110C's separate archive preserves seven renderer-equivalent packed-stage indexed viewport experiments.

## Independent verification

- A separate Python verifier reopens the untouched original `MK2.EXE`, `PROBE.GRA`, `ACCLAIM.GRA`, O110B's indexed 31-frame output, and O110E exported ZIP and independently repeats all source palette parsing and color arithmetic. It checks raw instruction opcode bytes and relative `CALL` targets, source SHA hashes, **every original pixel** in all 31 frames against the appropriate palette/mask/PNG pixel, and all 30 timed GIF frames. **3,904,275 checks passed, zero failures**.
- Five deliberate negative controls rejected: falsified DAC palette digest, shifted counted-color source boundary, falsified count of known pixels, wrong executable SHA, and a deliberately changed PNG with a recomputed ZIP CRC.
- O110C source-to-viewport verifier passed **277,954**, its PNG verifier passed **276,592**, and O110D original image-timing audit passed **1,920,211** in the O110E regression cycle; all with zero failures.
- These subtasks sum to **6,379,032 independent checks** in/through this continuation cycle (excluding O110A/O110B's earlier separate regressions). No fabricated source FPS, incorrect RGB555 promotion or stage color claims.

## Reproduction

```bash
python scripts/run-mk2-o110e-native-dac-palette.py "$MK2/mk2.exe" "$MK2" /path/to/MK2_LZW31_AND_FONT_OPCODE_TAPE_O110B_2026-10-09.zip /tmp/o110e
python scripts/verify-mk2-o110e-native-dac-palette.py "$MK2/mk2.exe" "$MK2" /path/to/MK2_LZW31_AND_FONT_OPCODE_TAPE_O110B_2026-10-09.zip /tmp/o110e/MK2_PROBE_ACCLAIM_SOURCE_DAC6_PALETTES_O110E.zip /tmp/o110e/MK2_PROBE_ACCLAIM_SOURCE_DAC6_PALETTE_PROVENANCE_O110E.json
python scripts/test-mk2-o110e-native-dac-negatives.py "$MK2/mk2.exe" "$MK2" /path/to/MK2_LZW31_AND_FONT_OPCODE_TAPE_O110B_2026-10-09.zip /tmp/o110e/MK2_PROBE_ACCLAIM_SOURCE_DAC6_PALETTES_O110E.zip /tmp/o110e/MK2_PROBE_ACCLAIM_SOURCE_DAC6_PALETTE_PROVENANCE_O110E.json scripts/verify-mk2-o110e-native-dac-palette.py
```

## Project status / next strongest target

MK2 is not closed. The large remaining graphics questions are: **dynamic stage palette-owner binding to the seven packed-stage viewport consumers, actual multi-layer compositing/scene geometry, remaining 14 held resources' true ownership and the unsolved animation routes**. Pixel art from intro LZW is now both decoded and source-DAC-qualified apart from runtime index0/allocator and elapsed time. The strict indexed-family graphics count stays **110/124**, with PROBE and ACCLAIM separately decoded as complete LZW streams. `FONTS`, `CAVE`, and `MONKS` still need semantic—not byte-coverage—qualification; optional TTF export remains low priority. Audio extraction is provisionally complete with basic/custom-bank options reserved for eventual extractor. Research order **MK2 → MK1 → MK3 → UI/usability → extractor**. No DOSBox Sound Blaster troubleshooting.
