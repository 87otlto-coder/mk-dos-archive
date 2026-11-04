# O193 — UI Stabilization (MK1/MK2)

This update is designed for the user's UI.1/O192 Windows environment.

- **MK1 Laboratory crash:** optional provenance fields no longer crash the research-workflow panel. No research validation or write safeguards were weakened.
- **MK1 Gallery:** lists real `*HDRS.GRA` stage/background candidates by resource identity without guessing arcade stage names.
- **MK2 Gallery:** original Portal/Tomb/Tower frames stay strict; changed game binaries or GRA files produce a clearer diagnostic instead of implying missing stage evidence.

## Windows test

With dependencies installed, run `npm run lint`, `npm run build`, `npm run verify:ui-foundation` and `npm run dev`. Open the same MK1 original directory, visit Museum → Stage gallery, then Laboratory → MK1 validated research workflow. The panel should open without crashing even before running the 75-stage pipeline.

## Additional fixture regression (optional)

`node scripts/verify-o193.cjs` requires the two original fixture folders set in `MK1_FIXTURE` and `MK2_FIXTURE`. Test fixtures are **not** distributed. This script independently confirms original-frame decoding and the provenance presentation guard.

## Boundaries

Full React/browser runtime and production build remain unverified in the packaging environment, so please report any new browser errors rather than assuming this update has complete UI coverage. A stage resource card is not a completed composed stage.
