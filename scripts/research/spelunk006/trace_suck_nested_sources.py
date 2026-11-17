#!/usr/bin/env python3
"""Read-only Spelunk 006: SUCK.GRA's nine nested source-script groups.

Require unmodified original DOS MK2.EXE and SUCK.GRA in the owner's ZIP.
Never write or distribute game bytes, indexed planes, palettes or imagery.
All findings are STATIC conditional source relationships, NOT a timeline.
"""
import argparse, collections, hashlib, json, struct, zipfile
from pathlib import Path

EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
SUCK_SHA='d5672116021a56c27b94a14c1eb51e83bb077209cf67fcf92add51553e862d08'
LE,O1,O2=0x28f0c,0x61c54,0xa0c54
SELECTOR=0x1bba0
ROOTS=(0x1be50,0x1bea8,0x1bdf8,0x1bd3c,0x1bd94,0x1bd94,
       0x1bc1c,0x1bc74,0x1bcd8,0x1bcd8,0x1bcd8,0x1bbd0)
GROUPS=((0x1be50,7),(0x1bea8,7),(0x1bdf8,7),(0x1bd3c,7),
        (0x1bd94,8),(0x1bc1c,7),(0x1bc74,8),(0x1bcd8,8),(0x1bbd0,6))
SUFFIX=((0x1bf00,5,0,None),(0x1bf18,5,0,None),(0x1bf30,8,1,0x1bf30))

def require(ok,reason):
    if not ok:raise ValueError('SPELUNK006: '+reason)
def u32(b,p):return struct.unpack_from('<I',b,p)[0]
def u16(b,p):return struct.unpack_from('<H',b,p)[0]
def sha(b):return hashlib.sha256(b).hexdigest()

def original_zip(p):
    with zipfile.ZipFile(p) as z:
        matches={}
        for item in z.infolist():
            if item.is_dir():continue
            name=item.filename.replace('\\','/').split('/')[-1].upper()
            if name in ('MK2.EXE','SUCK.GRA'):
                require(name not in matches,'duplicate ZIP member '+name)
                matches[name]=z.read(item)
    require(set(matches)=={'MK2.EXE','SUCK.GRA'},'original EXE/SUCK missing')
    return matches['MK2.EXE'],matches['SUCK.GRA']

def check_identity(exe,gra):
    require(len(exe)==861133 and sha(exe)==EXE_SHA,'canonical original EXE SHA/length')
    require(len(gra)==122000 and sha(gra)==SUCK_SHA,'canonical SUCK.GRA SHA/length')
    pool=[n.decode('ascii') for n in exe[0xa0ef1:0xa13a7].split(b'\0') if n]
    require(pool[14]=='SUCK.GRA','original resource registry id 14')

def relocations(exe):
    require(exe[LE:LE+2]==b'LE' and u32(exe,LE+0x14)==113,'LE header/page count')
    tab=LE+u32(exe,LE+0x40)
    require(u32(exe,LE+0x44)==2 and [(u32(exe,tab+24*i+12),u32(exe,tab+24*i+16)) for i in range(2)]==[(1,63),(64,50)],'LE object pages')
    po=LE+u32(exe,LE+0x68);base=LE+u32(exe,LE+0x6c)
    fx={};total=0
    for i in range(113):
        owner=1 if i<63 else 2;first=1 if owner==1 else 64
        pos=base+u32(exe,po+4*i);end=base+u32(exe,po+4*(i+1))
        require(0<=pos<=end<=len(exe),'fixup page bounds')
        while pos<end:
            kind=exe[pos]&15;flag=exe[pos+1];relative=struct.unpack_from('<h',exe,pos+2)[0];pos+=4
            require(flag&3==0,'external fixups unsupported')
            obj=u16(exe,pos) if flag&64 else exe[pos];pos+=2 if flag&64 else 1
            target=None
            if kind!=2:
                target=u32(exe,pos) if flag&16 else u16(exe,pos)
                pos+=4 if flag&16 else 2
            if flag&4:pos+=4 if flag&32 else 2
            site=(i+1-first)*4096+relative
            key=(owner,site);value=(kind,flag,obj,target)
            require(key not in fx or fx[key]==value,'conflicting fixup')
            fx[key]=value;total+=1
        require(pos==end,'fixup page end')
    require((total,len(fx))==(27004,26994),'canonical LE census')
    return fx

