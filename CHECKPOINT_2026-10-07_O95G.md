# MK DOS Archive — O95G constant-identity selected-pointer continuation tracing

Date: 2026-10-07 (SAST)

## Status

**VERIFIED / MK2 ANIMATION RESEARCH STILL OPEN**

O95G follows two remaining constant-identity Family-B selections through the code that actually consumes the selected pointer. It establishes two additional fixed-numeric-identity bounded sequences and, more importantly, proves that Family B does **not** feed one universal stream grammar.

Machine verdict:

`MK2_O95G_SLOT1_DELAYED_STANDARD_AND_SLOT0_SPECIALIZED_DIRECT_DESCRIPTOR_FIXED_IDENTITY_SEQUENCES_ESTABLISHED`

## 1. Canonical fixture

- `MK2.EXE` SHA-256: `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`
- authentic O69 descriptor/resource corpus retained as the graphics endpoint
- authentic LE fixups remain pointer authority
- O95B–O95F are prerequisites and remain regression-clean

## 2. Slot 1 — delayed Family-B route into the standard O95C interpreter

A bounded route at physical `0x68E9C..0x68ED7` is authenticated:

- `0x68E9C`: load immediate identity 1
- `0x68EA1`: write identity slot 1 to current object `+0x46`
- `0x68EA4`: write selector 39
- `0x68EAE`: call Family A lookup `0x918F1`
- the Family-A-selected cursor is dereferenced locally
- `0x68EBF`: **overwrite** cursor global `0x75A78` with packed value `0x00040001`
- `0x68ED3`: jump to scheduler wrapper `0x63B4B`

The initial Family-A index-39 selection is **not promoted as an animation route** here because its selected cursor is overwritten before animation consumption.

The scheduler wrapper performs:

- preserve high word `4` as an opaque consumer parameter;
- reduce cursor global to low word `1`;
- call Family B lookup `0x91909`;
- tail-jump to standard consumer `0x86825`;
- `0x86825` calls the already-qualified O95C shared interpreter `0x63E79`.

No wall-clock or dwell meaning is assigned to the preserved value `4`.

Family B slot 1 root Object-2 `0x5174`, nested index 1 resolves by authentic fixup to stream Object-2 `0x606C`.

The stream contains six one-part standard composition entries, each joined to an O69-authenticated `EXPLODE.GRA` descriptor:

1. descriptor `0x218F4`, GRA offset 0, 23x32, x=-75, y=-10
2. descriptor `0x21900`, GRA offset 976, 37x49, x=-66, y=0
3. descriptor `0x2190C`, GRA offset 3224, 39x51, x=-64, y=2
4. descriptor `0x21918`, GRA offset 5620, 41x57, x=-65, y=6
5. descriptor `0x21924`, GRA offset 8200, 44x60, x=-64, y=9
6. descriptor `0x21930`, GRA offset 10884, 49x65, x=-62, y=11

The next DWORD is raw token `0`. Under the already-qualified O95C interpreter behavior, the bounded structural sequence is:

`frame[0] -> ... -> frame[5] -> token 0 return`

No fighter name, move/effect name, timing, gameplay semantics or runtime-observation claim is assigned.

## 3. Slot 0 — Family-B route into a distinct direct-descriptor consumer

A second bounded route at physical `0x7B04D..0x7B077` is authenticated:

- `0x7B04D`: load immediate identity 0
- `0x7B052`: write identity slot 0 to current object `+0x46`
- `0x7B055`: write selector 2
- `0x7B05F`: call Family B lookup `0x91909`
- `0x7B073`: jump to loop consumer `0x86C99`
- `0x86C99` repeatedly calls token consumer `0x86CC5`

This path does **not** enter the O95C shared interpreter.

Family B slot 0 root Object-2 `0x3C94`, nested index 2 resolves to stream Object-2 `0x4F64`.

For this bounded stream, the first five tokens are relocation-backed pointers directly to O69-authenticated `HH2.GRA` 12-byte descriptors:

1. `0x23594`, GRA offset 112484, 32x110, x=30, y=-4
2. `0x235A0`, GRA offset 114712, 38x110, x=36, y=-4
3. `0x235AC`, GRA offset 116700, 35x110, x=39, y=-4
4. `0x235B8`, GRA offset 118516, 30x110, x=42, y=-4
5. `0x235C4`, GRA offset 120304, 26x110, x=44, y=-4

The sixth token is raw `0`.

The specialized consumer establishes only the following bounded grammar facts:

