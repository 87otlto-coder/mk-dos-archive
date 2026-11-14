#!/usr/bin/env python3
"""Probe DOSBox-X 2026.10 debugger TCP control with NO game mounted.

Pure standard library, localhost-only connection initiated by the emulator.
No game bytes, debugger memory writes, or external network operations.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import socket
import subprocess
import sys


def require(ok, reason):
    if not ok:
        raise ValueError("P89 MCP preflight: " + reason)


class Control:
    def __init__(self, peer: socket.socket):
        self.peer = peer
        self.peer.settimeout(5)
        self.reader = peer.makefile("rb")
        self.serial = 0

    def request(self, command: str) -> list[str]:
        require(command and "\n" not in command and "\r" not in command
                and len(command) <= 256, "invalid debugger command")
        self.serial += 1
        sid = str(self.serial)
        self.peer.sendall(f"REQ {sid} {command}\n".encode("ascii"))
        begin = self.reader.readline(2049).decode("utf8", errors="replace").strip()
        require(begin in (f"BEGIN {sid} OK", f"BEGIN {sid} ERR"),
                "unexpected or missing debugger response header")
        out = []
        for _ in range(150):
            line = self.reader.readline(2049)
            require(bool(line), "unterminated debugger response")
            value = line.decode("utf8", errors="replace").rstrip("\r\n")
            if value == f"END {sid}":
                require(begin.endswith("OK"), "debugger rejected request: " + "; ".join(out[:3]))
                return out
            require(len(value) < 2048, "oversized debugger output line")
            out.append(value)
        raise ValueError("P89 MCP preflight: debugger output limit exceeded")


def probe_protocol(channel: Control, *, exercise_resume: bool = False) -> dict:
    pong = channel.request("PING")
    require(any(x.strip() == "PONG" for x in pong), "PING reply contained no PONG")
    # EV returns register/expression text. CPU and D only draw a debugger window.
    registers = channel.request("EXEC EV EAX")
    require(bool(registers), "no debugger register output; debugger may not be stopped")
    result = {
        "status": "PASS",
        "protocol": "DOSBOX_X_MCP_LOCALHOST_V1",
        "pingVerified": True,
        "stoppedDebuggerExpressionVerified": True,
        "originalGameMounted": False,
        "originalDataReadOrDecoded": False,
        "registerOutputLines": registers[:3],
    }
    if exercise_resume:
        # RUN acknowledges acceptance BEFORE guest execution resumes.
        # A successful acknowledgement alone never establishes a later stop.
        channel.request("EXEC RUN")
        # Explicit BREAK must re-enter the debugger before we read registers.
        # Neither command mounts any original game or writes guest memory.
        channel.request("BREAK")
        after = channel.request("EXEC EV EAX")
        require(bool(after) and any("EV of" in x for x in after),
                "no register expression after remote BREAK")
        result["runAcknowledged"] = True
        result["remoteBreakAcknowledged"] = True
        result["registerAfterBreakVerified"] = True
        result["postBreakRegisterOutputLines"] = after[:3]
    return result


def run(executable: Path, validation: Path, timeout: float = 20.0,
        *, exercise_resume: bool = False) -> dict:
    exe = executable.resolve(strict=True)
    require(exe.is_file() and exe.name.lower() == "dosbox-x.exe",
            "DOSBox-X executable not found")
    folder = validation.resolve(strict=True)
    require(folder.is_dir() and folder != exe.parent
            and not folder.is_relative_to(exe.parent),
            "preflight output must be a private validation directory")
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as listener:
        listener.bind(("127.0.0.1", 0))
        listener.listen(1)
        listener.settimeout(timeout)
        port = listener.getsockname()[1]
        config = folder / "dosbox-x-mcp-preflight.conf"
        require(not config.exists(), "private preflight config already exists")
        config.write_text("[dosbox]\nmcp_server=" + str(port) + "\n[autoexec]\n",
                          encoding="ascii")
        process = None
        try:
            with (folder / "dosbox-x-preflight-stderr.txt").open("x", encoding="utf-8") as errors:
                process = subprocess.Popen(
                    [str(exe), "-conf", str(config), "-nopromptfolder",
                     "-console", "-break-start", "-noautoexec"],
                    cwd=str(folder), stdout=subprocess.DEVNULL, stderr=errors)
                peer, address = listener.accept()
                try:
                    require(address[0] == "127.0.0.1", "non-local debugger connection refused")
                    result = probe_protocol(Control(peer), exercise_resume=exercise_resume)
                finally:
                    peer.close()
                result["dosboxProcessId"] = process.pid
                result["evidenceConfigPath"] = str(config)
                result["portIsEphemeralAndLocalhostOnly"] = True
                return result
        finally:
            if process is not None and process.poll() is None:
                process.terminate()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait(timeout=5)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--exe", type=Path, required=True,
                        help="Existing debugger-enabled DOSBox-X SDL2 exe")
    parser.add_argument("--validation", type=Path, required=True,
                        help="NEW private validation directory, already created")
    parser.add_argument("--exercise-run-break", action="store_true",
                        help="Extra no-game test: remote RUN, BREAK, then EV EAX")
    args = parser.parse_args()
    try:
        print(json.dumps(run(args.exe, args.validation,
                             exercise_resume=args.exercise_run_break), indent=2))
        return 0
    except (ValueError, OSError, EOFError, UnicodeError,
            subprocess.SubprocessError, socket.timeout) as error:
        print("P89 MCP preflight ERROR: " + str(error), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
