# P89 R1 — original MK3 DOS/4GW executable source-address mapping

**Date:** 2026-11-14  
**Confidence:** VERIFIED original-file identity and LE metadata/page mapping; UNKNOWN P79 decompression entry point and runtime semantics. **New verified indexed images: 0.**

## Why this is useful for extraction

P79 recovered one original 320×200 indexed dragon-logo image and 216 contiguous raw continuation records from `DATA.MK3`. Prior P89 R1 tests recorded the complete byte partition, discovered recurring payload markers and rejected two specifically defined naïve RLE/output-bound hypotheses. Neither decoded the continuation payloads. Further generic RLE guessing was stopped.

To investigate a decompressor only if it materially improves P79 indexed-image reconstruction, we need a repeatable mapping between file offsets and code/data addresses in the canonical original executable. The new read-only LE mapping tool supplies that narrow prerequisite. It does **not** claim to identify the graphics routine.

## OBSERVE — original executable directly examined

- Source: canonical original `MK3.EXE` from the user's private `mk3.zip` project fixture; SHA256 `8aa7f3d45a086e7373afc120dc88378bda3d7766d5b69badbc707bb4570bdef0`, 1,496,497 bytes. Fingerprint checked directly, no exe bytes committed.
- Executable format: one recognized DOS/4GW **Linear Executable (LE)** header at original disk offset **`0x290A4`**. Do not confuse LE object virtual addresses with DOS file offsets or with unrelocated memory addresses.
- Original LE page file offset: **`0x69E00`**, page length **4,096 bytes**, **222** mapped physical pages, last page has 349 source bytes.
- Object 1: declared image **634,878** bytes, virtual base `0x10000`, flags `0x2045`, mapped pages **155** (initialized code data). The declared size is two bytes shorter than 155 complete pages.
- Object 2: declared image **521,520** bytes, virtual base `0xB0000`, flags `0x2043`, mapped pages **67**. Crucial: only **274,432** bytes are page-backed; **247,088** bytes are zero-fill virtual tail, **not absent or corrupt source pages**. A first draft of the LE guard incorrectly expected every object byte to be backed by a source page; it was corrected before test acceptance.
- Entry-point object **1**, offset `0x3A4F0`, virtual address `0x4A4F0`, maps to original file offset **`0xA42F0`**. Map uses LE's three-byte big-endian page number plus a fourth page flag, and original source page base `0x69E00`.
- The LE object's 32-bit page relocation/fixup information must be respected for any deeper static call-graph analysis. **This source-address map has not established an executable cross-reference or a calling relationship to the P79 records.**

These findings were independently read from the original attached executable, not inferred from filenames, screenshots or a synthetic test. The read-only code maps exact page-bound offsets with fail-closed SHA and format checks. The optional metadata JSON contains no game binary, compressed record payload, decoded artwork, or source disassembly.

## TEST

Research implementation:
- `scripts/research/p89/r1_mk3_le_source_map.py`
- `scripts/research/p89/test_r1_mk3_le_source_map.py` (17 original-free malformed/positive controls, including zero-fill, overlapping pages, invalid entry point, unrecognized source)
- `.github/workflows/p11-build-smoke.yml` includes syntax and tests on Windows only.

**Original-source corroboration:** a separate direct read-only calculation against original `MK3.EXE` confirmed the source SHA, LE header, 155+67 mapped pages, 247,088 virtual zero-fill bytes and original entry disk offset `0xA42F0`. The exact new source CLI's original-user Windows execution is **VALIDATION PENDING**; the source-only GitHub CI checks should be linked only after confirming its completed status.

Targeted private Windows original-source check (does not generate a report unless requested):

```powershell
Set-Location 'F:\Dev\MKEXT\SOURCE\mkdosext'
git fetch origin
git switch research/p89-extraction-unknowns
git pull --ff-only origin research/p89-extraction-unknowns
python scripts/research/p89/test_r1_mk3_le_source_map.py
python scripts/research/p89/r1_mk3_le_source_map.py --original 'F:\Dev\MKEXT\FIXTURES\mk3\mk3\MK3.EXE'
```

If a JSON report is desired, pass `--report '<NEW PATH UNDER F:\Dev\MKEXT\FIXTURES\VALIDATION>'` and **never overwrite an existing file**.

## HYPOTHESES and STOP

1. **H1: `80 FF F9` is a source record opcode.** The bytes recur in raw continuation payloads; as a little-endian unsigned word after `80`, `FF F9` is `0xF9FF=63999`, which numerically equals the final 0-based position of a 64,000-pixel 320×200 plane. **HYPOTHESIS ONLY**: repeat occurrence and alternate signed/byte interpretations prevent interpreting it as a frame terminator without a true decoder.
2. **H2: the P79 reader/decoder is in the LE code object.** Likely in a general sense, but no original opcode/pointer/relocation or runtime witness currently connects any mapped routine to these source records. **UNKNOWN** for a specific function.
3. **H3: P79 raw payloads represent deltas applied to base indexed data.** Not yet source-verified; object/source maps do not advance that claim. **UNKNOWN**.

**Next discriminating test:** identify an original program path that consumes a tagged P79 continuation header (source span offset `0xB2DE8` for the first record, validate before use) and has an observable *indexed* output buffer. Trace that source pointer and destination/mask update for one unusual record and one holdout; independently verify original byte-to-pixel parity and malformed-input refusals before writing another decoder. If the actual source-to-output witness is unavailable, stop and preserve the blocker. Do **not** reverse engineer unrelated gameplay.

**Outcome:** a verified address-mapping research aid, not new gallery assets, playback, palette assignment, animations or a complete MK3 intro. No commercial DOS files or extracted images uploaded to GitHub; draft P89 PR #30 remains unmerged. 
