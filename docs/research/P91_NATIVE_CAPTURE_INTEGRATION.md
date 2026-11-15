# P91 — native Tomb four-phase capture adapter integration

Branch: `research/p91-native-observer-smoke` (isolated from accepted P91, P90,
P89 and main). This document is a development checkpoint, **not** evidence
of an original-game capture.

## Accepted foundation (verified Windows)

- Real DOSBox-X normal-core instruction hook, bounded guest RAM read and
  internal VGA DAC read passed the no-game Windows build/smoke
  [#43744091555](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/43744091555).
- C++ four-phase generation guard passed 21 original-free cases on Windows
  [#43747420122](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/43747420122).
- Original-free native SHA-256, source-window metadata and bounded-memory
  controls passed Windows
  [#43748917458](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/43748917458).
- The independent Python native raw reader, v2 original near-RET/SS:ESP
  provenance requirements and P91 collector passed original-free synthetic,
  forged-return and corruption refusal tests on Windows
  [#43751520409](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/43751520409).
- The actual v2 C++ DOSBox-X normal-core adapter compiled on Windows and
  passed the real no-game hook, RAM, DAC and no-overwrite checks in
  [#43751377573](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/43751377573).
  Source-only patch SHA-256: `c9ad618064755fe887d74ad39a87f6264901cb9815219691643d86f782c6d334`.
  Built v2 EXE SHA-256: `0aa01b318494c59ee43cacf4c95db7e4ae5095051aa5bd25998911de9deaf448`.
- The Windows private launcher passed ten original-free missing-input, fixture
  fingerprint, disposable-copy, simulated early-exit and false-success refusal
  tests in [#43752332901](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/43752332901).
  Portable packaging source tests passed in
  [#43753012396](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/43753012396).

## New integration source

- `native_capture_core.hpp`: no-commercial-byte SHA-256, five masked
  original Object1 instruction windows and all twelve typed Object2 relocation
  checks. Derives actual linear bases from current normal-core CS/DS context,
  not preferred LE base guesses.
- `native_capture_adapter.hpp`: an opt-in, synchronous normal-core observer.
  Tracks original draw entry, draw completion, palette-ready presentation and
  post-presentation, preserving the last pixel-producing generation across
  gate-off coordinate updates. It reads bounded Object1/Object2 virtual
  images and 64,000-byte native indexed buffers; reads the 256-entry VGA
  DAC without port I/O; stores exact return-stack evidence and CPU registers;
  verifies post-present CPU aperture bytes after preserving VGA read latches.
  The matching P91 native generation guard refuses mixed buffers, changed
  palette slots, unproved presentation and out-of-target state.
- `native_capture_overlay.py`: reversible, exact-upstream
  `029bd65c5dcc7cdc7f2e14e35278620d9707d969` normal-core patch
  generator. Never changes an upstream checkout automatically.
- `read_native_capture.py`: independent raw-byte parser and five-window
  relocation re-verifier. Reconstructs the P91 reference collector's
  four-phase inputs and can produce a canonical, private packet only after
  original input hashes, captured data integrity and the four generation
  invariants agree.

The native writer is disabled unless
`MKEXT_P91_NATIVE_CAPTURE_DIR` points to an existing canonical
`F:\Dev\MKEXT\FIXTURES\VALIDATION\P91-*` directory.
It uses exclusive file creation. Raw data is emitted as
`p91-native-raw.bin` with a SHA-256/byte-count
`p91-native-raw-complete.json` marker written **last**.
A partial file without its completion marker is a failure. All private bytes
stay in FIXTURES and never enter GitHub or CI.

The strict binary contract begins with ASCII magic `P91NAT02`, little-endian
version 2 and four ordered phase records. Each record contains instruction
serial, mapped addresses, stage/mode/presentation state, return witness, DAC
format, 17 CPU register fields, eight VGA-mode registers and length-prefixed
Object1, Object2, indexed buffer, aperture, DAC and near-return-stack blobs.
The native v2 envelope adds a source-whitelisted original near-RET opcode,
instruction serial and observed SS:ESP pop transition. The independent reader
rejects a scheduler-only witness, wrong original opcode/offset, forged return
stack, changed return serial, mixed render buffers and DAC discrepancies.
It validates every byte-count and rebinds all five original code windows
from captured Object1 images; the reference Collector then validates pairing
and the exact presented buffer. Packet consistency
alone does **not** establish that the original DOS game was actually running.

## Acceptance status and next gate

**VERIFIED original-free build only:** the full v2 native observer compiled
and ran inside the pinned DOSBox-X Windows executable in
[#43751377573](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/43751377573).
This proves the real hook/RAM/DAC APIs are integrated. It does not prove that
a game frame can be captured, a source-derived pointer maps to actual loaded
commercial data, a near RET is reached, a buffer will match the VGA aperture,
or that original stage reconstruction is accurate.

The canonical one-click Windows private launcher
`scripts/research/p91/Run-P91-Private-Capture.cmd` and
`run_private_capture.py` are implemented and original-free synthetic
preflight-verified. They require the original fixture hashes, a matching
source-identified executable and an existing writable private validation
destination, then launch only a disposable game copy under FIXTURES.
Errors and partial packets are preserved, without a success marker.

The **portable native executable/DLL package and one-folder no-game acceptance
are VALIDATION PENDING** through
[Windows portable workflow #43753635156](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/43753635156).
It permits exactly one one-day test-kit artifact (no commercial data) **only
if** the bundled native executable runs with a restricted Windows PATH and
passes the same real CPU/RAM/DAC and no-overwrite checks.

After the portable gate passes, validate the exact downloaded kit, use one
bounded private Tomb mode-2 run, and independently verify the raw v2 packet
against the original executable source windows, recorded return event and
64,000 native indexed framebuffer bytes. If the original game does not reach
the target or the four-phase proof fails, classify it as an observed refusal
and retain evidence without guessing. Native stage palette/camera and
full scene remain **UNKNOWN / VALIDATION PENDING** until observed.

The original MK2, preserved P90 output, existing DOSBox installation and
accepted GitHub branches were not changed. No commercial assets were uploaded.
