"""Stage a bounded source-safe P91 private Windows capture package.

No original game files, reconstructed pixels, audio or raw RAM data are read.
This only stages the already-built, pinned DOSBox-X test executable together
with source-safe Python validation tools. Runtime DLLs are copied and tested
separately by the Windows CI workflow before any artifact is published.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import shutil
import sys

UPSTREAM="029bd65c5dcc7cdc7f2e14e35278620d9707d969"
MEMBERS=(
    ("run_private_capture.py","run_private_capture.py"),
    ("read_native_capture.py","read_native_capture.py"),
    ("snapshot.py","snapshot.py"),
    ("verify_snapshot.py","verify_snapshot.py"),
    ("Run-P91-Private-Capture.cmd","Run-P91-Private-Capture.cmd"),
    ("README_PRIVATE_CAPTURE.md","README_PRIVATE_CAPTURE.md"),
)
PLAN_SOURCE="docs/validation/P91_CAPTURE_SOURCE_PLAN_20261115.json"
PLAN_TARGET="P91_CAPTURE_SOURCE_PLAN_20261115.json"


class PackageRefused(ValueError):
    pass


def require(ok,reason):
    if not ok:
        raise PackageRefused("P91 package: "+reason)


def sha_file(path):
    digest=hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda:stream.read(1<<20),b""):
            digest.update(block)
    return digest.hexdigest()


def stage(repo:Path, exe:Path, patch:Path, output:Path):
    """Exclusive destination, no automatic overwrites or original fixtures."""
    repo=repo.resolve(strict=True)
    exe=exe.resolve(strict=True)
    patch=patch.resolve(strict=True)
    output=output.resolve()
    require(not output.exists(),"package destination exists")
    require(output.name=="P91Capture","package folder must be P91Capture")
    require(exe.name.lower()=="dosbox-x.exe","unrecognised compiled executable")
    require(exe.stat().st_size>100000 and exe.stat().st_size<80000000,
            "compiled DOSBox-X executable size outside permitted range")
    with exe.open("rb") as f:
        require(f.read(2)==b"MZ","Windows executable signature absent")
    header=patch.read_text(encoding="utf-8")
    require(header.startswith("--- a/src/cpu/core_normal.cpp\n"),
            "unrecognised pinned CPU source patch")
    require("MKEXT_P91_CaptureObserve(core.cseip)" in header,
            "pinned capture hook absent")
    plan=json.loads((repo/PLAN_SOURCE).read_text(encoding="utf-8"))
    require(plan.get("schema")=="mk2_p91_capture_plan_v1",
            "P91 original source plan unsupported")
    require(plan["sourceExeSha256"]==
            "fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65",
            "unexpected original source plan")
    scripts=repo/"scripts"/"research"/"p91"
    source=[]
    for relative,destination in MEMBERS:
        p=scripts/relative
        require(p.is_file(),"missing source-safe package member "+relative)
        require(p.stat().st_size<200000,"unexpected package source size")
        source.append((p,destination))
    output.mkdir(parents=True,exist_ok=False)
    shutil.copy2(exe,output/"dosbox-x.exe")
    shutil.copy2(repo/PLAN_SOURCE,output/PLAN_TARGET)
    for p,name in source:
        shutil.copy2(p,output/name)
    identity={
        "schema":"mkext_p91_private_capture_build_identity_v1",
        "upstreamCommit":UPSTREAM,
        "patchSha256":sha_file(patch),
        "executableSha256":sha_file(exe),
        "core":"normal",
        "pagingEnabled":False,
        "sourceOnlyPackage":True,
        "containsCommercialGameAssets":False,
        "originalRuntimeCaptured":False
    }
    with (output/"P91_CAPTURE_BUILD_ID.json").open("x",encoding="utf-8") as f:
        json.dump(identity,f,indent=2)
        f.write("\n")
    for p,name in [(exe,"dosbox-x.exe"),(repo/PLAN_SOURCE,PLAN_TARGET),*source]:
        require(sha_file(p)==sha_file(output/name),
                "staged member differs from source "+name)
    return identity


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo",type=Path,required=True)
    parser.add_argument("--compiled-exe",type=Path,required=True)
    parser.add_argument("--patch",type=Path,required=True)
    parser.add_argument("--output",type=Path,required=True)
    args=parser.parse_args()
    try:
        result=stage(args.repo,args.compiled_exe,args.patch,args.output)
        print(json.dumps(result,indent=2))
        return 0
    except (PackageRefused,ValueError,OSError,KeyError) as exc:
        print(str(exc),file=sys.stderr)
        return 2

if __name__=="__main__":
    raise SystemExit(main())