def ptr(exe,fx,owner,site,to_obj,dest):
    require(fx.get((owner,site))==(7,16,to_obj,dest),'typed pointer '+str(owner)+':'+hex(site))
    physical=(O1 if owner==1 else O2)+site
    require(u32(exe,physical)==dest,'raw relocated pointer '+str(owner)+':'+hex(site))

def code_witnesses(exe,fx):
    # 0x86825 is a scheduler wait, NOT a sprite decoder.
    patterns={
      0x846ca:'b8a0bb0100', # EAX=Object2 0x1BBA0
      0x846cf:'e8fe07feff', # CALL 0x64ED2
      0x846d4:'a3785a0700', # store selected list in global cursor
      0x846d9:'b804000000', # raw coroutine/scheduler count 4
      0x846e8:'e938210000', # JMP 0x86825 (wait)
      0x64ed2:'8b5f468b0498c3', # index 4-byte table by DWORD [EDI+0x46]
      0x86825:'528d6dfc8945005a', # scheduler helper begins
      0x8682d:'e847d6fdff', # direct CALL to 0x63E79 source interpreter
      0x63e79:'a1785a07008b008305785a070004', # shared cursor bytecode interpreter
      0x63e93:'e847020000', # CALL 0x640DF on pointer-like command
      0x640df:'57894742', # original descriptor-bearing item consumer
      0x640eb:'8b10', # first pointer in source command item
      0x64107:'8b3d6c5a0700', # desc into EDI
      0x6411a:'8b17', # descriptor width+height
      0x64134:'0fbf5704', # descriptor signed x
      0x6413f:'0fbf4f06', # descriptor signed y
    }
    for physical,hexstring in patterns.items():
        t=bytes.fromhex(hexstring)
        require(exe[physical:physical+len(t)]==t,'code opcode '+hex(physical))
    ptr(exe,fx,1,0x846cb-O1,2,SELECTOR)
    ptr(exe,fx,1,0x846d5-O1,2,0x75a78)
    for site,target in ((0x846cf,0x64ed2),(0x846e8,0x86825),(0x8682d,0x63e79),(0x63e93,0x640df)):
        require(site+5+struct.unpack_from('<i',exe,site+1)[0]==target,'wrong near branch '+hex(site))
    return {'selectorLoadPhysical':0x846ca,'indexHelperPhysical':0x64ed2,
            'indexSourceObjectField':0x46,'selectionStorePhysical':0x846d4,
            'sourceGlobalCursorObject2':0x75a78,'schedulerWaitJumpPhysical':0x846e8,
            'sharedCommandInterpreterPhysical':0x63e79,
            'genericDescriptorCommandPhysical':0x640df,
            'directSelectedGroupToInterpreterCallProven':True,
            'runtimeSelectorBoundedOrObserved':False}

def decode(gra,start,w,h):
    require(0<w<=320 and 0<h<=320 and w*h<=64000,'frame geometry')
    require(0<=start<len(gra),'source offset outside resource')
    idx=bytearray(w*h);mask=bytearray(w*h);pos=start;cmds=collections.Counter()
    for row in range(h):
        x=0
        while x<w:
            require(pos+4<=len(gra),'RLE truncated token')
            token=u32(gra,pos);pos+=4
            if token&1:n=token>>1;kind='transparent'
            elif token&2:
                n=token>>10;kind='repeated';v=(token>>2)&255
                require(0<n<=w-x,'RLE repeated run crossing row')
                k=row*w+x;idx[k:k+n]=bytes([v])*n;mask[k:k+n]=b'\1'*n
            else:
                n=token>>2;kind='literal'
                require(0<n<=64 and n<=w-x and pos+n<=len(gra),'RLE literal invalid')
                k=row*w+x;idx[k:k+n]=gra[pos:pos+n];mask[k:k+n]=b'\1'*n
                pos+=(n+3)&~3
            require(0<n<=w-x,'RLE transparent/run crossing row')
            x+=n;cmds[kind]+=1
    return {'streamEndExclusive':pos,'indexedSha256':sha(idx),
            'opacityMaskSha256':sha(mask),'encodedSha256':sha(gra[start:pos]),
            'opaquePixelCount':mask.count(1),'tokenCounts':dict(cmds)}

