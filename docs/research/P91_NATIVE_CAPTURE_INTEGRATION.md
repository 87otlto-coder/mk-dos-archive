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
- The independent Python native raw reader and original P91 collector passed
  original-free synthetic and corruption tests on Windows
  [#43750168303](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/43750168303).

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

The binary contract begins with ASCII magic `P91NAT01`, little-endian
version 1 and four ordered phase records. Each record contains instruction
serial, mapped addresses, stage/mode/presentation state, return witness, DAC
format, 17 CPU register fields, eight VGA-mode registers and length-prefixed
Object1, Object2, indexed buffer, aperture, DAC and near-return-stack blobs.
The independent reader validates every byte-count and rebinds all five
source windows from the captured Object1 image; the reference Collector
then validates pairing and the exact presented buffer. Packet consistency
alone does **not** establish that the original DOS game was actually running.

## Acceptance status and next gate

The **combined native adapter** is being compiled/tested without a game by
[Windows integration workflow](../../.github/workflows/p91-native-capture-integration-windows.yml).
Until that workflow finishes successfully, its real emulator build and
no-game selftest are **VALIDATION PENDING**. Do not issue game launch
instructions based on the source-only results.

After passing the Windows integration build, independently review the native
raw schema and path/refusal behavior; implement and test one safe local
Windows entry point with exact original fixture, upstream and executable
fingerprint checks. Only then request a **single bounded** private Tomb mode-2
run. The first native snapshot must still be verified against the actual
four-phase packet; no stage reconstruction, palette ownership, observed
camera position or animation timing is claimed by these source controls.

The pre-existing DOSBox-X installation, original MK2 files, private P90
projections and accepted branches are untouched. No CI artifacts uploaded.
