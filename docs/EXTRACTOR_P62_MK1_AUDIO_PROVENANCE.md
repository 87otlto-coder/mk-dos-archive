# P62 · MK1 original WAV provenance and sound-table bindings

First interim pass after the [accepted P61 checkpoint](EXTRACTOR_P61_ACCEPTED_CHECKPOINT_2026-11-08.md), on develop. P61 tested source was `3ff65c5b2a939df21e02a460f53e859a7b467346`, tree `dcf4aae49e96c092f7cc96233671685c64c75dba`. This pass starts from its acceptance record `8f5826045f9b5cbb35e1e9b5df09c9f3071665fa`.

## Observe and record

The [coverage matrix](GAME_MATRIX.md), P61 handoff, O63/O64 audio modules and current collection adapters give the following gap assessment. Counts refer to representations. Speech or event identity needs separate evidence from sample playback.

| Game | Sprites, indexed palettes and animation | Stage/background composition | Effects, speech and music |
| --- | --- | --- | --- |
| MK1 | 2,363 sprites, including 79 unresolved-palette index/mask records. Palette contexts are qualified individually. Gameplay names and cadence remain open. | 49 bounded stage PNGs include 24 normalized previews across 15 headers. Full arena assembly remains open. | All 244 WAVs already exported. Library records pointed at generated ZIP paths and omitted verified bindings. Speech/event meanings, SAMPLES.DAT role and runtime MIDI relationship remain unresolved. |
| MK2 | Indexed sprites and bounded color contexts. Eight source-order groups cover 57 frames. Live DAC ownership and native timing remain open. | Layer, floor and screenshot-supported component exports exist. Camera and full scene assembly remain open. | O94D qualifies 312 U8 WAVs and their active intervals. Original scores and one-traversal MIDI exist. These establish neither speaker identity nor hardware timbre. |
| MK3 | 6,654 sprites and 416 indexed images. Embedded image CMAPs are preserved. Native animation grouping and palette use require separate proof. | P57 previews 416 unassigned images. Their stage ownership remains open. | 1,024 audio and 46 music records. Container/file identifiers alone do not identify speakers, gameplay cues or event names. |

## Hypothesize

The highest-value bounded change identified here is MK1 WAV accuracy. A verified [O63 sound table](../src/games/mk1/research/audioMusicResourceGraphCensus.ts) and [O64 package manifest](../src/games/mk1/research/browserAudioExportBundle.ts) already carry the evidence for every library WAV. An exact package-path join after O64 validation should carry those facts into individual asset details and selected-export manifests with zero WAV or ID changes.

## Test

- Run `node scripts/test-p62-mk1-audio.cjs` for the source-only join check. It covers original-source projection, null-code retention and four refused joins (absent row, wrong package path, wrong source path, wrong extent).
- Run `node scripts/verify-mk1-p62-audio.cjs "<original MK1 folder>"` from the checkout with installed Node dependencies. The test reads the installation and builds the actual collection and selected ZIP in memory. It independently walks the canonical EXE's 533 records and path pool and reads RIFF chunks from the installed WAVs.
- Local focused result on the original DOS installation: **PASS**. Canonical MK1.EXE hash matched. The collection contained 2,656 assets. All 244 selected WAV payloads, original paths, lengths, SHA-256 values, stable IDs and filenames matched. All 243 bound codes and playback policies matched the EXE. The remaining path-pool-only WAV carried a null code and no record binding. Channel count, sample rate, bit depth and PCM data length matched the originals throughout.
- The source-only checks, TypeScript and production build passed locally. GitHub runs the source-only test on code pushes. Browser interaction with original data and listening tests were outside the focused run. The nine-group P61 result (17,211 assets) is the inherited baseline. P62's original-fixture run covers MK1 only.

## Classify and continue

**Verified** for the canonical MK1 pipeline: original source identity and extent, byte-exact WAV exports, PCM metadata, sound-code binding state and the O63 playback policy. The existing evidence package and forensic research code remain intact. No new decoded media or semantic names were added.

For P63, audit MK3 embedded WAV source intervals and selected exports against the original containers. For P64, inspect MK2 raw-score/MIDI event and loop evidence against the existing driver-derived decoder. For P65, inventory verified source-ordered animation relationships outside the MK2 groups already exported. Each is a candidate requiring its own bounded evidence before implementation. At P66 rerun the complete P61 three-game baseline plus each accepted P62–P65 fixture proof and refusal set on the exact candidate tree, with exports kept private.
