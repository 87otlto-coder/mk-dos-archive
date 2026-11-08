# P70 — MK3 GOG original CUE-linked Ogg audio extraction

Date: 2026-11-08. Fourth interim pass of P67–P71. `develop` only; `main` stays at the P16 source checkpoint. P66 remains the last accepted **complete original MK1/MK2/MK3 17,211-asset regression**. P67–P69 have separately accepted focused original-browser/fixture evidence.

**P70 source-only CI: PASS. Independent original-source input verification: PASS. Actual original MK3 Chrome ZIP download: PASS (user-local screenshot). Separate full-collection original P70 fixture runner: VALIDATION PENDING.**

## ORIGINAL MK3 CHROME DOWNLOAD — ACCEPTED (user-local evidence, 2026-11-08)

**VERIFIED FROM USER-LOCAL ORIGINAL-GOG BROWSER EXECUTION:** The user ran `node scripts/verify-p70-browser-cue.cjs` against `E:\\GOG\\Games\\Mortal Kombat 3\\mk3` after a successful Vite production build and supplied a complete PowerShell screenshot reporting `"pass":"P70_BROWSER"` and `"status":"PASS"`. The committed browser verifier opens the application in Chrome, uploads the actual MK3 directory, selects `Track02.ogg`, clicks the CUE-linked 46-track download control, and runs the independent original-file ZIP reader on the downloaded archive. The screenshot proves the test completed; its stdout does **not** identify an exact Git source SHA or original-fixture runner execution.

| Observed browser verifier field | Reported value |
| --- | --- |
| `game` | `mk3` |
| `mk3Assets` | **9,186**, unchanged |
| `oneClickOriginalCueMusicDownload` | **true** |
| `independentOriginalOggTracks` | **46** |
| `originalCueBytesPreserved` | **true** |
| `originalOggSourceBytesVerified` | **43,367,491** |
| `cueMp3VsActualOggMismatchPreserved` | **true** |
| `completeOriginalDiscImageClaimed` | **false** |
| `nativeRuntimeMusicAssociationsClaimed` | **false** |
| `audiblePlaybackVerified` | **false** |

The production Vite build passed; its warning about JavaScript chunks larger than 500 kB is nonfatal and unrelated to source audio parity. GitHub source-only CI [42478986383](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42478986383) separately passed at source/workflow SHA `80d64f336b2ffb6bcb3b8d68e997cd5f596ccc43`. No commercial CUE, OGG, game executable, original disc image or exported ZIP was committed.

**Precise limit:** the browser ZIP download and independent original-file track readback are **accepted**. The separately supplied full-collection fixture command `scripts/verify-mk3-p70-cue.cjs` has **not been shown as executed** and remains **VALIDATION PENDING**. Thus the browser result should not be counted as a separate P70 integrated fixture-run PASS. Native playback, stage assignments, timing, looping and complete disc-image fidelity remain UNKNOWN or expressly unclaimed. **P71 full three-game consolidation must not be declared complete on the strength of this focused P70 browser pass.**

Development-stage text below saying the browser acceptance is pending is retained as historical implementation context and is superseded by this acceptance section.

## OBSERVE — original music exists, but GOG CUE link is unused in extraction

The installed canonical GOG DOS MK3 `IMAGE/` directory contains `MK3.cue` and **46 original `Track02.ogg` to `Track47.ogg` source streams** (43,367,491 source audio bytes). `scanMK3` already exports those OGG assets in the Library, retains the raw CUE as a separate asset, and preserves their original files individually. Their source CUE association was not exposed as a single source-faithful export.

The independently inspected original CUE has **47 file/track/index triples**: `FILE "MK3.GOG" BINARY` / `TRACK 01 MODE1/2048` / `INDEX 0 00:00:00`, followed by 46 `FILE "TrackNN.ogg" MP3` / `TRACK NN AUDIO` / `INDEX 0 00:00:00` triples, NN=02–47. Importantly, its `MP3` declarations contradict the referenced original files' **`OggS`** signatures. Both facts are source evidence and must be retained without silently renaming or converting the files, or claiming DOS runtime MIDI, native audio hardware, stage music or loop timing.

**Independently verified private user upload:** `mk3.zip` canonical `MK3.EXE` SHA-256 `8aa7f3d45a086e7373afc120dc88378bda3d7766d5b69badbc707bb4570bdef0`; original `MK3.cue` **3,014 bytes**, SHA-256 `3a3f7b3da04d241575111a8023f61a69186d9e5ff7037f77d00f5520ba495409`; **46** literal CUE audio references correspond to **46** complete `OggS` source files, exactly **43,367,491** original OGG bytes; original `MK3.GOG` separate binary data track exists (45,056 bytes) but is **not** an audio track. This is original input verification, not an execution of the new extractor.

## IMPLEMENT — on-demand original audio-only CUE-linked ZIP

