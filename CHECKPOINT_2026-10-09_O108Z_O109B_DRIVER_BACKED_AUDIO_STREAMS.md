# MK DOS Archive — O108Z–O109B Audio Asset Recovery and Driver-Backed Event Parser

**9 October 2026 · Authentic MK2 DOS fixture · research checkpoint · MK2 STILL OPEN**

## Scope and what is actually solved

**Sound effects:** All **312 original `.U8` digitized effects** have a source-backed, independently verified, byte-exact export path to playable PCM WAV files via the existing O94D workflow, retained unchanged. 190 sources use 11,025 Hz and 122 use 22,050 Hz. The prior O94D verifier passed 23 tests including exact recomputation of all 312 original `.U8` payloads and all 312 source-rate WAV entries. Converted playback effects in WAV are sourced from each U8's active 8-bit PCM bytes; the unused trailing bytes are preserved in each original archived U8 file. This is *source-domain PCM export*, not a bit-identical replication of DOSBox audio mixing.

**Music:** All **165 original score files** (`MID/LAP/GVS/SBL/AWE`, 33 per hardware version) now have **driver-backed, lossless command-stream tokenization**. The separate verifier reconstructed all 165 original binaries byte-for-byte from stream tokens plus authentic prefix/footer and checked their SHA256 digests. This is solved **structural extraction**, **not yet independently verified audible music conversion**.

## Major executable discovery

The five original native music drivers (`SCC.BIN`, `LAP.BIN`, `GRV.BIN`, `SBL.BIN`, `AWE.BIN`) each contain a variable-length delay decoder and a complete 14-entry opcode dispatch table for bytes `0x90..0x9D`. All are independently source-checked. Within the original `SBL.BIN`:

- At raw offset `0x3B5` the selected score is entered by dereferencing the relocated music base pointer `0x2408`. The score header contains a source clock word, 8-bit channel count, and one 16-bit source offset per channel.
- At `0x434` each channel starts from the corresponding byte offset and initializes its separate playback cursor; at `0x5F3` a one-to-five-byte base-128 delta scalar is decoded.
- The scheduler at `0x2F0–0x347` consumes the delta, handles sub-`0x80` values as musical-event operands and `0x80..0x8F` as voice selectors, and dispatches `0x90..0x9D` via an in-driver handler table.
- At `0x3A3`, opcode `0x98` restores a saved cursor; at `0x3A7`, opcode `0x9C` stores one; and opcode `0x91` at `0x36C` terminates playback state for a channel. This establishes real driver-backed control-flow behavior, but there is no universal inference about music tempo in BPM, sound patches, note volume semantics, or exact hardware output.
- The score's footer contains the source clock word and channel count. All first channel offsets equal byte `3`. Earlier O104I recorded **931 offsets** beyond the first per file; this checkpoint verifies **1,096 total offsets** (**165 first** plus **931 subsequent**) across all 165 resources. The former count is preserved as an additional-offset count, **not** as the total number of channel streams.

## Source-backed corpus totals

- Authentic music files: **165** (5 hardware families × 33 songs).
- Channel streams: **1,096**, all adjacent in each original source file and all exactly bounded.
- Tokenized event records: **186,592**.
- Low-valued candidate pitch/event records: **81,465**. These are source-event records, not rendered notes in a validated Standard MIDI conversion.
- Source-ending control tokens: `0x91` on **679** channels; `0x98` on **417**.
- Five native opcode dispatch tables and five delay decoders authenticated against their actual BIN images.
- One-to-five-byte delays are preserved *both* in their original encoded bytes and as decoded scalar values. **Tick duration / wall-clock time remains unresolved.**
- Original score headers and footers, source file and stream digests, per-stream raw event bytes, and all source offsets are retained. A separate reassembler recreates all 165 files without needing the source fixture.

## Outputs

