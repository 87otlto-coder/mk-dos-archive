# P56 accepted development checkpoint — three-game original-fixture regression

Date: 2026-11-07. Branch: `develop`. **P56 accepted as a development checkpoint** after user-local full original-fixture execution and independent GitHub source-only CI. Keep `main` at P16 until a separately justified promotion; do not commit commercial DOS files or extracted artwork.

## Immutable source identity

- Tested P56 source/workflow candidate: `efa68318d42ca67051ae37595142dae994002966`.
- User pulled the follow-up documentation-only `develop` tip `457d6dc08fca6a50b74642f9b9211c1b327770dd` before executing P56. This tip did **not** modify the validated source/workflow compared with `efa68318`.
- GitHub source-only CI [run 42400950450](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42400950450): **SUCCESS** at `efa68318`, including P54/P55 source-only negatives, P56 ten preflight/input-output refusals plus synthetic fake-fixture failure, production build, TypeScript and headless Chrome startup.
- At source candidate, a non-truncated GitHub tree inventory reported **2,286 blobs / 388 source files**, no committed original-game/media ZIP/GRA/EXE/WAV files, and no unusual blob modes. This is server-side tree evidence, not a local checkout byte-audit.

## User-local P56 final acceptance: PASS

The user provided PowerShell terminal screenshots of running `node scripts/verify-p56-checkpoint.cjs` on the pulled current `develop` checkout against their three local original GOG DOS game directories, with private report/work files under `C:\Temp`.

Observed ordered execution:
1. `P52 187 original Kano indexed ZIPs and altered EXE guard`
2. `P54 24 source-header module/preview joins`
3. `P55 original header card to exact asset-ID navigation`
4. `P55 eleven false-claim controls and search parity`
5. `P54 six false source-join controls`
6. `P51 frozen full three-game cumulative acceptance`

Final terminal JSON explicitly reports:

```json
{
  "status": "PASS",
  "stepsPassed": 6,
  "census": { "mk1": 2656, "mk2": 5369, "mk3": 9186 }
}
```

The runner's source contract only emits PASS after the full P51 original-file gate passes: 27 core game gates, 12 original-MK2 independent image families (251 representations / 10,712,883 checks), 54 altered exports rejected, original indexed MK1/MK2/MK3 coverage, 416 original MK3 CMAP/IFF images, MK2 APNG consistency, and the newer P52/P54/P55 original MK1 gates. These detailed figures are **enforced by the reviewed runner and historical P51 baseline**; the user screenshot directly displays six PASS steps and the three asset counts, not each nested subreport. To conduct an independent audit of every nested result, inspect the private full `mkdos-p56-results.json` report and P51 private subreport (not yet uploaded).

Confidence: **VERIFIED USER-LOCAL ORIGINAL-FIXTURE ACCEPTANCE**, not a reproduction in the chat/container. User screenshot evidence is attached to the conversation, not to GitHub. Preserve provenance of the claim.

## Product-facing browser evidence

Prior user screenshots demonstrate P55 exact module preview navigation in MK1 Stage Gallery (two witnessed flows including `STATUE_MOD` and `STRIPPED_MOD`), one exact asset result, preserved selection/export controls, and exported 320 × 200 normalized preview PNGs. This validates the tested paths only, not all 24 browser clicks. Stage gallery still uses decorative resource cards. The normalized background images are **not** evidence of exact game-runtime frame, palette or stage identity.

## Conclusions and next pass

- P56 five-pass consolidation acceptance is **complete** for the recorded local original-fixture gate and source-only CI; production/browser cross-game interaction is not comprehensively verified.
- MK1 **2,656**, MK2 **5,369**, MK3 **9,186**, total **17,211** source-backed asset representations. No new assets introduced by P52–P56 UI/navigation work.
- **UNKNOWN / not asserted:** complete original stage compositions, unqualified runtime palette ownership, gameplay camera/alpha or native animation timing.
- **P57 candidate:** promote verified MK1 normalized preview images from hidden asset library into source-backed Stage Gallery thumbnails, while preserving header/module identifier provenance and refusing incomplete links. Defer unrelated cosmetic redesign. MK2 palette display can be investigated in a later targeted extractor pass only with original binary/fixture controls.
- `main` remains stable P16. No automatic main merge is authorized or warranted by this gate alone.
