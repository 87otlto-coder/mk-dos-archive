#!/usr/bin/env python3
"""Create a reviewable source-only DOSBox-X P89 passive read-return patch.

Target: upstream DOSBox-X commit 029bd65, src/dos/dos.cpp. Does NOT modify
the upstream checkout; outputs a patch for private review/application.
No game bytes are read, packaged, or committed. Runtime instrumentation is
disabled unless MKEXT_P89_CAPTURE_DIR is explicitly supplied.
"""
from __future__ import annotations

import argparse
import difflib
from pathlib import Path
import subprocess
import sys

UPSTREAM_SHA = "029bd65c5dcc7cdc7f2e14e35278620d9707d969"
MARKER = "/* MKEXT_P89_READ_RETURN_BEGIN */"
ANCHOR = """                else
                {
                    if((fRead = DOS_ReadFile(reg_bx, dos_copybuf, &toread))) {
                        MEM_BlockWrite(SegPhys(ds) + reg_dx, dos_copybuf, toread);
                        diskio_delay_handle(reg_bx, toread);
                    }
                }"""
REPLACEMENT = """                else
                {
                    /* MKEXT_P89_READ_RETURN_BEGIN */
                    // Passive return witness, not a native decoder hook.
                    // DOSBox-X's normal INT 21h AH=3Fh file read path.
                    // Disabled unless private fixture output was requested.
                    const char* mkext_capture_dir = getenv("MKEXT_P89_CAPTURE_DIR");
                    uint32_t mkext_offset = 0u;
                    const bool mkext_target =
                        mkext_capture_dir && *mkext_capture_dir &&
                        handle < DOS_FILES && Files[handle] &&
                        Files[handle]->IsOpen() &&
                        Files[handle]->IsName("DATA.MK3") &&
                        Files[handle]->Seek(&mkext_offset, DOS_SEEK_CUR);
                    const uint16_t mkext_requested = toread;
                    fRead = DOS_ReadFile(reg_bx, dos_copybuf, &toread);
                    if (fRead) {
                        MEM_BlockWrite(SegPhys(ds) + reg_dx, dos_copybuf, toread);
                        diskio_delay_handle(reg_bx, toread);
                    }
                    // Exact canonical P79 ordinal-0 compressed payload
                    // offset and length. No continuous memory dumping.
                    if (mkext_target && mkext_offset == 732662u &&
                        mkext_requested == 1506u) {
                        bool mkext_guest_matches = false;
                        if (fRead && toread == 1506u) {
                            uint8_t mkext_guest[1506u];
                            MEM_BlockRead(SegPhys(ds) + reg_dx, mkext_guest, toread);
                            mkext_guest_matches =
                                memcmp(mkext_guest, dos_copybuf, toread) == 0;
                        }
                        const std::string mkext_root(mkext_capture_dir);
                        const std::string mkext_bin =
                            mkext_root + "/p89-record0-return.bin";
                        int mkext_capture_status = 0;
                        if (mkext_guest_matches) {
                            FILE* mkext_existing = fopen(mkext_bin.c_str(), "rb");
                            if (mkext_existing) {
                                fclose(mkext_existing);
                                mkext_capture_status = 2; // Existing; never overwrite.
                            } else {
                                FILE* mkext_out = fopen(mkext_bin.c_str(), "wb");
                                if (mkext_out) {
                                    mkext_capture_status =
                                        fwrite(dos_copybuf, 1u, toread, mkext_out)
                                        == toread ? 1 : -1;
                                    if (fclose(mkext_out) != 0)
                                        mkext_capture_status = -1;
                                } else {
                                    mkext_capture_status = -1;
                                }
                            }
                        }
                        // Private metadata: exact source offset, actual
                        // successful return count, guest DS:DX + physical,
                        // guest-copy parity, and source capture status.
                        const std::string mkext_report =
                            mkext_root + "/p89-record0-read-return.tsv";
                        FILE* mkext_meta = fopen(mkext_report.c_str(), "ab");
                        if (mkext_meta) {
                            fprintf(mkext_meta,
                                "DATA.MK3\\t%u\\t%u\\t%u\\t%d\\t%04X\\t%04X\\t%08X\\t%d\\t%d\\n",
                                (unsigned)mkext_offset,
                                (unsigned)mkext_requested, (unsigned)toread,
                                fRead ? 1 : 0, (unsigned)SegValue(ds),
                                (unsigned)reg_dx,
                                (unsigned)(SegPhys(ds) + reg_dx),
                                mkext_guest_matches ? 1 : 0,
                                mkext_capture_status);
                            fclose(mkext_meta);
                        }
                    }
                    /* MKEXT_P89_READ_RETURN_END */
                }"""


def require(ok: object, why: str) -> None:
    if not ok:
        raise ValueError("P89 passive overlay: " + why)


def patched(text: str) -> str:
    require(MARKER not in text, "instrumentation already present; no duplicate")
    require(text.count(ANCHOR) == 1, "original DOSBox-X AH=3Fh anchor not unique")
    modified = text.replace(ANCHOR, REPLACEMENT, 1)
    require(modified.count(MARKER) == 1 and
            modified.count("DOS_ReadFile(reg_bx, dos_copybuf, &toread)") == 1,
            "instrumented READ call count changed")
    require("MEM_BlockWrite(SegPhys(ds) + reg_dx, dos_copybuf, toread);" in modified,
            "required original guest read-copy disappeared")
    return modified


def verify_checkout(root: Path) -> Path:
    root = root.resolve(strict=True)
    require(root.is_dir(), "upstream checkout missing")
    head = subprocess.check_output(
        ["git", "-C", str(root), "rev-parse", "HEAD"], text=True).strip()
    require(head == UPSTREAM_SHA, "unexpected upstream DOSBox-X commit: " + head)
    status = subprocess.check_output(
        ["git", "-C", str(root), "status", "--porcelain"], text=True).strip()
    require(not status, "upstream tree contains changes; refusing uncertain diff")
    target = root / "src" / "dos" / "dos.cpp"
    require(target.is_file(), "upstream src/dos/dos.cpp missing")
    return target


def create_patch(source: str, *, target_path="src/dos/dos.cpp") -> str:
    text = source.replace("\r\n", "\n")
    new = patched(text)
    diff = "".join(difflib.unified_diff(
        text.splitlines(keepends=True), new.splitlines(keepends=True),
        fromfile="a/" + target_path, tofile="b/" + target_path))
    require(diff.startswith("--- a/") and MARKER in diff,
            "generated patch missing source anchors")
    return diff


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--upstream", type=Path, required=True,
                        help="clean upstream DOSBox-X source at exact commit 029bd65")
    parser.add_argument("--output", type=Path, required=True,
                        help="NEW patch path under private FIXTURES/VALIDATION")
    args = parser.parse_args()
    try:
        target = verify_checkout(args.upstream)
        outfile = args.output.resolve()
        require("FIXTURES" in outfile.parts and "VALIDATION" in outfile.parts,
                "patch output must be private FIXTURES/VALIDATION")
        require(outfile.parent.is_dir() and not outfile.exists(),
                "output parent missing or target already exists")
        diff = create_patch(target.read_text(encoding="utf-8"))
        with outfile.open("x", encoding="utf-8", newline="\n") as stream:
            stream.write(diff)
        print("P89 passive DOSBox-X source patch created: " + str(outfile))
        print("No upstream source modified; original game not read")
        return 0
    except (OSError, ValueError, subprocess.CalledProcessError) as error:
        print(str(error), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
