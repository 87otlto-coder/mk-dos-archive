#!/usr/bin/env python3
"""MK2 O113: bounded original-source camera and palette index calibration.

Only authenticated 896-wide stage packed tails are modified. This module
makes *observable binary codewords* in source-index space; it does NOT claim
that a given palette index renders as any particular RGB value.
"""
from __future__ import annotations
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
import hashlib
import json
import sys

TOOL_ROOT=Path(__file__).resolve().parents[1]/'mk2_packed_stage'
if str(TOOL_ROOT) not in sys.path:sys.path.insert(0,str(TOOL_ROOT))
from mk2_packed_stage import RESOURCES,STRIDE,resource_identity,sha,require,replace_plane

CHEAT_OFFSET=0xCCF0E
CHEAT_BEFORE=bytes.fromhex('1e172e162612201f1f1626')
CHEAT_AFTER=bytes.fromhex('4300000000000000000000')
CHEAT_SHA='95f925bcf343701cd92d2fc631df4df6c8c98d51b1553c62ae4918349b074928'
CANONICAL_EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
CELL_WIDTH=28  # 896/32; divisible by 4 (DWORD native code).


def debruijn_binary(order:int)->tuple[int,...]:
    """Lexicographically minimal B(2,order) circular binary code.

    All cyclic length-'order' substrings are unique. A 320-byte viewport
    of 28-byte cells contains 11+ cells, enough to distinguish source columns.
    """
    require(type(order) is int and 1<=order<=10,'unsupported order')
    a=[0]*(2*order+1);sequence=[]
    def db(t,p):
        if t>order:
            if order%p==0:sequence.extend(a[1:p+1])
        else:
            a[t]=a[t-p];db(t+1,p)
            for j in range(a[t-p]+1,2):a[t]=j;db(t+1,t)
    db(1,1)
    assert len(sequence)==2**order
    return tuple(sequence)


def cheat_exe(original:bytes)->bytes:
    require(len(original)==861133 and sha(original)==CANONICAL_EXE_SHA,'noncanonical executable')
    require(original[CHEAT_OFFSET:CHEAT_OFFSET+11]==CHEAT_BEFORE,'cheat unlock anchor absent')
    require(original.count(CHEAT_BEFORE)==1,'cheat anchor not unique')
    patched=original[:CHEAT_OFFSET]+CHEAT_AFTER+original[CHEAT_OFFSET+11:]
    require(sha(patched)==CHEAT_SHA,'patched cheat executable identity mismatch')
    return patched


def pattern_plane(name:str,original:bytes,pattern:str)->tuple[bytes,dict]:
    """Patch original stage suffix with a calibrated source index pattern.

    Modes:
     x-ruler: B(2,5), 32 distinct 28-byte source cells across 896 columns.
     y-ruler: B(2,6), source rows individually coded as two-color strips.
     ramp: original source-index domain repeated every 4 source columns;
           this is a *screen-observation* experiment, not a DAC palette dump.
    """
    key,_,offset,rows=resource_identity(name,original)
    require(pattern in ('x-ruler','y-ruler','ramp'),f'unsupported pattern {pattern}')
    lo=min(original[offset:]); hi=max(original[offset:]); count=hi-lo+1
    xbits=debruijn_binary(5);ybits=debruijn_binary(6)
    plane=bytearray(rows*STRIDE)
    for y in range(rows):
        for x in range(STRIDE):
            if pattern=='x-ruler':v=hi if xbits[x//CELL_WIDTH] else lo
            elif pattern=='y-ruler':v=hi if ybits[y] else lo
            else:v=lo+((x//4)%count)
            plane[y*STRIDE+x]=v
    modified,receipt=replace_plane(key,original,bytes(plane))
    assert modified[:offset]==original[:offset] and len(modified)==len(original)
    doc={'resource':key,'pattern':pattern,'originalSha256':sha(original),
         'patchedSha256':sha(modified),'originalPrefixSha256':sha(original[:offset]),
         'packedOffset':offset,'stride':STRIDE,'rows':rows,
         'indexDomain':[lo,hi],'changedBytes':receipt['changedCount'],
         'xRulerBits':''.join(map(str,xbits)) if pattern=='x-ruler' else None,
         'yRulerBits':''.join(map(str,ybits[:rows])) if pattern=='y-ruler' else None,
         'sourceSemantic':'ORIGINAL_PACKED_SUFFIX_INDEX_SPACE_NOT_RUNTIME_RGB',
         'runtimeStatus':'REQUIRES_USER_DOSBOX_SCREENSHOT'}
    return modified,doc


def source_column_codes(order:int=5)->dict:
    b=debruijn_binary(order)
    windows={tuple(b[(start+i)%len(b)] for i in range(order)):start for start in range(len(b))}
    require(len(windows)==2**order,'not a complete cyclic ruler')
    return {''.join(map(str,k)):v for k,v in sorted(windows.items(),key=lambda x:x[1])}


def full_pattern_report(original:dict[str,bytes],names=tuple(RESOURCES)):
    results={}
    for name in names:
        results[name]={}
        for pattern in ('x-ruler','y-ruler','ramp'):
            _,d=pattern_plane(name,original[name],pattern)
            results[name][pattern]=d
    return results
