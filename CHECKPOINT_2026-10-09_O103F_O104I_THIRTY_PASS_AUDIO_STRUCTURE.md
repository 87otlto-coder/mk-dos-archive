# MK DOS Archive — O103F–O104I Thirty-Pass Audio Structure Checkpoint

**2026-10-09 · Authentic DOS MK2 · 30/30 bounded source analyses · MK2 OPEN**

## Outcome

Original DOS MK2 installs **33 distinct song-named groups**, with **five resource variants** per group: `.mid`, `.awe`, `.gvs`, `.lap`, `.sbl`, totalling **165 source files**. All 165 pass a single exact length and offset-table boundary relationship and admit a completely **lossless physical partition** verified against each native-file SHA-256. This is the largest new structural-music result so far; **it does not reconstruct notes, timing, instruments, or executable playback**.

## Authenticated audio-file structure

Let `L = u16le(file[1:3])` and `N = file[L+4] - 1`. Across **all 165**:

- First byte `file[0] = 0x01`.
- File length equals exactly **`L + 7 + 2*N`**.
- The 16-bit footer word at `file[L:L+2]` equals **`L+2`**.
- Footer byte `file[L+2] = 0x60`; footer word `file[L+5:L+7] = 0x0003`.
- `N` trailing little-endian 16-bit offsets occupy `[L+7, EOF)`, with **no gap or trailing leftover**.
- All **931 offsets** are strictly increasing within each file, point to byte `0x00`, have an immediately preceding marker `0x91` or `0x98`, and have a following byte in `0x80..0x89`.
- The final byte immediately before `L` is always `0x91` or `0x98`.
- The fourth footer byte (`file[L+3]`) is exactly equal across all five hardware-format variants of each of the 33 song families; observed family values range **80–135**. **Tempo is only a hypothesis**, not an authenticated unit.

Recorded counts: preceding offset marker `0x91` **573**, `0x98` **358**; terminating markers `0x91` **106**, `0x98` **59**. Offset-count histogram: `N=0:4, 1:3, 2:17, 3:11, 4:5, 5:20, 6:36, 7:28, 8:40, 9:1`.

### Necessary exceptions

- **Four files with zero offsets:** `title.mid`, `title.awe`, `title.gvs`, and `title.lap`. `title.sbl` instead has two.
- **Three files with duplicate identifier values** despite distinct increasing offsets: `flower.gvs` (129 twice), `pit2ea.lap` (132 twice), `portal.lap` (135 twice). Do not equate an identifier to a unique track.
- `intro1.mid` has nonzero header byte 3 (`0xB9`); the sound-family header byte is not universally a 24-bit length.

## 30 bounded passes

| Passes | Native-source evidence category | Qualification |
|---|---|---|
| O103F–O103J | All 33 `.mid` headers, footers, offsets, lossless segments, cross-variant joins | Verified |
| O103K–O103O | All 33 `.awe` resources, same five independent questions | Verified |
| O103P–O103T | All 33 `.gvs` resources, same five independent questions | Verified |
| O103U–O103Y | All 33 `.lap` resources, same five independent questions | Verified |
| O103Z–O104D | All 33 `.sbl` resources, same five independent questions | Verified |
| O104E | Shared per-song footer parameter across hardware variants | Verified 33/33 |
| O104F | Duplicate identifier exceptions | Exactly three verified |
| O104G | Cross-corpus offset and marker census | 931 offsets verified |
| O104H | Empty-offset table exceptions | Exactly four verified |
| O104I | Conservative closure, preservation and format boundaries | Verified |

## Verification

- **Independent Node verifier: 7,695 checks / 0 failures** against the original executable hash and original 165 files; no Python-producer imports.
- **30/30 deliberate report-content mutations rejected** by the independent verifier, with all pristine originals restored and passing afterward.
- Regressions: O102B–O103E **27,504**, O100X–O102A **109,898**, O100D–O100W **81,416**, O99J–O100C **81,535** = **300,353 / 0 failures**.
- No new exact-full indexed graphics promotions. **MK2 remains 110/124**, 14 held. No eighth animation sequence, no confirmed correct-color scene, no playback event/timing grammar.

## Evidence and reproduction

- `evidence/mk2_o103f_o104i/`: 30 report JSONs, one per pass.
- `mk2_o104i_music_structure_ledger_2026-10-09.json`: file-by-file hashes, metadata fields, 931 exact offsets, bounded identifiers, and all exception cases.
- `scripts/run-mk2-o103f-o104i-audio-trailer-thirty-pass.py` (producer)
- `scripts/verify-mk2-o103f-o104i-audio-trailer-thirty-pass.mjs` (independent verifier)
- `scripts/test-mk2-o103f-o104i-audio-trailer-negative-controls.py` (30 independent false-report acceptance tests)

```bash
python scripts/run-mk2-o103f-o104i-audio-trailer-thirty-pass.py "$MK2/mk2.exe" "$MK2" evidence/mk2_o103f_o104i
node scripts/verify-mk2-o103f-o104i-audio-trailer-thirty-pass.mjs "$MK2/mk2.exe" "$MK2" evidence/mk2_o103f_o104i
python scripts/test-mk2-o103f-o104i-audio-trailer-negative-controls.py "$MK2/mk2.exe" "$MK2" evidence/mk2_o103f_o104i scripts/verify-mk2-o103f-o104i-audio-trailer-thirty-pass.mjs
```

## Next higher-value technical question

Find authentic code/driver consumption of the `L+7` trailing tables and the `0x91/0x98` marked sections, or implement a **bounded read-only event grammar hypothesis** subjected to independent tests across every format, while preserving raw bytes and rejecting any unsupported note/tempo/channel semantics. If source code or emulator tracing is unavailable, move to the packed renderer's runtime transform and palette binding, not repeated audio header censuses.

**Research order remains MK2 → MK1 → MK3 → UI/usability → extractor.**
