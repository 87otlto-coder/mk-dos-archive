# O209.2 — Windows external stage-fatality keyboard helper

Date: 2026-10-17
Predecessor: O209 (bounded Gate 1 dispatcher investigation; no validated dispatcher found).

## Decision

Produce a reversible **external AutoHotkey v2 macro** instead of modifying the original DOS executable. The helper addresses the immediate need to record The Pit II lower fatality area in a genuine DOSBox run, without starting an open-ended dispatcher reverse-engineering effort.

## Supported input presets

- Pit II / Tomb, Kung Lao: Forward → Forward → Forward → High Punch (DOS PC move references)
- Pit II / Tomb, Scorpion: Down → Forward → Forward → Block
- Pit II / Tomb, Sub-Zero: Down → Forward → Forward → Block
- Dead Pool, DOS PC keyboard: Forward → Forward → Forward → Uppercut (Down + High Punch)

These are documented candidate inputs, not game-tested outcomes for the user's current setup.

## Safety and reproduction

- Only sends keystrokes to foreground windows matching a user-confirmed DOSBox process/title hint.
- Requires explicit first-run input mapping, offers a one-key High Punch validation via F7, and supports F8/right and Shift+F8/left.
- Has bounded hold/gap settings, guarded focus, and a local CSV attempt log. Results are logged as `inputs_sent` or `interrupted`, never as confirmed fatalities.
- Does not alter MK2.EXE, the stage cheat menu, the emulator or original game resources.
- Uses independent AutoHotkey v2 installation. No compiled binaries shipped.

## Verification boundary

- Static source/setting/preset/safety assertions: 16/16 passed on Linux.
- Source package preserves every O209 member unchanged.
- Windows execution, simulated input delivery, correct game-state readiness and successful fatalities: **not verified**.
- Authoritative stage fatalities/PC-specific input references: the period DOS PC guide and the MKSecrets platform-specific exception in MOVE_REFERENCE.json.

## Next runtime witness

User should select The Pit II + Kung Lao (or the matching preset), test F7 High Punch, reach FINISH HIM with opponents close, then press F8 or Shift+F8 based on facing. Capture and upload a video showing the fatality descent and lower spikes. If input fails, obtain mapping/timing/preset and local attempt log before more reverse engineering.
