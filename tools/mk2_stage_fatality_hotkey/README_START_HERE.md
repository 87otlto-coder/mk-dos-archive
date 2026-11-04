# MK2 DOS stage fatality hotkeys — O209.2

This **external Windows AutoHotkey v2 helper** presses a character's stage-fatality input sequence when the original MK2 DOS game is focused. It **does not modify MK2.EXE, the F9 cheat menu or your DOSBox installation**. It does not bypass the game's FINISH HIM / HER state, correct stage, fighter or distance requirements.

## Installation / first run

1. Install AutoHotkey **v2**, not v1, from the official website: https://www.autohotkey.com/
2. Extract this ZIP anywhere outside the game folder.
3. Double-click `MK2_Stage_Fatality_F8.ahk`.
4. In the first-run settings window, choose your fighter and enter the *real keys that MK2 recognizes* for Left, Right, Down, High Punch (HP) and Block. The initial values are **examples, not authenticated MK2 defaults**. For an arrow-key/numpad setup these might be Left, Right, Down, Numpad4 and Numpad5. The bindings depend on your specific DOSBox mapper and MK2 configuration. Save and arm.
5. Open DOSBox, choose **The Pit II** (blue bridge) with your F9 menu, then select the character matching the preset. Use the existing cheat menu to make the fight easier if you prefer. The F9 automatic fatality command performs normal fatalities; don't use it for this test.
6. During a fight, press **F7** once. Your fighter should perform High Punch. If not, change the keys using **Ctrl+Alt+F8**. Try running DOSBox windowed and using a physical keyboard. Make sure the DOSBox window has focus.
7. When **FINISH HIM/HER** appears, get close to the opponent and press **F8 if your fighter faces right** or **Shift+F8 if your fighter faces left**. The helper taps the appropriate preset sequence.
8. If nothing happens, adjust the timing in Ctrl+Alt+F8. Try hold 45ms / gap 40ms (faster) or 85ms / gap 70ms (slower). Check positioning and fighter. A completed macro sends keystrokes only; it cannot know whether the game accepted the fatality.

**Hotkeys:** F7 tests one High Punch. F8 attempts the fatality facing right. Shift+F8 attempts it facing left. Ctrl+Alt+F8 opens setup even outside DOSBox. The F7/F8 hotkeys are active only when the foreground window title or process matches the configured DOSBox hint (default `dosbox`).

## Presets and game-state limits

| Preset | Required fighter | Where | Input sequence |
|---|---|---|---|
| Pit II / Tomb - Kung Lao | Kung Lao | Pit II, Kombat Tomb | Forward, Forward, Forward, High Punch |
| Pit II / Tomb - Scorpion | Scorpion | Pit II, Kombat Tomb | Down, Forward, Forward, Block |
| Pit II / Tomb - Sub-Zero | Sub-Zero | Pit II, Kombat Tomb | Down, Forward, Forward, Block |
| Dead Pool - PC keyboard | Any valid fighter | Dead Pool | Forward, Forward, Forward, Uppercut (Down + High Punch) |

**Move-source references (not runtime confirmations):**
- DOS-specific PC FAQ: https://gamefaqs.gamespot.com/pc/564581-mortal-kombat-ii/faqs/1788
- DOS PC move list: https://gamefaqs.gamespot.com/pc/564581-mortal-kombat-ii/faqs/1792
- PC Dead Pool exception: https://www.mksecrets.net/mk2/eng/mk2-specialmoves.php

The Dead Pool command is specifically the PC keyboard version, as documented by MKSecrets. Other platforms have different input requirements. Different DOS revisions or game settings may behave differently.

## What to send back

If the move works, please record a 15–30-second DOSBox clip that includes FINISH HIM, the hotkey attempt and the complete stage transition. For The Pit II we specifically want the fall and lower area. If it doesn't work, send the attempted preset, which way your fighter faced, the keys from your MK2 mapping, and the `mk2_fatality_attempts.csv` file. This CSV logs key-sending attempts, **not gameplay success**.

## Safety and isolation

- This helper **never patches binaries** or reads/writes your game save files. It runs only in Windows.
- Its configured window hint must be present in the **foreground** window's process or title, and it stops sending if focus changes.
- Initial mappings must be confirmed once in the settings window. No key sends occur automatically at startup.
- Right/Left refer to **the fighter's facing direction**, not the side of the screen.
- AutoHotkey can sometimes fail to inject keys into DOSBox due to emulator input mapping, privileges or exclusive input. If the F7 test fails, do not assume that any fatality routine is broken; we need to fix input delivery first.
- Quit via the green AutoHotkey tray icon (right-click → Exit), or close the script.
- `mk2_fatality_keys.ini` and `mk2_fatality_attempts.csv` are created locally. This bundle contains no original copyrighted game files.

## Verification status

The preset sequences have been cross-checked against period DOS PC move references. The `.ahk` source was statically reviewed, but **an actual AutoHotkey v2 / Windows / DOSBox runtime test has not been performed here**. The exact inputs and key-delivery timing still require your first test.
