# MK DOS Archive — O109C–O109E: Corrected driver-backed audio decoding and playable output

**9 October 2026 · authentic original DOS MK2 sources · MK2 RESEARCH REMAINS OPEN**

## Summary of independently verified source-derived audio recovery

- All **312 native `.U8` effects** -> 312 PCM WAV files, original source rates (190 × 11025 Hz, 122 × 22050 Hz), 23 independent O94D checks / zero failures. The original `.U8` payloads are preserved.
- All **165 native music files** (33 × 5 devices) independently split into **1,096 contiguous channel streams**, with **187,097 source command records** and **78,574 sub-0x80 candidate pitch records** under the **correct** five-driver instruction-derived tokenization, without losing any bytes. All 165 source binaries independently reconstructed byte-for-byte, original source hashes checked; **1,333,856 checks / zero failures**.
- Original `.MID` Roland SCC.BIN music converted into **33 playable Type-1 Standard MIDI files**, source PPQN=96, source BPM in clock high byte (80–135), two runtime tempo changes in `intro1.mid`. MIDI commands were independently reconstructed from original native source bytes and compared with each output event: **283,097 checks / zero failures**. Exactly **15,721 note-on** and **15,721 note-off** event messages verified. 82 native channel streams terminate in a repeat opcode and have been converted to a bounded one-cycle MIDI rendition.
- Original `.LAP` Roland MT-32 music converted to **33 playable Type-1 Standard MIDI files**, checked against the separate original LAP.BIN driver: **277,293 independent checks / zero failures**. Exactly **16,261 note-on** and **16,261 note-off** messages verified. 75 native channel streams use repeat termination and are converted as one cycle only.
- **Three independent falsification tests** rejected altered command-event counts, MIDI source event bytes, and MT-32 MIDI header metadata after revalidation, and all pristine artifacts passed again. 
- A diagnostic **18-second GM SoundFont render** of the converted Roland title was produced using libfluidsynth. This is a playable derivative and proves the MIDI can drive a software synth, **not** authentic SC-55 timbral reproduction. Rendering warned that one percussion patch was unavailable and substituted a soundfont preset; that substitution is explicitly preserved as a limitation.

## Critical O109B interpretation correction

The previously checkpointed **O109B event export IS SUPERSEDED FOR COMMAND BOUNDARIES**. Its opcode `0x9B` was incorrectly assigned **two** parameters. All five native driver opcode handlers establish **one** parameter for `0x9B` and **two** for `0x9D`. A byte-for-byte source round trip does not disambiguate two incorrect event parses that consume the same bytes; the old O109B independent checker repeated the producer's incorrect argument-length assumption. This was detected while independently tracing SCC native MIDI writes and was corrected using five authenticated native-driver handler bodies. **O109B's historic reports are deliberately preserved but must not be used as an authoritative music-event grammar.** O109C fixes and verifies the original score grammar; O109D exports playable SCC MIDI; O109E exports independently verified LAP/MT-32 MIDI.

## Exact supported musical semantics

In the real SCC.BIN/LAP.BIN interpreter code: sub-0x80 event pitch + argument -> MIDI Note On; `0x90` -> explicit note with zero velocity; `0x99` -> last selected pitch with zero velocity; `0x92` -> Program Change; `0x95` -> Pitch Bend (zero LSB, source byte MSB); `0x96` -> CC7 Volume; `0x9B` -> CC10 Pan; `0x9D` -> general controller/value; `0x93` -> runtime BPM clock change. Voice selectors `0x80–0x8F` set current voice; the driver sends ordinary MIDI for voices 0–11. All source MID/LAP music events in the verified conversion use those voices. Native driver PIT calculation at `0x664` uses `71,590,800 = 60×1,193,180` and the original 96/BPM clock word. All decoded source delta units remain exactly preserved.

**Conservative downstream approximations:** Native `0x98` looping streams are bounded to one cycle; MIDI CC123 all-notes-off is inserted at their ends for safe rendering; these safety messages are NOT present in the original binary streams. The O97 series camera/graphics findings are unaffected. Native `0x9C` saved-cursor management is not emulated beyond one pass. Source instrument patches assume real SC-55/MT-32 hardware; listening on General MIDI software will be timbrally different.

## Outputs

