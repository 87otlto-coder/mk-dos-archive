#!/usr/bin/env python3
"""Spelunk 009: original DOS MK2 BANG.GRA paired-record and source-colour audit.

Owner's original ZIP is read-only. Output is source-safe offsets, signatures,
relative geometry and control evidence, never original executable/resource,
indexed pixel planes, native palette words or claimed runtime frames.
"""
from __future__ import annotations
import argparse, hashlib, json, struct, zipfile
from pathlib import Path

O1,O2,LE=0x61c54,0xa0c54,0x28f0c
EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
GRA_SHA='76bdab89c4262555560bd3958eecca58460bddb4d75f5bce90331ab419151152'
PALETTE=0x26cc4
GROUPS=((0x1b7dc,6,5),(0x1b810,1,1),(0x1b81c,8,8))
ROOTS=(0x1b540,0x1b568,0x1b590,0x1b5b8,0x1b5e0,0x1b608,
       0x1b62c,0x1b650,0x1b678,0x1b698,0x1b6d4)
COUNTS=(8,8,8,8,8,8,8,8,6,13,12)
CALLS=(0x83f36,0x83f47,0x83f5e,0x83f6f,0x83f86,0x83f97,0x83fae,0x83fbf)
EXPECTED_X=(48,46,40,29,16,0)
EXPECTED_HEADER_COUNTS=(8,6,13,12,8,8,8,8,8,6,8,8)


def need(ok,why):
    if not ok:raise ValueError('SPELUNK009: '+why)
def u32(b,p):return struct.unpack_from('<I',b,p)[0]
def i16(b,p):return struct.unpack_from('<h',b,p)[0]
def sha(b):return hashlib.sha256(b).hexdigest()

def original(zpath):
    with zipfile.ZipFile(zpath) as z:
        names={}
        for info in z.infolist():
            if info.is_dir():continue
            name=info.filename.replace('\\','/').split('/')[-1].upper()
            if name in ('MK2.EXE','BANG.GRA'):
                need(name not in names,'duplicate ZIP member '+name)
                names[name]=info.filename
        need(set(names)=={'MK2.EXE','BANG.GRA'},'missing exact original resources')
        return z.read(names['MK2.EXE']),z.read(names['BANG.GRA'])

def verify_identity(exe,gra):
    need(len(exe)==861133 and sha(exe)==EXE_SHA,'MK2.EXE identity')
    need(len(gra)==29556 and sha(gra)==GRA_SHA,'BANG.GRA identity')
    pool=[x.decode('ascii') for x in exe[0xa0ef1:0xa13a7].split(b'\0') if x]
    need(pool[12]=='BANG.GRA','original registry ID')

def relocations(exe):
    need(exe[LE:LE+2]==b'LE' and u32(exe,LE+0x14)==113,'LE signature/pages')
    tab=LE+u32(exe,LE+0x40)
    need(u32(exe,LE+0x44)==2 and
         [(u32(exe,tab+24*i+12),u32(exe,tab+24*i+16)) for i in range(2)]==[(1,63),(64,50)],
         'LE object page mapping')
    po=LE+u32(exe,LE+0x68);fb=LE+u32(exe,LE+0x6c)
    result={};total=0
    for page in range(113):
        owner=1 if page<63 else 2;first=1 if owner==1 else 64
        pos=fb+u32(exe,po+4*page);end=fb+u32(exe,po+4*(page+1))
        need(0<=pos<=end<=len(exe),'LE fixup page bounds')
        while pos<end:
            kind=exe[pos]&15;flag=exe[pos+1];relative=i16(exe,pos+2);pos+=4
            need(flag&3==0,'import fixup unsupported')
            destobj=struct.unpack_from('<H',exe,pos)[0] if flag&64 else exe[pos]
            pos+=2 if flag&64 else 1
            target=None
            if kind!=2:
                target=u32(exe,pos) if flag&16 else struct.unpack_from('<H',exe,pos)[0]
                pos+=4 if flag&16 else 2
            if flag&4:pos+=4 if flag&32 else 2
            site=(page+1-first)*4096+relative
            key=(owner,site);val=(kind,flag,destobj,target)
            need(key not in result or result[key]==val,'conflicting duplicate fixup')
            result[key]=val;total+=1
        need(pos==end,'LE page end misaligned')
    need((total,len(result))==(27004,26994),'original LE census')
    return result

def ptr(exe,fx,owner,site,to_obj,target):
    need(fx.get((owner,site))==(7,16,to_obj,target),'typed source pointer '+hex(site))
    base=O1 if owner==1 else O2
    need(u32(exe,base+site)==target,'raw source pointer '+hex(site))

