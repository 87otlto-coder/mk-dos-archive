#!/usr/bin/env python3
"""Windows-hosted, original-game-free CI guards for MK DOS Extractor.

Run on windows-latest with actions/setup-python. Do not read private game fixtures,
write extracted media, upload generated files, or prune research artifacts.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request

ARTIFACT = "mk-dos-p11-browser-build"
FORBIDDEN = re.compile(
    r"\.(?:exe|gra|ftr|u8|mid|wav|ogg|mp3|flac|png|gif|bmp|jpg|jpeg|webp|zip|bin|7z|rar)$",
    re.IGNORECASE,
)


def guard() -> None:
    paths = subprocess.check_output(["git", "ls-files", "-z"]).decode(
        "utf-8", errors="surrogateescape"
    ).split("\0")
    forbidden = [name for name in paths if FORBIDDEN.search(name)]
    if forbidden:
        raise RuntimeError("Forbidden Git-tracked game/media extensions: " + ", ".join(forbidden[:50]))
    for name in (
        "scripts/verify-mk2-p15-cumulative.cjs",
        "scripts/verify-mk2-p16-fixture-identity.py",
    ):
        if not Path(name).is_file():
            raise RuntimeError("Required regression source is missing: " + name)
    subprocess.run(
        [sys.executable, "scripts/verify-mk2-p16-fixture-identity.py", "--help"],
        stdout=subprocess.DEVNULL, check=True,
    )
    print("PASS: tracked media excluded; P16 original-input checker is loadable.")


def chrome_binary() -> Path:
    candidates = [
        os.environ.get("CHROME_PATH"),
        shutil.which("chrome"),
        shutil.which("chrome.exe"),
    ]
    for home in (os.environ.get("PROGRAMFILES"), os.environ.get("PROGRAMFILES(X86)"),
                 os.environ.get("LOCALAPPDATA")):
        if home:
            candidates.append(str(Path(home) / "Google" / "Chrome" / "Application" / "chrome.exe"))
    for candidate in candidates:
        if candidate and Path(candidate).is_file():
            return Path(candidate)
    raise RuntimeError("Chrome not found on the Windows-hosted runner.")


def smoke_browser() -> None:
    if os.name != "nt":
        raise RuntimeError("This smoke test must run on a Windows runner.")
    with tempfile.TemporaryDirectory(prefix="mk-dos-windows-ci-") as folder:
        temp = Path(folder)
        log_path = temp / "preview.log"
        with log_path.open("wb") as log:
            preview = subprocess.Popen(
                ["npm.cmd", "run", "preview", "--", "--host", "127.0.0.1",
                 "--port", "4173", "--strictPort"],
                stdout=log, stderr=subprocess.STDOUT,
            )
            try:
                ready = False
                for _ in range(30):
                    if preview.poll() is not None:
                        break
                    try:
                        with urllib.request.urlopen("http://127.0.0.1:4173/", timeout=2) as response:
                            if response.status == 200:
                                ready = True
                                break
                    except (urllib.error.URLError, TimeoutError):
                        pass
                    time.sleep(1)
                if not ready:
                    raise RuntimeError("Vite preview failed to start:\n" +
                                       log_path.read_text(encoding="utf-8", errors="replace")[-4000:])
                chrome = chrome_binary()
                proc = subprocess.run(
                    [str(chrome), "--headless=new", "--disable-gpu",
                     "--disable-extensions", "--no-first-run", "--no-default-browser-check",
                     "--user-data-dir=" + str(temp / "chrome-profile"),
                     "--virtual-time-budget=4000", "--dump-dom",
                     "http://127.0.0.1:4173/"],
                    stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                    timeout=50, check=False,
                )
                dom = proc.stdout.decode("utf-8", errors="replace")
                error = proc.stderr.decode("utf-8", errors="replace")
                if proc.returncode != 0:
                    raise RuntimeError("Chrome failed, exit " + str(proc.returncode) +
                                       ":\n" + error[-4000:])
                for expected in ("MK DOS ARCHIVE", "NO SOURCE LINKED"):
                    if expected not in dom:
                        raise RuntimeError("Chrome DOM missing " + expected +
                                           ":\n" + dom[-2500:] + "\n" + error[-1500:])
                print("PASS: Windows Chrome rendered the React app and no-source onboarding.")
            finally:
                # Terminate the Windows npm.cmd -> Node -> Vite child process tree.
                if preview.poll() is None:
                    subprocess.run(
                        ["taskkill", "/PID", str(preview.pid), "/T", "/F"],
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                        check=False,
                    )
                    try:
                        preview.wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        preview.kill()
                        preview.wait(timeout=5)


def duplicate() -> None:
    repo = os.environ["GITHUB_REPOSITORY"]
    sha = os.environ["GITHUB_SHA"]
    payload = subprocess.check_output(
        ["gh", "api", "--paginate", "--slurp",
         f"repos/{repo}/actions/artifacts?name={ARTIFACT}&per_page=100"]
    )
    pages = json.loads(payload)
    active = [a for page in pages for a in page.get("artifacts", [])
              if a.get("name") == ARTIFACT and a.get("expired") is False]
    exists = any(a.get("workflow_run", {}).get("head_sha") == sha for a in active)
    if exists:
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as out:
            out.write("Skipping browser upload: this commit already has an active build.\n")
    else:
        with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as out:
            out.write("upload=true\n")
    print("PASS: checked active browser artifacts; upload=" + str(not exists).lower())


if __name__ == "__main__":
    choices = {"guard": guard, "browser": smoke_browser, "duplicate": duplicate}
    if len(sys.argv) != 2 or sys.argv[1] not in choices:
        raise SystemExit("Usage: python .github/scripts/windows_ci.py guard|browser|duplicate")
    choices[sys.argv[1]]()
