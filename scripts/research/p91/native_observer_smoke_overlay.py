#!/usr/bin/env python3
"""Reversible, fail-closed DOSBox-X normal-core no-game API smoke overlay.

First native P91 integration gate only. No commercial game is launched or
captured; no four-phase Tomb adapter is claimed. A private, opt-in Windows
run proves the real normal-core instruction hook, bounded guest RAM APIs and
internal VGA DAC/latch reads can be reached without disturbing a game.
"""
from __future__ import annotations

import argparse
import difflib
from pathlib import Path
import subprocess
import sys

UPSTREAM = "029bd65c5dcc7cdc7f2e14e35278620d9707d969"
CORE_BLOB_SHA = "e582cc06f38809f2ee8ee8d6f1922f3eba5b6ab5"
MARKER = "/* MKEXT_P91_API_SMOKE_BEGIN */"
ANCHOR = "\twhile (CPU_Cycles-->0) {\n\t\tLOADIP;\n"
INSERT_AFTER = '#include "paging.h"\n'

# Native API smoke is opt-in and writes only status flags, no emulated bytes.
INCLUDES = r'''/* MKEXT_P91_API_SMOKE_BEGIN */
#include "mem.h"
#include "vga.h"
#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <string>
#if defined(_WIN32)
#include <windows.h>
#endif
extern bool vga_8bit_dac;

static void MKEXT_P91_NoGameSmoke(const PhysPt instruction_linear) {
    static bool once = false;
    if (once) return;
    once = true;
    const char *dir = std::getenv("MKEXT_P91_SMOKE_DIR");
    if (dir == NULL || dir[0] == '\0') return;
#if defined(_WIN32)
    const std::string folder(dir);
    if (folder.find("FIXTURES") == std::string::npos ||
        folder.find("VALIDATION") == std::string::npos ||
        folder.find("P91-") == std::string::npos) return;

    uint8_t ram[32] = {};
    const bool no_paging = !PAGING_Enabled();
    const bool bounded = MEM_TotalPages() >= 2;
    bool memory_parity = bounded && no_paging;
    if (memory_parity) {
        MEM_BlockRead((LinearPt)0x400u, ram, (Bitu)sizeof(ram));
        for (unsigned i = 0; i < sizeof(ram); ++i) {
            if (ram[i] != mem_readb((LinearPt)(0x400u + i))) {
                memory_parity = false;
                break;
            }
        }
    }
    const uint32_t latch_before = vga.latch.d;
    const uint8_t pel_mask_before = vga.dac.pel_mask;
    const uint8_t read_index_before = vga.dac.read_index;
    const uint8_t write_index_before = vga.dac.write_index;
    const uint8_t pel_index_before = vga.dac.pel_index;
    // Read actual emulator DAC registers. Never read destructive port 0x3C9.
    uint8_t palette_xor = 0;
    for (unsigned i = 0; i != 256; ++i) {
        palette_xor ^= vga.dac.rgb[i].red;
        palette_xor ^= vga.dac.rgb[i].green;
        palette_xor ^= vga.dac.rgb[i].blue;
    }
    const bool non_mutating = latch_before == vga.latch.d &&
        pel_mask_before == vga.dac.pel_mask &&
        read_index_before == vga.dac.read_index &&
        write_index_before == vga.dac.write_index &&
        pel_index_before == vga.dac.pel_index;
    const bool dac_supported = vga.dac.bits == 6 || vga.dac.bits == 8;
    const bool passed = memory_parity && non_mutating && dac_supported;

    const std::string filename = folder + "/p91-no-game-smoke.json";
    HANDLE file = CreateFileA(filename.c_str(), GENERIC_WRITE, 0, NULL,
                              CREATE_NEW, FILE_ATTRIBUTE_NORMAL, NULL);
    if (file == INVALID_HANDLE_VALUE) return;  // Never overwrite evidence.
    char report[1024] = {};
    const int n = std::snprintf(report, sizeof(report),
        "{\"schema\":\"mkext_p91_no_game_api_smoke_v1\","
        "\"result\":\"%s\",\"normalCoreHookCalled\":true,"
        "\"ramReadParity\":%s,\"ramBoundsChecked\":%s,"
        "\"pagingDisabled\":%s,\"dacReadNonMutating\":%s,"
        "\"dacComponentDepthSupported\":%s,\"dacBits\":%u,"
        "\"vgaEightBitDac\":%s,\"instructionLinear\":%u,"
        "\"paletteReadXor\":%u,\"commercialGameExecuted\":false,"
        "\"nativeFrameCaptured\":false}\n",
        passed ? "PASS" : "FAIL", memory_parity ? "true" : "false",
        bounded ? "true" : "false", no_paging ? "true" : "false",
        non_mutating ? "true" : "false", dac_supported ? "true" : "false",
        (unsigned)vga.dac.bits, vga_8bit_dac ? "true" : "false",
        (unsigned)instruction_linear, (unsigned)palette_xor);
    DWORD written = 0;
    if (n <= 0 || n >= (int)sizeof(report) ||
        !WriteFile(file, report, (DWORD)n, &written, NULL) || written != (DWORD)n) {
        CloseHandle(file);
        DeleteFileA(filename.c_str());
        return;
    }
    CloseHandle(file);
#else
    (void)instruction_linear;
#endif
}
/* MKEXT_P91_API_SMOKE_END */
'''

