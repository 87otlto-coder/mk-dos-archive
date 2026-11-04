# MK DOS Archive — O95O Final Held Selected-Pointer Route Qualification

**Date:** 2026-10-08 (SAST)  
**Game:** Mortal Kombat II DOS  
**Pass:** O95O — final 16 selected-pointer routes held after O95N  
**Status:** VERIFIED / MK2 RESEARCH STILL OPEN

## Scope and source authority

O95O uses the authentic SHA-256-pinned MK2.EXE (`fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`) and the exact 16-route union of the previous O95H/J/L/M/N held categories. No semantic inference is imported across these categories. It is specifically a selected-pointer **consumer-provenance** pass, not a fighter/move/timing inference pass.

The O95N source ZIP and the genuine fixture ZIP passed integrity checks. The 876 previously tracked source files were independently checked against the O95N manifest with **0 missing / 0 extra / 0 hash mismatches** before any O95O edits.

## Result: two newly terminal-qualified routes

1. **Family A `0x69C3D` (O95H cursor-transform hold):** `0x918F1` selects a pointer, `0x69C42` advances global `0x75A78` by exactly **16 bytes**, bounded read-only table fetch `0x67AEF` → `0x81B00` and cadence helper `0x6433F` preserve the selected cursor, and `0x69C62` reaches authenticated dynamic dispatcher `0x6435A`. This is a terminal-qualified **+0x10 byte derivative**, not a named frame/command.
2. **Family B `0x95B69` (O95J cursor-replaced hold):** two exact segment-navigation calls to `0x6334A`, bounded position comparison at `0x643D6`, cadence setup `0x6433F`, and O95M-qualified scheduler cursor preservation at `0x6710F` lead to `0x6435A` at `0x95BA7`. Replacement at `0x95C13` happens later; it must not invalidate earlier qualified consumption.

O95O therefore advances the conservative selected-pointer coverage across all 253 authenticated Family A/B lookup calls:

- **210 / 253 strict terminal-qualified** (208 + 2)
- **239 / 253 strong consumer-qualified** (237 + 2)
- **14 / 253 without a strong qualified consumer** (16 − 2)

## Four conditional consumer paths, not promoted to strong

- O95J **`0x67CAC`**: after three segment skips and yield, a known dynamic dispatcher call exists at `0x67CFE` before overwrite `0x67D56`. An optional sound/event helper `0x8140E` intervenes and is **not** universally qualified as selected-pointer-preserving. The bypass path is real, but the route is held as CONDITIONAL, not universally terminal-qualified.
- O95L **`0x716E1`** and **`0x721A4`**: earlier-established conditional dynamic paths remain conditional because `0x70F30` may redirect through an indirect `jmp ebx` before dispatch.
- O95L **`0x91D3D`**: returning-path continuation reaches `0x6435A` at `0x91D64`; however, helpers `0x931C0`, `0x632B8`, and `0x91DC3` can redirect control before the call. The selected cursor's saved baseline alone is not sufficient for strict qualification.

Conditional routes are included in the **14 weak/held total**; a possible path is not counted as universal selected-pointer consumer proof.

## Important correction to O95N's branch interpretation

The original O95N narrative called `0x71579` and `0x73F8A` **overwritten by a later lookup**. Authentic instruction-boundary analysis contradicts that particular interpretation:

- `0x71579` executes `jmp 0x715A8` at `0x71583`, **skipping** the later alternate-path lookup `0x7159E`.
- `0x73F8A` executes `jmp 0x73FC5` at `0x73F94`, **skipping** the later alternate-path lookup `0x73FBB`.

Each originating path instead tail-enters scheduler wrapper **`0x6394C`**, at `0x715D0` or `0x73FED` respectively. Neither originating path establishes `0x75A70 = 0` at the skipped alternate-branch setup site. Wrapper `0x6394C` can invoke a nonzero callback through `0x75A70` before dispatcher `0x6435A`. Selected-pointer provenance across that callback is not qualified on these paths. Consequently **both remain held, but their correct classification is conditional/callback-wrapper provenance rather than definitely overwritten by the other branch's lookup.**

This checkpoint supersedes that **specific** O95N explanation; O95N's 31-route census remains intact.

## Remaining 14 without a strong qualified consumer

| Origin | Count | Routes |
|---|---:|---|
| O95H | 0 | — |
| O95J | 2 | `0x67CAC` (conditional), `0x961ED` (overwritten) |
| O95L | 6 | `0x63345`, `0x68EAE`, `0x716E1` (conditional), `0x721A4` (conditional), `0x7E629`, `0x91D3D` (conditional) |
| O95M | 1 | `0x699EA` (reselected/overwritten) |
| O95N | 5 | `0x63901`, `0x63910`, `0x71579`, `0x73F8A`, `0x918DD` |
| **Total** | **14** | 4 conditional and 10 structural-only |

No routes have been silently merged into an "other" class.

## Validation

- Authentic fixture, exact executable SHA-256 required.
- O95O TypeScript real-fixture execution: **SUCCESS, 47 machine/partition checks**.
- Completely separate Python evidence verifier: **152 independent checks / 0 failures**.
- O95N regression independently rerun: **72 / 0**.
- O95M regression independently rerun: **75 / 0**.
- Previous O95N 876-file archive inventory: **0 missing / 0 extra / 0 hash mismatches**.
- Independent negative control (forged terminal promotion of held `0x67CAC`): **REJECTED as intended**.
- Inherited artifact SHA-256 and ZIP integrity: **PASS**.

The independent verifier anchors the sixteen historical route identities separately to O95H/J/L/M/N, checks authentic x86 call/jump/overwrite operands and corrected branch direction, and deliberately rejects attempts to count conditional paths as strong.

## Explicit non-claims

O95O does **not** establish human fighter identities, move names, graphical effect labels, frame rate, wall-clock timing, global animation grammar, universal callback behavior, or complete MK2 research closure. The known dispatcher still only qualifies nonzero selected tokens along preserved paths.

## Next bounded research area

**O95P — MK2 animation/exportability closure ledger.** With the remaining 14 paths explicitly accounted for, audit extractor-relevant animation/control/export obligations against authenticated consumers and root/asset coverage; make a clear blocker ledger rather than endlessly reopening selected-pointer holds. Then work systematically through unresolved MK2 stage/background, palette contexts, non-exact-full `.GRA` classifications, and hardware-specific non-`.MID` sequence/audio verification, consistent with the original O95A completion gate. **MK2 remains OPEN.**

The project order remains **finish MK2 → finish MK1 → finish MK3 → discuss UI/usability with the user → only then build the extractor**.
