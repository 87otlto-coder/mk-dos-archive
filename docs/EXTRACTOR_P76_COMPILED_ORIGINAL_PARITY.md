# P76 addendum — original MK3 compiled production recovery and indexed ZIP parity

**Date:** 2026-11-08. **Branch:** `develop`. **Mode:** independent original byte verification of **fingerprinted compiled production JavaScript**, not a full original-browser checkpoint. **No commercial MK3 source bytes or extracted media in Git.**

## Why this matters

The P76 app integration and offline Chrome source-only build already passed, but original DOS execution of the **new TypeScript runtime** remained unverified. A direct browser test in the current isolated environment was attempted and could not navigate even a `data:` URL; local Chromium returned `net::ERR_BLOCKED_BY_ADMINISTRATOR`. This is an environment restriction, not app validation success/failure. We **did not** mark any real Chrome gate passed.

An original-byte production-function test was then run locally using the **exact production JavaScript** downloaded from GitHub Actions build [42501729099](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42501729099).

## TESTED ORIGINAL EVIDENCE

- User-provided original **DATA.MK3** SHA-256 `72905bc96b752bceb0055296e26b904402909f73a1401541c0dd175135a55517`.
- GitHub Actions compiled bundle **`assets/index-HCq8SX5-.js`** SHA-256 `acb4692d99a0a3bfdb9da508bf730b858b3179607b34d2f3e0785dd9842c8884`. The bundled source is from the P76 code/workflow CI checkpoint (the subsequent source commits only add verification scripts/docs).
- Original P75 independently accepted source-row extraction private ZIP **SHA-256 `aeeed230c7d76adacebe9b33b5675c746b8248e2a3fdb2734b7253a9785904ed`**. Its original byte evidence had independently passed the P75 original source + 38 PNG readback.
- **Exact original compiled P76 recovery core:** extracted only the fingerprinted original compiled recover/decode functions and its exact compiled selected-indexed-ZIP, stored-ZIP and deterministic-PNG implementations into a constrained Node VM context. Supplied standard hash/DataView/filename/encoder dependencies from Node; no source function reimplementation substituted for the P76 decoder. The source-validating fixture has the actual **416 IFF FORM offsets and 20 original non-IFF gaps**, with the remaining baseline catalogue slots synthetic solely for the fixed **9,186** count. This is **not** execution of the complete original Asset Library scanner or browser UI.
- **Recovery result:** **19/19** source-indexed images; **2,050,843** indexed positions and masks; **996,697** painted pixels; **271** source-absent scanlines; source offsets/first compressed streams/row X and pointer tables match original P75; **1,611,110** bytes after row tables remain explicitly undecoded. All source fields and SHA values matched.
- **Production ZIP/PNG result:** the actual compiled export implementation produced **19 private original-indexed ZIPs** (total **13,442,074 bytes**) with **152 CRC-valid entries**. An independent Python/Pillow oracle compared **114 sidecar planes / 5,182,272 bytes** with the accepted original P75 private source archives and all **19 grayscale/alpha previews / 2,050,843 RGBA pixel positions** with independently generated source-indexed PNGs: **PASS**. No native RGB color ownership was claimed or applied to the indexed previews.
- **Source identity:** exact tested local Python independent oracle Git blob SHA-1 `763751803bdea9a0be0990b1bbba880848c853a7` and tested local Node original compiled replay Git blob SHA-1 `51d18db97a84fe78e0cfcc56e85a4fc1b2772af4`. Both files were committed to `develop` and GitHub blob hashes checked independently.
- No original MK3 binary, source color table, pixels, screenshots, or individual generated ZIPs were uploaded to GitHub. All 19 generated ZIPs stayed in a private local work folder.

## REPRODUCIBLE SOURCE

- `scripts/verify-mk3-p76-compiled-original.cjs` — fingerprinted exact compiled recovery+export execution using private original input; refuses other compiled bundle versions, unknown DATA.MK3, different P75 private archive, missing inputs and output overwrite. Parses 416 IFF/20-gap original source bounds independently, then uses source-backed baseline slots to invoke the exact compiled recovery functions. Exports private indexed ZIPs and invokes the independent oracle.
- `scripts/verify-mk3-p76-compiled-independent.py` — separately reopens **all 19 compiled ZIPs**, requires exact original P75 index/mask/source-table sidecars, 19 pixel-exact PNGs and unchanged UNKNOWN palette/renderer classifications. Exports JSON-only acceptance summary.

PowerShell example (the P75 private archive is from the user's prior original-source export; it is **not** tracked in Git):

~~~powershell
cd "C:\Users\87otl\mk-dos-extractor"
git switch develop
git pull --ff-only origin develop
npm.cmd run build

node scripts/verify-mk3-p76-compiled-original.cjs `
  "E:\GOG\Games\Mortal Kombat 3\mk3" `
  ".\dist" `
  "C:\Temp\mk3_p75_source_row_canvases_private.zip" `
  "C:\Temp\mkdos-p76-compiled-source-check-NEW"
~~~

Requires local Python and Pillow. The `NEW` path must not exist. The two production source/oracle scripts contain no proprietary game data and may be versioned; the original private ZIP and generated indexed ZIPs remain untracked.

## CONFIDENCE AND ACCEPTANCE GATES

**VERIFIED:** exact original MK3 source fingerprint, exact code fingerprint, 19 compiled source-row indexed images, 114 original source plane parity checks, 19 production-export PNG pixel parity checks, and preservation of UNKNOWN native palette/renderer state.

**VALIDATION PENDING:** actual full application MK3 scanner (9,186 genuine original entries), interactive real Chrome opt-in (9,186 → 9,205), actual browser download, P72 original Chrome palette comparison, original three-game P71 replay on the current branch, and P76 six-group original/Chrome final checkpoint. These are still required for **fully accepted P76**; no `main` promotion.

**NEXT:** execute the previously committed `scripts/verify-p76-checkpoint.py` in the original Windows environment (with Chrome, Playwright, the original three DOS installations and new private work path). The compiled source evidence is additional assurance only; do not substitute it for any of the six groups.
