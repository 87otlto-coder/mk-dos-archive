# MK DOS Archive — O126 continuation

O126 documents the source-level lifecycle of the MK2 stage-configuration mode at Object-2 `0x3014C`. See `CHECKPOINT_2026-10-12_O126_STAGE_MODE_LIFECYCLE.md` for the evidence, bounded claims and reproduction steps.

**Key new qualification:** the original conditional integrity reset writes mode 2, while two other code paths temporarily write mode 3 and restore their previous value. Mode-1 and fallback tables differ at indices 0 and 4; Tomb and Portal have equal roots across those two modes. No live mode/handle has been observed.

The preserved O125 handoff remains in the archive, along with historical MK1/MK2/MK3 source work. Development source excludes original MK2 commercial executable and graphics assets.

**50 passes is a limit, not a goal.**
