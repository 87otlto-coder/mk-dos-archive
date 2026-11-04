#Requires AutoHotkey v2.0
#SingleInstance Force

; MK DOS Archive O209.2 - external input helper (NO executable modification).
; Sends actual keyboard events only to a foreground DOSBox window.
; Does not inspect MK2's internal round/fatality state.

ConfigPath := A_ScriptDir "\mk2_fatality_keys.ini"
LogPath := A_ScriptDir "\mk2_fatality_attempts.csv"
Busy := false
Cfg := Map()

if !FileExist(ConfigPath) {
    FileAppend("[General]`nConfigured=0`nPreset=Pit II / Tomb - Kung Lao`nPressMs=60`nGapMs=55`n`n[Keys]`nLeft=Left`nRight=Right`nDown=Down`nHP=Numpad4`nBlock=Numpad5`n`n[Target]`nWindowHint=dosbox`n", ConfigPath, "UTF-8")
}
LoadConfig()
if (Cfg["Configured"] != "1") {
    ShowSettings()
}

; F8: fighter facing right. Shift+F8: fighter facing left.
; F7 taps only the mapped High Punch, to confirm DOSBox receives keystrokes.
#HotIf GameIsFocused()
F8:: {
    KeyWait("F8")
    DoFatality("right")
}
+F8:: {
    KeyWait("F8")
    KeyWait("Shift")
    DoFatality("left")
}
F7:: {
    KeyWait("F7")
    DoTestPunch()
}
#HotIf

; Can be used from anywhere to configure the keys; does not send gameplay input.
^!F8::ShowSettings()

PresetNames() {
    return ["Pit II / Tomb - Kung Lao", "Pit II / Tomb - Scorpion", "Pit II / Tomb - Sub-Zero", "Dead Pool - PC keyboard"]
}

LoadConfig() {
    global ConfigPath, Cfg
    Cfg := Map()
    for entry in [["Configured", "General", "Configured", "0"],
                  ["Preset", "General", "Preset", "Pit II / Tomb - Kung Lao"],
                  ["PressMs", "General", "PressMs", "60"],
                  ["GapMs", "General", "GapMs", "55"],
                  ["Left", "Keys", "Left", "Left"],
                  ["Right", "Keys", "Right", "Right"],
                  ["Down", "Keys", "Down", "Down"],
                  ["HP", "Keys", "HP", "Numpad4"],
                  ["Block", "Keys", "Block", "Numpad5"],
                  ["WindowHint", "Target", "WindowHint", "dosbox"]] {
        Cfg[entry[1]] := IniRead(ConfigPath, entry[2], entry[3], entry[4])
    }
}

GameIsFocused() {
    global Cfg
    try {
        p := StrLower(WinGetProcessName("A"))
        t := StrLower(WinGetTitle("A"))
        hint := StrLower(Trim(Cfg["WindowHint"]))
        return (hint != "") && (InStr(p, hint) || InStr(t, hint))
    } catch {
        return false
    }
}

ValidKeyName(key) {
    return RegExMatch(key, "i)^(?:[a-z0-9]|numpad[0-9]|left|right|up|down|space|enter|tab|home|end|pgup|pgdn|insert|delete|numpadadd|numpadsub)$") != 0
}

ShowSettings(*) {
    global Cfg, ConfigPath
    g := Gui("+AlwaysOnTop", "MK2 DOS stage-fatality hotkeys — setup")
    g.SetFont("s10", "Segoe UI")
    g.Add("Text", "w440", "Choose your fighter, then enter the KEYS bound inside MK2 / DOSBox. These are examples, not verified defaults.")
    g.Add("Text", "xm y+14", "Move preset (Pit II / Kombat Tomb, or Dead Pool)")
    choices := PresetNames()
    choice := g.Add("DropDownList", "w440", choices)
    selected := 1
    for index, name in choices {
        if (name = Cfg["Preset"])
            selected := index
    }
    choice.Choose(selected)

    keyControls := Map()
    for name in ["Left", "Right", "Down", "HP", "Block"] {
        g.Add("Text", "xm y+9 w150", name " key:")
        keyControls[name] := g.Add("Edit", "x+10 yp-3 w140", Cfg[name])
    }
    g.Add("Text", "xm y+15", "Key hold (ms):")
    pressField := g.Add("Edit", "x+10 yp-3 w70 Number", Cfg["PressMs"])
    g.Add("Text", "x+15 yp+3", "Key gap (ms):")
    gapField := g.Add("Edit", "x+10 yp-3 w70 Number", Cfg["GapMs"])
    g.Add("Text", "xm y+15", "Target window/process contains:")
    hintField := g.Add("Edit", "x+10 yp-3 w170", Cfg["WindowHint"])
    g.Add("Text", "xm y+15 w440", "F8 = facing RIGHT   |   Shift+F8 = facing LEFT   |   F7 = test High Punch")
    g.Add("Text", "xm y+5 w440", "Press Ctrl+Alt+F8 to reopen settings. Test only in DOSBox.")
    saveButton := g.Add("Button", "xm y+15 w190 Default", "Save and arm hotkeys")
    closeButton := g.Add("Button", "x+12 yp w120", "Cancel")
    saveButton.OnEvent("Click", (*) => SaveSettings(g, choice, keyControls, pressField, gapField, hintField))
    closeButton.OnEvent("Click", (*) => g.Destroy())
    g.Show("AutoSize Center")
}

