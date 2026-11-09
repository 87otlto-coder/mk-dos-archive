# P81 consolidation candidate — original three-game and real Chrome fifth-pass checkpoint

Date: 2026-11-09. Development branch: interim/p79-original-extraction. State: P81 source-only CI PASS, but the **single-source-tree Windows original-game and real Chrome acceptance remains VALIDATION PENDING**. Stable develop and main remain unchanged.

## What P81 consolidates

- P76: original MK1 2,656, MK2 5,369 and MK3 9,186 = **17,211 baseline asset representations**; inherited P71 ten-group and P76 six-group original/Chrome checkpoints. First MK3 opt-in adds 19 indexed images for **9,205 MK3** and **17,230 optional combined** representations.
- P77/P78: 216 original verified source-indexed MK3 image records in 19 non-IFF spans, including the first 19 P76 records and **197 further images**. P77 independent original byte and 432 PNG evidence is re-exercised by the P78 original integration runner. Second opt-in reaches **9,402 MK3** and **17,427 optional combined** representations. P78 verifies all 197 additional images/1,182 sidecars and an independent original Chrome indexed ZIP.
- P79/P80: a separate 1,840,634-byte original non-IFF span contains **one verified 320×200 index plane** and **216 individually bounded raw source records**, six of which contain no payload. P79 independent 220-part and 128,000 PNG-pixel evidence is re-exercised by P80 full original integration. P80 adds **one index-map image and 216 separately exportable raw resources**, yielding **9,619 MK3** and **17,644 optional combined** representations. The 216 raw records are NOT the earlier 216 verified source-indexed image records and NOT proven native animation frames.

P81 does not change the accepted resource decoders, palettes, stage associations, compositor, research workbench or default catalogue. Native palette, opacity for the P79 base image, runtime animation timing, source record/frame membership and stage geometry remain UNKNOWN or INFERRED as already documented.

## Source and regression changes

- scripts/verify-p81-checkpoint.py is the new fail-closed full original-source and Chrome orchestrator. It requires all three original game directories, exact original EXE fingerprints, a completely clean Git checkout, a fresh private work directory, a source commit/tree audit before and after verification and exact typed machine-readable results. It saves full private per-group stdout/stderr logs and SHA-256 digests, final report.json and summary.json outside source.
- It executes NINE ordered groups: inherited full P76 original/Chrome regression (which itself includes P71 ten groups and P76 six groups); P77 nine synthetic source controls; P79 four synthetic source controls; P78 original indexed/ZIP refusal controls; P80 original leading indexed/raw refusal controls; full original P78 all-197 source/index/ZIP verifier; P78 actual original Chrome indexed ZIP; full original P80 64,000 indices and 216 raw record verifier; and P80 original Chrome indexed ZIP plus two raw downloads, including an empty stored record.
- scripts/test-p81-checkpoint.py tests missing groups, false P76 source commit or Git tree, forged original/Chrome counts and original-data oracle flags, invented palette/animation/opacity claims, lost empty records, corrupted source JSON, wrong typed values and the explicit approved interim branch policy.
- Existing P61/P66 checkouts historically refused anything not named develop. The source branch allowlist now accepts exactly develop or interim/p79-original-extraction while preserving the clean checkout, complete tree/blob audit and exact original commercial EXE fingerprints. This avoids moving remote develop or misidentifying an interim source revision as develop.
- Source CI [run 42696584693](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42696584693) returned **SUCCESS** for source/test/workflow commit 18b4886356471cd871781af94401e4ceddaa97bf: P81 source-only negative/evidence tests, inherited P76–P80 source tests, production Vite build, TypeScript and offline Chrome boot. GitHub CI contains no commercial game fixtures and DOES NOT verify the full original Windows P81 checkpoint.

## Original-Windows acceptance: nine groups PENDING

Do not mark fifth-pass P81 accepted or release/push proprietary assets before receiving the full P81 output with status PASS, requiredGroupsPassed 9, originalThreeGameBaseline 17211, originalMk3AssetCounts [9186,9205,9402,9619], optInThreeGameAssetRepresentations 17644, sourceAuditUnchanged true, originalDosAndRealChromeP76P78P80Verified true, and exact sourceCommit/sourceTree. The private report must show all nine groups PASS on the same audited source revision. Previously accepted individual P76/P78/P80 runs are historical evidence, not a substitute for this same-source consolidation check.

## Windows PowerShell reproduction and directory safeguards

Local repository root: F:\Dev\MKEXT\SOURCE\mkdosext. External browser test dependencies: F:\Dev\MKEXT\TOOLS. Original commercial game installs and all private validation ZIP/PNG/report output: F:\Dev\MKEXT\FIXTURES. These directories must not overlap. The three fixture paths below assume MK1/MK2/MK3 are directly beneath FIXTURES; adjust to their actual existing folders if necessary.

    cd "F:\Dev\MKEXT\SOURCE\mkdosext"
    git switch interim/p79-original-extraction
    git pull --ff-only origin interim/p79-original-extraction
    git status --short
    git log -1 --oneline
    $env:NODE_PATH = "F:\Dev\MKEXT\TOOLS\playwright-driver\node_modules"
    $mk1 = "F:\Dev\MKEXT\FIXTURES\MK1"
    $mk2 = "F:\Dev\MKEXT\FIXTURES\MK2"
    $mk3 = "F:\Dev\MKEXT\FIXTURES\MK3"
    $validation = "F:\Dev\MKEXT\FIXTURES\VALIDATION"
    New-Item -ItemType Directory -Path $validation -Force | Out-Null
    $work = Join-Path $validation ("P81-" + [guid]::NewGuid().ToString("N"))
    python .\scripts\verify-p81-checkpoint.py --mk1 "$mk1" --mk2 "$mk2" --mk3 "$mk3" --work "$work"

The P81 runner also overrides TEMP, TMP and TMPDIR for every nested original-data and browser child process to a new private-temporary subdirectory inside the P81 $work folder. This keeps ephemeral original-derived archive, image, browser-download and independent verification files within FIXTURES, rather than Windows' default AppData Temp. Do not move or clean this private work directory until the result has been checked.

The last command automatically performs source lint/build/Playwright/Pillow prerequisite verification through P76/P71. Do not create $work beforehand: the runner requires a unique NEW private output directory. On success:

    Get-Content (Join-Path $work "summary.json") -Raw
    git rev-parse HEAD
    git rev-parse 'HEAD^{tree}'

On failure consult the failed group stderr/stdout file in $work and $work\report.json rather than rerunning everything blindly. Outputs stay in FIXTURES. No commercial binary or extracted copyrighted artwork belongs in GitHub.

## Acceptance boundaries and next checkpoint

Source CI PASS is VERIFIED. P81 nine-group original fixture plus Chrome run is VALIDATION PENDING. Preserve the existing 9,186 default MK3 assets, optional 9,205 / 9,402 / 9,619 counts and exact original indexed/raw provenance. The fifth-pass full source checkpoint / possible branch promotion is deferred until P81 original acceptance is proven against one recorded source SHA/tree. No main/develop changes or source release have been performed as part of this candidate.
