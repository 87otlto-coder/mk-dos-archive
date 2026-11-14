# P88 — MK1 source-indexed descriptor previews (interim candidate)

**2026-11-14.** First graphics-usability follow-up after accepted P87. Review branch `interim/p88-mk1-indexed-previews` forked from accepted P87 merge `87694e90548307792ab5e349220ed443542f13d0`. Keep `main` and `develop` untouched and do not package a full source ZIP. P91 remains the proposed fifth-pass consolidation.

## Extraction objective

P87/P65 already authenticates the original DOS `MK1.EXE`, eight ANITAB tables, 739 table cells, 514 source streams, and 1,102 original O60 descriptor index/paint-mask planes (11,230,148 original indexed bytes). The four-member P65 source ZIP is original-source-verified but contains **no PNG previews**.

P88 **does not invent or reimplement a graphics decoder**. It adds a Python 3.11+ source-preserving preview exporter for the accepted P87 ZIP. Every selected descriptor becomes:

- `frames/NNNN/original-indices.bin` — exact original index bytes, including invisible source positions.
- `frames/NNNN/original-paint-mask.bin` — exact binary original source paint mask.
- `frames/NNNN/diagnostic-index-rgba.png` — independently checkable source index-value diagnostic: `R=G=B=original numeric index`, `A=255*paint mask`; transparent pixels retain their original RGB index value.
- One root `manifest.json` containing original P65 ZIP SHA256, original EXE fingerprint, O60 indexed payload fingerprint, each original source descriptor (offset/geometry/resource), binary/PNG SHA256, explicit uncertainty flags; plus `README.txt`.

The user may export **all 1,102 descriptors** or select exact `tableSymbol:descriptorWatcomOffset` keys discovered using `list`. Deterministic ZIP writing, existing-directory requirement and exclusive `xb` creation refuse accidental replacement. No commercial source or original-derived media is committed.

## Critical authenticity and interpretation boundary

The public P88 `list` and `export` commands **first call the accepted P87 `mkext.py verify --game mk1`**, which replays the P65 independent original `MK1.EXE` pointer/opcode and O60 indexed byte oracle. **No CLI export PASS is permitted from a synthetic, fabricated or unknown P65 ZIP.** The standalone independent P88 verifier reruns P87 original acceptance separately and checks all exported sidecars and PNG pixels against the accepted P65 ZIP with its own PNG chunk/CRC/DEFLATE decoder.

The PNG is **NOT a native-colour portrait, native alpha blend, gameplay frame, runtime animation, or stage composite**. Sprite/palette context, runtime branch traversal, native durations and multipart Z order remain UNKNOWN. Source-mask alpha is diagnostic source coverage, not observed renderer ordering. O20 already proves ANITAB alone cannot choose a character-specific palette: do not add automatic colour assignment by table name.

## Source-only / Windows CI

New files:
- `scripts/mk1_p88_previews.py`: original-source-gated diagnostic preview exporter and descriptor selector.
- `scripts/verify_mk1_p88_previews.py`: independent PNG, exact source indices/masks, archive integrity, manifest and native-claim refusal.
- `scripts/test_mk1_p88_previews.py`: 20 original-free synthetic positive, selected-export, original-index-zero/transparent nonzero, malformed-source and false-native regression cases.
- A Windows-only source smoke step added to `.github/workflows/p11-build-smoke.yml`; original commercial data absent.

**CI PENDING until a full successful Actions result is inspected on the exact implementation commit.** No source-only tests prove real-DOS P88 acceptance.

## Private Windows original DOS acceptance — PENDING

Use the canonical local directory structure. Never place original binaries or derived ZIPs under SOURCE or GitHub.

```powershell
Set-Location 'F:\Dev\MKEXT\SOURCE\mkdosext'
git fetch origin
git switch interim/p88-mk1-indexed-previews
git pull --ff-only origin interim/p88-mk1-indexed-previews
git rev-parse HEAD
git rev-parse 'HEAD^{tree}'
python scripts/test_mk1_p88_previews.py

$mk1 = 'F:\Dev\MKEXT\FIXTURES\mk1\mk1'
$p87 = 'F:\Dev\MKEXT\FIXTURES\VALIDATION\P87-d779725fb21a4a31af69f0cc624d03ca\mk1-indexed-anitab-source.zip'
$private = Join-Path 'F:\Dev\MKEXT\FIXTURES\VALIDATION' ('P88-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $private -ErrorAction Stop | Out-Null
$out = Join-Path $private 'mk1-descriptor-previews.zip'
python scripts/mk1_p88_previews.py export --source "$mk1" --archive "$p87" --out "$out" --all
if ($LASTEXITCODE -ne 0) { throw 'P88 export failed' }
python scripts/verify_mk1_p88_previews.py --source "$mk1" --archive "$p87" --preview "$out"
if ($LASTEXITCODE -ne 0) { throw 'P88 independent verification failed' }
```

Before execution, confirm the earlier P87 private ZIP still exists at the documented path. **Do not overwrite, move or recreate old P87 validation evidence.** Run `list --source "$mk1" --archive "$p87"` for descriptor keys if selective export is desired. For a selective export, use `--key 'TABLE:offset'` instead of `--all`; source input must still be canonical.

Acceptance requires:
1. Exact local Git HEAD and tree captured and correlated to reviewed P88 source.
2. Local 20-case synthetic test PASS.
3. New export `P88_MK1_EXPORT / PASS` and independent `P88_INDEPENDENT / PASS`, **1,102 descriptor PNGs**, 1,102 original index sidecars and 1,102 original paint-mask sidecars, every original byte plane/source-index PNG pixel independently checked.
4. P87 independent original executable/O60 oracle PASS **on export and verify** and exact source archive SHA. No unverified native palette, runtime animation or stage assertion.
5. Existing MK1 2,656, MK2 5,369, MK3 9,186 canonical representation baselines unchanged. A broader P91 consolidation will rerun them; P88 must not claim it did from the focused test.
6. Optional browser behaviour: not changed or claimed by P88; this is an immediately usable private headless ZIP workflow.

If source CI or original Windows verification fails, preserve full outputs and exact source identity, investigate, and do not merge P88 until verified. Do not promote `main`/`develop` or release.

## After P88: research preparation for P89

Prepare a separate reproducible P89 research harness on the **accepted P88 base**. Reuse existing original P79 MK3 raw continuation boundary evidence, P65 MK1 executable source graphs, P82 MK2 native source-layer verifier and O20/P58 colour-context qualification. Run source-only negative tests in Windows CI first; Work mode should spend its allocation interpreting genuinely new original evidence, not relearning accepted formats or writing setup commands.

Source-only vs original private fixture vs actual Chrome acceptance must remain separate, and all hypotheses must be marked VERIFIED, INFERRED, HYPOTHESIS, UNKNOWN or VALIDATION PENDING.
