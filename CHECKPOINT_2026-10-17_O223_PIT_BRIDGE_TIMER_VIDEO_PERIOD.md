# MK DOS Archive — O223 Pit II distant fighters: measured loop and source timer correlation

**Date:** 2026-10-17. **Predecessor:** O222. **Scope:** read-only original-source + independent owner gameplay-video temporal verification. The original 50 fps DOS-port presentation observation remains intact.

## Finding

The two original `PIT.GRA` distant actor sequences each have seven frames and the original callback issues `EAX=6` to scheduler yield. The original `MK2.EXE` programs timer divisor `0x4D9D = 19869` in PIT mode `0x36`. The original `RM.DRV` interrupt handler increments the scheduler counter; the original scheduler decrements the task-yield countdown by one per task traversal. Under a **conventional IBM PC timer input-frequency assumption** of 1,193,182 Hz, this divisor implies approximately **60.0524 interrupts/s**. If one countdown decrement accompanies each interrupt, a full seven-frame / six-count sequence predicts **0.69939 seconds**, equivalent to 20.98 frames of the 30 fps capture.

**Independent observation:** Both original Pit actor screen regions exhibit an especially strong source-video image recurrence every **21 captured frames / 0.700 seconds**. ROI coordinates are O220-verified source matched locations; a variable-pixel mask is learned on recording frames 0–44 and frozen. All lag comparisons then run on **held-out recording frames 100–169**. Native video capture remains 30 fps; do not equate that with game output 50 fps.

| Capture lag | Green ROI mean RGB MAE/255 | Flaming ROI mean RGB MAE/255 |
|---|---:|---:|
| 20 frames | 4.361511 | 6.764015 |
| **21 frames** | **3.394253** | **4.744561** |
| 22 frames | 4.631790 | 6.811711 |
| 25 frames (near false 50-Hz-as-task-timer prediction) | 9.180328 | 13.971990 |

Both actors have an independently corroborating second-loop recurrence at 42 video frames. Thus the approximate 0.7-second cycle is a genuine recording feature, not merely a numerical model coincidence, and the verified source PIT timer/yield/descriptor counts agree closely. This independently reconciles 50 fps observed presentation with approximately 60 Hz source timer/scheduler behavior *without claiming they are the same clock*.

## Confidence boundary

**VERIFIED:** original divisor, source task-yield count, source scheduler decrement/increment opcodes, O221 seven-frame lists, original capture periodicity, held-out mismatch controls and strict original input hashes. **INFERRED, conditional:** one source scheduler task traversal per timer interrupt and a 6-count task yield meaning six 60Hz visits in the live recording. **UNKNOWN:** actual live IRQ servicing/dropped events, full scheduling cross-thread relationship, exact intermediate 50fps presentation poses, callback activation traced in RAM, sprite compositing/order.

## Verification

Read-only `scripts/verify-o223-pit-bridge-timing-60hz.py` accepts canonical owner MK2 ZIP (MK2.EXE, RM.DRV), original upper Pit recording, and a nonexistent output path. It confirms hash pins for all inputs, source opcode ranges, validates independent video recurrence, and rejects 4 deliberately corrupted source conditions (timer divisor, 6-count yield, task countdown decrement and driver's IRQ counter increment). Two separate executions produced byte-for-byte identical `research_outputs/O223_PIT_BRIDGE_TIMER_AND_RECORDED_LOOP.json`, SHA-256 `3cce0d4ba54a700e96942d4bdc9c4488c2a12343036b528e4f19a98d8fb4dd15`.

Reproduce from source project root:

```
python scripts/verify-o223-pit-bridge-timing-60hz.py --game-zip <original-user-mk2.zip> --pit-video <original-140419.mp4> --out <new-not-existing-dir>
```

**All O222 source members were preserved. No MK2.EXE/game files were modified, no binary patch, no UI change, no full Vite build claimed.** Next narrow question: source sprite58's actual control-flow role in fatality lower-scene sequence; or specific fatality/blood overlay runtime callback identification. Do not treat inferred source-to-video consistency as an independently observed RAM trace.
