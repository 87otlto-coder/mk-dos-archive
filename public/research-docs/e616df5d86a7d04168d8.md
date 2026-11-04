# MK DOS Archive — O95F fixed-identity provenance expansion

Date: 2026-10-07 (SAST)

## Status

**VERIFIED / MK2 ANIMATION RESEARCH STILL OPEN**

O95F expands the fixed-numeric-identity animation evidence from two bounded witnesses to three and establishes a qualified executable write-site census for object identity field `+0x46`. It does not assign fighter names, move names, wall-clock timing, or cross-product dynamic/copy identities.

Machine verdict:

`MK2_O95F_SLOT6_FAMILY_A_INDEX0_SEVEN_FRAME_ST0_STRUCTURAL_LOOP_AND_IDENTITY_WRITE_CENSUS_ESTABLISHED`

## 1. Canonical fixture

- `MK2.EXE` SHA-256: `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`
- authentic O69 descriptor/resource corpus retained as the graphics endpoint
- authentic LE fixups remain the pointer authority

## 2. Qualified identity-write census

Scanning the authenticated file-backed Object-1/Object-2 code ranges for the instruction form `mov [reg+0x46], reg` produces exactly **24 qualified code write sites**.

- **12 immediate-constant identity writes**
- **12 copy/dynamic identity writes**

Immediate constant writes observed:

- slot 9: physical `0x67F4D`
- slot 1: `0x68EA1`, `0x699DD`
- slot 0: `0x7B052`
- slot 6: `0x83DC2`, `0x950E9`, `0x9515C`, `0x951CB`
- slot 12: `0x950A2`, `0x95145`, `0x951B4`
- slot 7: `0xB4233`

The other 12 sites copy identity from another object/global/runtime value and remain symbolic unless their source is independently resolved. O95F does not infer numeric identities through visual/resource similarity.

## 3. Third fixed identity animation witness

A bounded route beginning at physical `0x83DBD` is authenticated:

- `0x83DBD`: load immediate `6`
- `0x83DC2`: write identity slot 6 to current object `+0x46`
- `0x83DC5`: call bounded pre-lookup helper `0x64E44`
- `0x83DCA`: write nested selector `0`
- `0x83DD4`: call combined Family-A lookup/interpreter entry `0x63E74`
- `0x63E74`: call Family A lookup `0x918F1`
- `0x63E79`: shared O95C stream interpreter

Route-slice SHA-256: `48b6ce27421dc8bb3c79c6d1eadcec42999543fbd4dae6d31c6539de61747635`.

The pre-lookup helper and explicitly audited returning subroutines contain no direct object-`+0x46` write. Its exceptional error path exits through a tail jump rather than returning to this lookup route. This is deliberately a **bounded route non-interference claim**, not a whole-program side-effect theorem.

Family A slot 6 root is Object-2 `0x11744`; nested index 0 resolves by authentic fixup to stream Object-2 `0x11884` (physical `0xB24D8`). Stream-slice SHA-256: `926f43a1181a2b6d375029dc77d851d6008490169b3a7aa1b62f1ff0ff33db85`.

## 4. Seven-frame ST0.GRA sequence and structural loop

Stream `0x11884` contains seven ordered composition pointers. Each composition contains one O69-authenticated `ST0.GRA` descriptor and a zero terminator:

1. `0x118A8` -> descriptor `0x25EE4` -> offset 27664, 44x96, x=18, y=-9
2. `0x118B0` -> descriptor `0x25E2C` -> offset 0, 44x97, x=18, y=-8
3. `0x118B8` -> descriptor `0x25E38` -> offset 3512, 44x99, x=18, y=-6
4. `0x118C0` -> descriptor `0x25E44` -> offset 7196, 44x100, x=18, y=-5
5. `0x118C8` -> descriptor `0x25E50` -> offset 10868, 44x98, x=18, y=-6
6. `0x118D0` -> descriptor `0x25E5C` -> offset 14428, 44x97, x=19, y=-8
7. `0x118D8` -> descriptor `0x25E68` -> offset 17832, 44x96, x=19, y=-9

