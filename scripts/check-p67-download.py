"""Independent readback of P67 Chrome downloads. Uses only the Python standard library."""
import hashlib
import json
from pathlib import Path
import re
import struct
import sys
from zipfile import ZipFile


EXE = {
    "mk1": "750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14",
    "mk2": "fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65",
    "mk3": "8aa7f3d45a086e7373afc120dc88378bda3d7766d5b69badbc707bb4570bdef0",
}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def source_bytes(root, relative):
    current = root
    for part in relative.split("/"):
        matches = [p for p in current.iterdir() if p.name.casefold() == part.casefold()]
        assert len(matches) == 1, relative
        current = matches[0]
    assert current.resolve().is_relative_to(root.resolve())
    return current.read_bytes()


def selection(game, root, archive, names):
    manifest = json.loads(archive.read("manifest.json"))
    assert manifest["format"] == "mkdos_selected_assets_v1"
    rows = manifest["selectionOrder"]
    kinds = ["raw", "sequence"] if game == "mk2" else ["audio"]
    assert [row["kind"] for row in rows] == kinds
    assert [row["name"] for row in rows] == names
    members = ["manifest.json"]
    for index, row in enumerate(rows):
        filename = re.sub(r"[^A-Za-z0-9_.-]", "_", row["filename"])[:180]
        member = f"assets/{index:05}_{filename}"
        members.append(member)
        payload = archive.read(member)
        source = row["source"]
        path, start, length = source["path"], source["offset"], source["length"]
        original = source_bytes(root, path)
        assert source["sha256"] == sha(original)
        assert 0 <= start < start + length <= len(original)
        interval = original[start:start + length]
        metadata = row["metadata"]
        if game == "mk2":
            assert path.upper() == "SOUND/ANIMB.MID"
            assert row["id"] == ("raw:" if index == 0 else "midi:") + path
            assert start == 0 and length == len(original)
            provenance = metadata["p64ScoreProvenance"]
            assert provenance["sourceSha256"] == sha(original)
            if index == 1:
                assert payload.startswith(b"MThd") and sha(payload) == provenance["exportedMidiSha256"]
                for track in provenance["sourceTrackBoundaries"]:
                    terminal = original[track["terminalSourceOffset"]]
                    assert terminal in (0x91, 0x98) and int(track["terminalOpcode"], 16) == terminal
            else:
                assert payload == original
        else:
            assert payload[:4] == b"RIFF" and payload[8:12] == b"WAVE"
            assert payload == interval, "WAV differs from original interval"
            if game == "mk1":
                assert start == 0 and length == len(original)
                assert row["id"] == "audio/wav/" + path
                assert metadata["packagePath"] == row["id"]
            else:
                assert row["id"] == f"{path}@{start}"
                assert metadata["wavSha256"] == sha(interval)
    assert sorted(archive.namelist()) == sorted(members), "unexpected or duplicate ZIP member"


def streams(exe, package, previous):
    manifest_path = "manifests/mk1_source_streams.json"
    indexed = ["indexed/descriptor_manifest.json", "indexed/descriptor_pixels.bin"]
    assert sorted(package.namelist()) == sorted([manifest_path, "README.txt", *indexed])
    assert package.testzip() is None
    manifest = json.loads(package.read(manifest_path))
    assert manifest["originalExeSha256"] == sha(exe)
    for name, key in zip(indexed, ["originalIndexedManifestSha256", "originalIndexedBinarySha256"]):
        data = package.read(name)
        assert data == previous.read(name) and sha(data) == manifest[key]
    tables = manifest["tables"]
    assert len(tables) == 8 and sum(len(t["entries"]) for t in tables) == 739
    for table in tables:
        for cell in table["entries"]:
            address = 0x8ca54 + cell["cellWatcomOffset"]
            assert 0 <= address <= len(exe) - 4
            assert struct.unpack_from("<I", exe, address)[0] == cell["rawValue"]


if __name__ == "__main__":
    if not __debug__:
        raise RuntimeError("run with Python assertions enabled")
    game, folder, selected, ui_names, *packages = sys.argv[1:]
    root = Path(folder)
    exe = source_bytes(root, game + ".exe")
    assert sha(exe) == EXE[game], "unexpected executable identity"
    names = json.loads(ui_names)
    with ZipFile(selected) as archive:
        selection(game, root, archive, names)
    if game == "mk1":
        with ZipFile(packages[0]) as package, ZipFile(packages[1]) as previous:
            streams(exe, package, previous)
    print(game, "verified Chrome downloads for", names, flush=True)
