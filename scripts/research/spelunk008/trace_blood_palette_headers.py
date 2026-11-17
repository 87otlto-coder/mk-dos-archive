#!/usr/bin/env python3
"""SPELUNK008: source-palette links and non-list blood sprite provenance.

Reads only owner-supplied unchanged original DOS mk2.zip; never emits
commercial binary bytes, indexed pixels, masks or original palette words.
Static EXE pointers are not proof of a live DAC bank or frame timing.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import struct
import zipfile
from pathlib import Path

EXE_SHA = 'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
BLOOD_SHA = '9a47dd926c27a6570bcd81cbb0a3ff1bae2106a26e0f5360c8018fea6f16a5a9'
LE, O1, O2 = 0x28f0c, 0x61c54, 0xa0c54
PALETTE_O1 = 0x26cc4
ORPHAN_LISTS = ((0x1d010,5),(0x1d1d0,2),(0x1d1f0,3),(0x1d22c,4),(0x1d2e0,7))
LISTS = ((0x1cfe0,11),(0x1d010,5),(0x1d038,12),(0x1d06c,7),
         (0x1d08c,18),(0x1d11c,7),(0x1d178,14),(0x1d1b8,5),
         (0x1d1d0,2),(0x1d1dc,4),(0x1d1f0,3),(0x1d200,10),
         (0x1d22c,4),(0x1d240,8),(0x1d264,13),(0x1d29c,16),
         (0x1d2e0,7),(0x1d300,9))
# Every original direct instruction here writes a verified BLOOD descriptor
# to the original sprite selection global O2+0x75A6C.
DIRECT_SEEDS = ((0x90cbd,0x20538),(0x9154b,0x20538),
                (0x91557,0x2063c),(0x8068b,0x206d4),
                (0x806e6,0x206fc))
PAIR_SITES = ((0x13da0,0x206e4),(0x13da8,0x206f0),
              (0x13db0,0x206e4),(0x13db8,0x206f0))
CONSTRUCTOR_CALLS = ((0x90cc7,0x64548),(0x91561,0x64548),
                     (0x80695,0x64548),(0x806f0,0x64548))
EXPECTED_GROUP_SIZES = (7,7,6,1,16,7,18,7,14,6,13,15,1,7,9,7,9,12,5,7,3,1)


def require(condition, why):
    if not condition: raise ValueError('SPELUNK008: '+why)

def u32(data, at): return struct.unpack_from('<I',data,at)[0]
def u16(data, at): return struct.unpack_from('<H',data,at)[0]
def sha(data): return hashlib.sha256(data).hexdigest()


def read_zip(path):
    found={}
    with zipfile.ZipFile(path) as z:
        for member in z.infolist():
            if member.is_dir(): continue
            key=member.filename.replace('\\','/').rsplit('/',1)[-1].upper()
            if key in ('MK2.EXE','BLOOD.GRA'):
                require(key not in found,'duplicate original ZIP resource '+key)
                found[key]=z.read(member)
    require(set(found)=={'MK2.EXE','BLOOD.GRA'},'missing original EXE/BLOOD')
    return found['MK2.EXE'], found['BLOOD.GRA']


def identity(exe,gra):
    require(len(exe)==861133 and sha(exe)==EXE_SHA,'original DOS MK2.EXE identity')
    require(len(gra)==111780 and sha(gra)==BLOOD_SHA,'original BLOOD.GRA identity')
    pool=[item.decode('ascii') for item in exe[0xa0ef1:0xa13a7].split(b'\0') if item]
    require(pool[9]=='BLOOD.GRA','original resource registry ID9')


def relocations(exe):
    require(exe[LE:LE+2]==b'LE' and u32(exe,LE+0x14)==113,'LE header')
    tab=LE+u32(exe,LE+0x40)
    require(u32(exe,LE+0x44)==2 and
            [(u32(exe,tab+24*i+12),u32(exe,tab+24*i+16)) for i in range(2)]==[(1,63),(64,50)],
            'LE page ownership')
    offsets=LE+u32(exe,LE+0x68); block=LE+u32(exe,LE+0x6c)
    fx={};count=0
    for page in range(113):
        owner=1 if page<63 else 2
        first=1 if owner==1 else 64
        at=block+u32(exe,offsets+4*page)
        end=block+u32(exe,offsets+4*(page+1))
        require(0<=at<=end<=len(exe),'LE block bounds')
        while at<end:
            kind=exe[at]&15;flags=exe[at+1]
            rel=struct.unpack_from('<h',exe,at+2)[0];at+=4
            to_obj=u16(exe,at) if flags&64 else exe[at]
            at+=2 if flags&64 else 1
            target=None
            if kind!=2:
                target=u32(exe,at) if flags&16 else u16(exe,at)
                at+=4 if flags&16 else 2
            if flags&4:at+=4 if flags&32 else 2
            require(flags&3==0,'unsupported imported LE relocation')
            site=(page+1-first)*4096+rel
            key=(owner,site);value=(kind,flags,to_obj,target)
            require(key not in fx or fx[key]==value,'conflicting LE duplicate')
            fx[key]=value;count+=1
        require(at==end,'LE block alignment')
    require((count,len(fx))==(27004,26994),'canonical LE fixup census')
    return fx


def pointer(exe,fx,owner,site,to_obj,target):
    require(fx.get((owner,site))==(7,16,to_obj,target),
            'typed LE pointer mismatch '+str(owner)+':'+hex(site))
    at=(O1 if owner==1 else O2)+site
    require(u32(exe,at)==target,'raw typed pointer mismatch '+str(owner)+':'+hex(site))


def rle_end(resource,start,w,h):
    require(0<w<=320 and 0<h<=320 and w*h<=64000,'sprite dimensions')
    require(0<=start<len(resource),'sprite source start')
    at=start
    for _ in range(h):
        x=0
        while x<w:
            require(at+4<=len(resource),'truncated compressed token')
            token=u32(resource,at);at+=4
            if token&1: n=token>>1
            elif token&2:n=token>>10
            else:
                n=token>>2
                require(0<n<=64 and at+n<=len(resource),'literal run overflow')
                at+=(n+3)&~3
            require(0<n<=w-x,'source run crosses row')
            x+=n
    return at


def scan(exe,gra):
    ds={}
    for d in range(0,min(0x32000,len(exe)-O2-12)+1,4):
        w,h,x,y,packed=struct.unpack_from('<HHhhI',exe,O2+d)
        rid,start=packed>>24,packed&0xffffff
        if rid!=9 or not(1<=w<=320 and 1<=h<=320 and w*h<=64000
                            and abs(x)<=1000 and abs(y)<=1000 and start<len(gra)):
            continue
        try: end=rle_end(gra,start,w,h)
        except (ValueError,struct.error):continue
        if end<=len(gra):
            ds[d]={'start':start,'end':end,'w':w,'h':h,'localXY':[x,y]}
    require(len(ds)==178,'original O69 BLOOD descriptor census')
    ext=sorted((v['start'],v['end']) for v in ds.values())
    require(ext[0][0]==0 and ext[-1][1]==len(gra) and
            all(a[1]==b[0] for a,b in zip(ext,ext[1:])),
            'full original BLOOD resource source-byte tiling')
    return ds


def classify(exe,gra,fx,ds):
    anchors=sorted(d for d in ds if fx.get((2,d+12))==(7,16,1,PALETTE_O1))
    require(len(anchors)==22,'expected 22 original palette-pointer headers')
    for d in anchors:pointer(exe,fx,2,d+12,1,PALETTE_O1)
    unrelated=[(d,fx[(2,d+12)]) for d in ds if (2,d+12) in fx and d not in anchors]
    require(not unrelated,'other descriptor+12 typed relocations')
    groups=[]
    for i,d in enumerate(anchors):
        end=anchors[i+1] if i+1<len(anchors) else max(ds)+16
        members=[x for x in sorted(ds) if d<=x<end]
        starts=sorted((ds[x]['start'],ds[x]['end']) for x in members)
        require(starts and all(a[1]==b[0] for a,b in zip(starts,starts[1:])),
                'palette-anchored source group gaps')
        groups.append({'anchorDescriptorObject2':d,
                       'typedPalettePointerSiteObject2':d+12,
                       'sourcePaletteRecordObject1':PALETTE_O1,
                       'firstSourceByte':starts[0][0],
                       'endSourceByteExclusive':starts[-1][1],
                       'descriptorCount':len(members),
                       'memberDescriptorsObject2':members,
                       'encodedGroupSha256':sha(gra[starts[0][0]:starts[-1][1]])})
    require(tuple(g['descriptorCount'] for g in groups)==EXPECTED_GROUP_SIZES,
            '22 palette-anchored group size census')
    require(groups[0]['firstSourceByte']==0 and groups[-1]['endSourceByteExclusive']==len(gra) and
            all(a['endSourceByteExclusive']==b['firstSourceByte'] for a,b in zip(groups,groups[1:])),
            'palette-anchored 22 group byte partition')

    used=set()
    for root,count in LISTS:
        for k in range(count):
            at=root+4*k;target=u32(exe,O2+at)
            pointer(exe,fx,2,at,2,target)
            require(target in ds,'source list points to valid BLOOD descriptor')
            used.add(target)
    remaining=sorted(set(ds)-used)
    require(len(used)==153 and len(remaining)==25,'prior BLOOD list vs unlisted census')

    # For five pointer-like groups absent from original cursor-writer and
    # relocation-base provenance, check the stronger NEGATIVE evidence:
    # no type-7 inbound references into any entry, plus no raw occurrence
    # of their exact four-byte *root* anywhere in original EXE.
    unlinked=[]
    for root,count in ORPHAN_LISTS:
        inbound=[{'owner':owner,'sourceSite':site,'target':target}
                 for (owner,site),(kind,flags,to_obj,target) in fx.items()
                 if kind==7 and to_obj==2 and target is not None
                 and root<=target<root+4*count]
        raw_occ=exe.count(struct.pack('<I',root))
        require(not inbound and raw_occ==0,'unclassified blood group got source ref '+hex(root))
        require(u32(exe,O2+root+4*count)==0,'unclassified group no zero terminator')
        unlinked.append({'sourceListObject2':root,'entryCount':count,
                         'typedInboundReferencesToEntries':len(inbound),
                         'exactRootDwordOccurrencesInOriginalExe':raw_occ,
                         'readerProven':False,'runtimeUnusedProven':False})

    seeded=[]
    for code,d in DIRECT_SEEDS:
        require(exe[code:code+6]==bytes.fromhex('c7056c5a0700'),
                'original direct sprite selector opcode '+hex(code))
        pointer(exe,fx,1,code+6-O1,2,d)
        require(d in remaining,'direct seed was not outside earlier lists')
        seeded.append({'originalInstructionPhysical':code,'sourceDescriptorObject2':d,
                       'selectorGlobalObject2':0x75a6c,
                       'paletteHeaderAtSeed':d in anchors})
    # Original alternatives at 0x9154B and 0x91557 join at the SAME
    # sprite constructor. The other two immediate selector writes also
    # have direct constructor calls; no runtime activation is presumed.
    require(exe[0x91555:0x91557]==bytes.fromhex('eb0a'),
            'alternate BLOOD seed short branch to shared constructor')
    constructors=[]
    for physical,target in CONSTRUCTOR_CALLS:
        require(exe[physical]==0xe8 and
                physical+5+struct.unpack_from('<i',exe,physical+1)[0]==target,
                'original BLOOD sprite constructor call '+hex(physical))
        constructors.append({'originalCallPhysical':physical,
                             'sourceConstructorPhysical':target})
    paired=[]
    for site,d in PAIR_SITES:
        pointer(exe,fx,2,site,2,d)
        require(d in remaining,'Pit paired sprite already in earlier lists')
        paired.append({'sourceObject2':site,'descriptorObject2':d})

    # Source-byte contiguous runs: 9 source sprites from first source seed;
    # 13 from second source seed (including the separately used O228 source
    # 0x206d4); 3 from the earlier Pit impact placement/constructor work.
    groupspec=((0x20538,0x2059c,9),(0x2063c,0x206d4,13),(0x206e4,0x206fc,3))
    other_groups=[]
    found=[]
    for first,last,expected in groupspec:
        rows=[d for d in remaining if first<=d<=last]
        require(len(rows)==expected and rows[0]==first and rows[-1]==last,
                'unlisted original descriptor group extent')
        spans=sorted((ds[d]['start'],ds[d]['end']) for d in rows)
        require(all(a[1]==b[0] for a,b in zip(spans,spans[1:])),
                'unlisted original source-byte interval gap')
        found.extend(rows)
        other_groups.append({'firstDescriptorObject2':first,'lastDescriptorObject2':last,
                             'distinctSprites':len(rows),'sourceByteExtent':[spans[0][0],spans[-1][1]],
                             'sourceSha256':sha(gra[spans[0][0]:spans[-1][1]])})
    require(sorted(found)==remaining,'unlisted sprite groups not exact complement')
    return {'paletteAnchors':groups,'unlinkedListRoots':unlinked,
            'directSourceSeeds':seeded,'constructorCallWits':constructors,
            'pitPairedDescriptorReferences':paired,
            'unlistedSpriteGroups':other_groups,'unlistedSpriteCount':25,
            'listReferencedSpriteCount':153}


def produce(exe,gra):
    identity(exe,gra)
    fx=relocations(exe)
    sprites=scan(exe,gra)
    evidence=classify(exe,gra,fx,sprites)
    return {'schema':'mk2_spelunk_008_blood_palette_header_and_nonlist_provenance_v1',
            'classification':'VERIFIED_STATIC_TYPED_SOURCE_LINKS',
            'originalExeSha256':EXE_SHA,'originalBloodGraSha256':BLOOD_SHA,
            'originalResourceByteCount':len(gra),'originalIndexedSprites':len(sprites),
            'sourcePaletteObject1':PALETTE_O1,'sourcePalettePhysical':O1+PALETTE_O1,
            'originalDescriptorCarriedPaletteLinks':22,
            'directlyAssertedPaletteOwnerForNonHeaderSprites':False,
            'liveDACOwnershipVerified':False,
            'all178SpritesBelongTo22SourceContiguousDescriptorGroups':True,
            **evidence,
            'runtime':{'gameExecuted':False,'nativePaletteCaptured':False,
                       'sourceFrameTimingObserved':False,'onScreenPlacementObserved':False},
            'limits':['No source-level evidence that unreferenced list roots are dead code; dynamic pointer arithmetic remains possible.',
                      '22 typed source-palette links do not establish the runtime palette bank for all 178 decoded sprites.',
                      'Direct source seeds do not prove automatic traversal of subsequent adjacent descriptor records.',
                      'Existing O218/O228 Pit fragment and source palette provenance retained; no commercial asset bytes exported.']}


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--game-zip',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True)
    args=p.parse_args()
    require(not args.out.exists(),'refusing to overwrite existing report')
    exe,gra=read_zip(args.game_zip)
    result=produce(exe,gra)
    with args.out.open('x',encoding='utf-8') as out:
        json.dump(result,out,indent=2);out.write('\n')
    print(json.dumps({'sourcePaletteLinks':result['originalDescriptorCarriedPaletteLinks'],
                      'descriptorSourceGroups':len(result['paletteAnchors']),
                      'unreferencedListRoots':len(result['unlinkedListRoots']),
                      'unlistedSprites':result['unlistedSpriteCount']}))

if __name__=='__main__':main()
