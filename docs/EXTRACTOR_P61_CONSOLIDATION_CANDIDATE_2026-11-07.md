# P61 — Fifth-pass consolidation candidate, original three-game gate pending

Date: 2026-11-07. Branch: `develop`. Last **original-fixture accepted full three-game** checkpoint: P56. P57, P58 and P60 subsequently passed focused user-local original game acceptance, while P59 passed independent original MK2 fixture plus browser ZIP validation. Do not equate these separate focused successes with a *fresh* P61 cumulative three-game PASS. `main` remains P16; no promotion.

## Scope / design

P61 is the fifth development pass after P56. It adds **no new game decoding, asset count, native palette, scene-assembly or UI features**. It integrates the existing original-source regression gates, captures a precise reproducible source identity, and checks source hygiene.

- `scripts/verify-p61-checkpoint.cjs` is the single fail-closed, **original-MK1/MK2/MK3** gate. It requires all three original DOS installation folders, a clean tracked `develop` checkout, and private report/work folders outside both Git and original installations. It snapshots Git HEAD, tree SHA, tracked file count and untracked count; rejects tracked commercial binary/media formats and unsafe input/output paths. No commit, tag, merge or original game file mutation is performed.
- Runs the **full P56** original checkpoint, which itself runs P52, P54, P55 source-quality controls and frozen **P51** three-game cumulative fixture suites: 27 core game gates, 12 independent original-MK2 image/export families (251 image representations / 10,712,883 independent checks), 54 falsified exports rejected, original indexed MK1 and MK2, original MK3 416 IFF images and embedded CMAPs, and source-ordered MK2 APNG checks. Requires **MK1 2,656, MK2 5,369, MK3 9,186**, **17,211 total**.
- Runs a **fresh P57** original three-game source-thumbnail parity check: 24 MK1 previews across 15 headers, 10 MK2 source images, 416 unassigned MK3 IFF images, original source identity and explicitly no invented stage assignments.
- Runs **P58** original MK2 evidence: five Forest original-index/candidate-colour paired canvases, two Tomb/Portal screenshot-conditioned floor strips and four original source hashes, with live DAC/native scene claims withheld.
- Adds `scripts/verify-mk2-p61-tomb-independent.cjs`: produces an authenticated P59 ZIP privately from the current original MK2 scan and invokes the **independent Python O121/O122/O123 source decoder** (`scripts/verify-mk2-p59-tomb.py`) on that ZIP to check the 2,650 architecture + 823 sky source samples. The captured gameplay screenshot itself is not a fixture to this script, so it **does not claim a new screenshot RGB comparison**.
- Runs **P60** original MK2 export parity: three independently packaged Tomb components, exact old P59 PNG/index/mask bytes, exact P15 floor indexed/paint/palette-known planes, 15,360 floor pixels reconstructed independently from original TOMB.GRA, 5,369 unchanged MK2 asset representations and explicit denial of shared runtime camera, full stage scene and native DAC.
- Re-runs P57/P58/P59/P60 synthetic false-input controls, including P58's 15 palette/witness refusals and P60's 15 component refusals. The P59 source-only control returns textual PASS and is checked explicitly.
- The runner only emits final `status:PASS` after **all nine** primary step groups pass. `RUNNING`/`FAIL` intermediate JSON is preserved atomically at the user-specified private path; failed steps cannot become checkpoint acceptance. Child original-file ZIPs, reports and temporary art are under the private work directory, never source control.

## Source-only CI and audit — VERIFIED

Source/workflow candidate commit: `0bb7c21c35393cfda7927f99f8b8cbceb44b8060`.

[GitHub Actions CI 42415630493](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42415630493) **SUCCESS**. It syntax-checks the new independent P59 and P61 runners, runs `scripts/test-p61-checkpoint-controls.cjs` with **13** unsafe preflight refusals, reruns existing P54–P60 synthetic source controls, validates tracked source guard, TypeScript, Vite production build and headless Chrome offline startup. This source-only CI **does not execute original game fixtures**, does not prove the P61 cumulative source gate, and does not validate stage colour fidelity.

GitHub tree audit (source candidate) is **nontruncated, 2,309 tracked blobs, 394 `src/` files**. Checked tracked extensions show **zero** `.exe/.gra/.ftr/.u8/.mid/.wav/.ogg/.mp3/.flac/.png/.gif/.bmp/.jpg/.jpeg/.webp/.zip/.bin/.7z/.rar` files; all source-only CI guards passed. This is **tracked-file extension/source inventory evidence**, not a byte-level inspection of every text file. Compared against P56 accepted `483b807`, P57–P61 changes are scoped to Stage Gallery/source-qualification helpers, independent Tomb component export/tests and documentation, not a forensic workbench restructure or native game data.

## Original-fixture gate — VALIDATION PENDING

The private MK1/MK2/MK3 archives are attached in the conversation, but the current chat container has no network route to `github.com` for a complete Git checkout. The authoritative source was updated via the connected GitHub integration and validated source-only by GitHub Actions; the **complete P61 original-fixture runner has NOT been executed here**.

The exact local test is:

```powershell
cd "C:\Users\87otl\mk-dos-extractor"
git switch develop
git pull --ff-only origin develop
node scripts/verify-p61-checkpoint.cjs `
  --mk1 "E:\GOG\Games\Mortal Kombat\mk1" `
  --mk2 "E:\GOG\Games\Mortal Kombat 2\mk2" `
  --mk3 "E:\GOG\Games\Mortal Kombat 3\mk3" `
  --report "C:\Temp\mkdos-p61-results.json" `
  --work "C:\Temp\mkdos-p61-private"
```

Expected: `pass:P61`, `status:PASS`, `stepsPassed:9`, `census:{mk1:2656,mk2:5369,mk3:9186}`, P57 thumbnail census 24/10/416, P58 5 original Forest pairs, P59 independent 2,650+823, P60 three original Tomb components. Require exact `sourceCommit` and `sourceTree` in the final private report to associate acceptance with code actually tested. If any step fails, preserve report/work outputs, correct only the verified cause and rerun before declaring a full checkpoint.

The runner requires `develop` and a **clean tracked checkout**; no original DOS binaries or artwork should ever be copied into that checkout. Python with Pillow is needed by the inherited P51 and original P59 independent verifiers.

## Remaining unknowns and release boundary

**UNKNOWN:** native VGA DAC palette ownership for unresolved stage resources, complete gameplay scene compositing and authentic runtime camera, original layer order and timing. P59/O123 screenshot-registered architecture/sky are **not** co-registered with the P15/O117 floor capture. MK3 original IFF pictures are unassigned source images, **not** verified original stages.

**CHECKPOINT DECISION PENDING:** Do not claim P61 accepted, cut a full-source release, promote `main`, rewrite historical evidence or begin P62 until the current-source full three-game PASS is demonstrated. Preserve P56 and P57–P60 evidence; all incremental changes are recoverably committed to `develop`.
