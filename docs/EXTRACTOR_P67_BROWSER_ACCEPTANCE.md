# P67 original-directory browser acceptance

First interim pass of P67–P71, 8 November 2026. P66 exercised the extractor and its archives directly. Its hosted Chrome check stopped at offline onboarding. P67 adds a repeatable private acceptance test for the path from directory input to the bytes Chrome downloads. The application source is identical to accepted P66 source commit `2f911b7961a706022927bd0db187f9cf2cba555c`, tree `04b2ee39313b655232e719f32ec63a525ebd14a1`. The parent checkout was the P66 publication commit `8623c3154cd1830a85a86f1b237c55725532b7bd`.

## Observed locally on the original GOG installations

Chrome 157.0.8103.38, driven by Playwright Core 1.62.1, loaded the production build in a fresh browser context per game. The test populated the real directory-upload input, opened Asset library, clicked Decode & browse, filtered by asset type, inspected a card and clicked export. Python reopened Chrome's completed temporary download files using its independent ZIP reader. All three executable hashes matched the [P66 identities](EXTRACTOR_P66_ACCEPTED_CHECKPOINT.md).

| Library census | Browser selection and downloaded evidence |
| --- | --- |
| MK1 · 2,656 | Audio card 001.WAV. Chrome loaded positive finite WAV duration. The selection manifest and payload matched the stable asset ID, original path, whole-file extent, digest and bytes. Two additional evidence downloads supplied the P65 indexed stream package and its O60 reference. All four P65 member names and CRCs passed, both indexed members matched O60 byte for byte and matched the declared digests, and all 739 exported cell values across eight tables matched MK1.EXE at the declared offsets. |
| MK2 · 5,369 | Searched animb.mid, selected the original score under raw, then Control-clicked the derived MIDI under sequence. The two inspector names, stable IDs, queue order and ZIP rows agreed. Original bytes and source digests matched SOUND/animb.mid. The MIDI header and exported digest matched, and declared terminal opcodes were read back from the original score. |
| MK3 · 9,186 | Audio card BLADE.FTR / Spec0003 / 0. Chrome loaded positive finite WAV duration. Its downloaded RIFF/WAVE bytes matched the declared interval in the original BLADE.FTR. Parent and interval hashes and physical ID matched. |

The run completed five browser downloads, including one selection ZIP per game. Each selection had exactly its manifest and selected payloads. Empty selection disabled export, a no-match search disabled batch addition, and clearing each queue disabled export again. No uncaught page errors were observed. The census is a UI count. P66 remains the full asset regression.

## Reproduce

Use Node, npm, installed Google Chrome and Python 3.9+ with assertions enabled. From the checkout root in PowerShell, install the optional browser driver outside the checkout or point NODE_PATH at an existing installation. The three arguments must be the game folders containing the executables.

```powershell
npm ci --no-audit --no-fund
npm run lint
npm run build
$driverDir = Join-Path $env:TEMP 'mkdos-p67-driver'
npm install --prefix $driverDir --no-audit --no-fund playwright-core@1.62.1
$env:NODE_PATH = Join-Path $driverDir 'node_modules'
python scripts/test-p67-download.py
node scripts/verify-p67-browser.cjs 'E:/GOG/Games/Mortal Kombat/mk1' 'E:/GOG/Games/Mortal Kombat 2/mk2' 'E:/GOG/Games/Mortal Kombat 3/mk3'
```

The driver starts a loopback Vite preview server. Playwright owns the temporary downloads and removes them when the context closes. The hosted workflow runs the source-only archive controls, driver syntax check, and existing build checks. One synthetic positive and five refusals cover wrong payload, parent digest, offset, selected name and extra member.

## Coverage limits and P68

Browser coverage uses the directory-upload input. Native picker permissions, cancellation, and switching games within one live session remain untested. WAV metadata loading was observed. Audible playback, visual fidelity, all-category inspection, independent reconstruction of MIDI events in this browser run, gameplay timing and palette interpretation remain outside this sample. P66 records the broader original-source checks.

P68 priority is switching original installations in the same tab with a populated selection. Exercise cancellation and replacement, then verify the active game, preview, queue, evidence buttons and next downloaded archive all refer to the intended installation.
