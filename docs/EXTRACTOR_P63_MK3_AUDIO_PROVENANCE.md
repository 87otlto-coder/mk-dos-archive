# P63 MK3 embedded WAV provenance

Second interim pass of the P62–P66 cycle, based on P62 develop commit `50d7169`.

## Observe and record

A direct read of the original installation found 29 WAVs in MK3.ASG, 672 in SPEC regions and 323 in CLAS regions across 17 fighter containers. All 1,024 physical records have a distinct file/offset pair. Comparing complete RIFF records yielded 673 distinct byte strings. Of these, 464 occur once and 209 occur at multiple locations. Ancillary chunks are part of that comparison. This count does not measure distinct acoustic performances.

All 1,024 format headers describe one channel of unsigned 8-bit PCM, with one byte per frame. 451 declare 6,000 Hz and 573 declare 11,025 Hz. Every record has a fmt and data chunk. The files also contain 40 INFO and 34 spr1 chunks across these records.

## Hypothesize and test

The original library already used the physical interval as the WAV ID. Its source record lacked a digest, and the manifest omitted the boundary and ordinal of the enclosing audio region. The scanner now walks each validated audio region directly and carries its provenance into the existing asset details and selected-export manifest. Source SHA-256 covers the entire named installation file. The separate wavSha256 covers exactly the exported RIFF record. Offsets are zero-based bytes in the source file. Record indices start at zero in each region. ASG rows have null MFIL chunk name and header offset.

Run from the checkout with the locked dependencies installed:

```sh
node scripts/test-p63-mk3-audio.cjs
node scripts/verify-mk3-p63-audio.cjs "<original MK3 installation>"
```

The original-fixture verifier fingerprints the sorted ASG/FTR filenames and whole-file hashes, obtains sound region bounds independently from the MFIL end directory, and searches every installed file for RIFF/WAVE headers. It checks gapless region coverage and reads each WAV's chunks directly. It compares the library and selected ZIP manifest, physical IDs, filenames, format fields, file and record digests and every selected payload. Equal digest groups are checked for byte equality. The fixture passed with 9,186 catalogue assets, 1,024 selected WAVs and one manifest in memory. Synthetic controls cover repeated bytes at separate offsets, truncated records, invalid inner chunk bounds, ambiguous data chunks, partial trailing records and the non-PCM confidence label.

## Classify and continue

Every literal RIFF/WAVE header found in this installation was accounted for and every catalogued WAV exported intact. Other audio encodings elsewhere in the game are outside this signature census. Speaker, gameplay event and runtime playback identities remain unresolved. Commercial media and extracted records stayed local. This focused run did not exercise interactive browser export, listening, gameplay, or the full three-game regression. P61 remains the accepted consolidated baseline.

P64 investigates MK2 score and loop evidence. P65 investigates source-ordered animation coverage. P66 consolidates the three-game regression and accepted interim fixture and refusal checks.
