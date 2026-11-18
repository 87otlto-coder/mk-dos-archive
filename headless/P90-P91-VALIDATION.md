# P90/P91 runtime evidence and continuation

P90 replayed from committed code against the canonical MK2.EXE. The suite passed 11/11, the independent initializer replay passed 729 assertions across nine stage/mode cases, and the separate camera verifier passed 47 assertions. These are VERIFIED STATIC. P90 projection work remains governed by its existing private qualification. No native pixels were compared in this run.

P91 committed Python mechanism, launcher, reader and observer patch tests passed 43/43 with simulated captures. The original-executable mapping model also matched five code windows and 12 relocated operands. This checks executable identity and mapping logic, with no emulator launch or guest runtime observation.

| Gate | Result |
|---|---|
| Original inputs | MK2.EXE fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65; TOMB.GRA be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613; IMAGES.GRA 2b26796a64c2aebfee75832696aeae9bbcf9df56d82cb9a39df58a557d3ad8cf |
| Canonical kit | F:\Dev\MKEXT\TOOLS\P91Capture absent. Existing P89 and Pit II debugger executables are separate builds. |
| Prior CI | Windows portable original-free run 43753635156 at 9d890e4. GitHub returned an empty artifact list. |
| Rebuild | Windows workflow supports dispatch and uses pinned DOSBox-X 029bd65c5dcc7cdc7f2e14e35278620d9707d969. No permitted local C++ or MSBuild command was available and the connected tool offers no workflow dispatch. No new executable was built. |
| Original runtime | VALIDATION PENDING before launch. Zero original-game captures. Zero original 64,000-position comparisons. |

The November 17–18 audit identifies static risks in target prefilter ordering, read-mode/banking and VGA observer side effects, effective DAC remaps, CRTC scanout and raw indexed PNG readback with trailing rPAL. No original-game applicability was established. Keep logical framebuffer, CPU aperture and displayed scanout evidence distinct.

Recover the exact [Windows workflow](https://github.com/87otlto-coder/mk-dos-archive/blob/9d890e4ed0ed05e8e2216380dfe02b64847f57ca/.github/workflows/p91-portable-capture-windows.yml) and record new build identity and exe hash from the original-free portable smoke. Extract the validated kit into the canonical TOOLS/P91Capture directory. First run `python .\run_private_capture.py` for preflight. Then run a single bounded capture with `python .\run_private_capture.py --capture --maximum-seconds 600` from that directory, using the launcher-managed disposable fixture copy. Preserve refused phases and context privately. Independently validate original source windows, the four phases and producing generation, then compare all 64,000 indexed positions. Validate effective palette and scanout separately. The [execution-readiness notes](https://github.com/87otlto-coder/mk-dos-archive/blob/research/spelunk-20261118-final-execution-gate/docs/research/SPELUNK_20261118_FINAL_EXECUTION_READINESS.md) link the observer and raw screenshot evidence and the separate runtime acceptance gates.
