"""Small original-free capture-mechanism tests; optional exact EXE mapping test."""
import argparse,copy,hashlib,struct,sys,unittest
from pathlib import Path
from snapshot import Collector,resolve_mapping,decode_state

def put(b,p,v):struct.pack_into('<I',b,p,v)
def make_plan():
    windows=[]
    for i,name in enumerate(('frame_entry','draw_entry','draw_ret','present_entry','scheduler_entry')):
      raw=bytes([0x83,0x35])+b'\0'*4+bytes([1,i])
      windows.append({'name':name,'object1Offset':0x100+i*16,'length':8,'maskedSha256':hashlib.sha256(raw).hexdigest(),
        'relocations':[{'byteOffset':2,'targetObject':2,'targetOffset':0x562d4}]})
    return {'schema':'mk2_p91_capture_plan_v1','mapping':{'dataOperandByteOffset':2,'dataOperandTargetObject2':0x562d4},
      'windows':windows,'objects':[{'virtualSize':0x40000},{'virtualSize':0x86660}],
      'target':{'stage':1,'mode':2,'controlStreamObject2':0x17300},
      'stateObject2':{'mode':0x3014c,'stage':0x7747f,'controlStream':0x75cf6,'renderGate':0x562d4,'drawBuffer':0x7662a,
        'lastPresentedBuffer':0x7662e,'horizontalAccumulators':list(range(0x84310,0x84334,4)),
        'paletteSlots':{'offset':0x75b00,'count':60,'stride':8},'listHeads':[0x84350]},
      'renderObject':{'bytes':0x58,'nextOffset':0,'xPosition':0x18,'paletteHandle':0x30,'clipFlags':0x4a}}

def fake_mapping(plan):
    memory={};code=0x200000;bias=0x300000
    for i,w in enumerate(plan['windows']):
      raw=bytearray(bytes([0x83,0x35])+b'\0'*4+bytes([1,i]));put(raw,2,bias+0x562d4)
      for j,v in enumerate(raw):memory[code+w['object1Offset']+j]=v
    def read(a,n):return bytes(memory[a+i] for i in range(n))
    return resolve_mapping(plan,code+0x100,0,0,read),memory,read

def event(plan,mapping,boundary,serial,*,gate=1,post=False):
    bias=mapping['object2OperandBias'];data=bytearray(0x86660)
    for p,v in [(0x3014c,2),(0x7747f,1),(0x75cf6,bias+0x17300),(0x562d4,gate),
      (0x7662a,bias+(0x65f24 if post else 0x56524)),(0x7662e,bias+0x56524),
      (0x84350,bias+0x767cf)]:put(data,p,v)
    result={'boundary':boundary,'instructionSerial':serial,'mapping':mapping,'protected32':True,
      'memoryReadPolicy':'NO_PAGING_BOUNDED_RAM','instructionLinear':mapping['object1LinearBase']+next(w['object1Offset'] for w in plan['windows'] if w['name']==boundary),
      'object2':bytes(data),'bufferPointerRaw':bias+(0x65f24 if post else 0x56524),
      'buffer':b'\x11'*64000,'dac':bytes([j%64 for j in range(768)]),'dacBits':6,'pelMask':255,
      'aperture':b'\x11'*64000}
    result['presentReturnStack']=struct.pack('<I',mapping['object1OperandBias']+0x670dd-0x61c54)
    result['presentationReturnWitness']={'instructionLinear':mapping['object1LinearBase']+0x670dd-0x61c54,'instructionSerial':serial}
    for i,w in enumerate(plan['windows']):
      raw=bytearray(bytes([0x83,0x35])+b'\0'*4+bytes([1,i]));put(raw,2,bias+0x562d4);result['codeWindow'+str(i)]=bytes(raw)
    return result

