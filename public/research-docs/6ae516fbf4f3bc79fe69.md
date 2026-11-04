# MK DOS Archive — Checkpoint — Pass 1E.3O.63 Audio/Music Resource Graph and Export-Capability Census

Date: 2026-10-01

## Status

**DIRECT AUTHENTIC-FIXTURE VALIDATION PASSED / INTEGRATED AS PIPELINE STAGE 72/72**

O63 is the first half of the O63/O64 audio block. It is deliberately read-only and export-first. It inventories the authentic installation audio surface, reconstructs the executable-side fixed sound-code table and bounded playback bridge, and keeps resource identity, playback behavior, and gameplay/event naming as separate confidence axes.

O64 has not started.

## Canonical fixture

- `MK1.EXE`: 1,157,222 bytes
- SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`
- code file-image base: `0x00050A54`
- static-data file-image base: `0x0008CA54`

## Authentic installation WAV surface

The complete installation contains exactly **244** files under `SFX/*.WAV`.

All 244 are mechanically parsed as:

- RIFF/WAVE;
- Microsoft PCM (`audioFormat = 1`);
- mono;
- 8-bit;
- 11,025 Hz;
- byte rate 11,025;
- block align 1.

Aggregate sizes:

- WAV file bytes: **11,383,194**
- PCM data bytes: **11,372,336**

Every WAV has its SHA-256 recorded in the O63 report.

No standalone file with common sequenced-music extensions (`MID`, `MIDI`, `XMI`, `HMP`, `HMQ`, `CMF`, `ROL`, `MUS`) occurs in the authentic installation. This is a bounded installation observation, **not proof that the game has no music path**.

## `sfx.ASM` data graph

Watcom module evidence bounds:

- code: `0x00027ABC..0x00027B46` (138 bytes)
- data: `0x0001EE14..0x00022BEC` (15,832 bytes)

`reset_fx_addrs_` mechanically establishes:

- record count: `0x215` = **533**
- record stride: `0x18` = **24 bytes**
- record table base: `0x0001EE34`
- runtime slots at record `+0x10` and `+0x14` are zeroed during reset.

The fixed table therefore spans `0x0001EE34..0x0002202C`.

Record fields preserved by O63:

- `+0x00`: WAV path Watcom offset or zero;
- `+0x04`: exact file byte length;
- `+0x08`: load flags (`0x10` for all 533 canonical records);
- `+0x0C`: raw zero field, semantics not promoted;
- `+0x10`: canonical zero / runtime mutable slot;
- `+0x14`: canonical zero / runtime mutable slot.

Counts:

- **533** records total;
- **243** bound records;
- **290** zero-path/unbound records;
- **243** unique bound path pointers;
- every bound record's stored byte length matches the authentic WAV exactly.

## Executable WAV path pool

The path pool begins immediately after the record table at `0x0002202C` and contains exactly **244** NUL-terminated `SFX\*.WAV` paths. The path set is exactly equal to the 244 installed WAV files.

A direct validation failure caught an initial over-strong assumption: the string pool does **not** consume the entire `sfx.ASM` data range. The final `XTRA07.WAV` terminator is followed by **one additional zero padding byte** at the end of the module. O63 preserves that byte explicitly rather than calling it part of an empty path.

Exactly one executable path is not referenced by a sound record:

- `SFX/DUMMY.WAV`

It is retained as a real installation/path-pool resource but has no O63-qualified sound-code binding.

## Sound-code identity

For every bound numeric WAV, the three-character filename is the hexadecimal representation of its table sound code. Examples:

- code `0x001` -> `SFX/001.WAV`
- code `0x014` -> `SFX/014.WAV`
- code `0x130` -> `SFX/130.WAV`

There are **222** such numeric resources.

The named tail maps mechanically as:

- `DUNNO01..DUNNO14` -> codes `0x200..0x20D`
- `XTRA01..XTRA07` -> codes `0x20E..0x214`

These filenames are preserved as canonical installation identifiers only. O63 does **not** assign gameplay/event meanings to them.

## Low-code playback policy

The 32 bytes at `sfx.ASM` data `0x0001EE14` are consumed by `play_fx` for sound codes below `0x20`.

Qualified forever/loop codes are:

`0x001, 0x002, 0x003, 0x006, 0x007, 0x00A, 0x00D, 0x012, 0x014, 0x01B, 0x01F`

Bounded behavior:

- code `< 0x20`: `stop_all_samples_` is called first;
- code `0`: stop-all only;
- null-path record: no resource playback;
- nonzero low-code policy byte: `play_sample_forever_`;
- zero low-code policy byte: `play_sample_`;
- code `>= 0x20`: ordinary one-shot path when bound.

## Playback bridge

`play_fx` uses the exact table-index formula:

`record = 0x1EE34 + soundCode * 24`

The only direct application-module near call to `play_fx` found by the bounded census is the authentic `MKSOUND.ASM` symbol `SOUND`. `SOUND` checks `F_NOSOUND` before calling `play_fx`.

Higher-level authentic symbols are retained as structural context, including `PLAYER_SOUND` and `SMART_SOUND`. O63 records their direct caller-module census but does not infer a universal event-name-to-WAV mapping.

The game-side `play_sample_` / `play_sample_forever_` helpers directly call linked Miles digital-sample APIs including:

- `_AIL_allocate_file_sample`
- `_AIL_start_sample`
- `_AIL_set_sample_loop_count`
- `_AIL_sample_status`
- `_AIL_stop_sample`
- `_AIL_end_sample`

This establishes the bounded digital WAV playback relationship.

## MIDI / sequence boundary

The executable contains linked Miles sequence/MIDI/wave-synth symbols, including `_AIL_start_sequence`, `_AIL_init_sequence`, `_AIL_set_sequence_volume`, and related routines.

The O63 bounded direct-near-call census finds **zero direct application-module calls** into the selected linked sequence/MIDI API surface.

The correct interpretation is therefore:

`LINKED_LIBRARY_CAPABILITY_ONLY_NO_DIRECT_APPLICATION_NEAR_CALL_OBSERVED`

This pass does **not** exclude indirect runtime use and does not claim that MK1 has no music.

## `SAMPLES.DAT`

Authentic file:

- size: **311,976 bytes**
- SHA-256: `99f701709521855d6c78cd394377ba32fd55c262465ba05bfdfe82df029f5b45`

Bounded negative evidence:

- exact ASCII `SAMPLES.DAT` occurrences in canonical `MK1.EXE`: 0
- exact little-endian dword occurrence of the file size in canonical `MK1.EXE`: 0

Its format and executable relationship remain **UNKNOWN**. O63 policy is:

`PRESERVE_RAW_WITH_UNKNOWN_ROLE`

## Validation

The TypeScript O63 core passes direct authentic-install execution and its internal validation contract.

A separate Python reconstruction/audit independently checks the authentic EXE/WAV bytes and the emitted report. Result:

- **516/516 checks passed**
- 244 WAV identities/hashes/headers reproduced
- 533 raw table records reconciled
- 243 bound / 290 unbound reproduced
- numeric and DUNNO/XTRA code mapping reproduced
- one unbound `DUMMY.WAV` path reproduced
- 11 low-code forever flags reproduced
- `reset_fx_addrs_` table immediates reproduced
- `play_fx` 24-byte index pattern reproduced
- `SOUND -> play_fx` direct call reproduced
- every reported digital API call occurrence decodes to its stated target
- `SAMPLES.DAT` bounded negative facts reproduced

## Export capability decision

Ready for O64:

- lossless raw export of all 244 WAVs;
- exact sound-code -> WAV path binding for 243 records;
- playback-policy metadata;
- provenance/hashes/PCM metadata;
- raw preservation of `SAMPLES.DAT` as an unresolved resource if desired.

Not ready / intentionally blocked:

- invented gameplay/event names;
- semantic use of `DUNNO`/`XTRA` filenames beyond their installation identifiers;
- `SAMPLES.DAT` role or format claims;
- MIDI/sequence runtime claims from linked-library presence;
- import/re-encoding/write-back.

## Verdict

`MK1_AUDIO_MUSIC_RESOURCE_GRAPH_AND_EXPORT_CAPABILITY_CENSUS_ESTABLISHED`

## Next pass

**1E.3O.64 — Browser-downloadable MK1 audio package plus workspace integration**

Package only the O63-qualified raw surface and relationships, independently validate package inventory/bytes, and add Audio Assets workspace presentation only where the evidence model supports it. Unknown relationships must remain explicitly unknown.
