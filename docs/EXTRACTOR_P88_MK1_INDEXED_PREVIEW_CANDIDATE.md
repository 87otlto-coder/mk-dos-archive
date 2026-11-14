# P88 — MK1 source-indexed descriptor previews (interim candidate)

## P88 ORIGINAL DOS WINDOWS ACCEPTANCE — PASS (2026-11-14)

**Accepted bounded P88 original-source extraction and independent readback, pending merge/post-merge source CI.** The user supplied the complete PowerShell transcript from `F:\Dev\MKEXT\SOURCE\mkdosext`, showing a successful `git fetch`, checkout and fast-forward pull of `interim/p88-mk1-indexed-previews`. The original tested local Git HEAD **`7308e073f3a1d9c1b68e9871e60dda115440510e`** and tree **`d7094fae94c0c704983dfbd3236f44167a71dde6`** were printed. The GitHub Git-commit API independently confirmed that exact commit/tree pair and the PR head. Source-only Actions [#43570821991](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/43570821991) returned SUCCESS on executable code/test/workflow commit `b501c4b00730189896bb44d516778137c04d72c6`; P88 executable, independent verifier, synthetic tests and Windows workflow blobs were subsequently compared with the current accepted candidate and are **identical**. Later changes before the Windows run were documentation-only.

**Observed private original Windows output:**

- `python scripts/test_mk1_p88_previews.py`: **20/20 PASS** in 0.015 seconds.
- `P88_MK1_EXPORT / PASS`: canonical prior P87/P65 ZIP input SHA-256 `d7a94c1473e1ab409eea62d7899f8d548eb9143f4d1c5add83c5430ba22e51e8`; exported **1,102** descriptor selections to a fresh private ZIP, SHA-256 **`65f070b3a5b6072b67c06698c8163cc9e095aecd4937a4feeb613546fb47b991`**.
- `P88_INDEPENDENT / PASS`: the independent original index/mask/PNG checker reopened that ZIP, checked **5,615,074 original indexed source pixel positions**, exact source index and paint-mask planes and preview RGBA pixels, with `originalIndexAndMaskAndPreviewPixelParity:true`. Both report identical input/output SHA-256 values and `nativePaletteOrTimingClaimed:false`. No shell `throw` occurred.
- Private output retained at `F:\Dev\MKEXT\FIXTURES\VALIDATION\P88-672616b0834547d991188e3430333da1\mk1-descriptor-previews.zip`. The private input P87 ZIP remains at its previous P87 validation path. Neither private derived ZIP nor commercial source was uploaded to GitHub.

**Source-authentication boundary:** Both P88 public entrypoints first invoke the original P87 `mkext.py verify --game mk1` and require its PASS, with the nested P65 original executable/O60 oracle enforced by the already accepted P87 code. The P88 printed summaries do **not** print the nested P87 oracle values; their success establishes the asserted source check by inspecting the committed fail-closed call chain, not by an independently supplied nested trace. The user-supplied transcript is process-produced original-machine evidence; the original commercial source and private output archive were not independently downloaded into this GitHub review.

**Confidence:** P88 original-DOS preview/export **VERIFIED FROM USER-EXECUTED ORIGINAL WINDOWS PROCESS RESULTS**, source-only Windows CI **VERIFIED**, Git tested commit/tree directly confirmed. The independent P88 verifier checks exact index/mask/RGBA parity, **not** native colour selection, original gameplay animation traversal/duration, actor Z-order or stage composition. Current broader three-game asset totals and original Chrome click/download remain inherited checkpoint evidence, not rerun by focused P88.

**Decision:** Original Windows acceptance **PASS** for the bounded, headless preview/export scope. P88 may be merged only to accepted interim development branch `interim/p83-mk2-stage-library`. Preserve the P88 branch and all private original tests recoverably. Keep `main` and `develop` unchanged; no full source checkpoint/release. The historical pending-acceptance instructions below document the pre-test gate and are superseded by this PASS record.


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

**SOURCE-ONLY WINDOWS CI VERIFIED PASS:** [Actions #43570821991](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/43570821991) completed SUCCESS on exact tested candidate source commit `b501c4b00730189896bb44d516778137c04d72c6`. The P88 synthetic 20-case suite, P87 and inherited regressions, TypeScript, Vite production build and source-offline headless Chrome startup passed on Windows. Later P88 documentation-only commits do not alter executable source, the tests or workflow; check exact Git blobs at original acceptance. **Original P88 DOS fixture verification is still VALIDATION PENDING**; no commercial game files were used in hosted CI.

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