class Mechanism(unittest.TestCase):
    def setUp(self):self.plan=make_plan();self.mapping,self.mem,self.read=fake_mapping(self.plan)
    def run_sequence(self,mutator=None,gated_off=False):
      p=self.plan;m=self.mapping;c=Collector(p)
      events=[event(p,m,'draw_entry',1),event(p,m,'draw_ret',2),event(p,m,'present_entry',5,gate=0),event(p,m,'scheduler_entry',6,gate=0,post=True)]
      if mutator:mutator(events)
      c.draw_entry(events[0]);c.draw_ret(events[1])
      if gated_off:
        c.draw_entry(event(p,m,'draw_entry',3,gate=0));c.draw_ret(event(p,m,'draw_ret',4,gate=0))
      c.present_entry(events[2]);return c.scheduler_entry(events[3])
    def test_complete_pair_and_buffer_swap(self):
      r=self.run_sequence();self.assertNotEqual(r['drawComplete']['bufferPointerRaw'],r['postPresent']['bufferPointerRaw'])
    def test_gate_off_draw_does_not_replace_generation(self):self.assertIsNotNone(self.run_sequence(gated_off=True))
    def test_wait_alone_not_capture(self):
      with self.assertRaisesRegex(ValueError,'not presentation proof'):Collector(self.plan).scheduler_entry(event(self.plan,self.mapping,'scheduler_entry',1,post=True))
    def test_changed_buffer_refused(self):
      with self.assertRaisesRegex(ValueError,'buffer changed'):self.run_sequence(lambda e:e[2].update(buffer=b'\x22'*64000))
    def test_wrong_aperture_refused(self):
      with self.assertRaisesRegex(ValueError,'aperture differs'):self.run_sequence(lambda e:e[3].update(aperture=b'\x22'*64000))
    def test_dac_change_refused(self):
      with self.assertRaisesRegex(ValueError,'DAC changed'):self.run_sequence(lambda e:e[3].update(dac=b'\0'*768))
    def test_palette_reallocation_refused(self):
      def mutate(e):
        b=bytearray(e[2]['object2']);b[0x75b06]=99;e[2]['object2']=bytes(b)
      with self.assertRaisesRegex(ValueError,'palette allocation'):self.run_sequence(mutate)
    def test_cyclic_list_refused(self):
      e=event(self.plan,self.mapping,'draw_entry',1);b=bytearray(e['object2']);put(b,0x767cf,self.mapping['object2OperandBias']+0x767cf);e['object2']=bytes(b)
      with self.assertRaisesRegex(ValueError,'cyclic'):Collector(self.plan).draw_entry(e)
    def test_external_node_refused(self):
      e=event(self.plan,self.mapping,'draw_entry',1);b=bytearray(e['object2']);put(b,0x84350,0x999999);e['object2']=bytes(b)
      with self.assertRaisesRegex(ValueError,'external block'):Collector(self.plan).draw_entry(e)
    def test_bad_relocation_refused(self):
      a=self.mapping['object1LinearBase']+self.plan['windows'][1]['object1Offset']+2;self.mem[a]^=1
      with self.assertRaisesRegex(ValueError,'relocated'):resolve_mapping(self.plan,0x200100,0,0,self.read)
    def test_bad_code_refused(self):
      self.mem[0x200110]^=1
      with self.assertRaisesRegex(ValueError,'fingerprint'):resolve_mapping(self.plan,0x200100,0,0,self.read)
    def test_target_guard(self):
      e=event(self.plan,self.mapping,'draw_entry',1);b=bytearray(e['object2']);put(b,0x3014c,3);e['object2']=bytes(b)
      with self.assertRaisesRegex(ValueError,'not Tomb'):Collector(self.plan).draw_entry(e)

def original_mapping_test(exe,source_root):
    from capture_plan import make
    b=exe.read_bytes();plan=make(b,source_root);o1=0x61c54;code=0x210000;cs=0x1000;ds=0x2000;bias=0x310000
    memory={}
    for w in plan['windows']:
      raw=bytearray(b[w['physical']:w['physical']+w['length']])
      for r in w['relocations']:put(raw,r['byteOffset'],(code-cs if r['targetObject']==1 else bias)+r['targetOffset'])
      for i,v in enumerate(raw):memory[code+w['object1Offset']+i]=v
    def read(a,n):return bytes(memory[a+i] for i in range(n))
    mapping=resolve_mapping(plan,code+0x67050-o1,cs,ds,read)
    assert mapping['object1LinearBase']==code and mapping['object2LinearBase']==bias+ds
    return {'status':'PASS_ORIGINAL_SOURCE_RELOCATED_MAPPING_MODEL','codeWindows':len(plan['windows']),
      'relocatedOperands':sum(len(w['relocations']) for w in plan['windows']),'guestRuntimeObserved':False}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--exe',type=Path);p.add_argument('--source-root',type=Path,default=Path(__file__).resolve().parents[3]);a=p.parse_args()
    result=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(Mechanism))
    if not result.wasSuccessful():sys.exit(1)
    if a.exe:print(original_mapping_test(a.exe,a.source_root))
