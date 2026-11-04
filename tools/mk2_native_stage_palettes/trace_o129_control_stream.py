#!/usr/bin/env python3
"""O129: bounded source-verified stage-control stream provenance (NOT runtime proof)."""
from __future__ import annotations
import argparse,hashlib,json,struct
from pathlib import Path
from trace_o120_setup_graph import fixups,EXE_SHA,OBJ1,OBJ2,require

STREAMS={0x13CEC:[0x80191],0x1410C:[0x805C5],0x15D60:[0x84C91,0x9882E,0x98A4B]}
CMD={
  0x93500:'8b15f65c07008915985a0700',
  0x93547:'8b0d985a07008b0183c104a9ffffffff',
  0x93557:'74517931407410',
  0x9355e:'833d4c0103000074e6e85e030000ebdf',
  0x9356e:'8b3183c1048b368b3983c1048b1983c104890d985a0700',
  0x93585:'e88eab0000ebbb',
  0x9358c:'8b3183c104668b36668935685a0700890d985a07008be8e8e8fdffffeb9d',
  0x935aa:'a1ca620700a9ffffffff742f',
  0x81f55:'8b1883c004891df65c0700',
  0x9e118:'f705d4620500010000007473',
}
DIRECT_REF_SITES={0x75CF6:[0x80196,0x80557,0x805CA,0x81F5C,0x84C96,0x93502,0x98833,0x98A50,0xA1964],
                  0x75A98:[0x93508,0x9350F,0x93549,0x93581,0x9359D]}

def u32(b,p):return struct.unpack_from('<I',b,p)[0]
def h(b):return hashlib.sha256(b).hexdigest()
def parse_stream(exe,offset,fx):
    pos=offset; entries=[]
    for n in range(128):
        physical=OBJ2+pos
        require(physical+4<=len(exe),'bounded stream read')
        token=struct.unpack_from('<i',exe,physical)[0]
        if token==0:
            return {'object2Offset':offset,'physicalStart':OBJ2+offset,
                    'terminatorObject2Offset':pos,'byteLengthIncludingTerminator':pos+4-offset,
                    'streamSHA256':h(exe[OBJ2+offset:physical+4]),
                    'positivePairs':entries,'positiveCount':len(entries),
                    'containsMinusOne':False,'containsOtherNegative':False}
        # These particular static streams are positive-token-only. Do not infer that about dynamic streams.
        require(token>0,'fixed list unexpectedly contains non-positive command at '+hex(pos))
        require(physical+8<=len(exe),'fixed pair overrun')
        operand=u32(exe,physical+4)
        for k,d in [(pos,token),(pos+4,operand)]:
            v=fx.get((2,k))
            require(v is not None and (v['kind'],v['flags'],v['targetObject'],v['targetOffset'])==(7,16,2,d),'typed item pointer at '+hex(k))
        entries.append({'object2Offset':pos,'tokenPointerObject2':token,'payloadPointerObject2':operand})
        pos+=8
    raise ValueError('nonterminating static stream')

def produce(exe):
    require(len(exe)==861133 and h(exe)==EXE_SHA,'canonical MK2.EXE required')
    fx=fixups(exe)
    for physical,hexstr in CMD.items():
        require(exe[physical:physical+len(hexstr)//2].hex()==hexstr,'opcode mismatch '+hex(physical))
    def reloc(site,target,sourceobj=1):
        v=fx.get((sourceobj,site-(OBJ1 if sourceobj==1 else OBJ2)))
        require(v is not None and (v['kind'],v['flags'],v['targetObject'],v['targetOffset'])==(7,16,2,target),'typed fixup '+hex(site))
        require(u32(exe,site)==target,'inline target mismatch '+hex(site))
    for dest,sites in DIRECT_REF_SITES.items():
        for site in sites:reloc(site,dest,1 if site<OBJ2 else 2)
    result=[]
    for start,sites in STREAMS.items():
        for site in sites:
            reloc(site,start)
            require(exe[site-1]==0xB8 and exe[site+4]==0xA3,'immediate EAX plus global store signature')
            reloc(site+5,0x75CF6)
        stream=parse_stream(exe,start,fx)
        stream['directEAXImmediateSetters']=sites
        result.append(stream)
    require([r['positiveCount'] for r in result]==[10,4,10],'fixed stream lengths')
    require([r['terminatorObject2Offset'] for r in result]==[0x13D3C,0x1412C,0x15DB0],'terminators')
    # The live stream pointer can also arrive from a different stream, not just these three immediates.
    require(exe[0x80554:0x8055B].hex()=='33c0a3f65c0700','explicit zeroing')
    # direct cursor initialization copies 0x75cf6 to 0x75a98 before parse.
    # command -1: consumes token (4) + 3 pointer/coordinate DWORDs (12), not 5 DWORDs.
    # other negative: optional helper path conditioned by runtime mode; positive: consumes token+pointer.
    typed=sorted(v['sourcePhysical'] for v in fx.values() if v['targetObject']==2 and v['targetOffset']==0x75CF6)
    require(typed==DIRECT_REF_SITES[0x75CF6],'nine typed refs to stream pointer')
    return {'schema':'mk2_o129_bounded_stage_control_stream_provenance_v1',
      'status':'PASS_STATIC_FIXED_STREAMS_AND_DYNAMIC_BOUNDARY','sourceExeSHA256':EXE_SHA,
      'leRelocationUniqueEntries':len(fx),'streamPointerObject2':0x75CF6,'activeCursorObject2':0x75A98,
      'typedStreamPointerReferenceSites':typed,
      'fixedStreams':result,
      'dynamicPointerLoad':{'physical':0x81F55,'semantics':'read DWORD from dynamic input stream; store at Object-2 0x75CF6',
                            'observedValue':False,'fixedStreamExhaustivenessProven':False},
      'controlGrammar':{
         'loop':0x93547,'cursorInitialization':0x93500,'cursorCopyDestination':0x93508,
         'zeroToken':'exit at 0x93557 to 0x935AA',
         'positiveToken':'token + one DWORD pointer: advance 8 bytes, call 0x93390',
         'minusOneToken':'token + three DWORD parameters: first parameter dereferenced for ESI; EDI and EBX passed to 0x9E118; advance 16 bytes',
         'otherNegativeToken':'mode-dependent optional helper 0x938CA; otherwise skip to next token; advance 4 bytes',
         'guardedPackedRenderer':0x9E118,'guardBitObject2':0x562D4,'requiredBit':1,
         'staticFixedListsContainMinusOne':False,'allPossibleDynamicListsExcludeMinusOne':False},
      'limits':['These three static stream lists cannot invoke the -1 branch if processed without modification.',
                'A separate event/init path stores a dynamically obtained pointer in the same global; its possible targets are not exhaustively enumerated.',
                'The positive-token handler invokes other drawing logic; lack of -1 does NOT imply no visual output.',
                'Token parameter structures remain partly semantic guesses; only actual register/dataflow and cursor increments are asserted.',
                'No live stream pointer, execution count, setup, flag, camera, palette handle, or DAC index was observed.']}

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--exe',type=Path,required=True);ap.add_argument('--out',type=Path,required=True);a=ap.parse_args()
    if a.out.exists():raise SystemExit('O129 refuses overwrite '+str(a.out))
    d=produce(a.exe.read_bytes());a.out.write_text(json.dumps(d,indent=2)+'\n');print('PASS O129',[(hex(x['object2Offset']),x['positiveCount']) for x in d['fixedStreams']])
