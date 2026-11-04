# MK DOS Archive — O226: Original falling-fighter pose loop and distinct impact graphic

**Date:** 2026-10-17. **Predecessor:** O225. Source-authenticated original MK2.EXE typed relocations plus separately inherited O215 video evidence, not a live animation timing trace.

An original Object-2 animation-list byte sequence at `0x1405C` (physical `0xB4CB0`) has exactly five original type-7 relocation-backed descriptor pointers to `FALL.GRA` sprite descriptors **42, 43, 44, 45, 46**, in that original order. Each descriptor is also reached through a separate relocation-backed pointer in the original source's 8-byte units at `0x14084..0x140A4`. The sequence ends with DWORD loop marker **1** (`0x14070`) and a typed back-pointer to original `0x1405C` (`0x14074`). Three distinct original Object-2 pointer-table cells at `0x13DE4`, `0x13DE8` and `0x13DEC` all link to this same falling-loop list.

Original **impact pose 47** has a separate descriptor at physical `0xC3BEC`, referenced from original Object-2 `0x1407C` through descriptor-pointer unit at `0x140AC`. This places the impact artwork outside the five-pose looping list and corresponds to the independently identified later O215 video pose. This does **not** prove the entire original fatality control flow or exact physics logic; typed source structure is not itself a dynamic trace.

Independent O215 30fps video matching identifies 42,44,46,43,45,46,42 during sampled descent and then graphic47. That sample order is **not** the original list order; both original findings must be retained until a true runtime frame/cursor/timer witness reconciles them. Do not infer alternating skipped sprites as an established schedule or silently rewrite the original list based on video.

`scripts/verify-o226-pit-falling-pose-list.py` independently checks original EXE/FALL SHA-256, 26,994 typed LE fixup sites, exact 5-entry loop and independent impact source, carries forward O215's original source-video hashes and pose records, and rejects six deliberately altered evidence bytes. Two fresh reproductions produced byte-identical `research_outputs/O226_FALLING_FIGHTER_SOURCE_POSE_LIST.json` with SHA-256 `77cf60856a76b3b3395d355d629f2a0e93320a7688dd6573df7e758620589f3c`.

```
python scripts/verify-o226-pit-falling-pose-list.py --game-zip <original-user-mk2.zip> --project . --o215-report research_outputs/O215_FALL_POSE_TIMELINE.json --out <new-absent-output-dir>
```

No original binary, historical source, UI or existing research report modified. This is incremental static source archaeology, not a reconstructed DOS event dispatcher or playable fatality implementation.
