"""Independent P68 readback of three same-tab Chrome selection downloads.

Reuses the P67 original-source WAV/MIDI verifier; no payload is trusted merely
because the UI displayed the expected game. Command-line JSON contains only
private local paths and selected UI names. No originals are written to Git.
"""
import json
from pathlib import Path
import runpy
import sys
from zipfile import ZipFile

p67 = runpy.run_path(str(Path(__file__).with_name("check-p67-download.py")))


def main(records):
    assert [row["game"] for row in records] == ["mk1", "mk2", "mk3"]
    for item in records:
        game = item["game"]
        root = Path(item["root"]).resolve(strict=True)
        original_exe = p67["source_bytes"](root, game + ".exe")
        assert p67["sha"](original_exe) == p67["EXE"][game], "wrong original executable: " + game
        with ZipFile(item["download"]) as archive:
            assert archive.testzip() is None, "download ZIP CRC failure: " + game
            p67["selection"](game, root, archive, item["names"])
        print(game, "P68 same-tab download matches original source and selection", flush=True)


if __name__ == "__main__":
    assert __debug__, "Python assertions must be enabled"
    assert len(sys.argv) == 2, "Pass one JSON array of MK1/MK2/MK3 downloads"
    main(json.loads(sys.argv[1]))
