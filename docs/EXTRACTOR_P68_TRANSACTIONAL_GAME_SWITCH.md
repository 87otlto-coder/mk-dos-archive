# P68 — Transactional game-source replacement (second interim pass)

**Date:** 2026-11-08. **Branch:** `develop` only. **Last complete original three-game accepted baseline:** P66, source commit `2f911b7961a706022927bd0db187f9cf2cba555c`, 17,211 assets (MK1 2,656 / MK2 5,369 / MK3 9,186). **P67 original-directory browser acceptance:** PASS on fresh browser contexts, as documented in [P67](EXTRACTOR_P67_BROWSER_ACCEPTANCE.md). **P68 same-tab original-fixture browser acceptance:** **PASS**, demonstrated by user-local Chrome/PowerShell screenshot of `scripts/verify-p68-browser-switch.cjs` against the original GOG installations (see acceptance record below).

## Original-installation same-tab Chrome acceptance — PASS (2026-11-08)

**VERIFIED BY USER-LOCAL RUN OUTPUT:** The user pulled the P68 source and ran `node scripts/verify-p68-browser-switch.cjs` with the original DOS MK1, MK2 and MK3 installations, supplying an image of its completed PowerShell JSON and the preceding independent readback messages. The screenshot reports `"pass":"P68_BROWSER"`, `"status":"PASS"`; the original-file download checker printed **"mk1 P68 same-tab download matches original source and selection"**, with corresponding successful messages for MK2 and MK3.

The reported JSON fields are:

| Field | Result |
| --- | --- |
| `oneBrowserTab` | **true** |
| `originalGamesSwitchedInOrder` | **["mk1", "mk2", "mk3", "mk1"]** |
| `nativePickerCancelPreservedQueue` | **true** |
| `nativePermissionDeniedPreservedQueue` | **true** |
| `mixedCandidateRejectedWithoutLosingQueue` | **true** |
| `staleInspectorAudioAndEvidenceResetOnAcceptedSwitch` | **true** |
| `privateDownloadsVerifiedAgainstOriginals` | **3** |
| `gameCensus` | **[2656, 5369, 9186]** |
| `audiblePlaybackVerified` | **false** |

**Evidence classification:** original DOS installation + same-tab Chrome browser **PASS (user-local screenshot)**, with the three private downloaded selection ZIPs independently read back against original-source identities and bytes by the committed Python checker. The screenshot does not print a source Git SHA; the implementation and browser harness are part of the source-only validated P68 source/workflow commit `ca38adb68fd5a5b2490ad7ae8aa092b85aba35a8` (CI [42473501388](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42473501388) **SUCCESS**), with subsequent documentation-only updates. Do not claim that Git SHA was independently printed by the user-local browser test.

**Test boundary:** actual OS-native picker dialog permissions were **not** exercised; the automation intentionally stubs `showDirectoryPicker` to produce cancellation (`AbortError`) and denial (`NotAllowedError`). Real folder-upload input, in-tab game replacement, decoding, previews, selections and downloads ran against the original GOG installations. WAV duration metadata loads, but audible output and quality were **not** verified. The 17,211-asset **P66** original three-game cumulative fixture suite remains the last complete consolidation; P68 verifies browser switching and selected downloads, not a new cumulative fixture checkpoint.

**P68 focused acceptance CLOSED**; earlier passages below calling the browser run “pending” are preserved as chronology and superseded by this section. Next P69 is an interim extractor coverage/usability pass, with P71 scheduled for the next five-pass full original three-game consolidation.

## OBSERVE

P67 proved that Chrome can load each original MK1/MK2/MK3 directory, browse 2,656/5,369/9,186 assets, inspect WAV preview metadata, and download original-source verified ZIPs. It intentionally created a **fresh browser context for each game**. Reviewing the actual committed `src/App.tsx` reveals an operational defect for switching games in one tab:

- The old `Change directory` handler called `reset()` immediately, destroying the current browser, inspector and populated export selection **before** opening the new picker. Cancellation or permission denial therefore lost the current work.
- `handleSelectDirectory` synchronously set `source` to the newly chosen directory **before inventory/detection completed**. A failed, ambiguous or unreadable candidate could replace a usable original game session.
- The active Asset Library used `key=`${source.directoryName}:${detection.game}``. Two distinct selected directories with the same display name would reuse a React component unless reset through other state changes; the key was not a unique accepted-session identity.
- Inventory requests had no revision guard. Async results from a superseded picker could potentially overwrite a newer accepted source.

These are concrete session-integrity risks, not speculation about DOS game data.

## IMPLEMENT

**`src/core/discovery/directorySwitchGateP68.ts`** adds a monotonic transaction revision. A newly selected directory receives a token; cancellation or a later candidate invalidates all previous tokens. Only the current candidate's progress, error and successful inventory may modify the active session.

**`src/App.tsx`** replaces eager reset with reversible **Change game installation** dialog:

- Keeps the previous original directory, detection, Library component, inspector preview, selected export queue, source evidence and source-gallery state active until successful replacement.
- Uses the existing native read-only directory picker, existing file-upload folder fallback, and ZIP picker. Native `AbortError` still signifies benign cancellation; permission errors remain visible. The user can explicitly choose **Cancel change** without losing their existing selection.
- Scans the candidate first. Empty, ambiguous/mixed, unrecognized or **partially unreadable** replacement directories are refused with a visible error. Source identity is switched only after the inventory is ready and the candidate has been recognized as one supported MK1/MK2/MK3 game. The initial onboarding path still preserves its historical handling of unknown directories.
- A successful replacement atomically installs the new source/inventory/detection, resets O194 and gallery-derived state, resets search and navigation to Overview, and increments `activeSessionId`. The keyed `AssetBrowser` remounts, clearing its old queue, inspector, audio URL, canvas and package buttons. A late former library callback is rejected by matching its accepted session ID.
- `src/components/MuseumWorkspace.css` adds an accessible modal layer with cancellation and diagnostics. All established research-workbench and binary-source code remains untouched.

