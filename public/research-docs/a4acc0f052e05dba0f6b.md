# MK DOS Archive — O97L — Mountain Double Addition and Shared-Control-Word Semantics

**2026-10-09 · Authentic MK2 DOS binary · independently verified · MK2 OPEN**

## Verified new executable relationship

O97K qualified ten contiguous `MOV` / `ADD` accumulator update pairs. O97L follows the first accumulator `0x842E8` and its source `0x842E4` within the same bounded straight-line routine into the initialization of the positive-token control walker.

1. At `0x93433`, code loads DWORD `D` from global `0x842E4`; at `0x93438` it adds it into DWORD `A` at `0x842E8`.
2. At `0x934B5..0x934C1`, code copies `D` to global `0x75A74`.
3. At `0x934C3..0x934CF`, code copies the then-current `A + D` accumulator into global `0x75A68`.
4. At `0x934D1..0x934DD`, it adds `D` from `0x75A74` into `0x75A68` again.
5. At `0x934DF..0x934EB`, it stores that new value back to `0x842E8`.
6. Assuming normal return through the subsequent call at `0x934EC` and no intervening mutation of these globals, `0x93500..0x9350C` copies the installed control-list pointer from `0x75CF6` to the active walker cursor `0x75A98`.
7. When the selected control token is positive, `0x93591..0x9359A` loads a **16-bit word** through the second list pointer and overwrites only the low 16 bits of the same global `0x75A68`; its original 32-bit scalar meaning cannot be carried blindly into the positive-token path.

**Bounded algebraic identity:** `A_after = (A_before + 2 * D_before) modulo 2^32` for this consecutive instruction path. This is a machine-code arithmetic relationship, not a video refresh rate, a pixel-per-second scroll speed, or observed DOS execution. The fact that two additions occur in an eligible call *rejects* the narrower claim that this straight-line path contains exactly one accumulator addition; it does *not* disprove one change per video frame under unknown scheduling.

## Independent tests

- Node fixture producer `scripts/run-mk2-o97l-mountain-double-add-and-scalar-multiplex.mjs`: **PASS**.
- Separate Python verifier `scripts/verify-mk2-o97l-mountain-double-add-and-scalar-multiplex.py`: **44 checks / zero failures**; rechecks eight exact opcode segments, ten physical operands, five arithmetic counterexamples including 32-bit wrap, and hypothesis status.
- Three deliberate tamper tests **rejected**: fabricated single-add formula, falsely proven FPS, and modified arithmetic test. Restored original passed.
- Independent O97I, O97J, O97K regressions: **27,192 + 27,191 + 96 checks, all passed**. Combined four new passes: **54,523 checks, zero failures**; nine new falsifications rejected across O97I–L.
- Reproducible runner `scripts/test-mk2-o97l-negative-controls.py`. Original O97F–H regressions were also clean in the joint continuation.

## Evidence and boundary

Evidence: `mk2_mountain_base_accumulator_double_add_o97l_2026-10-09.json`.

**Proven:** setup installation → conditional object producer row 0 and 2 → positive-token control heads → 10 additive control sources → double-addition for base accumulator and later 16-bit field multiplexing on an eligible path.

**Unproven:** this path executes for any particular gameplay scene; both object lists contain visible sprites simultaneously; precise camera offset/cropping; DOS frame timing or FPS; final correct-color output; unrelated jump/fatality meaning.

**Next O97M:** identify runtime initializer(s) and values of the ten accumulator source globals and audit visibility predicates/cropping at `0x931E4..0x93390`. If no bounded advancement, move to remaining MK2 blockers, then MK1 and MK3. Do not start UI/extractor implementation before research closure.