- `src/core/assets/mk3CueAudioBundleP70.ts`: accepts only one verified original `MK3.cue` Asset, validates its full original byte extent and SHA-256, strictly parses the **47 original triple statements** and requires the 46 exact referenced OGG source names, matching original file SHA-256/byte lengths/signatures and no duplicate or cross-source references. It retains **the exact source CUE bytes** and **all 46 original OGG bytes**, with no transcode/re-encode.
- The on-demand `MK3_P70_GOG_CUE_AUDIO_TRACKS_02-47.zip` contains: `MK3.cue` (original CUE bytes), `Track02.ogg` … `Track47.ogg` (exact original bytes), `manifest.json` (original byte extents/hashes and literal source CUE track statements), and `README.txt`. It is **not** a complete CD image: original data track `MK3.GOG` is intentionally excluded, explicitly declared in the manifest and documented. Original INDEX 0 statements are literal metadata, **not verified playback timing**.
- The manifest explicitly records original declared `MP3` **versus** actual `OggS`; no gameplay music names, runtime loop periods, stage associations, exact game CD-drive behavior, MIDI device output or music scheduler is invented.
- `src/components/AssetBrowser.tsx` adds **Export original CUE-linked MK3 audio tracks 02–47** to the MK3 OGG music inspector. It creates the ZIP *on demand*; pending work and errors are surfaced and stale exports are refused after switching game sessions.
- No game decoding mechanism, asset count/ID, existing OGG payload, existing raw CUE asset, workbench or stage/effects system is changed; expected MK3 census **9,186**.

## SOURCE-ONLY CI — VERIFIED

[GitHub Actions source-only CI 42478986383](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42478986383) **PASS, final confirmed** at P70 code/test/workflow commit `80d64f336b2ffb6bcb3b8d68e997cd5f596ccc43`. The prior first P70 source test CI run failed on **a negative-control fixture with the wrong spoofed payload byte length**, which caused a valid source-length refusal before the test's intended Ogg signature refusal. The test fixture was corrected (same original byte length, falsified signature) in `e53bdd45506add3763c65161bfec0745ae548580`; later successful CI includes **15** synthetic negative controls, source guard, TypeScript, Vite production build and offline Chrome boot. Both original fixture and browser runners are syntax checked, **not executed against commercial game binaries in GitHub CI**.

## ORIGINAL FIXTURE — VALIDATION PENDING

`scripts/verify-mk3-p70-cue.cjs` scans the entire original MK3 directory (expected **9,186 unchanged catalogue assets**), builds the 49-member original CUE/46-OGG/manifest/README ZIP, and then invokes the **independently implemented Python original-data and ZIP reader** `scripts/verify-mk3-p70-cue-independent.py`. The independent reader checks canonical EXE, literal original CUE statements, original binary track 01 existence/exclusion, all OGG signatures/bytes/hashes/track order, ZIP CRC and native runtime-claim limitations. Output stays outside Git:

```powershell
cd "C:\Users\87otl\mk-dos-extractor"
git switch develop
git pull --ff-only origin develop
npm.cmd ci --no-audit --no-fund

node scripts/verify-mk3-p70-cue.cjs `
  "E:\GOG\Games\Mortal Kombat 3\mk3" `
  "C:\Temp\mkdos-p70-cue-results"
```

Expected **only after running**: `pass:"P70"`, `status:"PASS"`, `mk3Assets:9186`, `originalOggTracks:46`, `originalOggByteTotal:43367491`, `allOriginalSourceBytesAndHashesMatched:true`, and no runtime/stage/complete-CD claims. The private folder receives the ~43MB ZIP and the independent detailed report. Any mismatch is a real failure to diagnose, not grounds for weakening evidence checks.

## ORIGINAL BROWSER EXPORT — VALIDATION PENDING

`scripts/verify-p70-browser-cue.cjs` opens the built extractor in Chrome, loads the real MK3 directory, selects `Track02.ogg`, clicks the new CUE-linked export button, and sends the **actual downloaded ZIP** to the independent original CUE/OGG reader. It does **not** play or record audio:

```powershell
npm.cmd run build
$driverDir = Join-Path $env:TEMP 'mkdos-p68-driver'
$env:NODE_PATH = Join-Path $driverDir 'node_modules'
node scripts/verify-p70-browser-cue.cjs `
  "E:\GOG\Games\Mortal Kombat 3\mk3"
```

Requires installed Chrome and `playwright-core` (the P68 driver). Expected `pass:"P70_BROWSER"`, `status:"PASS"`, 46 original track readbacks and the original byte count. OS-native CD audio/track selection, source-independent audible playback, hardware devices, game cue-event meanings and timing are not verified.

## CLASSIFY / P71 HANDOFF

**VERIFIED:** original `MK3.cue` byte identity and 46 literal source file statements, 43,367,491 original `OggS` bytes (private original upload); source-only synthetic CUE/OGG byte-parity and all 15 false-source refusals; TypeScript, production build and offline Chrome boot **PASS** on exact source-only GitHub CI.

**VALIDATION PENDING:** full current-source original MK3 pipeline + generated audio ZIP/independent readback; real MK3 Chrome downloaded archive; next current-source complete MK1/MK2/MK3 regression.

**UNKNOWN / explicitly unclaimed:** original DOS runtime CD audio relationships, cue → stage music names, native loop and timing, game-CD image completeness and actual playback quality.

**Next P71 fifth-pass consolidation:** rerun accepted P66 cumulative original MK1/MK2/MK3 fixtures plus P67/P68 browser-source integrity and accepted P69 original-indexed bundles and P70 MK3 CUE/OGG source fixtures. Preserve checkpoints, require exact tested commit/tree, zero copyrighted game files/media in Git and do not promote `main` without explicit authorization.
