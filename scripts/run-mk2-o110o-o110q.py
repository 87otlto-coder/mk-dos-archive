#!/usr/bin/env python3
"""O110O–Q: source-authenticated offline MK2 palette queue and allocator diagnostics.

No emulator or claims about the runtime stage palette. Original files read-only.
"""
import argparse, hashlib, json, struct
from pathlib import Path

H='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
CODE=(0x61c54,0xa0c54)
QBASE,QEND=0x562d8,0x563d8
ZERO=0x75ce8
# Anchors checked at exact physical file offsets, including code not reused in other passes.
ANCHORS={
 'queueReset':(0x7b2c0,'b8d8620500a3d8630500a3dc630500c3'),
 'enqueue':(0x7b2d0,'518b0ddc6305008901668951046689590683c10881f9d86305007c05b9d8620500890ddc6305003b0dd8630500750ab80a000000e8eb6afeff59c3'),
 'queueInput':(0x7b381,'0fb74d068b75000fb77d0483c5088bc703c13d000100007e0a'),
 'queueDacStart':(0x7b3a4,'bac80300008bc7ee42eb00'),
 'queueDacColor':(0x7b3af,'33c066ad8bf8c1e809243f0c01eeeb00'),
 'queueDacColorGreen':(0x7b3bf,'8bc7c1e804243f0c01eeeb00'),
 'queueDacColorBlue':(0x7b3cb,'8bc7d1e0243f0c01eee2db'),
 'queueDrained':(0x7b3e7,'892dd8630500c705e063050000000000c3'),
 'requestBankAssign':(0x7b4aa,'8904dd005b07008814dd065b0700'),
 'requestShiftCompare':(0x7b4cb,'6603103814dd065b0700731f'),
 'requestShiftWrite':(0x7b4d7,'8814dd065b0700'),
 'requestQueueShift':(0x7b4ed,'e8defdffff'),
 'releaseClearPointer':(0x7b52a,'c704c5005b070000000000'),
 'stageHandleOne':(0x9e18b,'b801000000')}

# Candidate locations are exact 4-byte matches of ZERO; the final hit is an opcode
# boundary coincidence (E8 5C 07 00 ... = byte pattern E8 5C 07 00).
READ={0x64d8e,0x64df1,0x7b344,0x84e07}
TEST={0x7b30d,0x7b330}
BIT_SET={0x7b36b}
WRITES={0x64da6,0x64dcf,0x66fa4,0x707c0,0x80411,0x805b6,0x81ef4,0x832ef,0x83340,0x83395,0x833ea,0x8343f,0x84ca1,0x84d15,0x84e19,0x84e37,0x84e52,0x850c4,0x93df7,0x93e15,0x987d9,0x9883a,0x98900}
FALSE=0x99c0a

