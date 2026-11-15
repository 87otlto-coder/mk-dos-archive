# P91 portable native Tomb capture deployment gate

**Current status: Windows portable build/run acceptance pending; no MK2 runtime capture.**

This branch starts from `e99bc73cb586b2275f5b4907d0e9921028e74a9f`, preserving
the tested combined four-phase observer. It introduces a strict source-safe
portable inventory and a Windows package build gate.

## What the new gate tests

1. The committed adapter source and the portable inventory's nine
   original-free corruption/refusal tests.
2. An exact upstream DOSBox-X checkout at
   `029bd65c5dcc7cdc7f2e14e35278620d9707d969`.
3. The pinned normal-core C++ overlay, with source/blob guards, and Windows
   SDL2 native compilation.
4. The actual no-game observer's RAM/DAC/hook parity.
5. Staging a portable `P91Capture` directory with the exact built EXE,
   the exact patch hash, approved source-safe scripts, and original DOSBox-X
   license.
6. Copying the emulator's dynamically linked MinGW DLL dependencies.
7. Sealing and re-reading the SHA-256 inventory and identity without any
   original commercial game assets.
8. Running the staged executable directly (unarmed, armed, rearmed) from
   the portable folder with no game mounted. No-overwrite and raw-packet
   exclusion remain mandatory.
9. Publishing only a single one-day, source-safe Windows package artifact
   **if all preceding gates pass**.

## Overlapping development gate

A parallel `research/p91-native-observer-smoke` portable workflow
[`p91-portable-capture-windows.yml`](../../.github/workflows/p91-portable-capture-windows.yml)
was also launched in the source project. Its recursive DLL closure and
**restricted PATH** execution checks are stronger for true portability.

**Do not approve a local game launch solely on success of this branch's
workflow.** Require the stronger isolated-DLL/PATH test to pass and confirm
the exact kit's build identity. Never treat two concurrent build artifacts
as interchangeable.

## Remaining native scope

No original DOS Mortal Kombat II game was executed by either Windows CI
workflow. No actual loaded LE object bases, native indexed framebuffer,
presented DAC or a valid Tomb mode-2 packet have been observed. The user
should not be asked to troubleshoot an unverified installer or launch script.

Keep all original/extracted game bytes in `F:\Dev\MKEXT\FIXTURES\`,
all source in `SOURCE\`, and external binaries in `TOOLS\`.
