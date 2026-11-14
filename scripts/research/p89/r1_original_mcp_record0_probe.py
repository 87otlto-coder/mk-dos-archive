#!/usr/bin/env python3
"""P89 R1: bounded DOSBox-X original MK3 P79 source READ REQUEST probe.

Requires disposable GOG MK3 copy under private FIXTURES/VALIDATION. Starts
DEBUGBOX MK3.EXE, observes DOS seek to original source byte 667866 and then
a 1506-byte read request matching record-0 payload length. Captures only
metadata; stops BEFORE any claim of successful read, decoding or pixels.
Experimental original-Windows acceptance required.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import socket
import subprocess
import sys
import time

from r1_mcp_preflight import Control
from r1_mk3_le_source_map import input_exe, MK3_EXE_SHA256
from r1_payload_discriminators import source_file, DATA_SHA, START

P79_FIRST_PAYLOAD = 732662
P79_FIRST_PAYLOAD_LENGTH = 1506
MAX_SEEK_STOPS = 1600
MAX_READ_STOPS = 250
DEADLINE_SECONDS = 240
REGISTER_NAMES = ("EAX", "EBX", "ECX", "EDX", "DS", "CS", "EIP")


def require(ok: object, reason: str) -> None:
    if not ok:
        raise ValueError("P89 R1 original MCP: " + reason)


def parse_ev(lines: list[str], register: str) -> int:
    """EV output is hexadecimal, e.g. EV of 'EAX' is: / 4200."""
    name = re.escape(register)
    joined = "\n".join(lines)
    match = re.search(r"EV of ['\"]?" + name + r"['\"]?\s+is:\s*(?:\n|\r\n)\s*(?:0x)?([0-9A-Fa-f]+)(?:\b|$)",
                      joined, flags=re.I)
    require(match is not None, "unexpected EV " + register + " reply: " + repr(lines[:3]))
    return int(match.group(1), 16)


def registers(channel: Control) -> dict[str, int]:
    return {name: parse_ev(channel.request("EXEC EV "+name), name)
            for name in REGISTER_NAMES}


def is_p79_seek(reg: dict[str, int]) -> bool:
    return ((reg["EAX"] & 0xFFFF) == 0x4200
            and ((reg["ECX"] & 0xFFFF) << 16 | (reg["EDX"] & 0xFFFF)) == START)


def is_record0_read(reg: dict[str, int], handle: int) -> bool:
    return (((reg["EAX"] >> 8) & 0xFF) == 0x3F
            and (reg["EBX"] & 0xFFFF) == handle
            and (reg["ECX"] & 0xFFFF) == P79_FIRST_PAYLOAD_LENGTH)


def require_original_debug_copy(game: Path, evidence: Path, private_root: Path) -> dict:
    root = private_root.resolve(strict=True)
    require(root.is_dir() and root.name.upper() == "VALIDATION",
            "private root must be existing FIXTURES/VALIDATION")
    g = game.resolve(strict=True)
    out = evidence.resolve(strict=True)
    require(g.is_dir() and g.is_relative_to(root) and g != root
            and g.name == "P89-R1-MK3-DEBUG-COPY",
            "game must be canonical disposable P89-R1-MK3-DEBUG-COPY")
    require(out.is_dir() and out.is_relative_to(root) and out != g
            and not out.is_relative_to(g) and not g.is_relative_to(out),
            "evidence folder must be separate from original debug copy")
    require((g/"IMAGE"/"MK3.CUE").is_file() and (g/"IMAGE"/"MK3.GOG").is_file(),
            "original GOG CUE/CD image missing from private debug copy")
    original_exe = input_exe(g / "MK3.EXE")
    original_data = source_file(g / "DATA.MK3")
    require(hashlib.sha256(original_exe).hexdigest() == MK3_EXE_SHA256
            and hashlib.sha256(original_data).hexdigest() == DATA_SHA,
            "original fixture fingerprint mismatch")
    return {"originalExeSha256": MK3_EXE_SHA256, "originalDataSha256": DATA_SHA}


def await_stopped(channel: Control, deadline: float) -> dict[str, int]:
    """A successful STEPIN confirms stopped state, AFTER taking one instruction.

    Record registers beforehand. STEPIN is rejected while guest is running.
    Because a real instruction is taken, the report is a request witness,
    not an immutable pre-call register/call stack.
    """
    while time.monotonic() < deadline:
        try:
            candidate = registers(channel)
            stepped = channel.request("EXEC STEPIN")
            require(any("STEPIN CS:IP=" in line for line in stepped),
                    "unexpected successful STEPIN response")
            return candidate
        except ValueError as error:
            # Release DOSBox-X 2026.10.01 (b6abbd5) does NOT implement STEPIN.
            # Fail with the exact missing dependency instead of retrying or
            # mistaking it for any original MK3 decoder behaviour.
            if "command not recognized" in str(error).lower():
                raise ValueError(
                    "P89 R1 original MCP: installed DOSBox-X does not support "
                    "remote STEPIN; first pass a no-game "
                    "r1_mcp_preflight.py --exercise-step-commands capability test"
                ) from error
            # Only known running-state errors are retried; all others fail closed.
            if "requires the debugger to be stopped" not in str(error).lower():
                raise
        time.sleep(0.05)
    raise ValueError("P89 R1 original MCP: breakpoint wait expired without verified stopped STEPIN")


def run(executable: Path, game: Path, validation: Path, private_root: Path,
        *, budget: float = DEADLINE_SECONDS) -> dict:
    require(30 <= budget <= 600, "invalid bounded runtime budget")
    fingerprint = require_original_debug_copy(game, validation, private_root)
    exe = executable.resolve(strict=True)
    require(exe.is_file() and exe.name.lower() == "dosbox-x.exe"
            and not exe.is_relative_to(private_root.resolve()),
            "debugger must be an existing EXE outside private fixture folder")
    output = validation.resolve()
    cfg = output / "r1-mk3-mcp.conf"
    logfile = output / "dosbox-r1-source-fileio.log"
    stderr = output / "dosbox-r1-stderr.txt"
    report = output / "r1-record0-read-request.json"
    require(all(not x.exists() for x in (cfg, logfile, stderr, report)),
            "refusing existing private report/config/log overwrite")

    deadline = time.monotonic() + budget
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as listener:
        listener.bind(("127.0.0.1", 0))
        listener.listen(1)
        listener.settimeout(min(budget, 40))
        port = listener.getsockname()[1]
        conf = (
            f"[dosbox]\nmcp_server={port}\n"
            f"[log]\nlogfile={logfile}\nfileio=true\nfiles=debug\nint21=true\n"
            f"[autoexec]\nmount c \"{game.resolve()}\"\n"
            "imgmount d c:\\image\\mk3.cue -t cdrom\n"
            "c:\ndebugbox mk3.exe\n"
        )
        cfg.write_text(conf, encoding="ascii")
        process = None
        try:
            with stderr.open("x", encoding="utf-8") as errors:
                process = subprocess.Popen([
                    str(exe), "-conf", str(cfg), "-nopromptfolder",
                    "-console", "-log-fileio", "-log-int21",
                ], cwd=str(output), stdout=subprocess.DEVNULL, stderr=errors)
                peer, address = listener.accept()
                require(address[0] == "127.0.0.1", "nonlocal debugger connection")
                try:
                    channel = Control(peer)
                    require(any(x.strip() == "PONG" for x in channel.request("PING")),
                            "debugger TCP handshake failed")
                    # Wait for DEBUGBOX game-entry stop, stepping one instruction.
                    initial = await_stopped(channel, deadline)
                    channel.request("EXEC BPDEL *")
                    channel.request("EXEC BPINT 21 42")
                    observed_seek = None
                    seek_count = 0
                    while seek_count < MAX_SEEK_STOPS:
                        channel.request("EXEC RUN")
                        stop = await_stopped(channel, deadline)
                        seek_count += 1
                        if is_p79_seek(stop):
                            observed_seek = stop
                            break
                    require(observed_seek is not None,
                            "P79 original source seek not reached within bounded stops")
                    handle = observed_seek["EBX"] & 0xFFFF
                    channel.request("EXEC BPDEL *")
                    channel.request("EXEC BPINT 21 3F")
                    observed_read = None
                    read_count = 0
                    while read_count < MAX_READ_STOPS:
                        channel.request("EXEC RUN")
                        stop = await_stopped(channel, deadline)
                        read_count += 1
                        if is_record0_read(stop, handle):
                            observed_read = stop
                            break
                    require(observed_read is not None,
                            "original 1506-byte record-0 read request not reached within bounds")
                    result = {
                        "status": "P79_RECORD0_READ_REQUEST_BREAKPOINT_STOPPED",
                        "classification": "SOURCE_FILE_IO_REQUEST_ONLY",
                        **fingerprint,
                        "p79SourceStart": START,
                        "firstRecordPayloadSourceOffset": P79_FIRST_PAYLOAD,
                        "firstRecordPayloadBytes": P79_FIRST_PAYLOAD_LENGTH,
                        "seekBreakStops": seek_count,
                        "readBreakStopsAfterSeek": read_count,
                        "readFileHandleCandidate": handle,
                        "seekRequestRegistersBeforeStep": observed_seek,
                        "readRequestRegistersBeforeStep": observed_read,
                        "gameEntryRegistersBeforeStep": initial,
                        "runBudgetSeconds": budget,
                        "sourceReadCompletionWitnessed": False,
                        "sourceBufferBytesDumped": 0,
                        "decompressionRoutineVerified": False,
                        "indexedOutputPixelPositionsVerified": 0,
                        "nativeFrameOrderOrTimingVerified": False,
                        "originalGameCopyOnly": True,
                        "privateEvidenceDir": str(output),
                    }
                finally:
                    peer.close()
        finally:
            if process is not None and process.poll() is None:
                process.terminate()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait(timeout=5)

    # File-I/O log must independently contain the original P79 seek marker.
    require(logfile.is_file(), "DOSBox-X did not produce a FILES log")
    log = logfile.read_text(encoding="utf-8", errors="replace")
    require("Seeking to 667866 bytes from position type (0) in DATA.MK3" in log,
            "missing independent logged P79 source seek; breakpoint alone is insufficient")
    result["independentFileIoP79SeekLogged"] = True
    result["fileIoLogSha256"] = hashlib.sha256(logfile.read_bytes()).hexdigest()
    with report.open("x", encoding="utf-8") as stream:
        json.dump(result, stream, indent=2, sort_keys=True)
        stream.write("\n")
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--exe", type=Path, required=True)
    parser.add_argument("--game", type=Path, required=True,
                        help="Disposable original GOG MK3 copy (not canonical installation)")
    parser.add_argument("--validation", type=Path, required=True,
                        help="NEW empty private evidence directory under validation root")
    parser.add_argument("--private-root", type=Path, required=True,
                        help="Existing F:\\Dev\\MKEXT\\FIXTURES\\VALIDATION directory")
    parser.add_argument("--budget-seconds", type=float, default=DEADLINE_SECONDS)
    args = parser.parse_args()
    try:
        print(json.dumps(run(args.exe, args.game, args.validation,
                             args.private_root, budget=args.budget_seconds),
                         indent=2, sort_keys=True))
        return 0
    except (ValueError, OSError, UnicodeError, EOFError, socket.timeout,
            subprocess.SubprocessError) as error:
        print("P89 R1 ORIGINAL MCP FAIL CLOSED: " + str(error), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
