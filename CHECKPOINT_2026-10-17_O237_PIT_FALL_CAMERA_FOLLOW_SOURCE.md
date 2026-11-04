# O237 — Original Pit II fall camera follows selected actor motion

**Status:** VERIFIED SOURCE CONTROL PATH / RUNTIME ACTIVATION NOT PROVEN.

## Inputs and inheritance
- Owner-supplied canonical MK2 original archive `mk2(2).zip`, file `mk2/mk2.exe` SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.
- Source-preserving continuation after O236. Original user files and owner video are not shipped or altered.
- O234 verified 6-layer coordinate rebasing at `0x80202` and camera vertical motion clearing at `0x842E4`.
- O236 verified genuine original accumulator: vertical motion DWORD `0x842E4`, position DWORD `0x842E8`, signed video Y origin word `0x842EA`.

## Original code established
A bounded code path immediately following O234's layer rebasing controls camera movement during a falling-object phase:
1. `0x802DE` sets a loop countdown at `0x75A7C` to 104. `0x802E8` calls scheduler yield `0x6710F` with `eax=1`, decrements the countdown, and branches to `0x803F6` when it reaches zero.
2. The current object pointer is global `0x75A80`. Its signed X coordinate at `+0x1A` is compared with the stage X origin `[0x8432E] + 159` and near-center tolerance 6; conditional code chooses a callback at `0x75A6C`.
3. `0x8033D..0x8034B` reads the selected object DWORD at `+0x14`, staging it into global `0x75A70`.
4. `0x8034D..0x80357` branches back to the scheduler when that staged value is negative.
5. `0x80359..0x8036E` computes signed object Y `+0x1E` minus signed screen Y origin `[0x842EA]`, and branches back if that difference is **less than 96 native pixels**.
6. When both tests permit, `0x80374..0x80382` copies the staged object +0x14 DWORD to the exact stage-camera velocity DWORD `[0x842E4]` and loops. O236 independently verified that this movement field feeds the stage vertical position accumulator.
7. The routine eventually continues through `0x8045B -> 0x8054A` into later fatality code.

## Confidence and limits
- VERIFIED: authentic source code, branch destinations, constant 96, object field +0x14, camera motion destination, task count 104, relationship to O234/O236 and conditional horizontal steering.
- INFERRED: this is the exact moving-camera behavior responsible for the pillar descent in the owner's video. The source path lies in the established fatality precursor and the geometry/video evidence is compatible.
- UNKNOWN: live identity of selected object at `0x75A80`, object motion values during each callback, actual number and cadence of display updates, absolute pillar Y travel across 96-pixel texture aliases, whether FALL graphic 58 reaches the presented framebuffer, ultimate stage-fatality dispatch entry.

## Reproducer
`python scripts/verify-o237-pit-follow-camera-source.py --game-zip <owner original MK2 archive> --out <new empty destination>`

- Two independent runs against original fixture produced identical output SHA-256 `b78ef5fcd5473fb4d5499a545adb88c34258306298c3bf4e0200a1cec8c07055`.
- **20/20 deliberate source mutations rejected**, including control branches and both ends of the camera-motion data flow.
- No game executable patch, synthetic camera curve, UI edit or complete stage renderer asserted.