## TEST / VALIDATION

### SOURCE-ONLY VERIFIED

- `scripts/test-p68-directory-switch.cjs` exercises cancellation, overwritten async inventory scan revisions, stale results, new session queue/preview reset and refusal of invalid tokens using synthetic data.
- `scripts/test-p68-switch-readback.py` uses three private synthetic source roots and ZIPs, reuses the independent P67 original-interval reader, accepts the exact ordered MK1/MK2/MK3 path and **rejects five** wrong-game/order/selection/payload cases. This does not inspect any original commercial files.
- **[GitHub Actions run 42473501388](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42473501388) — SUCCESS** at exact P68 source/test/workflow commit `ca38adb68fd5a5b2490ad7ae8aa092b85aba35a8`. CI reran both P68 source-only control suites, syntax-checked the original-browser acceptance runner, and passed all existing refusal controls, the Git-tracked commercial-file guard, TypeScript, production Vite build and headless Chrome startup. **No original DOS game files are present in CI.**

### ORIGINAL-BROWSER VALIDATION PENDING

`scripts/verify-p68-browser-switch.cjs` is a **new browser acceptance runner** and has **not** been executed against original MK1/MK2/MK3 directories in this chat session. It uses **one Chrome page/context**, rather than P67's per-game fresh contexts. After loading and selecting MK1 WAV, it tests:

1. Stubbed native `showDirectoryPicker` `AbortError` and `NotAllowedError`: both must preserve the original MK1 inspector and queue; denial must display its error, while cancellation must be non-fatal.
2. A private synthetic mixed MK1/MK2 primary-executable directory: rejection must leave the original MK1 source, inspector, evidence and selection intact.
3. MK1 → MK2 replacement: old audio preview, WAV queue and MK1 P65 evidence button must disappear; new MK2 asset count **5,369**, empty queue, default search/type. Select original `animb.mid` and derived MIDI in click order, then download.
4. MK2 → MK3 replacement: old MIDI/raw selection disappears; MK3 asset count **9,186**; inspect and download the source-interval-backed `BLADE.FTR / Spec0003 / 0` WAV.
5. MK3 → MK1 replacement in the same tab: old MK3 state disappears, MK1 returns to **2,656** and a fresh queue; inspect and download original `001.WAV`.
6. `scripts/check-p68-switch-download.py` then independently checks the three Chrome ZIP downloads against the **actual installed original DOS sources**, source executable identities, original WAV intervals/source SHA-256, Sound Images raw score byte parity and derived MIDI digest.

The native picker's OS-specific permission dialog itself is **not** automated; intentional native `AbortError` and `NotAllowedError` branches are stubbed. Browser WAV metadata loading is not audible output verification.

### Reproduction (PowerShell)

Requires the updated `develop` checkout, original GOG MK1/MK2/MK3 DOS installation directories, installed Google Chrome, Node/npm, Python and the optional Playwright Core 1.62.1 browser driver outside the source repository.

```powershell
cd "C:\Users\87otl\mk-dos-extractor"
git switch develop
git pull --ff-only origin develop
npm.cmd ci --no-audit --no-fund
npm.cmd run lint
npm.cmd run build

$driverDir = Join-Path $env:TEMP 'mkdos-p68-driver'
npm.cmd install --prefix $driverDir --no-audit --no-fund playwright-core@1.62.1
$env:NODE_PATH = Join-Path $driverDir 'node_modules'

node scripts/verify-p68-browser-switch.cjs `
  "E:\GOG\Games\Mortal Kombat\mk1" `
  "E:\GOG\Games\Mortal Kombat 2\mk2" `
  "E:\GOG\Games\Mortal Kombat 3\mk3"
```

Expected **only if actually observed**: `{"pass":"P68_BROWSER","status":"PASS","oneBrowserTab":true,"originalGamesSwitchedInOrder":["mk1","mk2","mk3","mk1"],"privateDownloadsVerifiedAgainstOriginals":3,...}`. If this fails, preserve the actual error, diagnose the UI/source gate and rerun. Do **not** infer a PASS from P67, synthetic controls or offline Chrome startup.

## EVIDENCE / LIMITS

- **VERIFIED:** original P67 fresh-context end-to-end downloads; P68 source-only transaction and cross-game ZIP refusals; TypeScript/build/CI once the new workflow run completes.
- **VALIDATION PENDING:** executing the new one-tab P68 original-fixture browser runner; real OS-native permission UI; user-observed playback/audio quality; fresh full P66 original three-game cumulative regression at P68 exact source.
- **UNCHANGED:** individual decoded asset counts and asset IDs; audio, sprite, stage, native indexed and music extraction mechanisms; research workbench; original source files; P66 last fully accepted fixture baseline; `main` P16.
- **UNKNOWN / NOT ASSERTED:** native timing, palette ownership, stage relationships, runtime audio event names and sound hardware fidelity.

**Next:** accept or repair the original same-tab P68 browser gate, then begin P69 based on a measurable extractor coverage/usability gap. P71 is the scheduled fifth-pass full three-game consolidation. No commercial game files or extracted copyrighted media are committed.
