#!/usr/bin/env python3
"""P69 independent original MK3 MFIL/FHDS/FDAT bitstream readback.

Reimplements the DOS fighter-frame bit reader and row-expansion logic without
importing the TS decoder. Processes the privately exported per-FTR indexed ZIPs
from verify-mk3-p69-ftr-indexed.cjs; never puts copyrighted data into GitHub.
"""
import hashlib
import json
from pathlib import Path
import struct
import sys
from zipfile import ZipFile

DEPTHS = [5,4,4,3,3,7,7,3,2,2,2,3,4,4,6,3,7,2,6,4,6]

def sha(data):
    return hashlib.sha256(data).hexdigest()

def require(condition, msg):
    if not condition:
        raise ValueError("P69 original MK3 verification: " + msg)

def source_file(root, relative):
    p = root
    for part in relative.replace("\\", "/").split("/"):
        require(part not in ("", ".", ".."), "bad source path " + relative)
        children = [q for q in p.iterdir() if q.name.casefold() == part.casefold()]
        require(len(children) == 1, "missing/ambiguous original file " + relative)
        p = children[0]
    require(p.resolve().is_relative_to(root.resolve()), "source outside DOS root")
    return p.read_bytes()

def little_u16(data, p):
    require(0 <= p and p + 2 <= len(data), "u16 outside original source")
    return struct.unpack_from("<H", data, p)[0]

def little_i16(data, p):
    require(0 <= p and p + 2 <= len(data), "i16 outside original source")
    return struct.unpack_from("<h", data, p)[0]

def little_u32(data, p):
    require(0 <= p and p + 4 <= len(data), "u32 outside original source")
    return struct.unpack_from("<I", data, p)[0]

def mfil_chunks(data):
    require(len(data) >= 12 and data[:4] == b"MFIL", "not original MFIL")
    count = little_u16(data, 4)
    directory_offset = little_u32(data, 8)
    p = 12
    chunks = []
    while p < len(data):
        require(p + 32 <= len(data), "truncated original MFIL chunk header")
        tag = data[p:p+4].decode("ascii")
        name = data[p+6:p+14].split(b"\0", 1)[0].decode("ascii").rstrip()
        length = little_u32(data, p+16)
        decoded_length = little_u32(data, p+20)
        flags = little_u32(data, p+24)
        checksum = little_u32(data, p+28)
        require(len(tag) == 4 and tag.isupper() and tag.isalpha(), "bad MFIL tag")
        require(flags == 0 and length == decoded_length, "unsupported MFIL compression")
        require(p+32+length <= len(data), "MFIL chunk exceeds source")
        body = data[p+32:p+32+length]
        require((sum(body) & 0xffffffff) == checksum, "original MFIL checksum " + name)
        chunks.append(dict(tag=tag, name=name, offset=p,
                           payload=p+32, size=length, body=body))
        p += 32 + length
    require(len(chunks) == count + 1, "MFIL count mismatch")
    require(chunks[-1]["tag"] == "CDIR" and
            chunks[-1]["offset"] == directory_offset and
            chunks[-1]["size"] == count * 32, "original MFIL directory mismatch")
    directory = chunks[-1]["body"]
    for i, chunk in enumerate(chunks[:-1]):
        q = i * 32
        require(directory[q:q+4].decode("ascii") == chunk["tag"] and
                directory[q+6:q+14].split(b"\0",1)[0].decode("ascii").rstrip() == chunk["name"] and
                little_u32(directory,q+16) == chunk["offset"] and
                little_u32(directory,q+20) == chunk["size"],
                "original MFIL directory entry " + str(i))
    return chunks

