#!/usr/bin/env python3
"""O129 independent source verifier: does not import O129 producer or its constants."""
from __future__ import annotations
import hashlib,json,struct,sys
from pathlib import Path
from verify_o120_independent import parse_fixups
H='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
O1,O2=0x61C54,0xA0C54
S=((0x13CEC,(0x80191,),10,0x13D3C),(0x1410C,(0x805C5,),4,0x1412C),(0x15D60,(0x84C91,0x9882E,0x98A4B),10,0x15DB0))
def sha(x):return hashlib.sha256(x).hexdigest()
def read(exe,p):return struct.unpack_from('<I',exe,p)[0]
def verify(exe,report):
    n=0
    def chk(cond,msg):
        nonlocal n
        if not cond:raise ValueError('O129 independent: '+msg)
        n+=1
    chk(len(exe)==861133 and sha(exe)==H,'original binary hash')
    doc=json.loads(report)
    chk(set(doc)=={'schema','status','sourceExeSHA256','leRelocationUniqueEntries','streamPointerObject2','activeCursorObject2','typedStreamPointerReferenceSites','fixedStreams','dynamicPointerLoad','controlGrammar','limits'},'exact report schema')
    chk(doc['schema']=='mk2_o129_bounded_stage_control_stream_provenance_v1' and doc['status']=='PASS_STATIC_FIXED_STREAMS_AND_DYNAMIC_BOUNDARY','status')
    chk(doc['sourceExeSHA256']==H,'provenance hash')
    fx,total=parse_fixups(exe)
    chk(total==27004 and doc['leRelocationUniqueEntries']==len(fx),'independent LE parser')
    def reloc(obj,site,target):
        idx=site-(O1 if obj==1 else O2)
        chk(fx.get((obj,idx))==(7,16,2,target),'typed relocation at '+hex(site))
        chk(read(exe,site)==target,'original pointer at '+hex(site))
    wanted=(0x80196,0x80557,0x805CA,0x81F5C,0x84C96,0x93502,0x98833,0x98A50,0xA1964)
    references=sorted((O1 if ob==1 else O2)+i for (ob,i),v in fx.items() if v[2:]==(2,0x75CF6))
    chk(tuple(references)==wanted and doc['typedStreamPointerReferenceSites']==references,'nine typed pointer references')
    for site in references:reloc(1 if site<O2 else 2,site,0x75CF6)
    chk(doc['streamPointerObject2']==0x75CF6 and doc['activeCursorObject2']==0x75A98,'pointer globals')
    chk(len(doc['fixedStreams'])==3,'stream count')
    for d,(start,setters,count,end) in zip(doc['fixedStreams'],S):
        chk(set(d)=={'object2Offset','physicalStart','terminatorObject2Offset','byteLengthIncludingTerminator','streamSHA256','positivePairs','positiveCount','containsMinusOne','containsOtherNegative','directEAXImmediateSetters'},'stream keys')
        chk(d['object2Offset']==start and d['physicalStart']==O2+start and d['terminatorObject2Offset']==end,'stream bounds')
        chk(d['byteLengthIncludingTerminator']==8*count+4 and d['positiveCount']==count,'stream length')
        chk(d['directEAXImmediateSetters']==list(setters),'static immediate setter citations')
        chk(d['streamSHA256']==sha(exe[O2+start:O2+end+4]),'stream byte SHA')
        chk(d['containsMinusOne'] is False and d['containsOtherNegative'] is False,'no negative tokens in fixed list')
        chk(len(d['positivePairs'])==count,'pair count')
        for i,item in enumerate(d['positivePairs']):
            loc=start+8*i
            t=read(exe,O2+loc);payload=read(exe,O2+loc+4)
            chk(t>0 and t<0x90000 and payload>0,'positive token two DWORDs')
            chk(item=={'object2Offset':loc,'tokenPointerObject2':t,'payloadPointerObject2':payload},'pair '+hex(loc))
            reloc(2,O2+loc,t);reloc(2,O2+loc+4,payload)
        chk(read(exe,O2+end)==0,'zero terminator')
        for src in setters:
            reloc(1,src,start);reloc(1,src+5,0x75CF6)
            chk(exe[src-1]==0xB8 and exe[src+4]==0xA3,'mov eax immediate plus mov global instruction')
    chk(exe[0x80554:0x8055B].hex()=='33c0a3f65c0700','zero setter')
    chk(exe[0x81F55:0x81F60].hex()=='8b1883c004891df65c0700','dynamic pointer writer')
    chk(doc['dynamicPointerLoad']=={'physical':0x81F55,'semantics':'read DWORD from dynamic input stream; store at Object-2 0x75CF6', 'observedValue':False,'fixedStreamExhaustivenessProven':False},'dynamic setter qualification')
    grammar=doc['controlGrammar']
    chk(set(grammar)=={'loop','cursorInitialization','cursorCopyDestination','zeroToken','positiveToken','minusOneToken','otherNegativeToken','guardedPackedRenderer','guardBitObject2','requiredBit','staticFixedListsContainMinusOne','allPossibleDynamicListsExcludeMinusOne'},'grammar schema')
    for at,hx in [(0x93500,'8b15f65c07008915985a0700'),(0x93547,'8b0d985a07008b0183c104a9ffffffff'),(0x93557,'74517931407410'),(0x9355e,'833d4c0103000074e6e85e030000ebdf'),(0x9356e,'8b3183c1048b368b3983c1048b1983c104890d985a0700'),(0x93585,'e88eab0000ebbb'),(0x9358c,'8b3183c104668b36668935685a0700890d985a07008be8e8e8fdffffeb9d'),(0x935aa,'a1ca620700a9ffffffff742f'),(0x9e118,'f705d4620500010000007473')]:
        chk(exe[at:at+len(hx)//2].hex()==hx,'code '+hex(at))
    chk(grammar['loop']==0x93547 and grammar['cursorInitialization']==0x93500 and grammar['cursorCopyDestination']==0x93508,'loop fields')
    chk(grammar['guardedPackedRenderer']==0x9e118 and grammar['guardBitObject2']==0x562D4 and grammar['requiredBit']==1,'guard fields')
    chk(grammar['staticFixedListsContainMinusOne'] is False and grammar['allPossibleDynamicListsExcludeMinusOne'] is False,'scope flags')
    chk('advance 8 bytes' in grammar['positiveToken'] and 'advance 16 bytes' in grammar['minusOneToken'] and 'advance 4 bytes' in grammar['otherNegativeToken'],'cursor increments')
    chk('0x935AA' in grammar['zeroToken'],'zero token')
    chk(len(doc['limits'])==5 and 'No live stream pointer' in doc['limits'][-1] and 'does NOT imply' in doc['limits'][2],'honest limits')
    return {'status':'PASS_O129_INDEPENDENT','assertions':n,'streams':len(S),'fixedPositivePairs':sum(s[2] for s in S),'typedFixups':total,'reportSHA256':sha(report)}
if __name__=='__main__':
    if len(sys.argv)!=3:raise SystemExit('usage: verifier original_MK2.EXE O129_STREAMS.json')
    print(json.dumps(verify(Path(sys.argv[1]).read_bytes(),Path(sys.argv[2]).read_bytes()),indent=2))