def decode_end(gra,start,w,h):
    need(0<w<=320 and 0<h<=320 and w*h<=64000 and 0<=start<len(gra),'RLE bounds')
    at=start
    for row in range(h):
        x=0
        while x<w:
            need(at+4<=len(gra),'RLE truncated token')
            cmd=u32(gra,at);at+=4
            if cmd&1:n=cmd>>1
            elif cmd&2:n=cmd>>10
            else:
                n=cmd>>2
                need(0<n<=64 and at+n<=len(gra),'RLE literal invalid')
                at+=(n+3)&~3
            need(0<n<=w-x,'RLE run crosses row')
            x+=n
    return at

def sprites(exe,gra):
    found={}
    for desc in range(0,min(0x32000,len(exe)-O2-12)+1,4):
        w,h,x,y,packed=struct.unpack_from('<HHhhI',exe,O2+desc)
        rid,start=packed>>24,packed&0xffffff
        if rid!=12 or not(1<=w<=320 and 1<=h<=320 and w*h<=64000 and
                            abs(x)<=1000 and abs(y)<=1000 and start<len(gra)):continue
        try:end=decode_end(gra,start,w,h)
        except(ValueError,struct.error):continue
        found[desc]={'descriptorObject2':desc,'sourceStart':start,
                     'sourceEndExclusive':end,'width':w,'height':h,
                     'descriptorLocalXY':[x,y]}
    need(len(found)==101,'canonical O69 101 BANG sprites')
    intervals=sorted((f['sourceStart'],f['sourceEndExclusive']) for f in found.values())
    need(intervals[0][0]==0 and intervals[-1][1]==len(gra) and
         all(a[1]==b[0] for a,b in zip(intervals,intervals[1:])),
         '101 streams do not partition BANG bytes')
    return found

def source_palettes(exe,gra,fx,desc):
    anchors=sorted(d for d in desc if fx.get((2,d+12))==(7,16,1,PALETTE))
    need(len(anchors)==12,'expected 12 typed colour headers')
    need(not [d for d in desc if (2,d+12) in fx and d not in anchors],
         'other typed descriptor+12 pointer')
    groups=[]
    for k,d in enumerate(anchors):
        ptr(exe,fx,2,d+12,1,PALETTE)
        end_desc=anchors[k+1] if k+1<len(anchors) else max(desc)+16
        members=[x for x in sorted(desc) if d<=x<end_desc]
        ranges=sorted((desc[x]['sourceStart'],desc[x]['sourceEndExclusive']) for x in members)
        need(ranges and all(a[1]==b[0] for a,b in zip(ranges,ranges[1:])),
             'colour-header group source discontinuity')
        a,b=ranges[0][0],ranges[-1][1]
        groups.append({'anchorDescriptorObject2':d,'typedSourcePointerObject2':d+12,
                       'sourceRecordObject1':PALETTE,'distinctSprites':len(members),
                       'resourceSpan':[a,b],'encodedSourceSha256':sha(gra[a:b]),
                       'memberDescriptorObject2':members})
    need(tuple(g['distinctSprites'] for g in groups)==EXPECTED_HEADER_COUNTS,
         '12 colour-header source group counts')
    need(groups[0]['resourceSpan'][0]==0 and groups[-1]['resourceSpan'][1]==len(gra) and
         all(a['resourceSpan'][1]==b['resourceSpan'][0] for a,b in zip(groups,groups[1:])),
         'colour-header group resource byte partition')
    # Independent 11 original typed selector-list targets should align with
    # the first eleven source-colour groups; the twelfth is the extra sprites.
    listed=[];selector_groups=[]
    for slot,(root,count) in enumerate(zip(ROOTS,COUNTS)):
        ptr(exe,fx,2,0x1b514+4*slot,2,root)
        members=[]
        for i in range(count):
            site=root+4*i;d=u32(exe,O2+site)
            ptr(exe,fx,2,site,2,d)
            need(d in desc,'BANG selector list pointer not native sprite')
            members.append(d);listed.append(d)
        selector_groups.append({'selectorSlot':slot,'sourceListObject2':root,
                                'orderedReferences':count,'uniqueSprites':len(set(members))})
    need(len(listed)==95 and len(set(listed))==93,'prior BANG selector census')
    need(len(set(desc)-set(listed))==8,'eight nonselector BANG sprites')
    for i,g in enumerate(groups[:-1]):
        need(set(g['memberDescriptorObject2'])==set(listed)
             .intersection(g['memberDescriptorObject2']),
             'coloured first 11 groups are not selector groups')
    need(set(groups[-1]['memberDescriptorObject2'])==set(desc)-set(listed),
         'twelfth colour group is not 8 nonselector sprites')
    return groups,selector_groups

