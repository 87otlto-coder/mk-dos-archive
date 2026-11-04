# MK DOS Archive — Pit II authoritative continuation through O236

Inherit `MK_DOS_Archive_Pit_II_HANDOFF_THROUGH_O233_2026-10-17.md` **without alteration**. All O210–O233 project history, research evidence and application source are additive and authoritative at their respective confidence levels. New owner originals remain external: `MK2.EXE` SHA-256 `fa93afdc...`, `PIT.GRA` SHA-256 `af6c10b6...`, `FALL.GRA` SHA-256 `60e6c56f...`; original fatality video SHA-256 `198b5ecc...`.

## O234 — Fatality camera handoff

Original executable region `0x80202–0x802A4` clears vertical movement `0x842E4`, then converts six stage object lists to screen-relative space through `0x8050B`, subtracting six independent stage-X origins and the common vertical Y origin `0x842EA` from object coordinates. Exact six list heads and scroll origins retained in `O234` checkpoint / JSON. This directly connects the layered Pit stage structure to the fatality-entry path. No verified complete pillar camera trajectory or upstream fatality dispatcher.

## O235 — Wall tile object path to conditional frame machinery

Original fatality selector `0x80721` makes objects through `0x64548`, then `0x646B4 -> 0x665EB` inserts them into shared sorted list `0x84358`. Tag `0x070B` removes earlier group. Main frame-loop `0x66E34 -> 0x67050 -> 0x935E6` maintains the three object lists before conditional frame composition. Related original paths call `0x7B30B` (VGA retrace) and `0x65420` (video memory copy to `0xA0000`). This is **not** proof graphic58 reaches a presented page or why it is missing in source-to-video witness.

## O236 — Genuine fixed-point stage accumulator link

Original `0x933C2` compositor updates vertical `0x842E8` using velocity `0x842E4`, and nine horizontal position accumulators from nine source velocities. Stage objects use high words as screen origins: `0x842EA` for Y and six of the nine X high-word locations for fatality entry rebasing. The inspected vertical path adds velocity twice before writing back. That is *path arithmetic*, not evidence of per-frame pixel travel without source activation/call cadence.

## Verified checkpoint integrity

The three scripts reject 14, 19, and 13 deliberately corrupted source controls respectively. Each report was reproduced identically in a separate second run. Original MK2 game files and recording were never modified. No new full app Vite build or executable patch claimed.

## Priority for continuation

1. Locate live initialization and updates of the vertical velocity `0x842E4`, position `0x842E8`, and nine stage layer X velocities, cross-check against genuine upper-pillar video and selected root. Be careful with sources from other stages and with high-word aliasing.
2. If source-only tracing cannot resolve graphic58, obtain live selected-object/framebuffer-swap telemetry (or a genuine 60fps capture) rather than treating the 30fps video skip as sufficient. Preserve the O233 negative test.
3. Continue blood/spray effect draw ordering and original fatality dispatcher only under bounded, guarded, nonpatching investigation. Preserve the observed ~50fps DOS presentation baseline and distinguish it from task scheduler and 30fps capture.
