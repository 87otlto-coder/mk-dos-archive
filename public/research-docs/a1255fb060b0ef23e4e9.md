# MK DOS Archive — O109F–O109G: authentic channel loop cursors and optional two-cycle MIDI

**9 October 2026 · original DOS MK2 binaries · MK2 remains OPEN**

## Scope and high-confidence results

The five hardware-specific drivers (`SCC.BIN`, `LAP.BIN`, `GRV.BIN`, `SBL.BIN`, `AWE.BIN`) share a verified indirect command table. Every table's `0x98` command points to `MOV SI,[DI+06]; RET` (reopen the stored channel cursor), and `0x9C` points to `MOV [DI+06],SI; RET` (save the current post-command cursor). Native channel initialization also stores the channel's original stream cursor, so a loop without `0x9C` does not automatically have an undefined target.

**O109F:** 165 authentic scores, 1,096 channel streams; exactly **417 streams terminate in `0x98`**, with **411 containing exactly one `0x9C`, four containing none, and two containing two**. For each stream, the report identifies original byte boundaries, all save-opcode byte positions, the effective saved restart position, the first-cycle end tick, the repeated segment's delay-tick period, and lossless source SHA-256 digests. All **five `PORTAL` variants contain one channel whose repeat segment consists exclusively of the final `0x98` with a 9,984-tick delay**; it is a sustained rest, not a malformed score.

Independent **Node.js verifier: 761,508 direct checks, zero failures**, re-reading native score bytes rather than importing the Python producer. It also independently validates all five drivers' 0x98/0x9C jump table targets and their exact instruction bytes.

**O109G:** Additive **66 two-cycle Standard MIDI renditions** (33 SCC/SC-55, 33 LAP/MT-32). Each looping channel plays its original intro once, then its authentic saved segment a second time; channels ending in `0x91` play once. Saved voice/note state is not reset at the loop boundary. All MIDI musical-message events retain their driver-grounded mappings; CC123 is appended only at final export track termination, not between native cycles. This is **a chosen bounded two-cycle export**, NOT a statement that the original game always plays two cycles. Non-Roland hardware timbres remain unrendered.

O109G independent **Node.js verifier: 831,408 checks, zero failures**. It reparses original score streams, rebuilds the 66 complete MIDI files byte-for-byte (including repeat cursor choice, delta ticks, event types, tempo meta messages, synthetic safety termination), verifies SHA-256 and the explicit provenance report. Outputs contain **58,367 Note On and 58,367 Note Off messages** across the 66 scores, and incorporate all **157 looping channels** in the SCC/LAP families.

Three adversarial negative controls rejected a wrong restart cursor, an invented loop count, and a modified MIDI binary accompanied by its own updated SHA-256. All pristine reports passed again after restoration.

Previous independently verified regressions remain green: O109C **1,333,856**, O109D **283,097**, O109E **277,293** checks, all zero failures. The O109E original 66 one-cycle MIDI arrangement export, all 165 source scores, 312 WAV effects, and lossless event archive are retained unchanged.

## Limitations and next priorities

- Native loop cursor semantics are verified, but **actual game playback duration, event-service stop conditions, music/SFX mixing and device timing under gameplay remain unobserved**.
- The new two-cycle Standard MIDI exports are optional renditions, not hardware captures. SC-55 and MT-32 timbres are not preserved by General MIDI soundfonts.
- GVS/GUS, SBL/OPL, and AWE scores remain preserved and correctly tokenized, but their exact synthesized audio is not independently rendered. Further work should be bounded around driver bank/patch ownership, playback hardware semantics, or return to the MK2 graphics/animation holdouts if marginal audio returns plateau.
- MK2 graphics resource coverage remains **110/124 exact-full indexed**, with 14 held; seven fixed-identity animation witnesses retained. Continue MK2 → MK1 → MK3 → UI/usability → extractor in this order.

## Reproduce from original sources

```bash
python scripts/run-mk2-o109f-native-loop-cursors.py "$MK2" mk2_native_music_loop_cursor_provenance_o109f_2026-10-09.json
node scripts/verify-mk2-o109f-native-loop-cursors.mjs "$MK2" mk2_native_music_loop_cursor_provenance_o109f_2026-10-09.json
python scripts/export-mk2-o109g-roland-two-cycle-midi.py "$MK2" evidence/mk2_o109c_corrected_scores/mk2_driver_score_stream_manifest_o109c_2026-10-09.json evidence/mk2_o109c_corrected_scores/mk2_lossless_channel_events_o109c_2026-10-09.jsonl.gz evidence/mk2_o109g_two_cycle_midi
node scripts/verify-mk2-o109g-roland-two-cycle-midi.mjs "$MK2" evidence/mk2_o109g_two_cycle_midi
python scripts/test-mk2-o109f-o109g-negative-controls.py "$MK2" .
```
