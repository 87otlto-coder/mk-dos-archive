# MK DOS Archive — Pass 1E.3O.59 Animation Export Capability/Coverage Manifest

**Status:** VERIFIED  
**Verdict:** `MK1_ANIMATION_EXPORT_CAPABILITY_COVERAGE_MANIFEST_ESTABLISHED`

## Purpose
O59 converts the already-verified O18–O26 MK1 animation graph into an explicit product/export contract. It does not introduce new palette guesses, gameplay animation names, timing units, or write paths.

## Canonical coverage
Against authentic `MK1.EXE` SHA-256 `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`:

- 9 character contexts
- 8 unique ANITAB families
- 739 ANITAB table cells preserved
- 592 image-bearing/indexed-export-ready entries
- 1,102 unique O18 descriptors preserved losslessly
- 2,263 explicit O24 character-context RGBA variants
- 21 independently palette-qualified O23 effect RGBA payloads
- 79 O25 cross-resource descriptors remain palette-unresolved and therefore indexed-only
- 514 O26 unique animation streams retain structural control/timing metadata

## Export tiers
1. **INDEXED_STRUCTURAL_EXPORT_READY** — all O18 descriptors remain available as indexed pixels + opaque mask with resource/descriptor metadata.
2. **EXPLICIT_CHARACTER_CONTEXT_RGBA_AVAILABLE** — dominant-resource descriptors rendered only under the explicit normal/alternate palette contexts established by O20/O24. These are context variants, not a universal per-animation palette assignment.
3. **VERIFIED_EFFECT_RGBA_AVAILABLE** — the bounded O23 Kano heart/BLOOD_P and Rayden lightning/MORPH_P fixtures.
4. **PALETTE_BINDING_UNRESOLVED_INDEXED_ONLY** — the exact 79 O25 unresolved cross-resource descriptors. No guessed RGBA is emitted.

O26 dwell/control values remain scheduler/caller units. No conversion to milliseconds/FPS is made. O22 nearest-symbol/context labels are not promoted into canonical gameplay animation names.

## Validation
The authentic prerequisite chain was rerun through O59 and reproduced the exact expected counts. A later independent O59/O60 audit separately reconciles these totals from O18/O22/O23/O24/O25/O26 and validates the exported payload surface.

## UI/product integration
O59 is integrated as stage 68/69 in **Run What's Needed**. Its report enters the generic Research Results Workspace and is classified under **Animation & character export** from report semantics rather than high pass number alone.

## Boundaries
- Read-only.
- No animation writeback/import.
- No guessed palette ownership for the 79 unresolved exceptions.
- No canonical gameplay animation names beyond independently established identity/table context.
- No wall-clock timing claim.