1. `MK2_DOS_COMPLETE_RECOVERED_AUDIO_ASSETS_O109E_2026-10-09.zip`: a complete combined package with 312 playable PCM WAV, 312 untouched native `.U8`, 66 playable `.mid` conversions, 165 native music scores, six original sound driver/bridge files, 1,096 lossless event streams, a General MIDI 18s diagnostic MP3 and per-file SHA-256 manifest.
2. `MK2_ROLAND_MT32_66_PLAYABLE_STANDARD_MIDI_O109E_2026-10-09.zip`: the two playable MIDI arrangement families with full provenance.
3. `MK2_165_NATIVE_MUSIC_CORRECTED_LOSSLESS_EVENTS_O109E_2026-10-09.zip`: all 165 original music sources, native drivers and corrected lossless command streams; each source is reconstructable from event archive + preserved original headers and footers.
4. `MK2_312_VERIFIED_PCM_WAV_EFFECTS_2026-10-09.zip`: WAV effects + original source bytes.
5. `MK2_DOS_HOOT_NATIVE_AUDIO_STAGING_2026-10-09.zip`: original drivers/music and community playback setup, **requires external Pyrotechnica CODE.COM / Hoot runtime, NOT tested locally**.
6. `MK2_Roland_Title_GM_Soundfont_DIAGNOSTIC_18s_2026-10-09.mp3`: software synth, not authenticated SC-55 hardware capture.

## Verification summary

- O109C corrected five-native-driver command-stream verify **1,333,856 / 0**.
- O109D independently re-derived 33 SCC Standard MIDI outputs **283,097 / 0**.
- O109E independently re-derived 33 LAP Standard MIDI outputs **277,293 / 0**.
- O94D verified 312 WAV source conversions **23 / 0**.
- Negative controls **3/3 rejected**; source and MIDI outputs restored and reverified.
- Latest source file manifest retains all **1,488 O109B historical tracked files** byte-for-byte; only new files are appended.

## Research still open — do not claim perfect gameplay audio

The authentic **GVS/GUS**, **SBL/OPL Sound Blaster**, and **AWE** scores are losslessly decoded as command streams and their untouched originals can be consumed by original DOS hardware drivers, but their hardware-specific bank/instrument configuration, music loop scheduler, native interrupt service call semantics, exact timbre, PCM overlays and waveforms have **not** been reproduced as verified rendered audio. The Roland SC-55 and MT-32 converted MIDI files are **musical message reconstructions**, not certified captures of the real sound modules. **MK2 remains OPEN**. Graphics coverage still 110/124 exact-full resources; seven bounded animation witnesses. Original project MK2 → MK1 → MK3 → UI → extractor sequence stays intact.

## Reproduction

```bash
python scripts/run-mk2-o109c-corrected-driver-stream-decode.py "$MK2" evidence/mk2_o109c_corrected_scores
node scripts/verify-mk2-o109c-corrected-driver-stream-decode.mjs "$MK2" evidence/mk2_o109c_corrected_scores
python scripts/export-mk2-o109d-scc-standard-midi.py "$MK2" evidence/mk2_o109c_corrected_scores/mk2_driver_score_stream_manifest_o109c_2026-10-09.json evidence/mk2_o109c_corrected_scores/mk2_lossless_channel_events_o109c_2026-10-09.jsonl.gz evidence/mk2_o109d_scc_midi
node scripts/verify-mk2-o109d-scc-standard-midi.mjs "$MK2" evidence/mk2_o109d_scc_midi
python scripts/export-mk2-o109e-lap-standard-midi.py "$MK2" evidence/mk2_o109c_corrected_scores/mk2_driver_score_stream_manifest_o109c_2026-10-09.json evidence/mk2_o109c_corrected_scores/mk2_lossless_channel_events_o109c_2026-10-09.jsonl.gz evidence/mk2_o109e_lap_midi
node scripts/verify-mk2-o109e-lap-standard-midi.mjs "$MK2" evidence/mk2_o109e_lap_midi
python scripts/test-mk2-o109c-o109d-negative-controls.py "$MK2" .
python scripts/verify-mk2-u8-o94d-pcm-export-qualification.py "$MK2" /path/to/MK2_312_VERIFIED_PCM_WAV_EFFECTS_2026-10-09.zip
```
