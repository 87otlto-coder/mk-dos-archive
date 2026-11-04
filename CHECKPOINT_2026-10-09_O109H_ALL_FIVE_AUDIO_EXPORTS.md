# MK DOS Archive — O109H: all five MK2 score families exported into playable Standard MIDI representations

**9 October 2026. Authentic DOS MK2 fixture. Graphics/animation research remains OPEN.**

## What is actually complete

- **312/312 original `.U8` sound effects** are independently verified PCM WAV exports, preserving original `.U8` source files and playback sample rates (O94D).
- **165/165 original device-specific music files** are losslessly byte-preserved, reconstructable through the O109C native-driver event decoder: 1,096 original channel streams, 187,097 source commands. The original files retain their native `MID`, `LAP`, `GVS`, `SBL`, `AWE` variants, original six sound-driver/bridge files and hashes.
- **All 78,574 pitched source-event onsets across all five families are represented** in the 165 one-cycle MIDI files (15,721 SCC + 16,261 LAP + 46,592 GVS/AWE/SBL); every represented Note On has a paired Note Off within the bounded export. Native loop continuation is handled separately.
- **165/165 original music files now have an independently checked, playable Type-1 Standard MIDI musical representation:** 33 SCC Roland (O109D), 33 LAP MT-32 (O109E), **33 GVS (new), 33 AWE (new), 33 SBL (new)**. The last 99 MIDI files are device-dependent **diagnostic representations**, not replacements for accurate native synthesis. Their note times, voices, instrument indices and applicable generic controllers derive from the original source streams and bounded code handler evidence.
- **417 native channel loops are source-qualified** (O109F); **66 optional two-cycle Roland MIDI renditions** retain each channel's actual native restart cursor (O109G).

## O109H new work and confidence boundaries

- `GRV.BIN` has MIDI-style note-on/off, instrument-change, bend, volume, pan and controller handlers matching the general Roland command architecture (native UltraMID patch timbre remains unavailable). 33 GVS source files were represented in Standard MIDI with exact source timing and program *indices*; no claim that a General MIDI synthesizer uses the authentic UltraMID patches.
- `AWE.BIN` uses native synthesizer APIs. Its source-level note-on/off and channel/program operations support 33 MIDI **surrogate command streams**, but EMU8000 memory patches, envelopes, voices and output waveforms are not reconstructed.
- `SBL.BIN` drives OPL FM patch data. Native note pitch, note-off and program-index operations support 33 MIDI **FM pitch/timing surrogates**; FM bends, panning and general-control opcodes are held rather than fabricated as General MIDI effects. **An FM patch index is not a General MIDI program number.**
- Each export retains its own fidelity limitation in `O109H_DEVICE_MIDI_PROXY_PROVENANCE.json`; the native raw scores and lossless native-event archive remain the authoritative extraction for sonic fidelity.
- The source's `ULTRAMID.INI` provides a patch name/size-mode mapping, but patch sample payloads are not included in the authentic fixture. Authentic GUS wavetable sound cannot be reconstructed solely from the song files.

## Source-backed independent validation

- **O109H** separately implemented raw-file-to-Standard-MIDI verifier: **671,100 checks, zero failures**, reconstructing 99 new MIDI files byte-for-byte directly from raw `.gvs/.awe/.sbl` bytes (not from the producer's event JSON). It also verifies anchored handler instructions in all three original native drivers and disallows unsubstantiated fidelity-label upgrades.
- New O109H corpus: **99 scores, 668 channel streams, 112,360 original native commands, 46,592 source note-on records, 46,592 corresponding source note-off records.** New files total 443,625 MIDI bytes.
- **Three adversarial negative controls rejected:** modified MIDI with updated SHA; fabricated hardware authenticity; and invented OPL-patch-to-General-MIDI ownership. Pristine state reverified after restoration.
- Original O109C score grammar regressions **1,333,856 / zero failures**, O109F native loops **761,508 / zero failures**, and O109G two-cycle MIDI **831,408 / zero failures**.

## What is NOT completed

**No capture or independently faithful waveform rendering for GUS, AWE, OPL, SC-55 or MT-32 hardware has been established.** The Roland SCC/LAP MIDI files are comparatively high-fidelity *musical message transcriptions*, not exact device timbres. The GVS/AWE/SBL MIDIs are playable note/time representations with instrumentation limitations. Native `0x98` repeats were bounded in their one-cycle MIDI files; the restored native stream and loop ledger preserve actual restart semantics. Mixer state, device-specific PCM overlays, and playback duration selected by gameplay remain unobserved. Do not claim hardware-authentic soundtrack synthesis.

## Reproduction

```bash
python scripts/export-mk2-o109h-three-device-midi-proxies.py "$MK2" evidence/mk2_o109c_corrected_scores/mk2_driver_score_stream_manifest_o109c_2026-10-09.json evidence/mk2_o109c_corrected_scores/mk2_lossless_channel_events_o109c_2026-10-09.jsonl.gz evidence/mk2_o109h_three_device_midi
node scripts/verify-mk2-o109h-three-device-midi-proxies.mjs "$MK2" evidence/mk2_o109h_three_device_midi
python scripts/test-mk2-o109h-negative-controls.py "$MK2" evidence/mk2_o109h_three_device_midi scripts/verify-mk2-o109h-three-device-midi-proxies.mjs
```

## Research status

The practical audio **asset extraction** inventory is now accounted for, with playable effect WAVs and musical representations of all native scores; **hardware-faithful soundtrack reproduction remains an explicit unsupported tier**, not a reason to rerun repetitive inventories. Focus future MK2 research on the remaining 14 graphics resources, animation, palette, stage runtime, and any missing audio service/mixer semantics that materially affect export. **Do not move to MK1 until MK2 research closure is justified.**
