# P11 build and browser quality gate — 2026-11-04

## GitHub P11 source branch

- Repository: https://github.com/87otlto-coder/mk-dos-archive
- `main` intentionally retains the P6 source baseline.
- `develop` contains consolidated P11 extraction source, original O198 research typing correction, focused Asset Library usability improvements, and a validated dependency lockfile.
- P11 **has not been promoted to main**; real-game browser QA remains unresolved.

## Verified CI gates

**GitHub Actions successful strict dependency-lock build:** https://github.com/87otlto-coder/mk-dos-archive/actions/runs/41920807431

The runner checked out `develop` at commit `ecae46ad8c70fb4945b5e2e9bbe65a869f6f9877` and passed:

1. npm 11 `npm ci` using the **committed** `package-lock.json` (not generated in this build).
2. `npm run test:syntax`.
3. `npm run build` (Vite production static build).
4. `npm run lint` (full `tsc --noEmit`).
5. Headless Chrome startup/mount smoke: MK DOS Archive branding and source-offline onboarding visible.
6. Static build artifact ZIP uploaded as `mk-dos-p11-browser-build` (artifact ID `13366267960`, 14-day retention, expires **2026-11-18**).

**Artifact ZIP SHA-256:** `4a12d4a20501ff746d9dab25d5b1f710b7e4983793f3908824761a59205a553f`, downloaded and ZIP integrity tested independently in the project tool environment. Its contents are compiled application files and research documentation, not original commercial games.

Earlier successful workflow runs:
- 41919315782: build and TypeScript after O198 typing fix.
- 41919648937: basic headless Chrome onboarding after build.
- 41920203722: build, types and Chrome after the Asset Library navigation/scroll changes.

## Source-level regressions and scope

- O198 original Forest conditional root fixture **passed** before and after type-only correction. Exported O198 forensic ZIP matched **byte-for-byte**; the type correction preserves the original role literals.
- From local P11 source with the Asset Library UI change, `scripts/verify-mk2-p11-cumulative.cjs` reported **5,053 unique MK2 assets / 40 checks PASS** against the authenticated original local MK2 installation. No decoder/assets/export logic changed in the UI patch.
- Two UI improvements were introduced in `develop` at commit `4e3c370264099a20f5e74bb61d9a696145d8a2bb`:
  - Asset search includes original `a.source.path` so Stage Gallery deep links to `PIT.GRA` / `PORTAL.GRA` can locate matching resources.
  - Re-entering Asset Library resets stale search/type/group filters (without deleting the export queue).
  - Asset grid is independently scrollable, with accessible paging controls and a sticky desktop inspector.
- These UI changes passed CI **compilation** and browser **startup**, but their real-game **interaction** remains validation pending.

## Dependency lock provenance

- The original full P11 local archive retains the original `package-lock.json` (SHA-256 `f915fa7ac029ae05ffa5fc535fd71b6e0425a94b9b7744db161a04799ea8f123`, Git blob `4197b395e74e6b86f19a4eca85a596e8c8d1e26d`).
- The Git-safe original import accidentally omitted it.
- A **new lockfile**, generated using npm **11.19.1**, was strictly installed, build-tested, typechecked, and then committed by one-time GitHub CI at `fdf73569ca2de9d1183059f1e8b4f76a2b6c4725`. Git blob: `361cdc9b67382b5d643bc1ff883a32888f231849`.
- The two lockfiles are **not byte-identical**. Do not claim the GitHub lockfile was restored from the original archive. It is a new, verified, reproducible dependency baseline. The original remains backed up outside GitHub.
- The temporary CI bootstrap workflow was removed after success. The normal P11 build workflow now **requires** the committed lockfile.

## Browser validation boundary

The compiled static build was successfully retrieved from private GitHub Actions. Local browser execution in the project tool environment was attempted with the original MK2 ZIP available locally; Chromium's host environment rejected all navigation with `net::ERR_BLOCKED_BY_ADMINISTRATOR`, including `data:`, `file:`, and localhost pages. This is an environment restriction, **not a proven application runtime failure**.

A trusted Windows/local browser with an authorized original MK2 installation is needed to validate Stage Gallery → Browse Resource, actual previews, independent scrolling, metadata, and export ZIP/PNG download. No commercial game data is committed to GitHub Actions.

The browser-quality acceptance checklist is in [Issue #4](https://github.com/87otlto-coder/mk-dos-archive/issues/4). Overall P11 release remains in [Issue #2](https://github.com/87otlto-coder/mk-dos-archive/issues/2); dependency and CI details are in [Issue #3](https://github.com/87otlto-coder/mk-dos-archive/issues/3).

## Next checkpoint decision

**Do not promote P11 from `develop` to `main` yet.** The compiled app now starts in CI, but real-game interactive inspection/export and MK1/MK3 browser regression have not been validated. Continue only extractor-relevant work; do not claim complete stage scenes, runtime DAC ownership, or authentic frame timing.
