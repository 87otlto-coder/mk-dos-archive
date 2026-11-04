# O244 — Pit II fatality stage-command-list transition

**Status:** Original executable source verified, two independent exact report reproductions, 17/17 deliberate source mutations rejected. Read-only and additive after O243. Does not establish runtime execution, presentation timing, active player identity, graphic 58 on-screen display, or the live movement gate.

## New source finding

There are three **different code-selected scene-command lists** relevant to The Pit:

| Situation | Original Object-2 offset | Original EXE physical | Positive entries |
|---|---|---|---:|
| Ordinary Pit rooted stage command list (O130) | `0x18AA8` | `0xB96FC` | 10 |
| Fatality upper/pillar camera handoff | `0x13CEC` | `0xB4940` | 10 |
| Fatality lower/rock scene | `0x1410C` | `0xB4D60` | 4 |

The original fatality handler at physical `0x80190` sets `EAX = 0x13CEC` and `0x80195` copies it to the shared renderer-command pointer `0x75CF6`. The previous O129 interpreter at `0x93500/0x93547` reads that pointer and dispatches positive pointer-pair commands to `0x93390`. The upper fatality command list contains ten pairs, and is **byte-identical** to another original fixed list at `0x15D60` (O129). That duplicate does not imply the game is running the Cave stage: these are reused object-list control commands, not sprite-resource identifiers.

The normal Pit stage's ten-entry list differs in the ordering of its final entries: the fatality's upper list has list `0x84350` **before** `0x84358`, whereas the ordinary Pit root has `0x84358` before `0x84350`. Do not infer displayed occlusion from that ordering without accounting for the renderer's object-order semantics.

After the camera-task countdown, source `0x8045B` branches to `0x8054A`, which sets a scene flag and **explicitly clears** `0x75CF6` at `0x80554–0x8055A`. The lower-scene code allocates another object (`0x8056A -> 0x85BE3`), then selects the **four-entry** command list at `0x805C4–0x805C9`. The first lower-animation loop yields (`0x805F9 -> 0x6710F`) and calls the authenticated `FALL.GRA` selector (`0x805FE -> 0x80721`), repeating through `0x80603`.

The lower list includes only `[0x8434C, 0x84350, 0x84358, 0x84360]`, all paired with vertical/horizontal-origin pointer `0x8432E`. It excludes **all six** separate bridge-scene list heads processed in the upper camera handoff: `[0x84348, 0x84344, 0x84340, 0x8433C, 0x84338, 0x84334]`.

This gives a concrete source-backed mechanism for the **change from pillar scenery to lower environment**: the renderer receives a reduced object-list command set after the scene handoff. It does not prove which exact frame first presents the new scene. No original source relationship was established that resolves graphic 58's missing video witness.

## Correct confidence boundaries

- **VERIFIED:** original commands, three fixed list byte contents, ten-to-four reduction, omitted six bridge list heads, renderer's shared list pointer consumption, code order, lower FALL selector call, original EXE/PIT/FALL SHA identities.
- **INFERRED:** reduced list explains the observed bridge-column disappearance; the source code admits this mechanism, but live framebuffer presentation has not been observed.
- **UNKNOWN:** player-slot identity of the fatality callback's EDI, live `0x762DE` gate, exact camera trajectories, 50 fps vs task/frame update cadence, and whether selector graphic 58 survives to a displayed frame.

## Reproduction

`python scripts/verify-o244-pit-scene-command-stream-switch.py --game-zip <canonical original MK2 zip> --out <new empty directory>`

Two separate executions yielded byte-identical JSON SHA-256 `ef4f2d3da0a271aeef94d2a4e7768443a977b0b94c245c7018b804bdf13190a5`, with 17 original-byte corruption controls rejected. The verifier does not write to game assets, assert a new build, or manufacture a runtime trace. See inherited O129/O130 for the independent original relocation-type evidence behind these lists.

## Next work

Keep the O243 actor-owner and live position-gate question open. A narrow next source-only option is tracing the activation predicate and object ownership of the original camera task at `0x801B8` without assuming proximity is a callback relation. A read-only emulated runtime trace may eventually be needed; the original file offsets must not be confused with virtual runtime addresses. For graphic 58, trace whether the selected `0x70B` tile objects reach a presented frame rather than postulating frame loss.