- cursor global is `0x75A78`;
- the consumer reads one DWORD and advances the cursor by four bytes before classification;
- relocated/high-address tokens call renderer helper `0x9377C`;
- `0x9377C` consumes the pointed record using fields at `+0`, `+4` and `+8`, matching the O69 12-byte descriptor geometry;
- token `0` returns carry set, which terminates the bounded `0x86C99` loop;
- token `1` redirects the cursor through the following DWORD target;
- other control forms in this specialized grammar are **not yet fully classified**.

Therefore the bounded structural order is:

`descriptor[0] -> ... -> descriptor[4] -> token 0 return`

O95G does not equate this direct-descriptor stream with the O95C standard composition grammar.

## 4. Important architecture correction

O95G rejects a universal parser assumption:

> **Family B selected pointers do not all feed the same stream grammar.**

At minimum, authentic executable evidence now establishes:

1. a standard composition-stream path through O95C interpreter `0x63E79`; and
2. a specialized direct-descriptor stream path through `0x86CC5` / renderer `0x9377C`.

The eventual extractor must dispatch by authenticated consumer/path context rather than treating every Family-A/Family-B selected pointer as an O95C stream.

## 5. New implementation/evidence

Added:

- `src/games/mk2/research/animationConstantIdentityContinuationTracing.ts`
- `scripts/run-mk2-animation-constant-identity-continuation-tracing.mjs`
- `scripts/verify-mk2-o95g-animation-constant-identity-continuation-tracing.py`
- `mk2_animation_constant_identity_continuation_tracing_o95g_2026-10-07.json`
- package smoke command `smoke:mk2-animation-constant-identity-continuation`

## 6. Validation

Fresh authentic-fixture TypeScript runner: **PASS**.

Independent Python verifier: **54,215 checks / 0 failures**.

It independently:

- authenticates `MK2.EXE`;
- reparses all **27,004** LE fixups;
- authenticates both fixed identity code routes;
- independently resolves Family-B slot 1/index 1 -> `0x606C` and all six `EXPLODE.GRA` joins;
- independently resolves Family-B slot 0/index 2 -> `0x4F64` and all five direct `HH2.GRA` descriptor joins;
- authenticates scheduler wrapper `0x63B4B`, standard consumer `0x86825`, specialized loop `0x86C99`, specialized token consumer `0x86CC5`, and direct-descriptor renderer `0x9377C` by code-slice hashes and control-flow joins;
- authenticates token-0/token-1 behavior only to the bounded level stated above;
- reconciles the machine-readable O95G report and all uncertainty boundaries.

Regression gates:

- O95B: **54,200 / 0 failures**
- O95C: **54,199 / 0 failures**
- O95D: **54,335 / 0 failures**
- O95E: **54,186 / 0 failures**
- O95F: **54,213 / 0 failures**

## 7. Boundary / closure status

Fixed numeric identity witnesses now total **five**:

1. slot 12 / Family A / index 7 -> 8 `GO.GRA` standard composition frames -> token 0;
2. slot 7 / Family B / index 1 -> 6 `RD0.GRA` standard composition frames -> token 0;
3. slot 6 / Family A / index 0 -> 7 `ST0.GRA` standard composition frames -> token 1 to stream start;
4. slot 1 / Family B / index 1 -> 6 `EXPLODE.GRA` standard composition frames -> token 0;
5. slot 0 / Family B / index 2 -> 5 direct `HH2.GRA` descriptors through specialized consumer -> token 0.

Still open:

- remaining constant-identity routes;
- all 12 copy/dynamic identity writes;
- complete consumer-family classification for all selected pointers;
- specialized `0x86CC5` control grammar beyond the bounded token forms above;
- broader stream/control corpus, multipart and branching coverage;
- animation timing/dwell semantics;
- human names and complete per-identity animation coverage;
- all other MK2 closure gates from O95A, especially stages/backgrounds/dynamics, remaining palette slots, unresolved graphics relevance and non-MID music verification.

**MK2 animation closure remains OPEN.**

## 8. Next small pass

**O95H — selected-pointer consumer-family census.**

Before promoting more individual routes, census every executable consumer reached after Family A/B selection and classify the pointer-use families structurally: O95C standard composition interpreter, O95G direct-descriptor consumer, data/metadata dereference-only paths, scheduler wrappers, and unresolved paths. This prevents forcing incompatible selected-pointer layouts into one animation grammar. Only after that census should fixed/dynamic identity coverage be expanded within each qualified consumer family.
