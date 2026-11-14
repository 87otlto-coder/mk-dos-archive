#!/usr/bin/env python3
"""P89 R1: original DOS4GW/LE source address map for MK3.EXE.

Maps original MK3 executable object-relative offsets to original file bytes.
No machine-code bytes, original assets, decoder claims or game data are
exported. Use only to locate and independently test a P79-specific routine.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import struct
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[3]
MK3_EXE_SHA256 = "8aa7f3d45a086e7373afc120dc88378bda3d7766d5b69badbc707bb4570bdef0"
EXPECTED_LENGTH = 1496497
# CPU=80386, OS=1, byte/word order little-endian, level=0.
LE_SIGNATURE = b"LE\x00\x00\x00\x00\x00\x00\x02\x00\x01\x00"


def require(condition: object, why: str) -> None:
    if not condition:
        raise ValueError("P89 R1 MK3 LE: " + why)


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def input_exe(folder_or_file: Path) -> bytes:
    path = folder_or_file.resolve(strict=True)
    require(not path.is_relative_to(ROOT.resolve()), "original input inside Git source")
    if path.is_dir():
        choices = [f for f in path.iterdir() if f.is_file() and f.name.upper() == "MK3.EXE"]
        require(len(choices) == 1, "missing or ambiguous original MK3.EXE")
        data = choices[0].read_bytes()
    elif zipfile.is_zipfile(path):
        with zipfile.ZipFile(path) as archive:
            entries = [name for name in archive.namelist()
                       if name.replace("\\", "/").upper().split("/")[-1] == "MK3.EXE"]
            require(len(entries) == 1, "missing or ambiguous original MK3.EXE in ZIP")
            member = archive.getinfo(entries[0])
            require(member.file_size == EXPECTED_LENGTH, "noncanonical ZIP original EXE size")
            data = archive.read(entries[0])
    else:
        require(path.is_file(), "original EXE must be a file, folder or private ZIP")
        data = path.read_bytes()
    require(len(data) == EXPECTED_LENGTH and sha(data) == MK3_EXE_SHA256,
            "original MK3.EXE hash/size mismatch")
    return data


def parse_source_map(data: bytes, *, canonical: bool = True) -> dict:
    positions = []
    cursor = data.find(LE_SIGNATURE)
    while cursor >= 0:
        positions.append(cursor)
        cursor = data.find(LE_SIGNATURE, cursor + 1)
    require(len(positions) == 1, "exactly one recognized DOS4GW LE header required")
    head = positions[0]
    require(head + 0xc4 <= len(data), "truncated LE header")

    u32 = lambda offset: struct.unpack_from("<I", data, head + offset)[0]
    page_size = u32(0x28)
    page_count = u32(0x14)
    object_count = u32(0x44)
    object_table = u32(0x40)
    page_map = u32(0x48)
    page_data = u32(0x80)
    last_page_length = u32(0x2c)
    entry_object = u32(0x18)
    entry_offset = u32(0x1c)
    require(page_size == 4096 and 1 <= page_count <= 4096 and
            1 <= object_count <= 16 and 0 < last_page_length <= page_size,
            "invalid LE page or object parameters")
    require(object_table >= 0xc4 and head + object_table + object_count*24 <= len(data),
            "invalid LE object-table extent")
    require(page_map >= object_table + object_count*24 and
            head + page_map + page_count*4 <= len(data),
            "invalid LE page map extent")
    require(page_data > head + page_map and
            page_data + (page_count - 1) * page_size + last_page_length <= len(data),
            "invalid LE mapped-page source extent")
    objects = []
    mapped_page_numbers = set()
    for i in range(object_count):
        size, base, flags, first_page, pages, reserved = struct.unpack_from(
            "<IIIIII", data, head + object_table + i*24
        )
        require(reserved == 0 and size > 0 and pages > 0 and
                first_page >= 1 and first_page + pages - 1 <= page_count and
                size <= pages * page_size,
                "invalid LE object mapping")
        maps = []
        for index in range(first_page, first_page + pages):
            physical = head + page_map + (index - 1)*4
            raw = data[physical:physical + 4]
            mapped_page_number = int.from_bytes(raw[:3], "big")
            page_flag = raw[3]
            require(page_flag == 0 and 1 <= mapped_page_number <= page_count,
                    "unsupported or invalid LE page-map entry")
            require(mapped_page_number not in mapped_page_numbers,
                    "duplicate mapped LE physical page")
            mapped_page_numbers.add(mapped_page_number)
            maps.append(page_data + (mapped_page_number - 1)*page_size)
        objects.append({
            "index": i+1, "declaredImageBytes": size, "virtualBase": base,
            "flags": flags, "sourceFirstPage": first_page,
            "mappedPageCount": pages, "sourcePageFileOffsets": maps,
            "containsExecutableInstructions": bool(flags & 4),
        })
    require(len(mapped_page_numbers) == page_count,
            "missing/unaccounted mapped LE physical pages")
    require(1 <= entry_object <= len(objects), "invalid entry-point object")
    obj = objects[entry_object - 1]
    require(entry_offset < obj["declaredImageBytes"], "LE entry point outside declared object")
    source_offset = obj["sourcePageFileOffsets"][entry_offset//page_size] + entry_offset%page_size
    require(source_offset < len(data), "LE entry source outside original file")
    result = {
        "format": "mk3_p89_r1_original_dos4gw_le_source_map_v1",
        "originalExeSha256": sha(data),
        "originalExeLength": len(data),
        "leHeaderFileOffset": head,
        "pageDataFileOffset": page_data,
        "pageSize": page_size,
        "declaredPageCount": page_count,
        "declaredLastPageBytes": last_page_length,
        "objectCount": object_count,
        "objects": objects,
        "entryPoint": {
            "objectNumber": entry_object,
            "objectOffset": entry_offset,
            "virtualAddress": obj["virtualBase"] + entry_offset,
            "originalFileOffset": source_offset,
        },
        "qualifiedP79DecompressionRoutine": False,
        "newDecodedP79Records": 0,
        "noOriginalSourceBytesExported": True,
    }
    if canonical:
        require(head == 0x290a4 and page_data == 0x69e00 and page_count == 222 and
                object_count == 2 and entry_object == 1 and entry_offset == 0x3a4f0 and
                source_offset == 0xa42f0 and
                [(x["declaredImageBytes"], x["virtualBase"], x["flags"],
                  x["sourceFirstPage"], x["mappedPageCount"]) for x in objects] ==
                [(634878, 0x10000, 0x2045, 1, 155),
                 (521520, 0xb0000, 0x2043, 156, 67)] and
                sha(data) == MK3_EXE_SHA256, "not canonical original DOS MK3 LE layout")
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--original", required=True, type=Path,
                        help="Private canonical MK3 DOS folder, MK3.EXE, or game ZIP")
    parser.add_argument("--report", type=Path,
                        help="NEW metadata-only JSON path in private FIXTURES/VALIDATION")
    args = parser.parse_args()
    try:
        data = input_exe(args.original)
        result = parse_source_map(data)
        if args.report is not None:
            output = args.report.resolve(strict=False)
            original = args.original.resolve(strict=True)
            require(output.suffix.lower() == ".json" and output.parent.is_dir() and
                    not output.exists() and not output.is_relative_to(ROOT.resolve()) and
                    output != original and not output.is_relative_to(
                        original if original.is_dir() else original.parent
                    ), "private output cannot overwrite source/Git or existing results")
            with output.open("x", encoding="utf-8") as stream:
                json.dump(result, stream, sort_keys=True, indent=2)
                stream.write("\n")
        # Compact aggregate; never output source bytes, full disassembly or file contents.
        print(json.dumps({
            "pass": "P89_R1_MK3_LE_SOURCE_MAP",
            "status": "PASS",
            "originalExeSha256": result["originalExeSha256"],
            "leHeaderFileOffset": result["leHeaderFileOffset"],
            "pageDataFileOffset": result["pageDataFileOffset"],
            "objectPageCounts": [x["mappedPageCount"] for x in result["objects"]],
            "originalEntryFileOffset": result["entryPoint"]["originalFileOffset"],
            "qualifiedP79DecompressionRoutine": False,
            "newDecodedP79Records": 0,
        }, indent=2))
        return 0
    except (ValueError, OSError, struct.error, zipfile.BadZipFile) as error:
        print("P89 R1 LE ERROR: " + str(error), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
