# MK DOS Extractor headless foundation

Node.js 24 runs these TypeScript modules directly. There is no install or build step. The CLI and its tests import only this directory, Node built-ins and the committed hash-only test references. See [migration audit](MIGRATION.md).

## Windows PowerShell

From a checkout of `feat/headless-extractor` in `F:\Dev\MKEXT\SOURCE\mkdosext-headless`:

```powershell
Set-Location 'F:\Dev\MKEXT\SOURCE\mkdosext-headless'
$mkRoot = 'F:\Dev\MKEXT\FIXTURES\mk2\mk2'
$mkValidation = 'F:\Dev\MKEXT\FIXTURES\VALIDATION'
node .\headless\cli.mts identify $mkRoot
node .\headless\cli.mts list $mkRoot probe.gra
node .\headless\cli.mts extract $mkRoot mountain.gra 14 (Join-Path $mkValidation 'headless-mountain-14')
node .\headless\cli.mts preview $mkRoot acclaim.gra 0 (Join-Path $mkValidation 'headless-acclaim-0')
node .\headless\cli.mts relationships $mkRoot mountain.gra
Remove-Item Env:MK2_DOS_FIXTURE -ErrorAction SilentlyContinue
node --test .\headless\test.mts
$env:MK2_DOS_FIXTURE = $mkRoot
node --test .\headless\test.mts
python .\scripts\verify-mk2-p13-mountain-independent.py $mkRoot .\scripts\fixtures\mk2-p13-mountain-independent-parity.json
```

Use a new output directory under the existing validation parent. Exports contain row-major 8-bit `indices.bin`, a byte-per-pixel `opacity.bin` (0 or 1) and schema-1 `metadata.json` with dimensions, stable asset ID, verified file fingerprints, source offsets, compression and file SHA-256 values. The metadata is written last. A directory with missing metadata can indicate an interrupted export.

`preview` also exports lossless RGBA PAM and a byte mask for the conditional diagnostic palette mapping. Intro previews use counted DAC6 source words with a one-based mapping. Zero and out-of-map indices render magenta. Mountain previews normalize index intensity and have an all-zero palette mapping mask. Both preserve the original index and opacity planes. Runtime palette ownership and timing are **UNKNOWN**.

## Coverage

| Game and family | Headless status | Evidence and limits |
|---|---|---|
| MK1 graphics, audio, music | Deferred | Legacy coverage documented at P16/P11. headless parity pending |
| MK2 Probe and Acclaim intro images | VERIFIED | 31 original 320×200 LZW index planes, source offsets and conditional DAC6 diagnostics |
| MK2 Mountain object graphics | VERIFIED | 15 original 35×41 streams in the 23,024-byte suffix. prefix and runtime colour remain unknown |
| MK2 Mountain conditional object lists | VERIFIED | Six original lists, five distinct. source token 14 aliases descriptor 13. adjacent graphic 14 is unselected |
| MK2 gameplay stages and runtime animations | VALIDATION PENDING | P90 static source research and P91 observer are retained on their research branches. native Tomb capture and end-to-end runtime parity are a separate gate |
| MK2 other sprites, sound, speech and music | Deferred | No headless migration in this checkpoint |
| MK3 graphics, audio, music | Deferred | Legacy coverage documented at P16/P11. headless parity pending |

## Verification and checkpoints

- Windows Node 24.20.0, original-free suite: 3 passed, 4 fixture-dependent skips. Controls cover synthetic LZW, truncated subblocks, invalid Mountain executable evidence and CLI argument/input failures.
- With the canonical original MK2 directory: 7 passed, 0 skipped. P12 index, conditional RGBA and mask hashes and original offsets matched for all 31 frames. P13 indexed, opacity and diagnostic RGBA hashes and descriptor/stream boundaries matched for all 15 graphics. All six relationship lists matched the hash-only P13 reference.
- Fresh independent P13 Python original-file verifier: 2,198 checks passed. P12 parity used the committed independent O110B/O110E manifests.
- CLI regression independently exercised identify, list, extract, relationships and preview. Separate process runs produced byte-identical Acclaim packages. Runtime reconstruction and the full legacy multi-game suite were outside this regression run.
- Pass 1 `46999b8`. Pass 2 `e4ef77a`. Pass 3 `93dadcb`. Pass 4 `d510a49`. Pass 5 tested source `70fc9ef28d50b9a5c89a217c1bbc0a13e504b06a`.

Next cycle: qualify the existing MK2 U8 sound extraction against independent original PCM hashes and preserve the raw samples and timing metadata. For stage work, use a verified native Tomb capture to qualify palette and composition evidence before admitting native reconstruction.
