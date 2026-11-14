#!/usr/bin/env python3
"""P89 research preflight: source + optional ORIGINAL DOS fixture identity.

Read-only for checked-out source and all original commercial input directories.
A report may be created exclusively at a new caller-selected private path.
No original bytes are embedded in stdout, logs, GitHub or the report.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[3]
ORIGINAL_SHA256 = {
    "mk1": {
        "MK1.EXE": "750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14",
    },
    "mk2": {
        "MK2.EXE": "fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65",
        "TOMB.GRA": "be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613",
        "PORTAL.GRA": "cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82",
        "IMAGES.GRA": "2b26796a64c2aebfee75832696aeae9bbcf9df56d82cb9a39df58a557d3ad8cf",
    },
    "mk3": {
        "MK3.EXE": "8aa7f3d45a086e7373afc120dc88378bda3d7766d5b69badbc707bb4570bdef0",
        "DATA.MK3": "72905bc96b752bceb0055296e26b904402909f73a1401541c0dd175135a55517",
    },
}


def require(ok, why):
    if not ok:
        raise ValueError("P89 PREFLIGHT: " + why)


def under(path: Path, directory: Path) -> bool:
    return path == directory or path.is_relative_to(directory)


def sha_file(path: Path) -> str:
    check = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            check.update(block)
    return check.hexdigest()


def command(args: list[str], *, root: Path = ROOT) -> str:
    result = subprocess.run(args, cwd=root, capture_output=True, text=True,
                            timeout=20, check=False)
    require(result.returncode == 0, "source tool command failed: " + args[0])
    return result.stdout.strip()


def require_clean_source(root: Path = ROOT) -> dict:
    root = root.resolve(strict=True)
    actual = Path(command(["git", "rev-parse", "--show-toplevel"], root=root)).resolve()
    require(actual == root, "unexpected Git source checkout root")
    dirty = command(["git", "status", "--porcelain", "--untracked-files=no"], root=root)
    require(not dirty, "tracked source is dirty; preserve changes before test")
    return {
        "commit": command(["git", "rev-parse", "HEAD"], root=root),
        "tree": command(["git", "rev-parse", "HEAD^{tree}"], root=root),
        "branch": command(["git", "branch", "--show-current"], root=root),
        "trackedSourceClean": True,
    }


def original_fixture(game: str, folder: Path, *, root: Path = ROOT) -> dict:
    require(game in ORIGINAL_SHA256, "unknown game family")
    resolved = folder.resolve(strict=True)
    require(resolved.is_dir(), "original installation directory not found")
    require(not under(resolved, root.resolve()), "commercial fixture is within Git source")
    files = {}
    listed = list(resolved.iterdir())
    for original_name, expected in ORIGINAL_SHA256[game].items():
        candidates = [p for p in listed if p.is_file() and p.name.upper() == original_name]
        require(len(candidates) == 1, "missing or duplicated " + original_name)
        actual = sha_file(candidates[0])
        require(actual == expected, "original input SHA mismatch: " + original_name)
        files[original_name] = {"sha256": actual, "verified": True, "bytes": candidates[0].stat().st_size}
    return {
        "game": game,
        "classification": "VERIFIED_INPUT_IDENTITY_ONLY",
        "commercialSourceUploaded": False,
        "requiredFiles": files,
    }


def preflight(*, fixture_folders: dict[str, Path] | None = None,
              require_original: bool = False,
              expect_head: str | None = None,
              expect_branch: str | None = None,
              require_windows: bool = False,
              root: Path = ROOT) -> dict:
    source = require_clean_source(root)
    require(not expect_head or source["commit"] == expect_head, "wrong source commit")
    require(not expect_branch or source["branch"] == expect_branch, "wrong branch")
    require(not require_windows or os.name == "nt", "original Windows mode requires Windows")
    require(sys.version_info >= (3, 11), "Python 3.11+ required")
    node = command(["node", "--version"], root=root)
    require(bool(node), "Node version unknown")
    fixture_folders = fixture_folders or {}
    require(all(game in ORIGINAL_SHA256 for game in fixture_folders), "unknown fixture family")
    evidence = []
    for game in ORIGINAL_SHA256:
        folder = fixture_folders.get(game)
        if folder is None:
            evidence.append({"game": game, "classification": "UNAVAILABLE",
                             "originalByteChecksPerformed": False})
        else:
            evidence.append(original_fixture(game, folder, root=root))
    if require_original:
        require(all(e["classification"] == "VERIFIED_INPUT_IDENTITY_ONLY" for e in evidence),
                "original fixture required for every game family")
    return {
        "pass": "P89_PREFLIGHT", "status": "PASS",
        "source": source,
        "platform": {"osName": os.name, "python": sys.version.split()[0],
                     "node": node, "pillowInstalled": importlib.util.find_spec("PIL") is not None},
        "originalFixtureEvidence": evidence,
        "originalInputsDirectlyTested": sum(e["classification"] == "VERIFIED_INPUT_IDENTITY_ONLY"
                                            for e in evidence),
        "extractionOrAnimationDecodingClaimed": False,
        "workbookSourceFilesMutated": False,
        "sourceOnlyPASSDoesNotMeanOriginalFixturePASS": True,
    }


def private_report_path(path: Path, fixture_folders: dict[str, Path], *, root: Path = ROOT) -> Path:
    require(path.suffix.lower() == ".json", "report must be JSON")
    require(path.parent.is_dir(), "private report parent missing")
    resolved = path.resolve(strict=False)
    require(not resolved.exists() and not under(resolved, root.resolve()),
            "report overwrite or report path in source checkout")
    for folder in fixture_folders.values():
        require(not under(resolved, folder.resolve(strict=True)),
                "report path within commercial installation")
    return resolved


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    for game in ORIGINAL_SHA256:
        parser.add_argument("--" + game, type=Path, help="Optional private original DOS game directory")
    parser.add_argument("--require-original", action="store_true")
    parser.add_argument("--require-windows", action="store_true")
    parser.add_argument("--expect-head")
    parser.add_argument("--expect-branch")
    parser.add_argument("--report", type=Path, help="New private JSON report path")
    args = parser.parse_args()
    try:
        folders = {name: getattr(args, name) for name in ORIGINAL_SHA256 if getattr(args, name)}
        result = preflight(fixture_folders=folders, require_original=args.require_original,
                           require_windows=args.require_windows,
                           expect_head=args.expect_head, expect_branch=args.expect_branch)
        if args.report:
            report = private_report_path(args.report, folders)
            with report.open("x", encoding="utf-8") as writer:
                json.dump(result, writer, sort_keys=True, indent=2)
                writer.write("\n")
        print(json.dumps(result, indent=2))
        return 0
    except (OSError, ValueError, subprocess.TimeoutExpired) as error:
        print("P89 PREFLIGHT ERROR: " + str(error), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
