# P21 — fifth-pass source consolidation

Date: 2026-11-06. Baseline: P20 `3b1c5a131d0b938a141493339e68749ab5e99a63` on `develop`.

## Outcome

P17–P20 are consolidated into a reproducibly tested **source checkpoint on develop**. Main remains the accepted P16 source checkpoint. This is not a completed three-game extractor release, native gameplay validation, or a main promotion.

No asset decoder, palette interpretation, asset census or research implementation was changed in P21. The practical improvement is a single fail-closed regression command covering all three available fixtures, together with current source/coverage documentation.

| Pass | Change after P16 | MK2 representations |
|---|---|---:|
| P17 | Two original indexed IMAGES setup mosaics | 5,110 |
| P18 | Eight source-order contact-sheet/export groups, using 57 existing frames | 5,118 |
| P19 | Original source-order presentation queue | 5,118 |
| P20 | Full current-source cumulative regression closure | 5,118 |
| P21 | Repeatable multi-game regression and source checkpoint | **5,118** |

P17/P18 intermediate counts were originally expected; P20 and P21 freshly verify the complete combined 5,118 count. These are representations, not distinct commercial resource files or complete arenas.

## Fresh P21 results

`scripts/verify-p21-checkpoint.cjs` completed **11 suites / PASS**, with no optional games skipped:

| Gate | Fresh result |
|---|---|
| MK2 extracted input identity | 614-file census, 13 pinned resource hashes, 642 checks PASS |
| MK2 cumulative collection/export | 5,118 unique IDs, 536 checks PASS |
| MK2 seven focused P12–P19 suites | 818,695 checks PASS, including their existing negative controls |
| MK1 compatibility | 2,656 assets: 2,363 sprites, 244 audio, 49 stage PNGs; 2,615 checks PASS |
| MK1 stage exports | All 49 exported stage PNGs independently read back against collection pixels; 24 normalized module previews retained |
| MK3 compatibility | 9,186 assets: 6,654 sprites, 1,046 raw, 1,024 audio, 416 images, 46 music; 7,110 checks PASS |
| MK3 representative exports | First/last asset from each of five kinds: 10 payloads, selection order, PNG readback where applicable, and indexed sidecar parity PASS |
| Runner negative control | Empty input rejected, nonzero exit, explicit FAIL report and zero successful suites |
| New verifier syntax | Both CJS scripts pass `node --check`; also added to source CI |

The compatibility suites check every available RGBA plane's dimensions and record combined visual-plane and evidence-package hashes for future comparison. Historical P11 kind counts are pinned; current output hashes are recorded observations, not independently established new source goldens. MK1's canonical EXE hash is explicitly checked. MK3 EXE hash is recorded, not presented as newly independently authenticated corpus identity.

Machine-readable evidence: [P21 regression record](validation/P21_CHECKPOINT_REGRESSION_2026-11-06.json).

## Source checkpoint and preservation

The authoritative P20 parent tree `33351d372ce2bc7461e9e487a429ca46adb8616a` contains **2,085 tracked file blobs / 369 src files**, with zero reviewed original-game/media/archive extensions. The 365-file TypeScript syntax count excludes other source file types. The P20 source reconstruction and exact blob verification are documented in its handoff.

P21 adds two test scripts, the regression record and this checkpoint document; updates the source-only CI syntax step and current documentation. It does not remove or restructure established source. The complete Git-safe source is recoverable from the committed tree; no redundant full-source ZIP is issued. Original game files and generated asset archives remain outside GitHub.

## Reproduce

```powershell
node scripts/verify-p21-checkpoint.cjs --mk2 <original-MK2-dir> --mk1 <original-MK1-dir> --mk3 <original-MK3-dir> --report <output-json>
```

Python and installed Node dependencies are required. Set `PYTHON` if the executable is not `python`. Run from any directory; child commands use the repository root. Output must be outside all game directories. Optional omitted games appear as `NOT_RUN` in `notRun`; they never become implied passes. Each suite has a ten-minute timeout. Failure writes an explicit FAIL record and exits nonzero. Fixture-backed tests do not run in GitHub CI because commercial inputs are not uploaded.

## Remaining qualifications

- **VALIDATION PENDING:** actual browser clicking/import/export of P12–P19 additions with original game data. Source-offline Chrome startup is separate.
- **NOT FRESHLY VERIFIED:** attached MK2 ZIP-level hash/re-extraction; P20 transfer failed with DNS, and P21 uses the existing extracted fixture. Directory identity checks 13 critical hashes, not all 614 contents independently.
- **UNKNOWN:** native animation timing, live DAC-bank ownership, world/camera placement and complete stage composition. Source-order presentation keeps user-selected timing.
- MK1 bounded stage images retain their documented camera/phase/composition limits. MK3's 416 images are not newly classified as stages.
- Main promotion remains outside this continuation; do not treat consolidation as automatic acceptance.

## Next cycle

P22 remains MK2-first. Reconcile existing verified original-graphics research against the asset registry, then integrate one materially useful missing source family with independent byte/pixel evidence and focused negative controls. O110A's held-resource components are a candidate coverage audit, not permission to label ambiguous VFRAME/PLAYSTA interpretations or unknown font geometry as proven images. Apply verified work before investigating new runtime mechanisms. Preserve P21 and repeat the five-pass cycle; do not silently shift to MK1/MK3 research or UI redesign.
