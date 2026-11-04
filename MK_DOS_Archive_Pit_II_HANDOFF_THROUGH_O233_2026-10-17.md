# MK DOS Archive — Pit II authoritative continuation through O233

Latest: `MK_DOS_Archive_Source_O233_Pit_II_2026-10-17.zip` and `MK2_Pit_II_O233_Research_Evidence_2026-10-17.zip`.

Inherited full source through O230 has been preserved byte-for-byte. O231 pillar source identity and O232 independent pillar motion camera analysis are now included in the project ZIP. See earlier handoff through O230 for blood effects, stage setup, portal 50fps baseline, Pit bridge sprites and stage roots, and the unpatched O209 fatality dispatcher NO-GO.

## New facts

- O231: stage-fatality pillar before the lower texture cut is original `PIT.GRA` setup2, NOT `FALL.GRA`58; source matched three recorded timestamps around 28.8–29.2s.
- O232: exact source 96-pixel **vertical** pillar periodicity; 12 strict independent source-to-video samples. Column video-space X moves from −32 to −71 over 0.433s while sampled distant backdrop 3,500 pixels are pixel-identical at 28.8/29.0/29.2s. No unique absolute vertical camera offset is established. Canonical fixture rerender and video controls independently reproduced twice.
- O233: original `FALL.GRA` selector has five entries of sprite58, but no simple constant-step direct-visible model (40–75 steps/s across starting phases) matches the 17 captured post-cut texture classifications. Hypothetically displaying five consecutive selector ticks at exactly 60Hz would necessarily be caught in >=2 frames by a 30fps capture, independent of capture-grid phase. That *hypothesis* is contradicted; actual drawing/scheduling has not been reconstructed or falsified. Two byte-identical reruns.

## Boundaries

Do NOT claim a fully reconstructed camera, scene code, automatic fatality patch, exactly loaded VGA DAC palette or runtime timeline. Original lower effects and sprite sources are authenticated to varying degrees; live state machine and presentation behavior remain unresolved. O223's inferred ~60Hz task timer is distinct from approximately 50fps game presentation established during Portal tests and 30fps footage. Do not treat source `yield 1` as proof of exactly 1/60s per shown selector step.

## Next narrowly bounded work

Try tracing live selected texture/object list and framebuffer presentation for graphic58 using a debugger or emulator with telemetry if available. Alternatively, follow original executable dataflow from O227 tag `0x70B` tile cleanup to object-list callback and drawing to determine whether some selected sprites are generated but never presented. For upper stage, trace stage-2 vertical position accumulator against the O232 original-source camera witness. Reproduce O232/O233 verifiers with owner originals before promoting anything.

Original owner binaries and recordings remain outside the source and research ZIPs; no edits to them.
