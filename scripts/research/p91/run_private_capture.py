#!/usr/bin/env python3
"""P91 one-entry-point private native Tomb capture (Windows only).

NOT A RELEASE OR AN ACCEPTED GAME CAPTURE. The program must be distributed only
after the matching pinned DOSBox executable + DLLs and this complete package
have passed a separate Windows no-game preflight. It NEVER downloads files,
installs dependencies, modifies originals or changes Git branches.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time
import uuid

ROOT=Path(r"F:\Dev\MKEXT")
PACKAGE=Path(__file__).resolve().parent
GAME=ROOT/"FIXTURES"/"mk2"/"mk2"
VALIDATION=ROOT/"FIXTURES"/"VALIDATION"
EXECUTABLE=PACKAGE/"dosbox-x.exe"
IDENTITY=PACKAGE/"P91_CAPTURE_BUILD_ID.json"
PLAN=PACKAGE/"P91_CAPTURE_SOURCE_PLAN_20261115.json"
READER=PACKAGE/"read_native_capture.py"

class CaptureBlocked(RuntimeError):
    pass

def require(cond,why):
    if not cond:raise CaptureBlocked(why)

def sha_file(path):
    h=hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda:source.read(1024*1024),b""):
            h.update(block)
    return h.hexdigest()

def check_game(folder,required):
    require(folder.is_dir(),"Original MK2 fixture directory missing")
    for name,expected in required.items():
        matches=[p for p in folder.iterdir() if p.is_file() and p.name.upper()==name.upper()]
        require(len(matches)==1,"Missing/duplicate original fixture "+name)
        require(sha_file(matches[0])==expected,"Original fingerprint changed: "+name)

def check_identity(identity):
    for key in ("upstreamCommit","patchSha256","executableSha256","core","pagingEnabled"):
        require(key in identity,"Missing adapter identity: "+key)
    require(identity["upstreamCommit"]=="029bd65c5dcc7cdc7f2e14e35278620d9707d969",
            "Unexpected upstream DOSBox source")
    require(identity["core"]=="normal" and identity["pagingEnabled"] is False,
            "Unsupported emulator core/paging")
    for key in ("patchSha256","executableSha256"):
        value=identity[key]
        require(isinstance(value,str) and len(value)==64 and
                all(c in "0123456789abcdef" for c in value),
                "Adapter SHA-256 malformed: "+key)

def prepare_config(folder:Path,gamecopy:Path):
    require(gamecopy.is_dir(),"Disposable game copy not present")
    dest=folder/"capture.conf"
    require(not dest.exists(),"Private capture config already exists")
    # The DOS game sees only its private disposable copied directory.
    # No DEBUGBOX, breakpoints, memory-stepping or original-folder mounting.
    config=(
        "[sdl]\nfullscreen=false\noutput=surface\n"
        "[dosbox]\nmachine=svga_s3\nmemsize=16\n"
        "[cpu]\ncore=normal\ncycles=max\n"
        "[autoexec]\n"
        f'mount c "{gamecopy}"\n'
        "c:\nMK2.EXE\nexit\n"
    )
    with dest.open("x",encoding="ascii",newline="\n") as file:
        file.write(config)
    return dest

def preflight():
    require(os.name=="nt","Native P91 capture requires a Windows computer")
    require(ROOT.is_dir() and (ROOT/"SOURCE").is_dir() and
            (ROOT/"TOOLS").is_dir() and
            (ROOT/"FIXTURES").is_dir(),
            "Canonical F:\\Dev\\MKEXT SOURCE/TOOLS/FIXTURES layout missing")
    require(PACKAGE.resolve().is_relative_to((ROOT/"TOOLS").resolve()),
            "Installed adapter must be under canonical TOOLS")
    require(VALIDATION.is_dir(),"Private FIXTURES\\VALIDATION is missing")
    for file in (EXECUTABLE,IDENTITY,PLAN,READER,
                 PACKAGE/"snapshot.py",PACKAGE/"verify_snapshot.py"):
        require(file.is_file(),"Required P91 capture package member missing: "+file.name)
    identity=json.loads(IDENTITY.read_text(encoding="utf-8"))
    check_identity(identity)
    require(sha_file(EXECUTABLE)==identity["executableSha256"],
            "Instrumented DOSBox executable fingerprint mismatch")
    plan=json.loads(PLAN.read_text(encoding="utf-8"))
    require(plan.get("schema")=="mk2_p91_capture_plan_v1",
            "Unsupported P91 capture plan")
    check_game(GAME,plan["requiredOriginalFingerprints"])
    # Exclusive temporary write test; deletes only the file created here.
    probe=VALIDATION/(".p91-check-"+uuid.uuid4().hex)
    try:
        with probe.open("xb") as f:f.write(b"P91")
    finally:
        if probe.is_file():probe.unlink()
    return plan,identity

def capture(plan,identity,maximum_seconds=600):
    run=VALIDATION/("P91-"+uuid.uuid4().hex)
    run.mkdir(exist_ok=False)
    gamecopy=run/"GAMECOPY"
    try:
        shutil.copytree(GAME,gamecopy,symlinks=False)
        check_game(gamecopy,plan["requiredOriginalFingerprints"])
        config=prepare_config(run,gamecopy)
        # Bounded Windows GUI process; stdout/stderr never use PowerShell 5.1's
        # native-command pipeline or error-action preference.
        env=os.environ.copy()
        env.pop("MKEXT_P91_ADAPTER_SELFTEST_DIR",None)
        env["MKEXT_P91_NATIVE_CAPTURE_DIR"]=str(run)
        cmd=[str(EXECUTABLE),"-noconsole","-conf",str(config),"-exit"]
        with (run/"dosbox-stdout.log").open("xb") as stdout, \
             (run/"dosbox-stderr.log").open("xb") as stderr:
            process=subprocess.Popen(cmd,cwd=str(PACKAGE),env=env,
                                     stdin=subprocess.DEVNULL,stdout=stdout,stderr=stderr)
            try:
                deadline=time.monotonic()+maximum_seconds
                while time.monotonic()<deadline:
                    if (run/"p91-capture-refusal.json").exists():
                        raise CaptureBlocked("Native observer rejected state; inspect p91-capture-refusal.json")
                    if (run/"p91-native-raw-complete.json").is_file():
                        break
                    if process.poll() is not None:
                        raise CaptureBlocked("DOSBox exited before a Tomb packet was captured")
                    time.sleep(0.2)
                else:
                    raise CaptureBlocked("Bounded native capture expired without a complete Tomb packet")
            finally:
                if process.poll() is None:
                    process.terminate()
                    try:process.wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        process.kill();process.wait(timeout=5)
        # Binary marker is created only after the raw file is completely closed.
        from read_native_capture import verify_raw
        from snapshot import save_private
        from verify_snapshot import verify_folder
        verified=verify_raw(run,plan)
        output=VALIDATION/(run.name+"-verified")
        require(not output.exists(),"Refusing an existing verified packet path")
        save_private(plan,verified["phases"],output,
                     input_fingerprints=plan["requiredOriginalFingerprints"],
                     adapter_identity=identity)
        report=verify_folder(plan,output)
        require(report["status"]=="PASS_P91_PACKET_CONSISTENCY",
                "Independent P91 packet acceptance did not pass")
        summary={
            "status":"PASS_P91_PRIVATE_PACKET_CONSISTENCY",
            "rawPrivateFolder":str(run),"convertedPrivateFolder":str(output),
            "rawSha256":verified["rawSha256"],
            "packetIntegrityVerified":True,
            "nativeRuntimeProvenance":"VALIDATION PENDING",
            "originalFramebufferReconstructed":False,
            "originalGameExecutedByLauncher":True
        }
        with (run/"capture-result.json").open("x",encoding="utf-8") as output_file:
            json.dump(summary,output_file,indent=2)
        return summary
    except Exception as exc:
        # Never generate a success/manifest for an incomplete experiment.
        with (run/"capture-launcher-error.txt").open("x",encoding="utf-8") as log:
            log.write(type(exc).__name__+": "+str(exc)+"\n")
        raise CaptureBlocked(str(exc)+"; private evidence: "+str(run)) from exc

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--capture",action="store_true",
                   help="Launch once using a disposable verified game copy")
    p.add_argument("--maximum-seconds",type=int,default=600)
    args=p.parse_args()
    try:
        plan,identity=preflight()
        if not args.capture:
            print("P91 PREFLIGHT PASSED. No original game launched.")
            return 0
        require(60<=args.maximum_seconds<=900,"Capture budget must be 60–900 seconds")
        result=capture(plan,identity,args.maximum_seconds)
        print(json.dumps(result,indent=2))
        return 0
    except (CaptureBlocked,OSError,ValueError,KeyError,subprocess.SubprocessError) as exc:
        print("P91 CAPTURE NOT ACCEPTED: "+str(exc),file=sys.stderr)
        return 2

if __name__=="__main__":
    raise SystemExit(main())
