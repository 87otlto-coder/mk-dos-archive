# MK DOS Archive — Checkpoint — Pass 1E.3O.70 MK2 Browser Indexed Graphics Export Package

## Status

**VERIFIED / LOSSLESS BROAD MK2 INDEXED PACKAGE ESTABLISHED / IN-APP VALIDATION PASSED / INDEPENDENT 109/109 AUDIT PASSED / ONE-PASS PAUSE REACHED**

O70 productizes only the O69 exact-full indexed graphics surface. It does not broaden descriptor semantics, palette ownership, game-colour rendering, overlay runtime-consumer claims, or cross-game abstractions.

## Package contract

The browser package contains exactly **7,678 STORE ZIP entries**:

- **94** authentic O69-qualified GRA resources preserved byte-for-byte;
- **3,790** one-byte indexed-pixel payloads;
- **3,790** one-byte opacity-mask payloads;
- **4** metadata/evidence entries: indexed asset manifest, package manifest, stable O69 evidence snapshot, and README.

The package covers exactly the O69 qualified corpus:

- exact-full resources: **94**;
- unique streams: **3,790**;
- authentic encoded GRA bytes preserved: **11,385,532**;
- decoded indexed pixels materialized: **15,953,739**.

Accepted package:

- filename: `MK2_O70_INDEXED_GRAPHICS_EXPORT_PACKAGE.zip`
- byte length: **48,792,953**
- SHA-256: `04902dcd5962d5b9ca708b34ce57735d5215ca64d3be762aa8d0652918dd8e97`

## Lossless representation

Each exact-full resource is preserved once as its original authentic `.GRA` byte stream. Each qualified descriptor stream is additionally exported as:

- `*.indices.bin` — one byte per decoded pixel;
- `*.mask.bin` — one byte per decoded pixel, where nonzero marks an opaque source pixel.

Keeping the opacity mask separate avoids treating any numeric palette index as transparency. The original encoded GRA bytes are retained so the package preserves both the authentic source encoding and the decoded indexed/opacity state.

## Explicit exclusions and unresolved boundaries

O70 excludes the same surfaces O69 did not qualify for full-resource coverage:

- the **15** `PARTIAL_OR_AMBIGUOUS` candidate-bearing resources;
- the **14** pooled GRA resources with no qualifying overlay candidates;
- out-of-pool `MONKS.GRA`.

O70 does **not** establish:

- palette ownership;
- correct-colour RGBA/PNG rendering;
- semantic/gameplay names beyond authentic internal filenames;
- runtime consumers or semantic class for the unresolved post-LE descriptor corpus;
- completeness for excluded resources;
- a shared MK1/MK2 decoder/palette abstraction.

## Validation

The in-app O70 validator reparses the actual browser STORE ZIP, validates CRCs and exact inventory, compares all **94 raw GRA files byte-for-byte** with the authentic MK2 installation, independently decodes all **3,790 streams**, and matches every packaged index/mask payload and per-payload SHA-256.

A separate Python auditor that does not call the TypeScript exporter passes **109/109 checks**. It independently reads the ZIP, compares all 94 raw GRA files, decodes all 3,790 streams, verifies all 7,580 decoded payload files, checks the exact 7,678-entry set, and preserves the palette/runtime boundaries.

Source/UI integration audit passes **23/23** checks. `MK2FoundationPanel` now runs O67→O68→O69→O70 and exposes the broad indexed package download separately from the earlier JC0 pilot package. MK1's established workflow remains separate.

Targeted O67-O70 TypeScript plus `MK2FoundationPanel.tsx` passes under the established archival Node/React/lucide shims. The O70 Node runner and Python audits are syntax-clean.

## Correction preserved

The first independent O70 audit passed **108/109** checks. The only failure was an overly strict comparison of the embedded O69 report against the historical O69 JSON: fresh O69 runs carry different timestamp and operation IDs. No asset bytes failed.

O70 was corrected to embed a **stable O69 evidence snapshot** that removes only root run timestamp/operation ID and prerequisite O67/O68 operation IDs. The underlying O69 evidence/provenance content remains intact. After this correction:

- independent audit passes **109/109**;
- two complete O70 regenerations from the same authentic MK2 installation produce a **byte-identical ZIP** at the accepted SHA-256 above.

This correction is intentionally retained in project history rather than hidden.

## Verdicts

`MK2_BROWSER_INDEXED_GRAPHICS_EXPORT_PACKAGE_ESTABLISHED`

`MK2_BROWSER_INDEXED_GRAPHICS_EXPORT_BUNDLE_VALIDATED`

`MK2_O70_INDEXED_GRAPHICS_PACKAGE_INDEPENDENT_AUDIT_PASSED`

Per the user's timeout discipline, the project pauses after this **single major pass**. **O71 has not started.**
