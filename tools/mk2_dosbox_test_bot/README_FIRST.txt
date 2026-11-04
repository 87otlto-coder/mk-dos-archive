MK2 DOSBox — O110X.4 COMPLETE SEVEN-TEST KIT (11 OCT 2026)
============================================================

THIS PACKAGE INCLUDES THE FILES MISSING FROM THE O110X.3 BOT
- The latest O110X.3 key configuration (arrows, Q/A/W/S, Space; F1 to start)
- Untouched canonical MK2 baseline (00_BASELINE, executable + game files)
- All SIX modified game copies from the original O110W probe pack
- PowerShell launcher, log/screenshot capture and original O110W manifest

INSTALL (DO NOT EXTRACT INTO YOUR MK2 GAME-FILES DIRECTORY!)
Unzip this archive inside your existing 'Mortal Kombat 2' PARENT folder.
The resulting sibling-folder layout MUST be:

Mortal Kombat 2/
  DOSBOX/                 (your existing DOSBox installation, unchanged)
  MK2/                    (your installed MK2 game, unchanged)
  MK2_Test_Kit_O110X4/   (entire NEW folder extracted from this ZIP)
    START_HERE.cmd
    MK2_DOSBox_Test_Bot_O110X4/
    MK2_Runtime_Probes/
      00_BASELINE/
      01_PAL48_MAGENTA/
      02_PAL64_GREEN/
      03_BANK_START_1/
      04_BANK_START_49/
      05_BANK_START_65/
      06_STAGE_SKIP/

IMPORTANT: In Windows File Explorer, if 'Extract All' nests the kit under
another similarly-named folder, move MK2_Test_Kit_O110X4 directly beside
DOSBOX and MK2. The bot searches ancestor folders for DOSBOX and MK2.

RUN
1. Double-click MK2_Test_Kit_O110X4/START_HERE.cmd.
2. Look for 'Modified test directories available' and SEVEN menu options.
3. First choose 1 (00_BASELINE). Validate game reaches fight and captures images.
4. Then choose 2 (01_PAL48_MAGENTA) and 3 (02_PAL64_GREEN) in separate runs.
5. The remaining tests 4-7 are bank and renderer controls.
6. Run A (all) ONLY after the baseline screenshot is confirmed good.

All 7 game directories are separate complete copies. The O110X.4 bot uses
00_BASELINE from this kit when present, not your installed MK2 folder.
This ensures every test uses the same game version as the patched EXE.
Your original installed MK2 is never overwritten.

TROUBLESHOOTING
- If ONLY 00_BASELINE appears: the MK2_Runtime_Probes folder did not extract
  alongside the bot inside MK2_Test_Kit_O110X4. Re-extract the entire kit.
- If DOSBox starts at MK2's key assignment screen: first exit/save MK2 input
  settings in that game folder. Each test copy has its own settings file.
  You may need to configure a new copy manually. Bot cannot detect screens.
- If keys don't work, ensure MK2 Player 1 uses the same controls as the bot:
  arrows, Q/A punches, W/S kicks, Space block; F1 starts Player 1.
- If run aborts, share MK2_DOSBox_Test_Bot_O110X4/run-logs.
- HOLD SCROLL LOCK to stop the script; focus loss also stops input.
- This is NOT a gameplay AI and doesn't force particular stages.
- The experimental EXEs are statically verified, not DOSBox gameplay validated.

SOURCE AND PROVENANCE
Complete game copies: original O110W research fixture and patch manifest.
The only bot code change from O110X.3 is preferring the bundled, untouched
canonical baseline for fair A/B comparisons, and reporting the probe location.

Use only with your original legally held game installation.
