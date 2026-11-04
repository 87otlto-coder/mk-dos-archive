# O238 — Pit II falling-camera task registration and owner-pointer preservation

**Status:** VERIFIED SOURCE CONTROL RELATIONSHIP. Runtime task activation and fighter-instance identity not proven. Read-only, additive after O237.

The original MK2 executable code at physical `0x801A9` finds/allocates a task through `0x672C7`, supplies original logical callback `0x1E5AE` through `0x86AC3` (source task initializer), and writes the current `EDI` object pointer into task record `+0x0C` at `0x801BD`. The original code page rebase `physical = logical + 0x61C54` maps `0x1E5AE` to physical `0x80202`, the O234/O237 falling-camera task entry, and was independently checked against two other original code-offset references.

`0x86AC3` installs callback at task `+0x1C`. Original scheduler `0x6710F` saves working global `0x75A80` to task `+0x0C`; `0x67161` restores task `+0x0C` to global `0x75A80`; `0x67185` jumps through task callback `+0x1C`. The O237 camera-follow loop's reads of `[0x75A80]+0x1A`, `+0x14`, `+0x1E` thus have a source-proven task-local pointer provenance. The global is reusable scratch state and **must not** be assigned a unique semantic meaning outside the current task.

**Not established:** the exact player/loser identity represented by the parent's EDI, live task activation or registration preconditions, precise 50fps-vs-scheduler timing, or graphic58 frame presentation.

Reproducer: `scripts/verify-o238-pit-fall-follow-task-context.py --game-zip <original MK2 fixture> --out <fresh empty result directory>`. Two independent identical JSON reports, SHA-256 `4be72ae4224f72d910d097ba96c0bbf4ab25c84f8fae8a94c5813aa5eb79f6d5`, **16/16 source corruption controls rejected**. All original binaries remain untouched.
