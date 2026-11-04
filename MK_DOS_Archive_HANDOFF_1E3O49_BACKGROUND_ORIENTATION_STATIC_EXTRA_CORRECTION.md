# MK DOS Archive — Pass 1E.3O.49 Background Orientation + CHOP/STATUE Static-Extra Correction

**Status:** VERIFIED  
**Verdict:** `MK1_BACKGROUND_HORIZONTAL_FLIP_AND_CHOP_STATUE_STATIC_EXTRA_ESTABLISHED`

O49 was triggered by user visual review of the O48 stage package. The apparent left/right errors were genuine renderer-orientation omissions rather than bad descriptor or palette ownership.

Canonical `BAKGND` code transforms placement control bits into the renderer selector. In authentic placement records, control bit `0x0010` selects selector `0x12`, and the renderer dispatch table maps `0x12`/`0x52` to `fWrtNonZero`/`fClpWrtNonZero`. Those routines begin at the right edge of a row and retreat across pixels, mechanically establishing **horizontal flip** semantics. The ordinary source uGRA payload remains authentic and unmirrored; orientation belongs to the draw instance.

Impact across the O31/O43 scene population:
- 4,488 instantiated placement objects;
- 801 carry horizontal flip;
- 2,153 fresh-visible placement objects;
- 201 fresh-visible placements carry horizontal flip;
- 14 top-level module variants are visibly affected.

The affected visible module variants are CHOP_MOD, STATUE_MOD, STATUE_MOD386, CAVE_MOD, CAVE_MOD386, STRIPPED_MOD, STRIPPED_MOD486, STRIPPED_MOD386, GNINJA_MOD, GNINJA_MOD386, PILLAR_MOD, PILLAR_MOD386, ARENA_MOD and ARENA_MOD386.

O49 also resolves O47's CHOP/STATUE static-extra blocker. Shared init callback `0x4850` creates one no-scroll object using setup record `0x0C86`: descriptor `0x1A13C`, palette `0xFB6E`, screen `(72,15)`, renderer plane 4, standard non-flipped writer. The descriptor is 62×58, file ID 2, `GRAPHICS/MISC.GRA` offset `0x7764`; it decodes as the moon. The palette contains 14 colours and all opaque indices are in range. Independent checksum is `fdc1634a`.

Correction consequence: O44/O46/O48 **raster pixels are superseded where placement orientation matters**, but their descriptor decoding, palette bindings, fresh renderer-order evidence, time-aware scene IR and dynamic-mechanism research remain valid.

Independent audit re-read canonical EXE machine-code anchors, dispatch entries, placement control words and MISC.GRA bytes and passed all checks.

Final evidence:
- `mk1_background_orientation_static_extra_qualification_o49_final.json` SHA-256 `0b92f0e302388ce4ac8385715ead14af0b0d175f1fb1f55e8d943064b4fba2f6`
- `mk1_o49_independent_audit_final.json` SHA-256 `aac0222a480e3dec30a17ebf22647662e4ac06f093e78268ca4df086e69b3b9e`

Boundary: O49 qualifies renderer orientation and the CHOP/STATUE static moon. It does not claim canonical gameplay screenshots or broaden binary writeback.
