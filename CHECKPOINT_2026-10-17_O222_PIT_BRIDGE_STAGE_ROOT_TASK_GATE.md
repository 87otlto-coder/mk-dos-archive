# MK DOS Archive — O222: Pit stage roots source-link background actor task gate

**Date:** 2026-10-17. **Predecessor:** O221. **Status:** original source/static code and LE relocation VERIFIED; active runtime stage-mode and callback invocation NOT observed.

Original MK2.EXE hash pinned `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`, original PIT.GRA hash pinned `af6c10b676011cbbd0b8ef3fe4523cf52b36ebd3be15b2dcb4190b9a34c81d96`.

## Original executable links

The authenticated Pit stage is stage index **6**. Its three relocated stage-lookup fields select the original Object-2 roots:

- mode-2 table `0x15BEC + 6*4` → root `0x18990`;
- mode-1 table `0x15C68 + 6*4` → root `0x18A1C`;
- fallback table `0x15CE4 + 6*4` → root `0x18A1C`.

**Both roots** carry the same original type-7 LE-relocated Object-1 callback link at offset `+0x10`, targeting Object-1 `0x2155E` → physical `0x831B2`.

Original code `0x831B2..0x831D7` compares global `0x3014C` against 0 and against 1. Either value returns without a task allocation. Otherwise code loads EBX=6 and the **relocated callback pointer** `0x21584` (physical `0x831D8`) into EDX, then calls original task allocator `0x67222`. EDX callback begins the paired bridge-actor setup and animation loop source-qualified in O221.

This is the formerly missing **stage-root → callback gate → task allocator → actor-list animation** source connection. It is stronger than a descriptor coincidence. The observed runtime branch selection remains unknown. EBX=6 at registration is not automatically the same clock meaning as the separate O221 EAX=6 scheduler yield.

## Reproduction / tamper tests

`scripts/verify-o222-pit-bridge-stage-activation-gate.py` validates original fixture hash, 27,004 original LE relocations via preserved O120 parser, all three stage-table links, both root callback fields, exact code bytes, gate branches, original callback pointer relocation and allocator relative CALL destination.

- Six deliberate source changes all rejected (two root pointers, stage table, mode gate, callback pointer, allocator call).
- Two fresh reruns produced exact identical JSON SHA-256 **`0fbbc6d59284707d00602147bddc0d4383e321555b4f13637d445a864e34d41b`**.
- Machine evidence `research_outputs/O222_PIT_BRIDGE_STAGE_ROOT_TASK_GATE.json`.

`python scripts/verify-o222-pit-bridge-stage-activation-gate.py --game-zip /original/owner-mk2.zip --project . --out /new/nonexistent-output`

## 50fps continuity and remaining limits

The earlier owner-exercised Portal GIF/DOSBox testing establishes nominal **50fps DOS presentation** across roughly 50%-110% CPU-cycle configurations. Never substitute the 30fps sampling recording for native output speed. Original task scheduling also depends on source scheduler state and is not proven to match rendered frames 1:1 (O168). No definitive bridge sprite milliseconds or displayed pose frequency yet.

Other unresolved Pit II questions: live mode/callback activation and exact timer relation; upper-stage camera/compositor; fatality dispatcher; actual runtime stage and blood palette handle/DAC state; sprite54 crack layering and blood particle updates; sound/title scheduling; possible graphic58 use.

This pass is additive: every inherited original project/research file stays unchanged, commercial owner data remains separate, and no executable patch or full app build is claimed. The next pass, if source research continues, should be a *single narrow* targeted runtime trace proposal or callback activation witness—not an unsupported patch.