SaveSettings(g, choice, keyControls, pressField, gapField, hintField) {
    global ConfigPath
    for name, control in keyControls {
        value := Trim(control.Value)
        if !ValidKeyName(value) {
            MsgBox("Invalid " name " key: " value "`nUse e.g. Left, Right, Down, U, J, Numpad4, Numpad5.", "Invalid mapping", "Icon!")
            return
        }
    }
    try {
        press := Integer(Trim(pressField.Value))
        gap := Integer(Trim(gapField.Value))
    } catch {
        MsgBox("Hold and gap must both be whole numbers in milliseconds.", "Invalid timing", "Icon!")
        return
    }
    if (press < 30 || press > 200 || gap < 20 || gap > 200) {
        MsgBox("Set hold to 30–200 ms and gap to 20–200 ms.", "Invalid timing", "Icon!")
        return
    }
    hint := Trim(hintField.Value)
    if (StrLen(hint) < 3) {
        MsgBox("The DOSBox target hint must have at least 3 characters.", "Invalid target", "Icon!")
        return
    }
    ; Stop ambiguous bindings. Distinct game actions must have distinct key names.
    seen := Map()
    for name, control in keyControls {
        value := StrLower(Trim(control.Value))
        if seen.Has(value) {
            MsgBox("Two actions map to the same key: " seen[value] " and " name ".`nCorrect this before enabling.", "Conflicting mappings", "Icon!")
            return
        }
        seen[value] := name
    }
    IniWrite(choice.Text, ConfigPath, "General", "Preset")
    IniWrite(press, ConfigPath, "General", "PressMs")
    IniWrite(gap, ConfigPath, "General", "GapMs")
    for name, control in keyControls
        IniWrite(Trim(control.Value), ConfigPath, "Keys", name)
    IniWrite(hint, ConfigPath, "Target", "WindowHint")
    IniWrite("1", ConfigPath, "General", "Configured")
    LoadConfig()
    g.Destroy()
    MsgBox("Hotkeys armed for DOSBox only.`n`nF7: test High Punch`nF8: combo facing RIGHT`nShift+F8: combo facing LEFT`nCtrl+Alt+F8: settings`n`nUse after FINISH HIM/HER, at the stage's required distance.", "MK2 hotkeys ready", "Iconi")
}

CheckReady() {
    global Cfg
    if (Cfg["Configured"] != "1") {
        MsgBox("Mappings have not been confirmed. Press Ctrl+Alt+F8 to configure.", "Hotkeys disarmed", "Icon!")
        return false
    }
    return GameIsFocused()
}

TapGameKey(key, startingWindow) {
    global Cfg
    if (WinGetID("A") != startingWindow || !GameIsFocused())
        throw Error("The target DOSBox window lost focus; sequence stopped.")
    SendEvent("{" key " down}")
    Sleep(Integer(Cfg["PressMs"]))
    SendEvent("{" key " up}")
    Sleep(Integer(Cfg["GapMs"]))
}

DoUppercut(startingWindow) {
    global Cfg
    if (WinGetID("A") != startingWindow || !GameIsFocused())
        throw Error("The target DOSBox window lost focus; uppercut cancelled.")
    SendEvent("{" Cfg["Down"] " down}")
    Sleep(35)
    SendEvent("{" Cfg["HP"] " down}")
    Sleep(Integer(Cfg["PressMs"]))
    SendEvent("{" Cfg["HP"] " up}")
    SendEvent("{" Cfg["Down"] " up}")
    Sleep(Integer(Cfg["GapMs"]))
}

DoTestPunch() {
    global Busy, Cfg
    if Busy || !CheckReady()
        return
    Busy := true
    try {
        target := WinGetID("A")
        TapGameKey(Cfg["HP"], target)
        RecordAttempt("TEST_HP", "N/A", "sent")
    } catch as err {
        RecordAttempt("TEST_HP", "N/A", "interrupted")
        MsgBox(err.Message, "Key test stopped", "Icon!")
    } finally {
        Busy := false
    }
}

DoFatality(facing) {
    global Busy, Cfg
    if Busy || !CheckReady()
        return
    Busy := true
    preset := Cfg["Preset"]
    try {
        target := WinGetID("A")
        forward := (facing = "right") ? Cfg["Right"] : Cfg["Left"]
        ; Only these documented move presets are allowed; no custom executable code.
        if (preset = "Pit II / Tomb - Kung Lao") {
            sequence := [forward, forward, forward, Cfg["HP"]]
        } else if (preset = "Pit II / Tomb - Scorpion") {
            sequence := [Cfg["Down"], forward, forward, Cfg["Block"]]
        } else if (preset = "Pit II / Tomb - Sub-Zero") {
            sequence := [Cfg["Down"], forward, forward, Cfg["Block"]]
        } else if (preset = "Dead Pool - PC keyboard") {
            sequence := [forward, forward, forward, "UPPERCUT"]
        } else {
            throw Error("Unknown preset: " preset)
        }
        for key in sequence {
            if (key = "UPPERCUT")
                DoUppercut(target)
            else
                TapGameKey(key, target)
        }
        RecordAttempt(preset, facing, "inputs_sent")
    } catch as err {
        RecordAttempt(preset, facing, "interrupted")
        MsgBox(err.Message, "Fatality macro stopped", "Icon!")
    } finally {
        Busy := false
    }
}

RecordAttempt(preset, facing, status) {
    global LogPath, Cfg
    try {
        if !FileExist(LogPath)
            FileAppend("time_local,preset,facing,result,hold_ms,gap_ms,game_result_verified`n", LogPath, "UTF-8")
        ; A successful key send never confirms that the game accepted the fatality.
        line := FormatTime(, "yyyy-MM-dd HH:mm:ss") "," preset "," facing "," status "," Cfg["PressMs"] "," Cfg["GapMs"] ",no`n"
        FileAppend(line, LogPath, "UTF-8")
    } catch {
        ; Logging failures must never risk leaving game keys pressed.
    }
}
