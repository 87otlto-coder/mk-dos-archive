# P91  Standard Chat: first native Tomb capture

Branch: `research/p91-mk2-runtime-snapshot`.
Read `P91_RUNTIME_CAPTURE_RESEARCH.md`, `P91_DOSBOX_ADAPTER_SPEC.md` and the
P91 source plan/collector. P90 static/private projection acceptance is complete
for its intended milestone; do not rerun it.

## Current result

No native snapshot or capture-ready executable exists yet. The tested deliverable
is the loaded-mapping resolver, source capture plan, frame-generation collector,
packet contract and readback oracle. The native adapter is precisely specified,
but its implementation/build/actual execution remain pending. Do not give the
user a speculative game-launch sequence.

## Next work, in order

1. **Implement and validate the native adapter.** Use upstream DOSBox-X
   `029bd65c5dcc7cdc7f2e14e35278620d9707d969`, normal-core hook after LOADIP,
   protected 32-bit code/stack and no paging. Port the collector's four-phase
   protocol. First compile and execute an original-free harness against actual
   normal-core/memory/DAC APIs. Preserve the existing emulator installation.
   Reuse the exact five masked code windows and 12 Object2 relocations to bind
   loaded bases; do not start with file-offset breakpoints or DEBUGBOX.
2. **Then create one proven Windows entry point.** Check existing canonical
   paths, original hashes, upstream/patch/build identities, private writable
   destination and all prerequisites before launch. Use a new disposable copy
   under FIXTURES, preserve originals, redirect stdout/stderr with
   ProcessStartInfo for PS5.1, and handle execution policy explicitly. Test
   missing-input/nonzero-exit paths before asking the user to execute it.
   If a tool or build is missing, stop before launch with an exact requirement.
3. **Capture once.** A new private `FIXTURES\VALIDATION\P91-*` packet must
   contain draw-entry state/seed, completed buffer, palette-ready presentation
   state and post-present aperture/DAC proof. Preserve actual return-stack and
   return-event evidence. If a gate-off draw happens between generation and
   presentation, retain the earlier producing generation and require unchanged
   buffer bytes. Never assume post-present `0x7662A` is the displayed frame.
4. **Verify before rendering.** Rebind mapping from captured code bytes,
   validate each file/hash, target stage/mode, ordered lists, all channels,
   palette slots and 64,000-byte generation/aperture equality. The supplied
   `verify_snapshot.py` performs packet-consistency checks. Native provenance
   still needs independent review of the actual build/run; synthetic packet
   parity alone cannot certify a real capture.
5. **Implement one renderer against that packet.** Use draw-entry objects and
   source-backed in-traversal updates, not post-present coordinates. Apply
   original command order, clipping/masks, dynamic palette indices and source
   resource references. Retain the original seed buffer where needed. Count
   unmodeled actors/UI/queues explicitly. Compare every native indexed byte to
   DRAW_COMPLETE; compare DAC-expanded RGB separately. Stop and preserve exact
   discrepancies rather than visually correcting them.

## Paths and existing code

- SOURCE: `F:\Dev\MKEXT\SOURCE\` - separate P91 checkout/build source.
- TOOLS: `F:\Dev\MKEXT\TOOLS\` - separately built/pinned instrumentation.
- FIXTURES: `F:\Dev\MKEXT\FIXTURES\` - originals, disposable copies and all
  raw code/data/DAC/framebuffer packets. None may enter GitHub or CI.
- `scripts/research/p91/capture_plan.py`: canonical original-source plan.
- `scripts/research/p91/snapshot.py`: executable reference collector.
- `scripts/research/p91/verify_snapshot.py`: private packet readback.
- `scripts/research/p91/test_snapshot.py`: 13 small original-free tests.

Do not merge P91 into accepted branches merely because these source tests pass.
The first next acceptance gate is a **built and no-game-tested native adapter**;
the research task has not silently completed that gate.
