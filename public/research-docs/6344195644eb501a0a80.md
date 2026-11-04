# MK DOS Archive — O97H — Authentic Mountain Configuration Callback is Bare RET

**Date:** 2026-10-09 SAST  
**Status:** Fixture-authenticated, independently verified · MK2 RESEARCH OPEN  
**Parent:** `MK-DOS-Archive-2026-10-09-O97G-source.zip`.

## Qualified finding

O97G authenticated the installer that conditionally writes the 39-image tower setup to runtime slot `0x77453`, the explicit marker 1 to `0x77457`, the ten-image landscape setup to `0x7745B`, and control-cursor pointer `0x15D60` to global `0x75CF6`. Its bounded precondition included an indirect callback at `0x81F47` which had not yet been resolved.

O97H independently verifies that the callback source is **Object-2 offset `0x1C2F6`**, whose Type-7 LE fixup targets **Object-1 offset `0x21227`**. The authenticated Object-1 file-backed physical base is `0x61C54`, resolving the callback to **file physical `0x82E7B`**; the byte at this address is exactly **`C3` (`RET`)**. The caller sequence at `0x81F41..0x81F49` reads this relocated DWORD into EBX, increments EAX, pushes EAX, invokes `CALL EBX` (`FF D3`), then restores EAX after the immediate return. No callback-side transformation is performed by this one-instruction routine.

Therefore the **callback itself** does not block the O97G conditional installer. Entry into `0x81EB2`, the preceding resource-loading calls `0x62658` / `0x65521`, initialization state, scheduler coactivation, visibility of both sets in the same frame, camera/crop semantics and RGB remain **UNPROVEN**.

## Hypotheses

- **SUPPORTED:** selected configuration callback is an immediate return with no local register/data-memory writes.
- **REJECTED:** this callback mutates the scene setup state before it returns.
- **UNPROVEN:** the scene definitely executes in gameplay; both scenes draw in a frame; this is a jump or fatality; full-screen output is correctly colored.

## Independent testing

- Node fixture producer **PASS**.
- Separate Python verifier **27,137 checks / zero failures**, independently reparsing all **27,004 LE fixups**.
- Deliberately falsified claims **3/3 rejected**: invented callback side effect, altered callback opcode, invented runtime activation. Untampered evidence reverified.
- Previous O97F and O97G independent verifiers passed **27,463** and **27,185** checks respectively; the Mountain regressions O97E, O97C/D, and O96X/Y passed during this continuation.

**Evidence:** `mk2_mountain_preinstaller_bare_ret_o97h_2026-10-09.json`.  
**Producer:** `scripts/run-mk2-o97h-mountain-callback-qualification.mjs`.  
**Independent verifier:** `scripts/verify-mk2-o97h-mountain-callback-qualification.py`.

## Next: O97I

Research the earlier resource loader return contracts and dynamic selection/invocation predicates for index 13. Then qualify whether both installed setup slots are traversed in the same renderer cycle. Do not convert machine-code existence into runtime-observed execution, or misclassify jump/fatality semantics. If this path stalls, pivot to other remaining MK2 palette, graphics, audio and animation reachability blockers.

**Order remains:** finish MK2 → MK1 → MK3 → discuss usability/UI → build extractor.
