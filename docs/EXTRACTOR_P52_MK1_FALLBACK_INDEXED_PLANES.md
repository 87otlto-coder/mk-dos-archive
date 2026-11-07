# P52 — MK1 read-only fallback indexed-plane retention (interim, acceptance pending)

Date: 2026-11-07. Branch: `develop`; P51 remains the accepted develop checkpoint, `main` remains P16.

## Objective

Preserve already-decoded, source-anchored Kano indexed/opacity planes when the user opens the deliberately independent MK1 read-only fallback. P48's existing direct **Export indexed asset ZIP** depends on `Asset.metadata.indices` and optional `mask`. Previously all 187 fallback Kano preview assets discarded those planes after rendering grayscale.

## Bounded implementation

`src/core/assets/mk1ReadOnlyFallback.ts` now attaches `indices: decoded.indices` and `mask: decoded.opaqueMask` to the existing asset metadata. No decoder, sprite geometry, preview RGBA mapping, asset ID/count, raw resource bytes, executable selection, canonical authoring gates or palette qualification changed. A 187-frame all-or-nothing anchored run remains required. No runtime palette, native animation cadence, scene composition or replacement safety is inferred.

A new original-fixture gate `scripts/verify-mk1-p52-fallback-indexed.cjs` checks the direct fallback against the original directory, 187 authentic planes, original-source uGRA decoder parity, every asset's direct indexed ZIP payload/sidecars, four malformed native-plane refusals, the canonical-executable-to-modified-executable routing boundary and a damaged-descriptor fail-closed case. It also enforces a separately generated whole-run original-plane digest. Its syntax is checked by source CI; **the complete script has not been executed against the complete current committed checkout in this conversation**.

## Evidence and confidence

**VERIFIED (independent original-binary source analysis in this continuation):** the supplied `mk1.zip` contains canonical MK1.EXE SHA-256 `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14` and KANO.GRA SHA-256 `5b32513ed4fd5363f6aab56a9f2493b96ffbe331593297a277d4aac5fbbd9390`; both match the exact lengths expected by the fallback. All 187 original descriptors satisfy its bounded geometry and resource-ID constraints. An independent original-file row-command decoder reconstructed 187 frames, **928,368 index pixels / 340,324 opaque pixels / 72,052 stream commands**, and produced SHA-256 `838216030d67125687534f8a5e7e576d2381d049e3b98ca13185c48b12a8668a` over each frame's LE descriptor offset, width, height, indices and mask in source descriptor order. This is a private-fixture observation, not an in-app exported ZIP proof.

**VERIFIED (committed source):** the two-plane metadata change is on `develop`; source-only GitHub CI passed at commit `81f2d429744b9abf2056d50585bb69ee8b7de947` (run 42386834829).

**VALIDATION PENDING:** execute the new original-fixture acceptance script on the entire current committed source, verify all 187 real ZIPs and fail-closed negative cases, rerun the existing three-game fixture regressions and actual browser indexed ZIP clicking. Source CI does not contain commercial fixture data. P51's prior census MK1 2,656 / MK2 5,369 / MK3 9,186 remains historical, not freshly rerun here.

**UNKNOWN:** the proper original Kano palette bank, animation scheduling and in-game screen arrangement; none are claimed.

Next step: complete P52 original-fixture regression and original/noncanonical-browser acceptance if available, then decide whether to extend only already-qualified fallback source families. Do not weaken the strict canonical research path; preserve research workbench, source history, and original binaries outside Git. P56 is the next scheduled consolidation assessment; no `main` promotion.
