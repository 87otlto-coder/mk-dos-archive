# O240 — Pit II falling-object gravity consumer and frame composition

**Status:** VERIFIED original-executable byte/call edges; CONDITIONAL inference about time and live actor membership. Strictly additive research after O239. No original game file altered.

## Original-source result

O239 proved that the Pit fatality owner was configured with signed 16.16 `object+0x14 = 0xFFF70000` (−9.0) and `object+0x0C = 0x00004800` (+0.28125), using the common initializer at physical `0x63940`.

The original frame-composition routine at physical `0x933C2` reads main fighter pointers at `0x75FC2` and `0x76146`. It conditionally calls `0x93884` once for each non-null fighter (`0x9341B` and `0x9342E`). The callee has an X-boundary/check path leading to the following actual velocity-integration tail:

```
0x938B6  mov esi,[edi+0x0C]
0x938B9  test esi,0xFFFFFFFF
0x938BF  je 0x938C9
0x938C1  mov ecx,[edi+0x14]
0x938C4  add ecx,esi
0x938C6  mov [edi+0x14],ecx
```

The same composition path then updates the original 16.16 camera-position accumulators beginning at `0x93433`, previously recovered in O236. The shared frame loop has multiple conditional paths into `0x933C2` (calls at `0x6707B`, `0x670A2`, `0x670BD`), including paths that do not entail the same display-memory transfer. **Do not equate calls, scheduler ticks, and presented frames.**

In isolation, each execution of this tail against O239's unmodified object values adds exactly `0x4800` to the falling object's 16.16 vertical velocity. At update 31, velocity would be −0.28125; update 32 gives exactly 0.0. The O237 camera task ignores negative owner motion and also requires owner screen-relative Y ≥96 before copying its velocity to the stage vertical increment at `0x842E4`.

A hypothetical one-integration-per-50-fps-presentation cadence gives a 0.64-second time to reach zero. This is **not** a verified runtime duration. The parent task owner is not yet proved equal to either non-null main-fighter global on every composition. Other writes, update cadence, and position integration remain unresolved.

## Validation and reproducibility

`python scripts/verify-o240-pit-fall-gravity-consumer.py --game-zip <original owner mk2.zip> --out <fresh new dir>`

Authenticates unchanged original `MK2.EXE`, `PIT.GRA`, `FALL.GRA`, verifies original byte sequences and direct relative-call targets, rejects 23 deliberate source mutations, and emits JSON. Two independent fresh runs were byte-identical (SHA-256 `b967c47599fd5f37f4aa650a84b1ded47c64829913b87443c39398e80d4cbeb7`).

## Next narrow research

Recover actor fixed-point position stepping relative to the gravity and stage-update calls; qualify live owner/main-fighter identity and callback cadence; compare a source-predicted motion model with the user recording **only** after the initial position and scheduling relationship is supported. Graphic 58's selector-to-screen discrepancy, impact crack/spray compositing and the genuine fatality dispatcher are still unresolved.
