# P91 Tomb native capture — private Windows test package

**Status: experimental, not a verified original-game runtime capture.**
This package is for the original DOS Mortal Kombat II owned by the user.
Its original commercial files must never be uploaded to GitHub.

## Canonical installation

The exact Windows-only package must be extracted to:

`F:\Dev\MKEXT\TOOLS\P91Capture\`

Inside that folder, the following files must sit together:
`dosbox-x.exe`, its required runtime DLLs,
`P91_CAPTURE_BUILD_ID.json`,
`P91_CAPTURE_SOURCE_PLAN_20261115.json`,
`Run-P91-Private-Capture.cmd`,
`run_private_capture.py`, `read_native_capture.py`, `snapshot.py`,
and `verify_snapshot.py`.

The existing original DOS MK2 fixture stays, read-only, at:
`F:\Dev\MKEXT\FIXTURES\mk2\mk2\`

**Do not** overwrite or replace a pre-existing DOSBox or MK2 installation.
Never extract the instrumentation into SOURCE or FIXTURES.

## How one local test would work

**Do not attempt the game test until the exact package's portable Windows
no-game validation and provenance have passed.**

Once accepted, double-click **Run-P91-Private-Capture.cmd** in TOOLS/P91Capture.
It invokes Python directly and does not depend on PowerShell's execution
policy. Python 3.11+ must be installed.

The launcher refuses to proceed unless the original game hashes, DOSBox
executable fingerprint, installed source plan and private output directory
all match the tested identities. It then copies the original game folder
into a disposable, uniquely named directory under
`F:\Dev\MKEXT\FIXTURES\VALIDATION\P91-*`, and starts a normal game from
that *copy* using the dedicated observer-enabled DOSBox-X. The user's original
game and normal DOSBox installation are not modified.

The game must reach **Tomb, mode 2** during the bounded capture attempt.
If it does not, the launcher stops instead of fabricating a packet.
The game may require manual input/navigation; the launcher never guesses a
stage selection or patches executable gameplay.

A complete native result must pass four-phase draw/presentation/aperture/DAC
checks. It retains frame-buffer bytes, loaded memory and private original
resources **only in FIXTURES/VALIDATION**, with exclusive output files,
source-code fingerprints, hashes and explicit failure reasons. The reader
independently checks the raw packet and emits a converted private packet only
after its reference collector accepts the four-phase relationships.

**A valid packet is not yet a verified reconstructed Tomb scene.** The next
stage is an independent original-index framebuffer comparison of all 64,000
pixels. Native visual parity, camera observations and animation timing remain
unverified until the actual original game test and comparisons pass.

If a command or game fails, preserve the private evidence directory and
*do not repeatedly rerun* the launcher. The console will display an error.

## License and source provenance

Instrumented emulator source: DOSBox-X from
https://github.com/joncampbell123/dosbox-x
at pinned commit `029bd65c5dcc7cdc7f2e14e35278620d9707d969`.
Instrumenting patch generator, C++ headers, reproducible Windows CI workflow,
and independent verifier source:
https://github.com/87otlto-coder/mk-dos-archive/tree/research/p91-native-observer-smoke

DOSBox-X carries the upstream GNU GPL and relevant third-party dependencies
retain their own licenses. This package must keep corresponding source
provenance and applicable licensing information available.

The single short-retention CI artifact contains no game bytes, raw
framebuffers, screenshots, commercial sound or other extracted graphics.
