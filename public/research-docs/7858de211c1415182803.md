# MK DOS Archive — Pass 1E.3O.60 Browser Animation Export Package

**Status:** VERIFIED  
**Verdict:** `MK1_BROWSER_ANIMATION_EXPORT_PACKAGE_ESTABLISHED`

## Purpose
O60 turns the O59 evidence tiers into a browser-safe, one-click MK1 animation export package while preserving unresolved palette state instead of hiding or guessing it.

## Package contract
Browser download filename: `MK1_O60_BROWSER_ANIMATION_EXPORT_PACKAGE.zip`

The verified package contains **2,295 ZIP entries**:

- 2,263 explicit character-context PNGs reconstructed from canonical GRA bytes and exact O24 palette contexts
- 21 independently palette-qualified O23 effect PNGs
- 1 lossless indexed descriptor binary containing all 1,102 O18 descriptors
- 1 indexed descriptor manifest
- 1 animation asset manifest
- 7 prerequisite/coverage research reports (O18, O22, O23, O24, O25, O26, O59)
- 1 README

Total PNG count: **2,284**. Indexed binary length: **11,230,148 bytes**. The indexed format stores each descriptor's index bytes followed immediately by its opaque-mask bytes, with exact offsets and lengths in the manifest.

The exact 79 unresolved O25 descriptors are present in the indexed payload but receive **no character-context guessed RGBA asset**.

## Reconstruction discipline
O60 does not trust prior browser preview maps as canonical output. It rereads authentic GRA resources, re-decodes all 1,102 descriptors, reconstructs the 2,263 O24 context variants from exact palette records, and reconstructs the 21 O23 effects from the qualified descriptor/palette evidence.

PNG encoding is deterministic browser-safe RGBA8/filter-0/stored-DEFLATE. ZIP encoding uses the project's dependency-free STORE writer.

## Independent validation
A separate Python implementation passed **22/22 checks** against the final package:

- all 1,102 indexed descriptors independently uGRA-decoded and matched byte-for-byte
- all 2,263 character-context PNGs parsed and their O24 aggregate/sample FNV checks reproduced
- all 21 O23 effect PNGs matched qualified dimensions/checksums
- all 79 unresolved descriptors verified present indexed and absent from guessed character-context RGBA output
- report and inventory counts reconciled independently

## UI/product integration
O60 is integrated as stage 69/69 in **Run What's Needed**. The app retains the package result in state and exposes **Download Animation Package** beside the existing stage-package download. O59/O60 also appear automatically in the Research Results Workspace.

## Boundaries
- Read-only export.
- Character-context PNGs are explicit context renders, not proof that every animation event universally selects that body palette.
- 79 unresolved cross-resource palette bindings remain unresolved.
- O26 timing remains structural/caller dwell units, not milliseconds/FPS.
- No gameplay animation naming inference is added.
