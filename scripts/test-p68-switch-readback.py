"""P68 synthetic cross-game contamination refusals for independent download readback."""
import hashlib
import io
import json
from pathlib import Path
import runpy
from tempfile import TemporaryDirectory
import unittest
from zipfile import ZipFile

switch = runpy.run_path(str(Path(__file__).with_name("check-p68-switch-download.py")))
p67 = switch["p67"]


def sha(b):
    return hashlib.sha256(b).hexdigest()


class P68SameTabSelectionReadback(unittest.TestCase):
    def setUp(self):
        temp = TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.base = Path(temp.name)
        self.records = []
        self.exe = dict(p67["EXE"])
        self.addCleanup(lambda: p67["EXE"].update(self.exe))
        wav = b"RIFF" + bytes(4) + b"WAVE" + bytes(8)
        root1, root2, root3 = (self.base / g for g in ("mk1", "mk2", "mk3"))
        for root, game in zip((root1, root2, root3), ("mk1", "mk2", "mk3")):
            root.mkdir()
            data = b"MZ" + game.encode()
            (root / (game.upper() + ".EXE")).write_bytes(data)
            p67["EXE"][game] = sha(data)
        (root1 / "001.WAV").write_bytes(wav)
        source1 = {"path": "001.WAV", "offset": 0, "length": len(wav), "sha256": sha(wav)}
        mk1 = [{"kind": "audio", "name": "001.WAV", "id": "audio/wav/001.WAV",
                "filename": "001.WAV", "source": source1,
                "metadata": {"packagePath": "audio/wav/001.WAV"}}]
        self.records.append(self.record("mk1", root1, mk1, [wav]))
        (root2 / "SOUND").mkdir()
        score = bytes([0x91, 0x98])
        midi = b"MThd" + bytes(12)
        (root2 / "SOUND" / "animb.mid").write_bytes(score)
        provenance = {"sourceSha256": sha(score), "exportedMidiSha256": sha(midi),
                      "sourceTrackBoundaries": [{"terminalSourceOffset": 1, "terminalOpcode": "0x98"}]}
        source2 = {"path": "SOUND/animb.mid", "offset": 0, "length": len(score), "sha256": sha(score)}
        mk2 = [
            {"kind": "raw", "name": "animb.mid (original)", "id": "raw:SOUND/animb.mid",
             "filename": "animb.mid.soundimages.bin", "source": source2,
             "metadata": {"p64ScoreProvenance": provenance}},
            {"kind": "sequence", "name": "animb.mid", "id": "midi:SOUND/animb.mid",
             "filename": "animb.mid", "source": source2,
             "metadata": {"p64ScoreProvenance": provenance}},
        ]
        self.records.append(self.record("mk2", root2, mk2, [score, midi]))
        blob = b"prefix" + wav + b"suffix"
        (root3 / "BLADE.FTR").write_bytes(blob)
        source3 = {"path": "BLADE.FTR", "offset": 6, "length": len(wav), "sha256": sha(blob)}
        mk3 = [{"kind": "audio", "name": "BLADE.FTR / Spec0003 / 0", "id": "BLADE.FTR@6",
                "filename": "BLADE_0.wav", "source": source3,
                "metadata": {"wavSha256": sha(wav)}}]
        self.records.append(self.record("mk3", root3, mk3, [wav]))

    def record(self, game, root, rows, payloads):
        filename = self.base / (game + ".zip")
        with ZipFile(filename, "w") as z:
            z.writestr("manifest.json", json.dumps({
                "format": "mkdos_selected_assets_v1", "selectionOrder": rows}))
            for i, (row, payload) in enumerate(zip(rows, payloads)):
                z.writestr(f"assets/{i:05}_{row['filename']}", payload)
        return {"game": game, "root": str(root), "download": str(filename),
                "names": [r["name"] for r in rows]}

    def test_valid_three_game_sequence(self):
        switch["main"](self.records)

    def test_reversed_game_sequence_rejected(self):
        with self.assertRaises(AssertionError):
            switch["main"]([self.records[1], self.records[0], self.records[2]])

    def test_wrong_old_source_rejected(self):
        self.records[1]["root"] = self.records[0]["root"]
        with self.assertRaises(AssertionError):
            switch["main"](self.records)

    def test_stale_mk1_zip_under_mk3_rejected(self):
        self.records[2]["download"] = self.records[0]["download"]
        with self.assertRaises(AssertionError):
            switch["main"](self.records)

    def test_corrupted_current_download_rejected(self):
        self.records[1]["download"] = self.records[2]["download"]
        with self.assertRaises(AssertionError):
            switch["main"](self.records)

    def test_wrong_inspector_selection_rejected(self):
        self.records[0]["names"] = ["OLD_GAME_STALE.wav"]
        with self.assertRaises(AssertionError):
            switch["main"](self.records)


if __name__ == "__main__":
    unittest.main()