CALL = "\t\tMKEXT_P91_NoGameSmoke(core.cseip);\n"


def require(condition: object, why: str) -> None:
    if not condition:
        raise ValueError("P91 no-game overlay: " + why)


def patched(source: str) -> str:
    source = source.replace("\r\n", "\n")
    require(MARKER not in source, "already instrumented")
    require(source.count(INSERT_AFTER) == 1, "paging include anchor not unique")
    require(source.count(ANCHOR) == 1, "normal-core LOADIP anchor not unique")
    changed = source.replace(INSERT_AFTER, INSERT_AFTER + INCLUDES, 1)
    changed = changed.replace(ANCHOR, ANCHOR + CALL, 1)
    require(changed.count("MKEXT_P91_NoGameSmoke(core.cseip);") == 1, "hook not unique")
    require(changed.index("MKEXT_P91_NoGameSmoke(core.cseip);") <
            changed.index("restart_opcode:"), "hook must precede restart_opcode")
    return changed


def create_patch(source: str) -> str:
    original = source.replace("\r\n", "\n")
    updated = patched(original)
    diff = "".join(difflib.unified_diff(
        original.splitlines(keepends=True), updated.splitlines(keepends=True),
        fromfile="a/src/cpu/core_normal.cpp", tofile="b/src/cpu/core_normal.cpp"))
    require(diff.startswith("--- a/") and MARKER in diff, "incomplete diff")
    return diff


def verify_upstream(root: Path) -> Path:
    root = root.resolve(strict=True)
    head = subprocess.check_output(
        ["git", "-C", str(root), "rev-parse", "HEAD"], text=True).strip()
    require(head == UPSTREAM, "wrong upstream revision " + head)
    status = subprocess.check_output(
        ["git", "-C", str(root), "status", "--porcelain"], text=True).strip()
    require(not status, "upstream checkout not clean")
    filename = root / "src/cpu/core_normal.cpp"
    require(filename.is_file(), "core_normal.cpp missing")
    blob = subprocess.check_output(
        ["git", "-C", str(root), "hash-object", str(filename)], text=True).strip()
    require(blob == CORE_BLOB_SHA, "upstream core blob identity mismatch")
    return filename


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--upstream", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    try:
        source = verify_upstream(args.upstream)
        destination = args.output.resolve()
        require("FIXTURES" in destination.parts and "VALIDATION" in destination.parts,
                "output patch must be in FIXTURES/VALIDATION")
        require(destination.parent.is_dir() and not destination.exists(),
                "patch parent absent or output already exists")
        diff = create_patch(source.read_text(encoding="utf-8"))
        with destination.open("x", encoding="utf-8", newline="\n") as handle:
            handle.write(diff)
        print("P91 no-game API smoke source patch produced; no game executed")
        return 0
    except (OSError, ValueError, subprocess.CalledProcessError) as err:
        print(str(err), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
