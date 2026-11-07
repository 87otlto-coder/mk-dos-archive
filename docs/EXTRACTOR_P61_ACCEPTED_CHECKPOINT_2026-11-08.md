# P61 accepted original-fixture checkpoint

On 2026-11-08 (Africa/Johannesburg), the complete P61 runner exited 0 on a clean `develop` checkout with the original local DOS installations of MK1, MK2 and MK3. It recorded **9/9 groups passing** and **17,211 assets**. This checkpoint accepts the extractor at commit `3ff65c5b2a939df21e02a460f53e859a7b467346`, tree `dcf4aae49e96c092f7cc96233671685c64c75dba`. Only the acceptance documentation follows that commit.

| Group | Observed result |
| --- | --- |
| 1. P56 cumulative | All six groups passed, including P51 with 27 game gates, 12 independent image families, 10,712,883 checks and 54 falsified exports rejected. The census was MK1 2,656, MK2 5,369 and MK3 9,186. |
| 2. P57 thumbnails | 24 MK1 previews across 15 headers, 10 MK2 previews and 416 unassigned MK3 images. |
| 3. P58 palette evidence | Five Forest pairs, two screenshot-witnessed floor strips and four source hashes verified. |
| 4. P59 independent Python oracle | The Python decoder reconstructed 2,650 architecture and 823 sky samples from original MK2 data and checked the indices, masks and PNG pixels in the freshly exported ZIP. |
| 5. P60 Tomb components | Three components passed, including byte-identical P59 files, P15 floor index and mask parity, pixel-identical floor RGBA and 15,360 floor indices. |
| 6. P57 provenance controls | Invalid MK1 headers, unproven MK2 layers and false MK3 identity or palette claims were excluded. |
| 7. P58 palette controls | All 15 falsified inputs were rejected. |
| 8. P60 component controls | All 15 falsified inputs were rejected. |
| 9. P59 registration controls | Sample coordinates, transparency, overlap, source and runtime qualification checks passed. |

## Source and run evidence

The runner recorded zero untracked files at startup. The local source audit matched all 2,310 tracked blobs to the Git tree after CRLF normalization, including 394 files under `src/`. It reported zero missing files, mismatches or unsafe paths. The original installations, generated exports and private reports stayed outside Git.

- Full private P61 report SHA-256 `8f16488beb8b52e86d7863f7f4f6df3729b468c7eba718c27d39fa175b242481`
- Source inventory SHA-256 `8bc773c58e8a338714e1268ff979edaa1642c9bad3763b9f1176ad5982ea3fd4`
- P59 ZIP verified by the independent oracle, SHA-256 `036e0d553065239b798657b4a6c38db221e3939cac3459a600237379cad6d445`
- Run interval (UTC) `2026-11-07T21:57:14.047Z` through `2026-11-07T22:01:59.713Z`

Local source checks passed for P54–P61, including all 13 P61 preflight refusals, both new runner syntax checks, TypeScript, the production build and offline headless Chrome startup. The P59 oracle used Python with Pillow. The run did not include a fresh gameplay screenshot comparison or interactive browser export replay. Runtime camera, native palette ownership, full-stage composition, draw order and timing remain unresolved.

The [candidate handoff](EXTRACTOR_P61_CONSOLIDATION_CANDIDATE_2026-11-07.md) contains the runner command. To reproduce the exact source, use a fresh clone, check out the tested commit as local branch `develop`, install the locked Node dependencies and select a Python interpreter with Pillow. Give each run fresh private work and report paths outside the checkout and game folders.
