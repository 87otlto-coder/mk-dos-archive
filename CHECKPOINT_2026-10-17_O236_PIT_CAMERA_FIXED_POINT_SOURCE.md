# O236 — Original 16.16 Pit stage/camera accumulator arithmetic

Status: **CANONICAL SOURCE VERIFIED**, runtime starting state / update cadence unverified.

In frame compositor `0x933C2`, code `0x93433` adds original vertical movement DWORD at `0x842E4` to position DWORD `0x842E8`. The same non-branching routine then stages the two DWORDs at `0x75A74`/`0x75A68`, adds the movement value again, and writes back to `0x842E8` at `0x934E5`. The signed display/camera origin consumed by other original code is the high 16-bit word `0x842EA`. Thus on this **static code path** the update is equivalent to `position += 2 * velocity (mod 2^32)`, with no inference of frame-rate or call count. This is not the claim that the camera moves two visible pixels per displayed frame.

The same frame routine includes nine distinct DWORD position increments from velocity fields `0x842EC` through `0x8430C` (stride 4), respectively accumulated into `0x84310` through `0x84330`. Their high word locations run `0x84312..0x84332`; six (`0x84326, 0x84322, 0x8431E, 0x8431A, 0x84316, 0x84312`) are the **exact** six horizontal-origin fields read by the O234 fatality layer rebasing code. This is direct static linkage between general per-layer motion and the fatality's entry normalization, not just matching byte patterns.

A full pillar-scrolling motion trace still requires capturing the active source initial values, camera motion / task state, and framebuffer presentation or additional suitable video controls. Graphic58 remains unresolved on screen.

Verifier: `scripts/verify-o236-pit-camera-fixed-point-accumulators.py --game-zip <owner ORIGINAL mk2 zip> --out <new empty destination>`. Two byte-identical reports SHA-256 `ce2a7dfe4ee46c67c297d0015e8df51a63df650396ad3119b5dc9460680a7055`; thirteen deliberate source mutations rejected.
