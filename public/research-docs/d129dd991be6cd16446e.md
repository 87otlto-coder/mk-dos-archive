# MK DOS Archive — Pass 1E.3O.37 CAVE Special-Object Random-Phase Qualification

**Status: VERIFIED.**



## CAVE special-object random-phase / palette qualification — VERIFIED

O37 closes the CAVE special-process-object gap left by O31. Unless numeric `GSTATE == 11`, callback `0x4680` spawns process `0x2025` at `0x4699`. The child creates six `BAKLST9` objects from exact offsets `(57,100)`, `(96,112)`, `(128,106)`, `(230,106)`, `(268,112)`, `(396,112)`. Their creation record directly binds descriptor `0x264C` and the three-colour `eyez2` palette at `0x0001003A`; all six unique FU7 cycle descriptors decode with every opaque index in range. Each object receives one sequential `RANDU(28)-1` call, establishing an initial visible phase domain of 0..27 without establishing the RNG seed/state. The linked six-object set advances through the same 28-slot table every eight scheduler ticks. `BAKLST9` is rendered before plane 8 using `WORLDTLX8` and shared `WORLDTLY`; object flags remain `2`, so 0x4000 scroll bypass is absent and creation-state projected offsets equal the coordinate table. Independent byte/decode audit passed. Verdict `MK1_CAVE_SPECIAL_OBJECT_RANDOM_PHASE_AND_PALETTE_BINDING_ESTABLISHED`.


Source implementation: `src/games/mk1/research/caveSpecialObjectPhaseQualification.ts`; smoke runner: `scripts/run-cave-special-object-phase-qualification.mjs`. Read-only; writer surface unchanged.
