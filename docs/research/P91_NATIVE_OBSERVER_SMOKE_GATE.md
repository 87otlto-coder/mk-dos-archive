# P91 native DOSBox-X API smoke gate — isolated implementation

Branch: `research/p91-native-observer-smoke`; parent checkpoint `f27834aa54ff205520502a5e966a597fcfa56d85`.

## Scope and status

This is the **first native integration gate**, not the finished MK2 frame-capture
observer. It instruments exactly one pinned `src/cpu/core_normal.cpp` in
DOSBox-X upstream `029bd65c5dcc7cdc7f2e14e35278620d9707d969`.

The source overlay is disabled unless `MKEXT_P91_SMOKE_DIR` is supplied.
It does not mount or read commercial games. The probe tests the actual normal
CPU instruction hook, bounded no-paging `MEM_BlockRead` against
`mem_readb`, and direct `vga.dac.rgb` / DAC-index / latch reads that do not
access the destructive guest DAC port. Its emitted report contains only
booleans, sizes, synthetic instruction address, and an XOR of current emulator
DAC components; it never exports source game pixels or memory.

The sole upstream edit is a hook immediately after `LOADIP` and before
instruction dispatch, not at `restart_opcode`. The overlay generator refuses
an unexpected upstream revision, dirty checkout, changed core blob, duplicate
hook, changed anchors or an existing output patch. Native output uses exclusive
Windows `CREATE_NEW` inside an explicitly armed validation path.

## Verification

- Seven original-free source-controls passed on the Windows runner.
- Upstream pinned checkout and patch application passed on the Windows runner.
- Real DOSBox-X SDL2 compilation, no-game run, and negative-path execution
  are **VALIDATION PENDING** until the workflow's actual final result is
  inspected; do not infer success from source tests.
- No MK2 runtime address bases, indexed frame, VGA DAC state, objects, or
  four-phase generation capture are verified by this gate.
- Source-only, minimal-artifact workflow:
  [P91 native observer smoke Windows gate](../../.github/workflows/p91-native-observer-smoke-windows.yml);
  initial run
  [#43744091555](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/43744091555).

## Next decision

If **native build + no-game smoke PASS**, reuse the verified emulator interfaces
to port the precise four-phase generation protocol from
`P91_DOSBOX_ADAPTER_SPEC.md`. No original-game launch instructions are
acceptable before that adapter is implemented and its failure paths are
validated.

If the build or smoke test fails, inspect the failed compiler/runtime step,
fix the minimal demonstrated defect in this isolated branch, and rerun only
the bounded source + build gate. Preserve P91/P90 checkpoints and all local
canonical `SOURCE/`, `TOOLS/`, and private `FIXTURES/` separation.