def near(exe,at):
    need(exe[at]==0xe8,'expected original near call')
    return at+5+struct.unpack_from('<i',exe,at+1)[0]

def bytecode(exe,fx):
    # Source establishes the initial seed AND the pointer/signed-XY consumer.
    for at,hexval in {
        0x842d6:'c7056c5a0700ac0c0200',
        0x842e0:'c705785a0700dcb70100',
        0x83ecd:'528b156c5a07008956645a',
        0x83ed9:'a1785a07008b18',
        0x83ef7:'0fbf10',
        0x83f1c:'0fbf10',
        0x83fc5:'528b566489156c5a07005a',
        0x93793:'8b4f3c3bcb',
        0x937d3:'895f3c'
    }.items():
        value=bytes.fromhex(hexval)
        need(exe[at:at+len(value)]==value,'original source instruction '+hex(at))
    ptr(exe,fx,1,0x842dc-O1,2,0x20cac)
    ptr(exe,fx,1,0x842e6-O1,2,0x1b7dc)
    need(near(exe,0x842ea)==0x83ecd,'original pair-list consumer call')
    need(exe[0x83eee:0x83ef0]==bytes.fromhex('7445'),
         'reader null descriptor sentinel branch')
    need(exe[0x83f13:0x83f15]==bytes.fromhex('7420'),
         'reader signed-X zero sentinel branch')
    need(near(exe,0x83f2e)==0x83f36,'original fanout helper')
    need(all(near(exe,at)==0x83fc5 for at in CALLS),
         'eight calls to original constructor wrapper')
    need(near(exe,0x83fd0)==0x64548 and near(exe,0x83fd5)==0x9377c,
         'original sprite constructor/descriptor update chain')
    # Source arithmetic executes SAR, SHL and NEG. Odd X values lose their
    # low bit on SAR→SHL, so don't simplify to naive symmetrical negatives.
    for at,opcode in ((0x83f3b,'d13d705a0700'),(0x83f41,'d13d745a0700'),
                      (0x83f4c,'d125705a0700'),(0x83f52,'d125745a0700'),
                      (0x83f58,'f71d705a0700'),(0x83f80,'f71d745a0700'),
                      (0x83fa8,'f71d705a0700')):
        data=bytes.fromhex(opcode)
        need(exe[at:at+len(data)]==data,'source coordinate transformation '+hex(at))
    return {'sourceSeedPhysical':0x842d6,'seedDescriptorObject2':0x20cac,
            'cursorWriterPhysical':0x842e0,'pairedRecordRootObject2':0x1b7dc,
            'pairedConsumerPhysical':0x83ecd,'zeroPointerExitPhysical':0x83eee,
            'zeroSignedXExitPhysical':0x83f13,'fanoutPhysical':0x83f36,
            'originalHelperCallSitesPhysical':list(CALLS),
            'originalObjectConstructorPhysical':0x64548,
            'descriptorUpdatePhysical':0x9377c,
            'objectDescriptorAssignmentPhysical':0x937d3,
            'staticHelperCallsPerAcceptedRecord':8,
            'actualObjectAllocationOrPresentationObserved':False}

def transforms(x,y):
    """The source shift/negate program's exact small signed relative XY values."""
    out=[(x,y)]
    x>>=1;y>>=1;out.append((x,y))
    x<<=1;y<<=1;x=-x;out.append((x,y))
    x>>=1;y>>=1;out.append((x,y))
    x<<=1;y<<=1;y=-y;out.append((x,y))
    x>>=1;y>>=1;out.append((x,y))
    x<<=1;y<<=1;x=-x;out.append((x,y))
    x>>=1;y>>=1;out.append((x,y))
    need(len(out)==8,'original eight-source-transform census')
    return [list(p) for p in out]