def digest(b):return hashlib.sha256(b).hexdigest()
def check_source(b):
 assert digest(b)==H and len(b)==861133,'wrong canonical source'
 for n,(at,hx) in ANCHORS.items():
  assert b[at:at+len(hx)//2].hex()==hx,(n,hex(at))

def palette(b,rel):
 at=CODE[0]+rel
 n=struct.unpack_from('<H',b,at)[0]
 words=list(struct.unpack_from('<'+str(n)+'H',b,at+2))
 assert n in (48,64) and all(w<=0x7fff for w in words)
 return {'name':'original_'+hex(rel),'pointer':rel,'count':n,'words':words,'filePhysical':at,'sourceHash':digest(b[at:at+2+2*n])}

def dac(w):return (((w>>9)&63)|1, ((w>>4)&63)|1, ((w<<1)&63)|1)

def replay(entries):
 # Each queue element stores (source pointer,count/start), exactly as encoded by 0x7B2D0.
 events=[]
 for ent in entries:
  assert ent['start']+len(ent['words'])<=256
  events.append([0x3c8,ent['start']&255])
  for w in ent['words']:
   events.extend(([0x3c9,v] for v in dac(w)))
 return events

class Ring:
 def __init__(self):self.buf=[None]*32;self.r=0;self.w=0
 def push(self,x):
  new=(self.w+1)&31
  if new==self.r:raise OverflowError('Original encoder would invoke error code 10')
  self.buf[self.w]=x;self.w=new
 def drain(self):
  out=[]
  while self.r!=self.w:
   out.append(self.buf[self.r]);self.buf[self.r]=None;self.r=(self.r+1)&31
  return out
 def state(self):return {'read':self.r,'write':self.w,'queued':(self.w-self.r)&31}

class Alloc:
 def __init__(self):self.slots=[{'ptr':None,'count':0,'bank':0,'n':0,'words':[]} for _ in range(60)];self.queued=[];self.gate=1;self.pending=0
 def request(self,rec):
  ptr=rec['pointer'];n=rec['count']
  for i,s in enumerate(self.slots):
   if s['ptr']==ptr:
    s['count']+=1;return i
  d=1
  i=0
  while i<60:
   s=self.slots[i]
   if not s['count']:break
   d=(s['bank']+s['n'])&65535
   i+=1
  if i==60:raise OverflowError('slots exhausted')
  s=self.slots[i];s.update(ptr=ptr,count=1,n=n,bank=d&255,words=rec['words'])
  self.queued.append({'ptr':ptr,'start':d,'words':rec['words']});self.pending=1;self.gate=0
  for j in range(i+1,60):
   nxt=self.slots[j]
   if not nxt['count']:continue
   d=(d+n)&65535
   if nxt['bank']>=d:break
   nxt['bank']=d&255
   self.queued.append({'ptr':nxt['ptr'],'start':d,'words':nxt['words']})
  return i
 def release(self,idx):
  s=self.slots[idx]
  assert s['count']>0
  s['count']-=1
  if s['count']==0:s['ptr']=None  # bank retained, original code
 def snapshot(self):return [{'slot':i, 'ptr':s['ptr'],'refs':s['count'],'bank':s['bank'],'n':s['n']} for i,s in enumerate(self.slots) if s['count']]

def main():
 parser=argparse.ArgumentParser();parser.add_argument('fixture',type=Path);parser.add_argument('out',type=Path)
 a=parser.parse_args();b=(a.fixture/'mk2.exe').read_bytes();check_source(b);a.out.mkdir(parents=True,exist_ok=True)
 A,B=(palette(b,x) for x in (0x26cc4,0x2ab28))
 # O: queue record, wrapping, empty/full and DAC6 triplets (exact source palette contents).
 q=Ring();q.push({'ptr':A['pointer'],'start':1,'words':A['words']});q.push({'ptr':B['pointer'],'start':49,'words':B['words']})
 payload=q.drain();events=replay(payload)
 assert len(events)==338 and q.state()['queued']==0
 for j in range(29):q.push({'ptr':'synthetic_'+str(j),'start':1,'words':[0]})
 assert len(q.drain())==29
 for j in range(31):q.push({'ptr':'wrapped_'+str(j),'start':1,'words':[0]})
 full=q.state();assert full['queued']==31
 try:q.push({'ptr':'overflow','start':1,'words':[0]});assert False
 except OverflowError:pass
 q.drain()
 o={'format':'mk2_o110o_palette_queue_dac6_offline_v1','status':'SOURCE_ANCHORED_OFFLINE_REPLAY','exeSha256':H,
    'sourceAnchors':{k:{'at':at,'hex':hx} for k,(at,hx) in ANCHORS.items() if k.startswith('queue')},
    'ring':{'start':QBASE,'endExclusive':QEND,'recordWidth':8,'capacity':32,'safePendingWithoutFatal':31,
      'writePointerGlobal':0x563dc,'readPointerGlobal':0x563d8,'fullOnWriteEqualsRead':True,
      'wrappedBuffer':full,'overflowRejected':True},
    'queueLayout':['uint32 palette_data_ptr','uint16 vga_start_index','uint16 palette_color_count'],
    'fixtureRecords':[{'pointer':p['pointer'],'count':p['count'],'sourceHash':p['sourceHash']} for p in (A,B)],
    'dac6':{'conversion':'r=((word>>9)&63)|1;g=((word>>4)&63)|1;b=((word<<1)&63)|1',
            'portStart':0x3c8,'portData':0x3c9,'recordStarts':[1,49],
            'events':len(events),'writesTo3c8':2,'writesTo3c9':336,
            'eventStreamSHA256':digest(json.dumps(events,separators=(',',':')).encode()),
            'firstTriplet':list(dac(A['words'][0]))},
    'runtimePaletteHandleOneDetermined':False,'origin':'canonical MK2.EXE, synthetic offline queue scenarios only'}
 # P: live slot shifting is modeled; two real records, plus synthetic copied third at DISTINCT pointer.
 alloc=Alloc();idx0=alloc.request(A);idx1=alloc.request(B)
 before=alloc.snapshot();queue_before=len(alloc.queued)
 again=alloc.request(B);assert idx1==again and len(alloc.queued)==queue_before
 alloc.release(idx0)
 C={'pointer':'synthetic_clone_of_B_at_distinct_pointer','count':64,'words':list(B['words'])}
 idx_new=alloc.request(C);after=alloc.snapshot()
 assert (idx0,idx1,idx_new)==(0,1,0) and before[1]['bank']==49 and after[1]['bank']==65
 assert [e['start'] for e in alloc.queued]==[1,49,1,65]
 assert alloc.gate==0 and alloc.pending==1
 p={'format':'mk2_o110p_palette_allocator_shift_offline_v1','status':'SOURCE_ANCHORED_HYPOTHETICAL_STATE_REPLAY',
    'exeSha256':H,'parentO110OReportSHA256':None,
    'sourceAnchors':{k:{'at':at,'hex':hx} for k,(at,hx) in ANCHORS.items() if k.startswith(('request','release'))},
    'model':{'slots':60,'recordStride':8,'firstBank':1,'freshRequestSetsPendingAndClearsDrawGate':True,
             'matchingPointerReusesHandle':True,'releaseOnZeroClearsPointerNotBank':True,
             'laterLiveBanksMayBeShiftedAndRequeued':True},
    'scenario':{'firstOriginalRecord':A['pointer'],'secondOriginalRecord':B['pointer'],
                'thirdRecordIsSyntheticDistinctPointer':True,
                'thirdRecordPixelWordsCopiedFromOriginal64':True,
                'before':before,'after':after,'returnedSlots':[idx0,idx1,again,idx_new],
                'queuedBankStarts':[e['start'] for e in alloc.queued],
                'queuedEventCount':len(replay(alloc.queued)),
                'secondRecordBankMove':[49,65],'pendingFlag':alloc.pending,'drawGate':alloc.gate},
    'observedRuntimeGameOrder':False,'paletteHandleOneAtDrawKnown':False}
 # Q: full raw search and instruction-boundary negative. Exact direct-ref list is bounded to
 # known opcode forms; other aliases/indirect accesses have not been exhausted.
 raw=[i for i in range(*CODE) if b[i:i+4]==struct.pack('<I',ZERO)]
 assert len(raw)==31 and set(raw)==READ|TEST|BIT_SET|WRITES|{FALSE}
 assert b[FALSE:FALSE+5].hex()=='e85c070000'
 refs=[{'at':i,'access':('read' if i in READ else 'test' if i in TEST else 'bit_set' if i in BIT_SET else 'write'),
        'before4':b[i-4:i].hex()} for i in raw if i!=FALSE]
 qq={'format':'mk2_o110q_palette_zero_global_operand_census_v1','status':'SOURCE_ANCHORED_BYTE_CENSUS',
     'exeSha256':H,'globalAddress':ZERO,'sourceCodeRange':list(CODE),
     'allRawFourByteOccurrences':raw,'directInstructionOperandCount':30,
     'categorizedDirectRefs':refs,'counts':{'read':len(READ),'test':len(TEST),'bit_set':len(BIT_SET),'write':len(WRITES)},
     'falsePositive':{'at':FALSE,'encoding':'e85c070000','isCallTo':0x9a36b,'notMemoryAccess':True},
     'allIndirectOrAliasedReferencesKnown':False,'livePaletteZeroColorKnown':False}
 for suffix,report in [('o',o),('p',p),('q',qq)]:
  path=a.out/('MK2_O110'+suffix.upper()+'.json')
  if suffix=='p':report['parentO110OReportSHA256']=digest((a.out/'MK2_O110O.json').read_bytes())
  path.write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'passes':['O110O','O110P','O110Q'],'queueWrites':len(events),
                   'relocatedBank':[49,65],'rawHits':len(raw),'directMemoryRefs':len(refs),
                   'outputs':str(a.out)}))
if __name__=='__main__':main()
