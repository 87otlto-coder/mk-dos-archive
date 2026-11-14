# P89 R1 — bounded original MK3 input-to-output runtime witness

**Status: PREPARED / RUNTIME EVIDENCE NOT YET CAPTURED (2026-11-14).** Preserve original input, source workbench, P88 accepted extractor and historical private reports. No new P79 continuation image has been independently reconstructed.

## Why static R1 source analysis has stopped

A direct original DOS `MK3.EXE` source scan at the accepted SHA `8aa7f3d45a086e7373afc120dc88378bda3d7766d5b69badbc707bb4570bdef0` found no exact 32-bit little-endian occurrences of the following *original DATA.MK3 file offsets* within the mapped 155-page executable object:

- P79 full source span start **667,866** (`0xA30DA`).
- P79 first record header **732,648** (`0xB2DE8`).
- P79 first record compressed payload start **732,662** (`0xB2DF6`).
- Next IFF FORM / end of P79 span **2,508,500** (`0x2646D4`).

**These zero exact-immediate matches are not proof of absent calls:** file offsets may be calculated or read through a file seek/read library rather than embedded as literal code constants. `64000` (`0xFA00`) occurs in 170 four-byte matches within the mapped code, including generic buffered-copy/VGA code. Therefore a 64,000-byte copy instruction is NOT a P79 decompressor witness. A static scan of 32-bit LE words alone does not resolve relocations, indirect calls, DSP video transfers or the runtime loading of P79.

Do not spend another pass applying generic byte-RLE guesses or treating these copy routines as proof. The previous direct original source report [P89_R1_SOURCE_OBSERVATIONS_20261114.md](P89_R1_SOURCE_OBSERVATIONS_20261114.md) explicitly rejects two specified naïve grammar-plus-output-size combinations; the raw 216 continuation records have still not been decoded.

## A narrow original-source signature plan

The original P79 source records were independently bounded under the canonical whole `DATA.MK3` SHA `72905bc96b752bceb0055296e26b904402909f73a1401541c0dd175135a55517`.

New **read-only memory match** code:
- `scripts/research/p89/r1_runtime_source_witness.py` — takes exact private original DATA.MK3 or private game ZIP; walks all P79 record bounds and selects a varied 48-byte window that occurs **exactly once in the entire original file**. Can check those windows against an optional private binary debugger memory dump.
- `scripts/research/p89/test_r1_runtime_source_witness.py` — synthetic negative and successful buffer-presence tests.

Six default source records are **0,23,66,68,126,215**, spanning first/subsequent records and the observed prefix/tail exceptions. Original direct-file inspection confirmed all six have a deterministic source-unique 48-byte fingerprint. Their **bytes themselves must not be pasted into source control or public tickets**. Only offset, length and SHA-256 appear in the metadata. Test exactly one source record first; then another independent record and holdout.

**Direct-original source-unique anchor evidence** (48 bytes per anchor; no payload bytes published):

| Record ordinal | Original DATA.MK3 byte offset | Relative payload offset | SHA256 of the 48-byte window |
| ---: | ---: | ---: | --- |
| 0 | 733766 | 1104 | `bb457c3b46529b4177cf4fa8140e76758aa743ef4267073472f9bd68e7e881e5` |
| 23 | 865178 | 48 | `1c7b0f7d5cdfc264ba2d970fe16e326ab52dd66f7d59e9fcb2e5eabe4e8af524` |
| 66 | 1412955 | 0 | `fd6f2529c7f2b935bf8d7bc57a8cac1813b4083d4a02fe68c3a4f9457e76af10` |
| 68 | 1440571 | 40 | `5043561fc575f6d09b8c23d8a1b463d6c9a84f1eb90a77b50f4b7f8dd1baa443` |
| 126 | 1898756 | 272 | `bf787b6f6a37895fb211f41d9ea37b995e47f5a8dfc3115aaebac26c2c1f3f53` |
| 215 | 2501733 | 856 | `4e99f341c34949e0b8765a549c0c463c358c07410298677f1e21055873df0cd0` |

These SHA fingerprints and offsets were independently computed against the attached canonical original `DATA.MK3`; each byte window occurs exactly once in that original file. They are **not runtime observations**.

**A positive input signature ONLY means a raw source payload is present in the sampled emulator memory.** This is not an authenticated decompressor address, a decompressed pixel, an output-destination buffer, the runtime draw sequence or native timing. Its purpose is to identify the correct input buffer before doing a targeted input→output trace.

### Windows original-source anchor inventory (no debugger required)