def decode_independent(data, expanded_size, width, height, mode):
    require(0 <= mode < len(DEPTHS) and width > 0 and height > 0 and
            width*height <= 1_000_000 and 2 <= expanded_size <= 2_000_000,
            "unsupported original sprite dimensions/format")
    depth = DEPTHS[mode]
    bit = 0
    expanded = bytearray()
    def bits(n):
        nonlocal bit
        value = 0
        for _ in range(n):
            word = (bit // 32) * 4
            require(word+4 <= len(data), "truncated source FTR packed frame")
            bits_word = little_u32(data, word)
            value = (value << 1) | ((bits_word >> (31-(bit % 32))) & 1)
            bit += 1
        return value
    def put(value):
        require(len(expanded)<expanded_size, "source expanded frame overflow")
        expanded.append(value & 255)
    while len(expanded) < expanded_size:
        if bits(1) == 0:
            skip = bits(5)
        elif bits(1) == 0:
            skip = bits(3)
        elif bits(1) == 0:
            skip = bits(6)
        elif bits(1) == 0:
            skip = bits(7)
        else:
            skip = bits(8)
        put(skip)
        if bits(1) == 0:
            count = 0
        elif bits(1) == 0:
            count = bits(4)
        else:
            count = bits(8)
        put(count)
        if count == 0:
            continue
        color = bits(depth)
        put(color)
        for _ in range(1,count):
            if depth == 2:
                color = bits(2)
            elif bits(1):
                if bits(1):
                    color = bits(depth)
                else:
                    color = (color + (1 if bits(1) else -1)) & 255
            put(color)
    consumed_bytes = ((bit + 31) // 32) * 4
    require(len(data) - consumed_bytes <= 4, "unexplained original packed bytes")
    indices = bytearray(width*height)
    mask = bytearray(width*height)
    p = 0
    for y in range(height):
        x = 0
        while True:
            require(p+2 <= expanded_size, "source row terminator missing")
            skip,count = expanded[p],expanded[p+1]
            p += 2
            x += skip
            require(x <= width and x+count <= width and p+count <= expanded_size,
                    "source row exceeds original descriptor geometry")
            if count == 0:
                break
            at = y*width+x
            indices[at:at+count] = expanded[p:p+count]
            mask[at:at+count] = b"\1"*count
            x += count
            p += count
    require(p == expanded_size, "expanded original source trailing bytes")
    return bytes(indices),bytes(mask)

def main(original_root,work,report):
    require(original_root.is_dir() and work.is_dir(),"original/work dir missing")
    cases = json.loads((work/"p69_cases.json").read_text())
    require(cases["format"]=="mk3_p69_original_ftr_cases_v1","case format")
    require(len(cases["cases"])==17,"canonical original fighter container count")
    total_frames = 0
    total_pixels = 0
    total_opaque = 0
    distinct_frames = set()
    for case in cases["cases"]:
        source = source_file(original_root,case["originalFtrPath"])
        require(sha(source) == case["originalFtrSha256"],"original FTR whole-file SHA")
        chunks = mfil_chunks(source)
        frames_by_header = {}
        by_name = {}
        for chunk in chunks:
            if chunk["tag"]=="FHDS":
                require(chunk["size"] % 36 == 0,"original FHDS descriptor stride")
                for i in range(chunk["size"]//36):
                    offset = chunk["payload"] + i*36
                    require(offset not in frames_by_header,"duplicate original FHDS byte offset")
                    frames_by_header[offset]=(chunk,i)
            if chunk["tag"]=="FDAT":
                require(chunk["name"] not in by_name,"duplicate original FDAT chunk name")
                by_name[chunk["name"]]=chunk

        zip_path = work/case["zip"]
        require(zip_path.resolve().is_relative_to(work.resolve()),"archive outside private work")
        with ZipFile(zip_path) as z:
            require(z.testzip() is None,"downloaded fighter bundle failed ZIP CRC")
            require(len(z.namelist())==len(set(z.namelist())),"duplicate ZIP filenames")
            m=json.loads(z.read("manifest.json"))
            require(m["format"]=="mk3_p69_original_ftr_indexed_sprites_v1","manifest schema")
            require(m["originalFtrWholeFileSha256"]==sha(source) and
                    m["originalFtrPath"]==case["originalFtrPath"],"manifest FTR identity")
            require(m["spriteCount"]==case["frames"]==len(m["originalDescriptors"]),"sprite census")
            require(m["nativePaletteOwnershipVerified"] is False and
                    m["nativeAnimationTimingVerified"] is False and
                    m["nativeAnimationSequenceOrderVerified"] is False and
                    m["runtimeWorldPlacementOrCompositorOrderVerified"] is False,
                    "unsupported native scene/animation/palette claim")
            names={"manifest.json","README.txt"}
            preceding_header=-1
            for frame in m["originalDescriptors"]:
                original_header=frame["originalFhdsDescriptorHeaderOffset"]
                require(original_header in frames_by_header,"frame does not reference FHDS")
                require(original_header>preceding_header,"source descriptor order not preserved")
                preceding_header=original_header
                hdr,index=frames_by_header[original_header]
                require(index == frame["originalDescriptorIndex"],"FHDS descriptor index")
                width=little_u16(source,original_header)
                height=little_u16(source,original_header+2)
                x=little_i16(source,original_header+4)
                y=little_i16(source,original_header+6)
                expanded=little_u32(source,original_header+12)
                source_offset_in_payload=little_u32(source,original_header+20)
                compression=little_u32(source,original_header+24)
                length=little_u32(source,original_header+28)
                mode=little_u16(source,original_header+32)
                group=little_u16(source,original_header+34)
                require(compression==1 and 0 <= mode < len(DEPTHS),"source descriptor compression/mode")
                original_model=int(hdr["name"][-1])
                fdat_name=f"FrDt{group-1:02d}{original_model:02d}"
                require(fdat_name in by_name,"original FHDS to FDAT source binding")
                fdat=by_name[fdat_name]
                source_offset=fdat["payload"]+source_offset_in_payload
                require(source_offset_in_payload+length<=fdat["size"],"compressed source outside FDAT")
                require(frame["originalSourceOffset"]==source_offset and
                        frame["originalCompressedByteLength"]==length,
                        "original compressed source interval mismatch")
                require(frame["originalMode"]==mode and frame["originalGroup"]==group and
                        frame["originalModel"]==original_model and
                        frame["originalExpandedSize"]==expanded and
                        frame["originalBitDepth"]==DEPTHS[mode] and
                        frame["width"]==width and frame["height"]==height and
                        frame["originalDescriptorX"]==x and frame["originalDescriptorY"]==y,
                        "original descriptor geometry/format mismatch")
                indices,mask=decode_independent(
                    source[source_offset:source_offset+length],expanded,width,height,mode)
                ip,mp=frame["indicesPath"],frame["maskPath"]
                names.add(ip);names.add(mp)
                require(z.read(ip)==indices and z.read(mp)==mask,
                        "independent original indexed-plane decompression differs from export")
                require(frame["indicesSha256"]==sha(indices) and
                        frame["maskSha256"]==sha(mask) and
                        frame["indexedPixelCount"]==len(indices) and
                        frame["opaquePixelCount"]==sum(mask),
                        "original indexed bytes/hash/opacity metadata mismatch")
                require(frame["nativePaletteVerified"] is False and
                        frame["runtimeAnimationOrderVerified"] is False and
                        frame["gameplaySpriteIdentityVerified"] is False,
                        "invented animation/palette/identity claim")
                identity=(case["originalFtrPath"],original_header)
                require(identity not in distinct_frames,"duplicate original descriptor")
                distinct_frames.add(identity)
                total_frames += 1
                total_pixels += len(indices)
                total_opaque += sum(mask)
            require(set(z.namelist())==names,"unexpected bundled files or missing frame plane")
    require(total_frames==6654,"original source fighter sprite census")
    result=dict(passName="P69",status="PASS",originalFtrContainers=17,
                originalIndexedSprites=total_frames,
                independentlyDecodedPlanes=total_frames,
                originalSourceIntervalsVerified=total_frames,
                indexedPixelBytesVerified=total_pixels,
                opaqueMaskPixelsVerified=total_opaque,
                originalCompressedSourceIntervalsMatched=True,
                originalFhdsDescriptorFieldsMatched=True,
                nativePaletteOrRuntimeAnimationClaimed=False,
                browserPackageDownloadVerified=False)
    report.parent.mkdir(parents=True,exist_ok=True)
    report.write_text(json.dumps(result,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(result,indent=2))

if __name__=="__main__":
    require(__debug__,"Python assertions must be enabled")
    require(len(sys.argv)==4,"usage: originals work private_report.json")
    main(Path(sys.argv[1]),Path(sys.argv[2]),Path(sys.argv[3]))