def secondary(exe,fx,desc):
    parsed=[]
    for root,count,expected_consumed in GROUPS:
        rows=[]
        for ordinal in range(count):
            site=root+8*ordinal;d=u32(exe,O2+site)
            ptr(exe,fx,2,site,2,d)
            need(d in desc,'non-BANG descriptor within secondary records')
            x,y=i16(exe,O2+site+4),i16(exe,O2+site+6)
            rows.append({'ordinal':ordinal,'entryObject2':site,
                         'descriptorObject2':d,'signedRelativeXY':[x,y],
                         'fanoutTransforms':transforms(x,y) if x else []})
        terminal_site=root+8*count
        need(u32(exe,O2+terminal_site)==0 and (2,terminal_site) not in fx,
             'secondary source group missing unrelocated zero')
        actual=sum(1 for record in rows if record['signedRelativeXY'][0]!=0)
        need(actual==expected_consumed,'source accepted-record census')
        if root==0x1b7dc:
            need(tuple(r['signedRelativeXY'][0] for r in rows)==EXPECTED_X,
                 'code-connected group sentinel changed')
            need(rows[5]['signedRelativeXY']==[0,-48],
                 'source sentinel y signed word changed')
            accepted=5
        else:
            need(all(r['signedRelativeXY'][0]!=0 for r in rows),
                 'other group contains unexpected X=0 sentinel')
            accepted=count
        # Independently test for typed relocations to any record position,
        # not to the BANG sprite descriptors contained in those records.
        typed_inbound=[(owner,site,target) for (owner,site),f in fx.items()
                       for target in [f[3]] if f[0]==7 and f[2]==2
                       and target is not None and root<=target<terminal_site]
        if root==0x1b7dc:
            need(typed_inbound==[(1,0x842e6-O1,0x1b7dc)],
                 'first group direct source writer evidence')
        else:
            need(not typed_inbound,'other group now has source typed inbound')
        parsed.append({'rootObject2':root,'records':rows,
                       'pointerSignedXYRecords':count,
                       'sourceAcceptedBeforeStop':accepted,
                       'trailingZeroObject2':terminal_site,
                       'typedInboundToRecords':len(typed_inbound),
                       'originalReaderCodeLinked':root==0x1b7dc,
                       'standaloneRuntimeSelectionVerified':False})
    need(len({r['descriptorObject2'] for g in parsed for r in g['records']})==8,
         'exactly eight extra BANG original sprites referenced')
    return parsed

def audit(exe,gra):
    verify_identity(exe,gra)
    fx=relocations(exe)
    desc=sprites(exe,gra)
    palette,slots=source_palettes(exe,gra,fx,desc)
    code=bytecode(exe,fx)
    blocks=secondary(exe,fx,desc)
    return {'schema':'mk2_spelunk_009_bang_secondary_and_colour_source_v1',
            'confidence':'VERIFIED_STATIC_SOURCE_WITH_RUNTIME_LIMITS',
            'inputIdentity':{'exeSha256':EXE_SHA,'bangGraSha256':GRA_SHA,
                             'originalResourceBytes':len(gra),'originalResourceId':12},
            'sourceReadOnly':True,'originalLERelocationCount':27004,
            'originalLEUniqueSites':26994,'originalIndexedSpriteStreams':101,
            'allOriginalResourceBytesDecoded':True,'paletteSourceObject1':PALETTE,
            'exactTypedColourLinks':len(palette),'sourceColourGroups':palette,
            'originalSelectorLists':slots,'consumerInstructions':code,
            'secondaryGroups':blocks,'runtimeUnknown':{
                'livePaletteBank':False,'paletteUpload':False,
                'objectAllocationSuccess':False,'nativePresentedPixels':False,
                'playbackFrameDurations':False,'alternativeGroupActivation':False},
            'notes':['One code-connected six-record source group has signed-X zero sentinel at the sixth record; only five records reach its eight-call helper per traversal.',
                     'An additional one-record and eight-record group are structurally compatible with the reader, but no typed original inbound reference reaches either group.',
                     'Eight calls are source instruction fanouts, not proof of eight displayed frames or successful allocations.',
                     'All 12 explicit source palette links target Object1 0x26CC4, also seen in BLOOD research, without proving live DAC ownership.',
                     'The 11 previously validated BANG list selectors account for 93 unique sprites; the final source-colour group covers eight additional sprites.']}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--game-zip',type=Path,required=True)
    parser.add_argument('--out',type=Path,required=True)
    args=parser.parse_args()
    need(not args.out.exists(),'refusing to overwrite existing source report')
    exe,gra=original(args.game_zip)
    report=audit(exe,gra)
    with args.out.open('x',encoding='utf-8') as fp:
        json.dump(report,fp,indent=2);fp.write('\n')
    print(json.dumps({'staticSourceColourLinks':len(report['sourceColourGroups']),
                      'secondaryGroups':len(report['secondaryGroups']),
                      'nativeSprites':report['originalIndexedSpriteStreams']}))

if __name__=='__main__':main()
