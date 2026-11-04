# MK DOS Archive — O114 runtime evidence checkpoint

This source package extends O113 with three actual DOSBox screenshot witnesses and the conditional X-ruler analysis tools. No commercial MK game asset ZIP or EXE is newly bundled. All prior O113 source files are preserved verbatim.

**Start here:** `CHECKPOINT_2026-10-11_O114_RUNTIME_XRULER_RESOLVED.md`.

## Latest results
- Test 20 original Portal control: no binary ruler.
- Test 21 Tomb X ruler: source-offset proxy 290–291 (41 qualified screenshot rows), conditional two-index RGB association.
- Test 24 Portal X ruler: source-offset proxy 317–326 (34 qualified screenshot rows), conditional two-index RGB association.
- 61 relevant existing and new Python regression tests passed; independent pixel verifier agrees.
- Exact runtime palette bank, true camera register and floor row placement remain open.

## Next user tests
The **same O113** calibration test kit already installed provides experiments **22 Tomb Y**, **25 Portal Y**, **23 Tomb index ramp**, **26 Portal index ramp**. There is no need to download an updated game kit yet.

## Current development priority
MK2 → MK1 → MK3 → UI/extractor milestone. Authentic Enhanced runtime and intelligent bots remain long-term options.
