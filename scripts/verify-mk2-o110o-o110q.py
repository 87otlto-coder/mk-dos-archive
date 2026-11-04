#!/usr/bin/env python3
"""Independent O110O/P/Q report verifier, freshly decodes source record and byte census.
Does not import or call the producer. Assertions bind data and negative conclusions.
"""
import hashlib,json,struct,sys
from pathlib import Path
HASH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
OPSTART,OPEND=0x61c54,0xa0c54
EXPECTED_ZERO=[0x64d8e,0x64da6,0x64dcf,0x64df1,0x66fa4,0x707c0,0x7b30d,0x7b330,0x7b344,0x7b36b,0x80411,0x805b6,0x81ef4,0x832ef,0x83340,0x83395,0x833ea,0x8343f,0x84ca1,0x84d15,0x84e07,0x84e19,0x84e37,0x84e52,0x850c4,0x93df7,0x93e15,0x987d9,0x9883a,0x98900,0x99c0a]
# Reading against the original binary is mandatory; no report alone can prove source evidence.

def digest(v):return hashlib.sha256(v).hexdigest()
def verify(binary,ooo,ppp,qqq,o_bytes):
 checks=0
 def ck(value,detail):
  nonlocal checks
  if not value:raise AssertionError(detail)
  checks+=1
 ck(len(binary)==861133 and digest(binary)==HASH,'canonical MK2 source image')
 for r,tag,fmt in ((ooo,'O','mk2_o110o_palette_queue_dac6_offline_v1'),(ppp,'P','mk2_o110p_palette_allocator_shift_offline_v1'),(qqq,'Q','mk2_o110q_palette_zero_global_operand_census_v1')):
  ck(r['format']==fmt,'format '+tag)
  ck(r['exeSha256']==digest(binary),'source '+tag)
  ck(r['status'].startswith('SOURCE_ANCHORED'),'status '+tag)
 # O replay: independently unpack both palette records as little-endian and emit original DAC port bytes.
 orig=[];data=[]
 for off in (0x26cc4,0x2ab28):
  file_at=OPSTART+off;n=struct.unpack_from('<H',binary,file_at)[0]
  words=struct.unpack_from('<'+str(n)+'H',binary,file_at+2)
  ck(n in (48,64) and max(words)<=0x7fff,'source record bounds')
  ck(ooo['fixtureRecords'][len(orig)]=={'pointer':off,'count':n,'sourceHash':digest(binary[file_at:file_at+2+2*n])},'record identity')
  orig.append((off,words))
 events=[]
 for slot,(rec,words) in enumerate(orig):
  events.append([0x3c8,(1,49)[slot]])
  for w in words:
   for ch in (((w>>9)&63)|1,((w>>4)&63)|1,((w*2)&63)|1):events.append([0x3c9,ch])
 ck(len(events)==338,'event count')
 ck(ooo['dac6']['events']==338 and ooo['dac6']['writesTo3c8']==2 and ooo['dac6']['writesTo3c9']==336,'ports')
 ck(ooo['dac6']['eventStreamSHA256']==digest(json.dumps(events,separators=(',',':')).encode()),'event stream digest')
 ck(ooo['dac6']['firstTriplet']==[x[1] for x in events[1:4]],'first DAC triplet')
 ck(ooo['dac6']['recordStarts']==[1,49] and ooo['dac6']['portStart']==0x3c8 and ooo['dac6']['portData']==0x3c9,'VGA registers')
 ring=ooo['ring']
 ck(ring['start']==0x562d8 and ring['endExclusive']==0x563d8,'ring span')
 ck(ring['recordWidth']==8 and ring['capacity']==32 and ring['safePendingWithoutFatal']==31,'queue capacity arithmetic')
 ck(ring['endExclusive']-ring['start']==ring['recordWidth']*ring['capacity'],'ring mathematical length')
 ck(ring['wrappedBuffer']['queued']==31 and ring['overflowRejected'] is True,'overflow assertion')
 ck(ring['readPointerGlobal']==0x563d8 and ring['writePointerGlobal']==0x563dc,'head/tail pointers')
 ck(ooo['runtimePaletteHandleOneDetermined'] is False,'no observed handle one')
 for name,v in ooo['sourceAnchors'].items():
  at=v['at'];hx=v['hex'];ck(binary[at:at+len(hx)//2].hex()==hx,'authentic O opcode '+name)
 for addr,raw in [(0x7b2d7,'8901'),(0x7b2d9,'66895104'),(0x7b2dd,'66895906'),(0x7b2e1,'83c108'),(0x7b2e4,'81f9d8630500'),(0x7b2ec,'b9d8620500'),(0x7b2f1,'890ddc630500'),(0x7b2f7,'3b0dd8630500'),(0x7b2ff,'b80a000000'),(0x7b30b,'f705e85c070000800000'),(0x7b329,'ec'),(0x7b3a4,'bac8030000'),(0x7b3b1,'66ad'),(0x7b3d4,'e2db')]:
  ck(binary[addr:addr+len(raw)//2].hex()==raw,'second-read instruction '+hex(addr))
 # P: distinguish reused pointer, release-ref zero, fresh pointer and bank shift.
 ck(ppp['parentO110OReportSHA256']==digest(o_bytes),'parent document binding')
 for name,v in ppp['sourceAnchors'].items():
  at=v['at'];hx=v['hex'];ck(binary[at:at+len(hx)//2].hex()==hx,'P source anchor '+name)
 model=ppp['model'];s=ppp['scenario']
 ck(model['slots']==60 and model['recordStride']==8 and model['firstBank']==1,'slot cardinality')
 ck(model['matchingPointerReusesHandle'] and model['laterLiveBanksMayBeShiftedAndRequeued'],'allocator flags')
 ck(model['freshRequestSetsPendingAndClearsDrawGate'] and model['releaseOnZeroClearsPointerNotBank'],'lifetime flags')
 ck(s['firstOriginalRecord']==0x26cc4 and s['secondOriginalRecord']==0x2ab28,'original operands')
 ck(s['thirdRecordIsSyntheticDistinctPointer'] is True and s['thirdRecordPixelWordsCopiedFromOriginal64'] is True,'hypothesis labeling')
 ck(s['returnedSlots']==[0,1,1,0],'reuse/free-slot path')
 ck(s['before']==[{'slot':0,'ptr':0x26cc4,'refs':1,'bank':1,'n':48},{'slot':1,'ptr':0x2ab28,'refs':1,'bank':49,'n':64}],'pre-shift table')
 ck(s['after']==[{'slot':0,'ptr':'synthetic_clone_of_B_at_distinct_pointer','refs':1,'bank':1,'n':64},{'slot':1,'ptr':0x2ab28,'refs':2,'bank':65,'n':64}],'post-shift table')
 ck(s['queuedBankStarts']==[1,49,1,65] and s['queuedEventCount']==724,'requeued original record')
 ck(s['secondRecordBankMove']==[49,65] and s['pendingFlag']==1 and s['drawGate']==0,'dynamics')
 ck(ppp['observedRuntimeGameOrder'] is False and ppp['paletteHandleOneAtDrawKnown'] is False,'runtime exclusions')
 for loc,hexstr in [(0x7b487,'5053668b18'),(0x7b489,'668b18'),(0x7b499,'c705d462050000000000'),(0x7b4a3,'e828feffff'),(0x7b4c9,'74ee'),(0x7b4ce,'3814dd065b0700'),(0x7b4d5,'731f'),(0x7b4d7,'8814dd065b0700'),(0x7b4ed,'e8defdffff'),(0x7b4f9,'66ff04dd045b0700'),(0x7b52a,'c704c5005b070000000000')]:
  ck(binary[loc:loc+len(hexstr)//2].hex()==hexstr,'P second-read '+hex(loc))
 # Q: 31 raw occurrences, one is not operand at all.
 raw=[i for i in range(OPSTART,OPEND-3) if binary[i:i+4]==b'\xe8\x5c\x07\x00']
 ck(raw==EXPECTED_ZERO and raw==qqq['allRawFourByteOccurrences'],'raw census positions')
 ck(qqq['directInstructionOperandCount']==30 and len(qqq['categorizedDirectRefs'])==30,'direct count')
 ck(qqq['counts']=={'read':4,'test':2,'bit_set':1,'write':23},'Q categories')
 ck(qqq['falsePositive']=={'at':0x99c0a,'encoding':'e85c070000','isCallTo':0x9a36b,'notMemoryAccess':True},'CALL negative')
 ck(binary[0x99c0a:0x99c0f].hex()=='e85c070000','CALL code bytes')
 ck(0x99c0a+5+struct.unpack_from('<i',binary,0x99c0b)[0]==0x9a36b,'CALL destination')
 for x in qqq['categorizedDirectRefs']:
  at=x['at'];ck(at in raw and at!=0x99c0a and x['before4']==binary[at-4:at].hex(),'typed source '+hex(at))
  op=x['before4'];valid={'read':('8b15','a1'),'write':('a3','c705','8915','891d'),'bit_set':('810d',),'test':('f705',)}[x['access']]
  ck(any(op.endswith(end) for end in valid),'source opcode type '+hex(at))
 ck(qqq['allIndirectOrAliasedReferencesKnown'] is False and qqq['livePaletteZeroColorKnown'] is False,'Q bounds')
 return {'status':'PASS','checks':checks,'directZeroRefs':30,'queueEvents':338,'runtimeStagePaletteKnown':False}

if __name__=='__main__':
 if len(sys.argv)!=3:raise SystemExit('usage: verify <original-mk2-dir> <evidence-dir>')
 b=(Path(sys.argv[1])/'mk2.exe').read_bytes();folder=Path(sys.argv[2]);o_file=(folder/'MK2_O110O.json').read_bytes()
 o=json.loads(o_file);p=json.loads((folder/'MK2_O110P.json').read_bytes());q=json.loads((folder/'MK2_O110Q.json').read_bytes())
 print(json.dumps(verify(b,o,p,q,o_file)))
