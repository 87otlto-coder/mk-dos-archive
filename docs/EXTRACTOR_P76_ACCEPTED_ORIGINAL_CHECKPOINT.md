# P76 accepted — original DOS three-game and Chrome consolidation checkpoint

**Date:** 2026-11-08  
**Cycle:** P72–P76, fifth-pass consolidation  
**Branch tested:** `develop`  
**Acceptance:** **PASS, all 6/6 required P76 groups** from the user's actual Windows PowerShell run with the three original DOS game installations.  
**Evidence level:** user-supplied full machine-readable `verify-p76-checkpoint.py` final stdout; exact source/tree independently reconciled with GitHub. The private per-step report and downloaded originals were **not uploaded here** and remain outside Git.  
**Main branch:** not promoted; `main` remains P16.

## Exact accepted source identity

- **Original-fixture tested Git commit:** `a5192ce0f1dca2ad765571cb6c1dae68ac30411f`.
- **Original-fixture tested Git tree:** `2eac170cc3d7f79e135d71d639ed47ed3552f137`.
- Both IDs were checked against the actual GitHub commit/tree API and match the user's P76 final result exactly.
- Original DOS `DATA.MK3` source fingerprint for the P75–P76 recovered graphics: `72905bc96b752bceb0055296e26b904402909f73a1401541c0dd175135a55517`.
- P76 source CI on the FTR regex fix and new UI guard: [GitHub Actions 42516323584](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42516323584) **SUCCESS** on `7414a24e368d2f636ddacbbc973d1f1e95afa3f4`. The subsequent `a5192ce` change is status documentation only. Earlier production compiled original source-graphics checks remain recorded in [P76 compiled parity handoff](EXTRACTOR_P76_COMPILED_ORIGINAL_PARITY.md).

## Accepted user-supplied P76 result

~~~json
{
  "pass": "P76",
  "status": "PASS",
  "sourceCommit": "a5192ce0f1dca2ad765571cb6c1dae68ac30411f",
  "sourceTree": "2eac170cc3d7f79e135d71d639ed47ed3552f137",
  "requiredGroupsPassed": 6,
  "originalThreeGameBaseline": 17211,
  "newOptInSourceRowImages": 19,
  "optInThreeGameRepresentations": 17230,
  "originalDosFixtureAndChromeP72P76Verified": true,
  "sourceAuditUnchanged": true,
  "nativePaletteOrRendererPlacementAsserted": false,
  "mainPromoted": false
}
~~~

The locally created private report was emitted to a fresh `mkdos-p76-<unique-id>/report.json` temporary work directory on the user's Windows machine. It contains checkpoint logs, evidence hashes and independently checked private export details. **Do not commit this private report or source-derived media to GitHub.** The acceptance statement above is from the full user-provided final process stdout, not a claim that this assistant re-opened each private log.

## Six required groups — original DOS acceptance

| Required group | Result | Coverage asserted by fail-closed checkpoint |
|---|---|---|
| `p71_accepted_three_game_baseline` | **PASS** | Reproduced P71 ten-group original MK1/MK2/MK3 source and real Chrome baseline, including original-source regression, independent exports and actual downloads. |
| `p72_original_mk3_source_comparison` | **PASS** | Original MK3 fighter indexed-plane plus original IFF CMAP reference; experimental comparison only; independently checked source bytes and PNG. |
| `p72_original_chrome_comparison` | **PASS** | Real Chrome selection of source IFF CMAP, preview and independently verified original indexed/mask/palette/PNG download. |
| `p76_source_refusal_controls` | **PASS** | P76 malformed source/row-pointer/sentinel and misleading provenance refusals; source-only controls. |
| `p76_original_mk3_indexed_assets` | **PASS** | Original DOS DATA.MK3 full baseline scan plus 19 source-row-mapped images, independent P75 original index/mask/stream/row-table byte parity and indexed ZIP sidecars. |
| `p76_original_chrome_indexed_download` | **PASS** | Real Chrome original MK3 Asset Library **9,186 → 9,205** opt-in image display and downloaded indexed evidence ZIP with independent original grayscale/alpha PNG and row source checks. |

The **17,211** baseline remains unchanged: MK1 **2,656**, MK2 **5,369**, MK3 **9,186**. The new **19** MK3 images appear after explicit action; MK3 then has **9,205 visible assets**, yielding **17,230** optional combined representations. Neither existing source assets nor unresolved source ranges are deleted or overwritten.

## Why the P72 Chrome gate initially failed — resolved before acceptance

On an earlier source revision, the P72 Chrome runner timed out looking for the fighter comparison panel after selecting `BLADE.FTR`. Investigation found an incorrectly escaped `.FTR` predicate in `src/components/AssetBrowser.tsx`, rather than any source/palette decoding failure. The source fix [22bf1d6](https://github.com/87otlto-coder/mk-dos-archive/commit/22bf1d6212ed9860fa31590b9cf86e552e605add) and `scripts/test-p72-browser-panel-guard.cjs` were committed and passed source CI.

The user then separately ran `verify-p72-browser-cmap.cjs` on original MK3 and reported `P72_BROWSER: PASS` with 125 source IFF CMAP choices, `BLADE.FTR` / `DATA.MK3`, and **5,151** original indexed fighter pixels checked. The **subsequent complete P76 rerun** repeated all six acceptance groups on the exact accepted source identity; those historical pre-fix groups were not carried forward without retesting.

## Evidence classification

**VERIFIED / accepted on original DOS user run:** the original three-game regression, actual original browser interactions/independent exports, 19 separately accessible source-indexed graphics and masks, exact source-data extraction, preservation of 20 raw non-IFF source intervals, P72 user-selected CMAP comparisons, and strict opt-in count behavior. The committed source/test tree and CI provenance were independently verified against GitHub.

**INFERRED (clearly marked in the app):** P75 source row-X offsets and the `-1` source-row sentinel represent positioning/transparent omitted rows in the reconstructed first image canvas. Repeated original row tables and independent byte-level parity support this interpretation; original DOS EXE renderer semantics have not been separately proved.

**UNKNOWN:** original fighter/native palette ownership, original stage compositing/layer/camera placement, gameplay animation frame sequence/timing, and the interpretation of **1,611,110** original source bytes remaining after the first image row tables. Experimental adjacent 768-byte RGB8 candidates are preserved as evidence, **not** automatically used to assign verified native colors.

## Consolidation / next decision

The P72–P76 five-pass cycle is now **accepted** on its original-fixture and real Chrome gates. **This is a source/research consolidation checkpoint, not an application release or main-branch promotion.** Keep the established research workbench, standalone source/independent oracles, the 19-image opt-in app integration, and all original raw fallback intact.

Carry the next development cycle forward from the accepted **code commit `a5192ce`** and this documentation-only checkpoint. Prioritize additional usable, independently verified extraction coverage (especially missing stage/background and audio/speech/music assets) over reverse engineering unrelated game logic or adding UI polish. Never infer stage associations, palettes or animation order from visually plausible screenshots. Keep original game binaries and extracted copyrighted assets out of Git.

**Reproduction:** from the original Windows `develop` source checkout with required Chrome/Playwright/Pillow installations and actual three original DOS game folders, run `python scripts/verify-p76-checkpoint.py --mk1 "<original MK1 folder>" --mk2 "<original MK2 folder>" --mk3 "<original MK3 folder>" --work "<new private output folder>"`. Require `status:"PASS"`, `requiredGroupsPassed:6`, and opening/closing source identity equality.
