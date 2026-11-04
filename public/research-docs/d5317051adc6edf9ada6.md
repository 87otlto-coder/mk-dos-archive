# MK DOS Archive — O110H–O110J — palette handle lifecycle and stage-join boundary

**2026-10-10 | Original DOS MK2 | INTERIM RESEARCH NOTE — 3/30 substantive passes since O110G**

The user increased the consolidation/handoff cadence from two to **30 independently verified substantive passes**. This is not a consolidated checkpoint. **MK2 remains open.** Original game EXE/GRA files were read-only throughout.

## O110H — Palette handle lifecycle

Machine-authenticated code at `0x7B41F`, `0x7B404`, `0x7B439`, `0x7B505`, `0x7B536`, `0x7B55E` establishes an eight-byte-stride palette handle table with **60 entries** starting at loaded address `0x75B00`:

- `+0`: palette record source pointer, DWORD;
- `+4`: reference count, WORD;
- `+6`: VGA palette-bank base/start, BYTE.

Reset clears 120 DWORDs (480 bytes). Request searches for pointer equality and increments an existing slot's count, otherwise selects a zero-reference-count slot, stores the pointer and allocated bank-base, and increments the count. Allocated bank-base is dependent on existing live entries. Release decrements the count and clears the pointer at zero; it does **not** zero the bank-base byte on release. Adjacent routines find by pointer, clear count and evict pointer/count. These are bounded instruction mechanics, not observed state during any particular scene.

Exact `E8 rel32` destination encoding corpus inside file-backed Object 1: 23 request, 2 reset, 2 find, 2 release, 0 clear-count, 0 evict-pointer, 1 stage draw, 1 stage pixel blitter. This is a **byte-pattern census**, not a control-flow execution profile. The renderer retains palette-handle **index 1**, whose live owner is **UNKNOWN**.

Independent verifier: **96 checks, 0 failures**. Adversarial evidence controls: **8/8 rejected**, after requiring the original report to pass first.

## O110I — Nine dynamic palette request sources

Independently bounded all **9** calls not immediately preceded by relocated `MOV EAX,imm32`. The direct source categories include object field `+0x0C`, descriptor-selected indirect palette pointers, an object-indirect word source, an object setup field at `[ESI+4]`, the intro palette-record cursor and an instruction/command-stream cursor. Three returned handles are stored as words into object `+0x30` fields. At the intro image consumer the first allocator return is retained in EDX for bank-base lookup. A token `8` path at `0x9959A..0x995B5` loads a record pointer, requests a palette, and stores the returned handle as a 16-bit word into shared mutable global `0x75A6C`.

This **does not** prove that token 8 executes in a specific stage, or that the stored global reaches stage renderer handle 1. Other site return-value continuations remain source-local, not full execution traces.

Independent verifier: **81 checks, 0 failures**. Adversarial evidence controls: **8/8 rejected**. A test harness defect in the first test invocation was corrected before acceptance: every negative suite now requires a successful baseline and rejects only intentional `AssertionError` from its verifier (not file-missing/incorrect-argument failures).

## O110J — Distinguish palette handle return from stage selector literal

On the two source-local O110G paths, the request to allocator `0x7B439` is followed by **independent literal stores 5 and 6** into `0x75A80`; the selector writer `0x82321` subsequently **reloads** that scalar into EAX from memory and stores it in `0x7747F`. It does not consume the allocator's EAX as its selector input. On the index-6 path an intervening helper `0x63F99` explicitly zeroes EAX and writes zero to unrelated `0x762CA` before the literal-6 assignment. Thus it is source-backed **negative evidence** against the direct-return-equals-stage-selector shortcut. An allocator-side mutation of live handle state is still possible and no interprocedural stage palette ownership is established.

Independent verifier: **35 checks, 0 failures**. Adversarial controls: **8/8 rejected**.

## Totals and regression

- **212 independent new checks (96 + 81 + 35)**, zero failures.
- **24/24 deliberate false reports rejected**, with authentic baseline reports passing first.
- O110F verifier rerun: **54,399 checks**, zero failures.
- O110G verifier rerun: **47 checks**, zero failures.
- Core invariants: original `MK2.EXE` SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`; no write to original fixture; no newly claimed scene palette, rendered true RGB screenshot, new playable animation, or stage-layer association.

## Reproduce

```bash
python scripts/verify-mk2-o110h-o110j-batch.py /path/to/original/mk2
```

The batch runner executes independent verifiers, source-provenance parent regressions and their negative controls. JSON reports are under `evidence/mk2_o110h`, `evidence/mk2_o110i`, and `evidence/mk2_o110j`. The four-byte packed selector in O110G still remains conditional on actual execution and persistence. **Next useful work** should seek actual live palette slot-one ownership through an instrumented trace or stronger reachable caller/allocator-state proof; avoid repeating heuristic nearest-palette guesses. The separate unresolved MK2 animation and stage compositing domains remain valid alternatives.