def sprite(exe,gra,desc):
    require(0<=desc<0x32000 and O2+desc+12<=len(exe),'sprite descriptor backing')
    w,h,x,y,packed=struct.unpack_from('<HHhhI',exe,O2+desc)
    require(packed>>24==14,'sprite resource ID not SUCK')
    start=packed&0xffffff
    decoded=decode(gra,start,w,h)
    return {'descriptorObject2':desc,'dimensions':[w,h],'localXY':[x,y],
            'streamStart':start,**decoded}

def audit(exe,gra,strict_identity=True):
    if strict_identity:check_identity(exe,gra)
    fx=relocations(exe);code=code_witnesses(exe,fx)
    selected=[];families=[];all_sprites={}
    for slot,root in enumerate(ROOTS):
        ptr(exe,fx,2,SELECTOR+4*slot,2,root)
        selected.append({'selectorSlot':slot,'sourceGroupObject2':root})
    for root,count in GROUPS:
        records=[]
        for ordinal in range(count):
            entry=root+ordinal*4
            rec=u32(exe,O2+entry)
            ptr(exe,fx,2,entry,2,rec)
            d=u32(exe,O2+rec)
            ptr(exe,fx,2,rec,2,d)
            require(u32(exe,O2+rec+4)==0 and (2,rec+4) not in fx,
                    'nested sprite command second DWORD not unrelocated zero')
            fr=sprite(exe,gra,d)
            require(d not in all_sprites,'prefix descriptor shared between distinct groups')
            all_sprites[d]=fr
            records.append({'ordinal':ordinal,'tableEntryObject2':entry,
                            'commandRecordObject2':rec,'descriptorObject2':d,
                            'encodedStart':fr['streamStart'],'encodedEnd':fr['streamEndExclusive']})
        terminator=root+count*4
        require(u32(exe,O2+terminator)==0 and (2,terminator) not in fx,
                'source group has no unrelocated zero terminator')
        sorted_intervals=sorted((f['encodedStart'],f['encodedEnd']) for f in records)
        require(all(a[1]==b[0] for a,b in zip(sorted_intervals,sorted_intervals[1:])),
                'group encoded streams not consecutive')
        first,last=sorted_intervals[0][0],sorted_intervals[-1][1]
        families.append({'sourceGroupObject2':root,'entryCount':count,
                         'firstDescriptorObject2':records[0]['descriptorObject2'],
                         'lastDescriptorObject2':records[-1]['descriptorObject2'],
                         'encodedSpan':[first,last],'encodedSpanSha256':sha(gra[first:last]),
                         'zeroTerminatorObject2':terminator,'records':records})
    require(len(selected)==12 and len(families)==9 and len(all_sprites)==65,
            'prefix selector/group/unique descriptor census')
    require([x['sourceGroupObject2'] for x in selected]==list(ROOTS),
            'selector aliases changed')
    require([x['entryCount'] for x in families]==[7,7,7,7,8,7,8,8,6],
            'prefix group entries changed')
    # Spelunk005 authenticated the last 18 lists; independently rebind here.
    suffix=[]
    for root,count,term,back in SUFFIX:
        ent=[]
        for k in range(count):
            at=root+4*k;d=u32(exe,O2+at)
            ptr(exe,fx,2,at,2,d)
            require(d not in all_sprites,'suffix descriptor repeats prefix')
            fr=sprite(exe,gra,d)
            all_sprites[d]=fr;ent.append(d)
        at=root+count*4
        require(u32(exe,O2+at)==term and (2,at) not in fx,'suffix list terminator')
        if back is not None:ptr(exe,fx,2,at+4,2,back)
        suffix.append({'listObject2':root,'orderedEntries':count,
                       'endMarker':term,'backPointerObject2':back,
                       'orderedDescriptorObject2':ent})
    require(len(all_sprites)==83,'full original SUCK descriptor census')
    spans=sorted((f['streamStart'],f['streamEndExclusive'],d) for d,f in all_sprites.items())
    require(spans[0][0]==0 and spans[-1][1]==len(gra) and
            all(a[1]==b[0] for a,b in zip(spans,spans[1:])),
            'original 83 native sprite streams do not exactly partition SUCK bytes')
    require(sum(1 for x in spans if x[0]<117872)==65 and
            spans[64][1]==117872 and spans[65][0]==117872,
            'previous Spelunk005 original suffix boundary changed')
    return {'schema':'mk2_spelunk_006_suck_nested_source_groups_v1',
            'classification':'VERIFIED_STATIC_CONDITIONAL_SOURCE_GROUPS',
            'originalExeSha256':EXE_SHA,'originalSuckSha256':SUCK_SHA,
            'originalSuckBytes':len(gra),'leFixupRecords':27004,
            'uniqueLEFixupSites':26994,'codeProvenance':code,
            'sourceSelectorTableObject2':SELECTOR,'selectorSlots':selected,
            'selectorSlotCount':12,'distinctSourceGroups':9,
            'prefixDistinctDescriptors':65,'prefixSourceBytes':117872,
            'prefixEncodedSha256':sha(gra[:117872]),'nestedSourceGroups':families,
            'priorSpelunk005SourceLists':suffix,'suffixDistinctDescriptors':18,
            'suffixSourceBytes':4128,'suffixEncodedSha256':sha(gra[117872:]),
            'wholeOriginalResourceSpriteCount':83,'allOriginalEncodedStreamBytesCovered':True,
            'descriptors':[all_sprites[d] for d in sorted(all_sprites)],
            'confidenceLimits':{
              'realGameExecuted':False,'selectorIndexObserved':False,
              'sourceGroupInterpreterInvocationObserved':False,
              'originalPresentedFramesCompared':False,'framesPerSecondKnown':False,
              'paletteOrDacOwned':False,'animationTimingKnown':False,
              'worldPositionOrOcclusionKnown':False},
            'notes':['A source table slot is not a timed frame; the 12 slot table aliases nine distinct zero-terminated groups.',
                     'Each group contains pointers to original eight-byte command records (sprite descriptor pointer, literal zero), not direct sprite descriptors.',
                     'Original 0x64ED2 uses [EDI+0x46] as table index, but no original-file evidence proves runtime selector bounds or which slot is chosen.',
                     'Static control flow 0x846E8 -> 0x86825 -> CALL 0x63E79 -> CALL 0x640DF proves the source-selected group reaches the original interpreter when the effect routine runs.',
                     '83 distinct original indexed sprite streams cover 100% of SUCK.GRA resource bytes; individual sprite discovery may already be in O69.']}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--game-zip',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True)
    args=p.parse_args()
    require(not args.out.exists(),'refusing to overwrite evidence')
    exe,gra=original_zip(args.game_zip)
    result=audit(exe,gra)
    with args.out.open('x',encoding='utf-8') as o:
        json.dump(result,o,indent=2);o.write('\n')
    print(json.dumps({'status':result['classification'],
                      'sourceGroups':result['distinctSourceGroups'],
                      'selectedSlots':result['selectorSlotCount'],
                      'resourceSprites':result['wholeOriginalResourceSpriteCount'],
                      'completeBytes':result['allOriginalEncodedStreamBytesCovered']}))
if __name__=='__main__':main()
