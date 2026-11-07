# P56 consolidation candidate — source-verified; original-fixture gate outstanding

Date: 2026-11-07. Branch: `develop` only. Source candidate: `efa68318d42ca67051ae37595142dae994002966`. Do not promote to `main` (P16 baseline).

## Scope

Fifth pass after P51, consolidating P52–P55 without modifying existing extractors, sources, palettes, gameplay interpretations, research workbench, UI assets or asset counts. This is a **candidate**, not a completed full original-game source checkpoint, until the comprehensive three-game acceptance is executed on the complete candidate checkout.

- **P52:** 187 source-anchored Kano read-only fallback index/mask planes preserved for direct indexed ZIP export; no native palette assignment.
- **P53:** MK1 HDRS.GRA inventory-candidate cards no longer navigate to non-existent decoded records.
- **P54:** exact O27 source-header/module graph identifiers joined to O54 normalized background preview IDs; metadata-only package.
- **P55:** source-qualified, fail-closed links from the MK1 Stage Gallery to exact normalized preview asset IDs, including multiple modules under one HDRS resource. No canonical gameplay scene claim.

## Collected fixture and browser evidence (different confidence levels)

**User-local P52 original-fixture execution: PASS**. 187 Kano frame ZIP exports, 928,368 index pixels, 340,324 opaque pixels, four corrupted-export refusals, modified executable routing and invalid descriptor refusal. The user supplied original terminal output.

**User-local P54 original-fixture execution: PASS**. 2,656 MK1 assets, 24 O27/O54 module-to-preview exact joins, 15 original HDRS resources, invalid preview refused and report SHA-256 `bb180450381a7f43ecca1f3bc6282bb1c6b0bc1d48cc77e8f9ad5e27092269db`. This is the user's reported native-run output.

**User-local P55 browser observations: PARTIALLY VERIFIED**. Screenshots show MK1 source-header cards offering module-specific links, an exact-ID Asset Library search yielding `1–1 of 1`, normalized STATUE_MOD and STRIPPED_MOD 320×200 images, and selection/queue export controls. The user also supplied PNGs matching these two previews. This supports two browser navigations and preview/extraction usability; it does NOT establish all 24 clickable targets, complete stage-gameplay identity, native palette attribution, or fully automated browser download verification.

**Private original ZIP availability in chat: VERIFIED**. Original `mk1.zip` (326 files, EXE SHA-256 `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`), `mk2.zip` (614 files, EXE `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`) and `mk3.zip` (87 files, EXE `8aa7f3d45a086e7373afc120dc88378bda3d7766d5b69badbc707bb4570bdef0`) were independently hashed/inspected locally. These files are **not** source checkout tests.

## Source-only consolidation controls — VERIFIED

Added `scripts/verify-p56-checkpoint.cjs`, a private-output original-fixture runner that executes:
1. current P52 original MK1 fallback/ZIP regression;
2. current P54 original 24-module join and report-hash regression;
3. current P55 15-header/24-exact-ID preview regression;
4. P54/P55 source-only false-report controls;
5. the frozen P51 *full* MK1/MK2/MK3 original-source runner: 27 core game gates, twelve independent MK2 image families/251 representations/10,712,883 comparisons, 54 false-export refusals and cross-game indexed/palette/APNG parity.

The runner refuses missing/duplicate options, unsafe outputs inside the repository or original game folders, overlapping game input roots and other unsafe destinations. It writes atomic private `RUNNING`/`PASS`/`FAIL` JSON, preserving the last passed step. Added `scripts/test-p56-checkpoint-controls.cjs`: ten preflight refusal cases plus a synthetic no-game failure that must not fabricate success. CI runs these controls and syntax-checks both runners.

**GitHub CI [42400950450](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42400950450) SUCCESS** on exact source candidate `efa68318d42ca67051ae37595142dae994002966`, including P54/P55 controls, P56 refusal controls, TypeScript checks, production Vite build and source-only Chrome startup.

**Remote GitHub tree inventory:** complete, not truncated; **2,286 tracked blob entries / 388 `src/` files**, no nonstandard blob modes and no tracked paths with .EXE/.GRA/.FTR/.ASG/.MK3/.WAV/.OGG/.ZIP extensions. Compared with P51 source candidate, 25 changed paths, 10 in `src/`, no commercial asset additions. This is server-side tree inspection, **not** a local byte-for-byte checkout SHA audit.

## Gate still outstanding — DO NOT claim P56 full PASS

The P56 runner has **not** run on a complete current GitHub checkout with original MK1/MK2/MK3 fixtures in this chat runtime because outbound Git access/DNS for `github.com` is unavailable in its container. There is no complete local checkout to execute it against. The P51 prior full PASS remains historical, not a fresh P56 acceptance.

On the user's local checkout, with original game directories outside Git:

```powershell
git pull --ff-only origin develop
node scripts/verify-p56-checkpoint.cjs --mk1 "E:\GOG\Games\Mortal Kombat\mk1" --mk2 "<original MK2 directory>" --mk3 "<original MK3 directory>" --report "C:\Temp\mk1-mk2-mk3-p56.json" --work "C:\Temp\mkdos-p56-private"
```

Require a final report with `status: PASS`, `completeCurrentGameGates: 27`, `census: {mk1:2656,mk2:5369,mk3:9186}`, P52 187 ZIPs, P54 24 joins, P55 24 exact links / 15 headers and no omitted original-game suites before accepting P56. If any test fails, preserve the private failure report and fix only the demonstrated regression before further checkpointing.

**Still UNKNOWN:** native palette selection for unqualified stage assets, authentic full gameplay stage identity/composition and animation timing. Decorative HDRS gallery panels are an acknowledged presentation limitation, but defer thumbnail redesign until P56 is accepted. P57 should be considered only after the checkpoint is accepted; no automatic `main` promotion.