At Object-2 `0x118A0`, raw token `1` is followed by a relocation-backed operand at `0x118A4` targeting the same stream start `0x11884`.

Using the already-qualified O95C token-1 behavior, the structural order is therefore:

`frame 0 -> frame 1 -> ... -> frame 6 -> token 1 -> stream start`

This establishes a structural loop. It does **not** establish dwell duration, FPS, gameplay action name, fighter name, or runtime observation.

## 5. Constant writes deliberately not promoted

Examples retained as non-promoted evidence:

- slot 1 at `0x68EA1`: Family-A index 39 is selected, but scheduler/state flow separates selection from interpreter consumption;
- slot 0 at `0x7B052`: Family-B index 2 is selected, but no bounded immediate lookup/interpreter join is established there;
- slot 12 at `0x95145`: Family-A index 3 lookup is followed by an explicit identity rewrite to slot 6 before later work;
- slot 12 at `0x951B4`: Family-A index 13 lookup is followed by an explicit identity rewrite to slot 6.

These are intentionally not treated as animation witnesses yet.

## 6. New implementation/evidence

Added:

- `src/games/mk2/research/animationFixedIdentityProvenanceExpansion.ts`
- `scripts/run-mk2-animation-fixed-identity-provenance-expansion.mjs`
- `scripts/verify-mk2-o95f-animation-fixed-identity-provenance-expansion.py`
- `mk2_animation_fixed_identity_provenance_expansion_o95f_2026-10-07.json`
- package smoke command `smoke:mk2-animation-fixed-identity-provenance`

## 7. Validation

Fresh authentic-fixture TypeScript runner: **PASS**.

Independent Python verifier: **54,213 checks / 0 failures**.

It independently:

- authenticates the executable;
- reparses all 27,004 LE fixups;
- re-derives the slot-6 Family-A index-0 stream;
- verifies the bounded helper/code slices and absence of direct `+0x46` writes in the audited helper slices;
- verifies all seven composition arrays and O69 `ST0.GRA` descriptor joins;
- verifies token 1 redirects to the exact stream start;
- independently reproduces the 24-site / 12-constant / 12-copy-or-dynamic identity-write census;
- reconciles the machine-readable O95F report and uncertainty boundaries.

Regression gates:

- O95B: **54,200 / 0 failures**
- O95C: **54,199 / 0 failures**
- O95D: **54,335 / 0 failures**
- O95E: **54,186 / 0 failures**

## 8. Boundary / closure status

Established through O95F:

- two identity-indexed animation pointer families;
- shared stream interpreter and bounded control-token geometry;
- 28 direct lookup/interpreter routes preserved without invalid identity cross-products;
- delayed wrapper and related-object identity mechanisms;
- three fixed numeric identity witnesses:
  - slot 12 / Family A / index 7 -> 8 `GO.GRA` frames -> token 0;
  - slot 7 / Family B / index 1 -> 6 `RD0.GRA` frames -> token 0;
  - slot 6 / Family A / index 0 -> 7 `ST0.GRA` frames -> token 1 back to stream start;
- complete qualified direct code write-site census for object `+0x46` under the current instruction-form boundary.

Still open:

- provenance for the 12 copy/dynamic identity writes;
- remaining constant-write routes whose selection/consumption is separated by scheduler/state machinery;
- broader connected stream corpus and control-token combinations;
- multipart/branch/loop coverage beyond individually proved witnesses;
- animation timing/dwell semantics;
- human names and complete per-identity coverage;
- all other MK2 closure gates from O95A, especially stages/backgrounds/dynamics, remaining palettes and unresolved graphics/music verification.

**MK2 animation closure remains OPEN.**

## 9. Next small pass

**O95G — constant-identity selected-pointer continuation tracing.**

Start with the remaining immediate identity writers that select a Family A/B pointer but do not immediately enter the O95C interpreter. Trace where the selected pointer is stored or resumed across scheduler/state helpers, and only promote a sequence when the exact selected pointer reaches an authenticated consumer without identity/index ambiguity. Do not assume that a selected pointer is an animation merely because it came from an O95B family, and do not assign names or timing.