```powershell
Set-Location 'F:\Dev\MKEXT\SOURCE\mkdosext'
git fetch origin
git switch research/p89-extraction-unknowns
git pull --ff-only origin research/p89-extraction-unknowns

python scripts/research/p89/test_r1_runtime_source_witness.py
python scripts/research/p89/r1_runtime_source_witness.py --original 'F:\Dev\MKEXT\FIXTURES\mk3\mk3\DATA.MK3'
```

The output is metadata only, including source-unique SHA256 per record and `status=SOURCE_ANCHORS_ONLY`. This is **not a runtime capture**. To privately retain a JSON report, create a **new** file path under `F:\Dev\MKEXT\FIXTURES\VALIDATION\` and add `--report '<that new JSON path>'`. Existing reports are never overwritten.

## Optional runtime collection path (not yet executed/verified)

DOSBox-X has documented debugger support for `BPINT`, protected-mode memory-change breakpoints (`BPPM`/`BPLM`) in compatible debug builds, binary memory dumps (`MEMDUMPBIN`) and optional `-log-fileio` logging. See official [DOSBox-X debugger command reference](https://github.com/joncampbell123/dosbox-x/blob/master/README.debugger) and [command-line switches](https://dosbox-x.com/wiki/DOSBox%E2%80%90X%E2%80%99s-Command%E2%80%90Line-Options). The debugger version and availability on the user's Windows machine have not been checked; do not claim these commands were executed.

The **minimum safe experiment**, once a real debugger is available under `F:\Dev\MKEXT\TOOLS\`, is:

1. Keep original MK3 game files under `F:\Dev\MKEXT\FIXTURES\mk3\mk3`. Store all logs and memory captures under a new `FIXTURES\VALIDATION\P89-<unique>` path, never `SOURCE` or GitHub. Preserve original files byte-identically.
2. Start the original DOS game with a debug-enabled DOSBox-X and trace the **actual `DATA.MK3` file-read boundary**. `BPINT 21 3D` (DOS open), `BPINT 21 42` (seek) and `BPINT 21 3F` (read) are documented interrupt/AH breakpoint forms, but DOS/4GW protected-mode file I/O may use a thunk/bounce buffer; **do not assume a specific `DS:DX` source address or file handle without observing it**. Use `-log-fileio` as a supplemental original-read witness if supported in the selected build.
3. Stop on a read actually overlapping a P79 record and capture a small **post-read private binary memory buffer**. The exact segment/selector/linear base must come from observed debugger state, not the LE source virtual address. Example debugger command syntax (actual address and byte count must be observed before use): `MEMDUMPBIN <segment> <offset> <hex_byte_count>`. Never use a guessed selector or write instructions.
4. For each binary memory dump, run `python scripts/research/p89/r1_runtime_source_witness.py --original '<canonical DATA.MK3>' --capture '<private memory dump>'`. A `RAW_INPUT_BUFFER_WITNESSED` report establishes only the presence of original input bytes at the reported dump offset. No match is `SOURCE_ANCHORS_NOT_OBSERVED`, not proof the game lacks a decompressor.
5. **Only after source input is confirmed** trace the consuming call/return, record the exact code selector and mapped original source offset, and independently capture the bounded original **destination pixel/index buffer** before/after decoding. Compare against a held-out original source record. Address page relocations/zero-filled BSS explicitly. Do not assume the VGA plane is always the decompression destination.
6. An actual decoder implementation needs a separately authored independent original-byte/index/mask verifier with malformed-source negative controls, repeated source records and holdout. Source-output must match exact indexed values and optionally paint-mask provenance; runtime timing, scene order, ownership and palette are distinct evidence requirements.

**Stop rule:** If original runtime source-to-output capture is inaccessible, return `RUNTIME_WITNESS_UNAVAILABLE`, preserve the source-only anchor tests and verified original P79 ZIP, and pivot P90 engineering effort to the already verified MK1 P65/P88 descriptor-preview mechanisms rather than continue speculative MK3 decompression.

## Confidence / disposition

- **VERIFIED:** original P79 raw header/offset partition, 216 record count (210 nonempty), unique source-fingerprint windows for the six chosen ordinals, exact original DOS LE object source mapping.
- **INFERRED:** runtime file-read breakpoints may expose P79 source bytes in a private buffer. Not tested.
- **UNKNOWN:** decompressor address, command grammar, destination state, source-record meaning, palette, frame timing/order.
- **VALIDATION PENDING:** first real protected-mode runtime trace, 48-byte source signature matched in a real memory capture, independently verified decoded source pixel output.
- **New verified P79 images:** **0**. Existing extracted first indexed base image and byte-perfect preservation of all 216 P79 records remain unchanged.
