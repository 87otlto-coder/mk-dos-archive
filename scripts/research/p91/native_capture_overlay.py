#!/usr/bin/env python3
"""Build a reversible pinned DOSBox-X normal-core four-phase adapter patch.

No DOS game is needed for patch generation. Strict source/hash checks and an
exclusive patch output are required. Windows adapter headers are separate
source-safe files under scripts/research/p91 and copied only into a disposable
DOSBox-X checkout by the CI/build wrapper.
"""
import argparse
import difflib
from pathlib import Path
import subprocess
import sys

UPSTREAM = "029bd65c5dcc7cdc7f2e14e35278620d9707d969"
CORE_BLOB = "e582cc06f38809f2ee8ee8d6f1922f3eba5b6ab5"
ANCHOR = "\twhile (CPU_Cycles-->0) {\n\t\tLOADIP;\n"
FUNCTION = "Bits CPU_Core_Normal_Run(void) {\n"
MARKER = "/* MKEXT_P91_CAPTURE_HOOK_BEGIN */"
ADAPTER = '#include "native_capture_adapter.hpp"\n'


def need(x, msg):
    if not x:
        raise ValueError("P91 native capture overlay: " + msg)


def patched(source):
    src=source.replace("\r\n","\n")
    need(MARKER not in src and "native_capture_adapter.hpp" not in src,
         "source already instrumented")
    need(src.count(ANCHOR)==1, "normal-core LOADIP loop anchor not unique")
    need(src.count(FUNCTION)==1, "normal-core entry anchor not unique")
    src=src.replace(FUNCTION,
        MARKER+"\n"+ADAPTER+"/* MKEXT_P91_CAPTURE_HOOK_END */\n"+FUNCTION,1)
    src=src.replace(ANCHOR,
        ANCHOR+"\t\tMKEXT_P91_CaptureObserve(core.cseip);\n",1)
    need(src.count("MKEXT_P91_CaptureObserve(core.cseip);")==1,
         "hook duplicated")
    need(src.index("MKEXT_P91_CaptureObserve(core.cseip);") <
         src.index("restart_opcode:"), "hook after prefix restart label")
    return src


def patch(source):
    old=source.replace("\r\n","\n")
    new=patched(old)
    diff="".join(difflib.unified_diff(
        old.splitlines(keepends=True),new.splitlines(keepends=True),
        fromfile="a/src/cpu/core_normal.cpp",
        tofile="b/src/cpu/core_normal.cpp"))
    need(diff.startswith("--- a/") and MARKER in diff,
         "invalid diff")
    return diff


def verify_upstream(root):
    path=root.resolve(strict=True)
    head=subprocess.check_output(
        ["git","-C",str(path),"rev-parse","HEAD"],text=True).strip()
    need(head==UPSTREAM,"wrong pinned upstream revision")
    dirty=subprocess.check_output(
        ["git","-C",str(path),"status","--porcelain"],text=True).strip()
    need(not dirty,"upstream checkout not clean")
    core=path/"src"/"cpu"/"core_normal.cpp"
    need(core.is_file(),"original core file missing")
    blob=subprocess.check_output(
        ["git","-C",str(path),"hash-object",str(core)],text=True).strip()
    need(blob==CORE_BLOB,"original core file changed")
    return core


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--upstream",type=Path,required=True)
    p.add_argument("--output",type=Path,required=True)
    a=p.parse_args()
    try:
        original=verify_upstream(a.upstream)
        out=a.output.resolve()
        need("FIXTURES" in out.parts and "VALIDATION" in out.parts,
             "private patch output must be under FIXTURES/VALIDATION")
        need(out.parent.is_dir() and not out.exists(),
             "private patch path absent or already exists")
        with out.open("x",encoding="utf-8",newline="\n") as file:
            file.write(patch(original.read_text(encoding="utf-8")))
        print("P91 pinned normal-core capture adapter patch created (no game executed)")
        return 0
    except (ValueError,OSError,subprocess.CalledProcessError) as exc:
        print(str(exc),file=sys.stderr)
        return 2


if __name__=="__main__":
    raise SystemExit(main())