1. `MK2_312_VERIFIED_PCM_WAV_EFFECTS_2026-10-09.zip`: 312 independently verified source-rate WAVs plus the original `.U8` files, package SHA verified by the original O94D independent auditor.
2. `MK2_165_NATIVE_MUSIC_LOSSLESS_EVENT_EXPORT_2026-10-09.zip`: a self-contained metadata + compressed JSONL token export for all 1,096 source streams, the original source headers and footers, standalone original-music reassembler, and independently written source verifier.
3. `MK2_DOS_HOOT_NATIVE_AUDIO_STAGING_2026-10-09.zip`: original 165 music files and six native `.BIN` driver files, staged using public Hoot community configuration. Includes SC-55/MT-32/SoundBlaster configuration fragments. **Not a player, missing the external Pyrotechnica `CODE.COM`, and not independently tested for audible playback.** Community reference: https://www.hcs64.com/mboard/forum.php?showpage=351&showthread=

## Verification

- Independent Node verifier: **1,331,996 checks, zero failures**, including complete 165-file byte-for-byte round trips and all five native driver opcode tables.
- Six semantic falsifications were deliberately inserted, including invented note-argument, delay, dispatch target, score header, stream terminator, and footer. The pristine original reports passed and the **6/6 false reports failed**.
- Older source regressions: O107V–O108Y **670 passed**, O106R–O107U **2,693 passed**, O105N–O106Q **8,494 passed**. Existing O94D PCM export verifier: **23 passed**. Total selected verified checks including new and older suite = **1,343,876**.
- All previously tracked source files are preserved byte-for-byte; latest source ZIP and manifest are reverified upon packaging.

## Next outstanding audio blockers / end-to-end playback

1. Reproduce the real `INT 80h` AH=4/AL=1 music-service implementation and its native driver call, or independently reproduce Hoot/Pyrotechnica music playback using an actual supported emulator. Static per-driver sequencer code alone does not qualify the game's interrupt bridge or guarantee audible rendering.
2. Establish genuine hardware timing units from the stored clock field and native clock/divisor path (SBL driver `0x65D`), and map voice patches/program selection and all device-specific playback control semantics.
3. Render a held-out selection on each supported hardware path and compare against a controlled DOSBox/real-driver playback capture. **Do not promote sampled audio waveform equivalence, MIDI files or tempo in BPM without an independent audible or hardware-register-level test.**
4. The user's reported Roland-working/SoundBlaster-failing DOSBox session is useful observational context, **not proof** of either driver defect or source file error.

**MK2 remains open.** Graphics still 110/124 exact-full resources, seven bounded animation witnesses. Follow original priority MK2 → MK1 → MK3 → UI/usability → extractor.

## Reproduction

```bash
python scripts/run-mk2-o108z-o109b-driver-stream-decode.py "$MK2" evidence/mk2_o108z_o109b
node scripts/verify-mk2-o108z-o109b-driver-stream-decode.mjs "$MK2" evidence/mk2_o108z_o109b
python scripts/test-mk2-o108z-o109b-negative-controls.py evidence/mk2_o108z_o109b "$MK2" scripts/verify-mk2-o108z-o109b-driver-stream-decode.mjs
python scripts/reassemble-mk2-o109b-music-source.py evidence/mk2_o108z_o109b/mk2_driver_score_stream_manifest_o109b_2026-10-09.json evidence/mk2_o108z_o109b/mk2_lossless_channel_events_o109b_2026-10-09.jsonl.gz /tmp/mk2_music_reassembled
python scripts/build-mk2-o109b-hoot-staging.py "$MK2" /tmp/mk2_hoot_staging.zip
node scripts/run-mk2-u8-o94d-pcm-export-qualification.mjs "$MK2" /tmp/mk2_pcm
python scripts/verify-mk2-u8-o94d-pcm-export-qualification.py "$MK2" /tmp/mk2_pcm/MK2_O94D_U8_BOUNDED_PCM_WAV_PACKAGE.zip
```
