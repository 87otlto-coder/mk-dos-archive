# P58 — Original MK2 colour-evidence comparisons, not speculative palettes

Date: 2026-11-07. Branch: `develop`. Accepted baseline: P57 focused original-three-game gallery and P56 complete three-game cumulative regression; `main` remains P16. P58 is the second interim pass of the P57–P61 five-pass development cycle.

## Extraction problem and existing verified research

P57 put real original-source artwork on MK2 gallery cards, but diagnostic grayscale/index-valued images and incomplete layers are visually easy to mistake for incorrect decoded colours or complete gameplay stages. The next useful step is to **show the strongest existing authentic colour evidence without inventing native palette-bank ownership**.

Two source-qualified evidence families were already implemented:

- **Living Forest P7 / O197:** five original setup-local indexed/opacity canvases, each with two registered asset representations sharing the same source pixels: an exact original index-value grayscale preview and an RGB rendering from an EXE-linked 80-word **candidate** colour record. O197 verifies the original resource and setup descriptors. It does **not** verify that the candidate palette is the actual live VGA DAC allocation or how the five layers compose during play.
- **Kombat Tomb / The Portal P15, O115/O116/O117:** one source-accurate 320-column floor strip each, rendered using RGB observed in authenticated original-game screenshots. Held-out comparison evidence counts are 12,222 Tomb pixels and 4,420 Portal pixels. Those are **floor-only, capture-conditional** colour witnesses, not global palette banks, runtime camera coordinates, native timing or a complete stage scene.

## P58 source changes

1. `src/components/mk2PaletteEvidenceP58.ts`: a pure, evidence-gated in-memory selector for five existing Forest index/candidate pairs and the two existing witnessed floor strips. It pins original FOREST.GRA, TOMB.GRA and PORTAL.GRA SHA-256 identities, source locations/lengths, dimensions, source setup/palette metadata, source-index/mask identity for Forest pairs, and the negative runtime-DAC/scene-ownership flags. Duplicate, malformed or contradictory verified records produce visible validation errors instead of silently inventing colour relationships.
2. `src/components/MK2PaletteEvidencePanelP58.tsx`: a **collapsed comparison panel** on only the relevant MK2 Stage Gallery resource cards. Forest shows both exact index values and optional candidate RGB, separately for each source setup. Tomb and Portal show their authenticated screenshot-conditioned **floor-only** RGB strips. All labels explicitly distinguish source indexes, candidate RGB and screenshot-observed RGB; no full-scene recolouring, palette substitution or canvas layer assembly occurs. Each preview can be opened via the existing exact asset-ID navigation.
3. `src/components/MuseumWorkspace.tsx` and CSS: expose the comparison panel without changing the P57 representative stage thumbnails or the original decoder/export controls. Errors are always visible.
4. `scripts/test-p58-mk2-palette-evidence.cjs`: source-only synthetic positive cases and **15** negative controls, including mismatched indexed planes/masks, altered source SHA/extents/geometry, false DAC/draw-order claims, invented screenshot matches and a false native-palette-known mask. CI executes this script.
5. `scripts/verify-mk2-p58-palette-evidence.cjs`: focused original MK2 acceptance. It scans the canonical original MK2 directory, asserts the unchanged **5,369** asset census, original EXE/FOREST/TOMB/PORTAL SHA-256, **five** authentic Forest paired planes and **two** original screenshot-conditioned floor strips. It independently regenerates the original 320-column floor indices from original GRA bytes and compares their SHA-256, original index planes, witnessed RGBA hashes and exact-ID navigation. Original files and test output remain outside Git. The script is syntax-checked by CI but **has not run against the private original MK2 fixture in this development session**.

## Confidence status

**VERIFIED, source only:** GitHub CI of the P58 source/workflow candidate successfully executes the synthetic positive/negative cases, TypeScript checks and production build once the workflow concludes successfully. Record the exact run and SHA rather than inferring original-file acceptance. Existing P57 and P56 original-file results are historical accepted baselines, not fresh P58 regression results.

**VALIDATION PENDING:** Run `scripts/verify-mk2-p58-palette-evidence.cjs` on complete local `develop` source with original DOS MK2 installation. Observe Forest palette comparison panels and the Tomb/Portal floor-only witnesses in the browser; verify source-index assets remain available separately. Current original-game and interactive tests have **not** been rerun for P58.

**UNKNOWN:** native live DAC palette ownership, inter-layer ordering/camera/parallax, original animation cadence and final composited stage screens. P58 does not claim to resolve these. This pass improves inspectability and provenance accuracy without inventing colours or source relationships.

## Next

Once original MK2 acceptance succeeds, P59 may investigate another high-value source-backed stage composition/palette relationship using independently repeatable original-file evidence. Keep all new changes on `develop`; protect existing decoder exports and forensic research workbench; P61 is the next full consolidation checkpoint, not an automatic promotion to `main`.

### Run on user's existing local installation

```powershell
git pull --ff-only origin develop
node scripts/verify-mk2-p58-palette-evidence.cjs "E:\GOG\Games\Mortal Kombat 2\mk2" "C:\Temp\mkdos-p58-results.json"
npm.cmd run dev
```

In the MK2 Stage Gallery, expand **Compare original palette evidence** under Living Forest, Kombat Tomb or The Portal. This panel is collapsed by default to avoid overwhelming other stage cards. A successful original-fixture test reports `P58`, `PASS`, `5369`, five Forest pairs and two floor witnesses, while preserving all runtime palette and full-scene UNKNOWN flags.
