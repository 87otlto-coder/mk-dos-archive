#!/usr/bin/env python3
"""Seal and verify one source-safe portable P91 Windows capture package.

This tool never executes DOSBox or reads commercial game files. It verifies
package inventory, executable identity, pinned provenance and byte integrity.
The independent Windows CI launch must additionally exercise the packaged EXE.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import sys

UPSTREAM = "029bd65c5dcc7cdc7f2e14e35278620d9707d969"
MANIFEST = "P91_PACKAGE_MANIFEST.json"
IDENTITY = "P91_CAPTURE_BUILD_ID.json"
REQUIRED = frozenset((
    "dosbox-x.exe", IDENTITY, "P91_CAPTURE_SOURCE_PLAN_20261115.json",
    "Run-P91-Private-Capture.cmd", "run_private_capture.py",
    "read_native_capture.py", "snapshot.py", "verify_snapshot.py",
    "README_PRIVATE_CAPTURE.md",
))
ALLOWED_EXT = frozenset((".exe", ".dll", ".json", ".py", ".md", ".cmd", ".txt"))
MAX_MEMBER_BYTES = 80_000_000

class PackageError(ValueError):
    pass

def require(ok, reason):
    if not ok:
        raise PackageError("P91 portable gate: " + reason)

def digest(path):
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()

def inventory(folder):
    require(folder.is_dir() and folder.name == "P91Capture",
            "the package must be a P91Capture directory")
    entries = list(folder.iterdir())
    require(entries, "empty package")
    require(all(p.is_file() and not p.is_symlink() for p in entries),
            "nested directories and symlinks refused")
    files = [p for p in entries if p.name != MANIFEST]
    names = {p.name for p in files}
    require(len(files) == len(names), "duplicate filenames")
    require(REQUIRED <= names, "required portable members missing")
    require(any(p.suffix.lower() == ".dll" for p in files),
            "no runtime DLLs bundled")
    require(all(p.suffix.lower() in ALLOWED_EXT or p.name == "COPYING"
                for p in files), "unexpected package file type")
    forbidden = {"MK2.EXE", "TOMB.GRA", "PORTAL.GRA", "IMAGES.GRA"}
    require(not (forbidden & {p.name.upper() for p in files}),
            "original DOS game file in package")
    require(all(0 < p.stat().st_size < MAX_MEMBER_BYTES for p in files),
            "empty or oversized portable member")
    ident = json.loads((folder / IDENTITY).read_text(encoding="utf-8"))
    require(ident.get("schema") == "mkext_p91_private_capture_build_identity_v1",
            "wrong build identity schema")
    require(ident.get("upstreamCommit") == UPSTREAM and ident.get("core") == "normal"
            and ident.get("pagingEnabled") is False and
            ident.get("containsCommercialGameAssets") is False and
            ident.get("originalRuntimeCaptured") is False,
            "unsafe or unpinned build identity")
    exe_sha = digest(folder / "dosbox-x.exe")
    require(exe_sha == ident.get("executableSha256"), "executable hash mismatch")
    with (folder / "dosbox-x.exe").open("rb") as f:
        require(f.read(2) == b"MZ", "Windows executable signature missing")
    return {
        "schema": "mkext_p91_portable_capture_package_v1",
        "upstreamCommit": UPSTREAM,
        "executableSha256": exe_sha,
        "patchSha256": ident.get("patchSha256"),
        "commercialGameFilesIncluded": False,
        "originalGameRun": False,
        "nativeTombCaptured": False,
        "members": [
            {"name": p.name, "bytes": p.stat().st_size, "sha256": digest(p)}
            for p in sorted(files, key=lambda p: p.name.casefold())
        ],
    }

def verify(folder):
    existing = folder / MANIFEST
    require(existing.is_file() and not existing.is_symlink(),
            "portable manifest absent")
    saved = json.loads(existing.read_text(encoding="utf-8"))
    expected = inventory(folder)
    require(saved == expected, "inventory/sha256/identity mismatch")
    return expected

def seal(folder):
    require(not (folder / MANIFEST).exists(),
            "existing portable manifest will not be overwritten")
    obj = inventory(folder)
    with (folder / MANIFEST).open("x", encoding="utf-8") as file:
        json.dump(obj, file, indent=2)
        file.write("\n")
    verify(folder)
    return obj

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("seal", "verify"))
    parser.add_argument("--package", type=Path, required=True)
    a = parser.parse_args()
    try:
        folder = a.package.resolve(strict=True)
        result = seal(folder) if a.action == "seal" else verify(folder)
        print(json.dumps({"status": "PASS_P91_PORTABLE_INVENTORY",
                          "members": len(result["members"]),
                          "executableSha256": result["executableSha256"],
                          "originalGameRun": False}, indent=2))
        return 0
    except (OSError, ValueError, KeyError, TypeError) as exc:
        print(str(exc), file=sys.stderr)
        return 2

if __name__ == "__main__":
    raise SystemExit(main())
