"""P91 relocation-aware mapping, bracketed collector and private snapshot contract.

This is a tested collector/oracle with a backend interface, NOT a verified
DOSBox runtime adapter. It never launches the game or guesses loaded bases.
"""
import hashlib,json,struct
from pathlib import Path

def need(ok,why):
    if not ok:raise ValueError('P91 snapshot: '+why)
def sha(b):return hashlib.sha256(b).hexdigest()
def u32(b,p):return struct.unpack_from('<I',b,p)[0]

def resolve_mapping(plan, instruction_linear, cs_base, ds_base, read):
    entry=next(w for w in plan['windows'] if w['name']=='frame_entry')
    code=instruction_linear-entry['object1Offset']
    operand=u32(read(instruction_linear+plan['mapping']['dataOperandByteOffset'],4),0)
    bias=operand-plan['mapping']['dataOperandTargetObject2']
    need(code>=cs_base>=0 and bias>=0 and ds_base>=0,'mapping underflow')
    mapping={'object1LinearBase':code,'object2LinearBase':ds_base+bias,
      'nearCodeOffsetBias':code-cs_base,'object2OperandBias':bias,'csBase':cs_base,'dsBase':ds_base}
    evidence=[]
    for w in plan['windows']:
      raw=read(code+w['object1Offset'],w['length']);need(len(raw)==w['length'],'short code read')
      masked=bytearray(raw)
      for r in w['relocations']:
        need(r['targetObject']==2,'unsupported Object1 relocation domain; do not guess data-pointer semantics')
        p=r['byteOffset'];expected=bias+r['targetOffset']
        need(u32(raw,p)==expected,'inconsistent relocated operand '+w['name'])
        masked[p:p+4]=b'\0'*4
      need(sha(masked)==w['maskedSha256'],'code fingerprint '+w['name'])
      evidence.append({'name':w['name'],'linear':code+w['object1Offset'],'rawSha256':sha(raw),'maskedSha256':sha(masked)})
    return dict(mapping,codeEvidence=evidence)

def decode_state(plan,mapping,data):
    need(len(data)==plan['objects'][1]['virtualSize'],'complete Object2 virtual image required')
    state={};fields=plan['stateObject2'];bias=mapping['object2OperandBias']
    for name,offset in fields.items():
      if type(offset) is int:state[name]=u32(data,offset)
    state['horizontalAccumulators']=[u32(data,p) for p in fields['horizontalAccumulators']]
    state['cameraHighWordSigned']=struct.unpack_from('<h',data,0x8432e)[0]
    state['paletteSlots']=[]
    spec=fields['paletteSlots']
    for i in range(spec['count']):
      p=spec['offset']+spec['stride']*i
      state['paletteSlots'].append({'handle':i,'recordPointerRaw':u32(data,p),
        'referenceWord':struct.unpack_from('<H',data,p+4)[0],'dacStartByte':data[p+6],'raw8Hex':data[p:p+8].hex()})
    lists=[];nodes={}
    for head in fields['listHeads']:
      ptr=u32(data,head);seen=set();order=[]
      for _ in range(1024):
        if ptr==0:break
        need(ptr not in seen,'cyclic object list');seen.add(ptr);offset=ptr-bias
        need(0<=offset<=len(data)-0x58,'object outside captured Object2; external block capture required')
        raw=data[offset:offset+0x58];order.append(ptr)
        if ptr not in nodes:
          node={'pointerRaw':ptr,'object2Offset':offset,'raw88Sha256':sha(raw)}
          for name,pos in plan['renderObject'].items():
            if name!='bytes':node[name]=struct.unpack_from('<H',raw,pos)[0] if name in ('paletteHandle','clipFlags') else u32(raw,pos)
          nodes[ptr]=node
        ptr=u32(raw,0)
      else:raise ValueError('P91 snapshot: object budget exceeded')
      lists.append({'headObject2Offset':head,'headPointerRaw':u32(data,head),'order':order})
    state['orderedLists']=lists;state['objects']=list(nodes.values())
    return state

def target(plan,mapping,state):
    t=plan['target']
    return state['stage']==t['stage'] and state['mode']==t['mode'] and state['controlStream']==mapping['object2OperandBias']+t['controlStreamObject2']

class Collector:
    """Backend calls four methods synchronously between guest instructions.

    Every phase contains full Object2, its selected 64000-byte native buffer,
    the observed mapping, monotonically increasing instruction serial and PC.
    Ready/post also contain the emulator's 768 raw DAC bytes + DAC format and
    CPU aperture bytes. A gate-off draw never overwrites the last generation.
    """
    def __init__(self,plan):self.plan=plan;self.pending=None;self.generated=None;self.ready=None;self.completed=None;self.sequence=0
    def check(self,s,boundary):
      need(s['boundary']==boundary,'wrong event boundary')
      need(type(s['instructionSerial']) is int and s['instructionSerial']>self.sequence,'non-monotonic instruction event')
      self.sequence=s['instructionSerial']
      need(s['memoryReadPolicy']=='NO_PAGING_BOUNDED_RAM' and s['protected32'] is True,'unsupported memory access context')
      m=s['mapping'];w=next(w for w in self.plan['windows'] if w['name']==boundary)
      need(s['instructionLinear']==m['object1LinearBase']+w['object1Offset'],'boundary address translation')
      regs=s['cpuRegisters']
      required={'eax','ebx','ecx','edx','esi','edi','ebp','esp','eip','eflags','cs','ds','es','ss','ssBase','cr0','cr3'}
      need(set(regs)>=required and all(type(regs[k]) is int and 0<=regs[k]<=0xffffffff for k in required),'incomplete CPU context')
      need(regs['eip']+m['csBase']==s['instructionLinear'] and regs['cr0']&1 and not regs['cr0']&0x80000000,'CPU/mapping/paging disagreement')
      need(len(s['object1'])==self.plan['objects'][0]['virtualSize'],'complete Object1 image required')
      need(len(m.get('codeEvidence',[]))==len(self.plan['windows']),'missing mapping evidence')
      # Rebind from private raw code reads at every retained phase. A previous
      # mapping assertion or a textual "verified" flag is not enough.
      def read_code(a,n):
        for i,window in enumerate(self.plan['windows']):
          base=m['object1LinearBase']+window['object1Offset'];raw=s['codeWindow'+str(i)]
          need(raw==s['object1'][window['object1Offset']:window['object1Offset']+len(raw)],'Object1/window disagreement')
          if base<=a and a+n<=base+len(raw):return raw[a-base:a-base+n]
        raise ValueError('P91 snapshot: code-window read not captured')
      start=m['object1LinearBase']+next(w['object1Offset'] for w in self.plan['windows'] if w['name']=='frame_entry')
      need(resolve_mapping(self.plan,start,m['csBase'],m['dsBase'],read_code)==m,'phase mapping does not reproduce')
      need(len(s['buffer'])==64000,'framebuffer length')
      state=decode_state(self.plan,m,s['object2'])
      need(target(self.plan,m,state),'not Tomb mode 2 rooted stream')
      need(s['bufferPointerRaw']==state['drawBuffer'] if boundary!='scheduler_entry' else True,'buffer pointer/state mismatch')
      return state
    def draw_entry(self,s):
      state=self.check(s,'draw_entry')
      if state['renderGate']&1:
        need(any(x['order'] for x in state['orderedLists']),'empty render lists')
        self.pending=s;self.generated=None;self.ready=None
      else:self.pending=None
    def draw_ret(self,s):
      state=self.check(s,'draw_ret')
      if not self.pending:return
      p=self.pending
      need(s['mapping']==p['mapping'] and s['bufferPointerRaw']==p['bufferPointerRaw'],'draw changed mapping/buffer')
      need(state['renderGate']&1,'draw gate changed before renderer return')
      self.generated={'entry':p,'rendered':s};self.pending=None
    def present_entry(self,s):
      state=self.check(s,'present_entry');need(self.generated is not None,'presentation without captured draw generation')
      g=self.generated;r=g['rendered']
      need(s['mapping']==r['mapping'] and s['bufferPointerRaw']==r['bufferPointerRaw'],'presentation source changed')
      need(s['buffer']==r['buffer'],'buffer changed between draw completion and presentation')
      need(u32(s['object2'],0x75cee)==0,'alternate fixed-buffer presentation unsupported')
      need(len(s['presentReturnStack'])==4,'missing observed presentation return stack')
      need(s['returnStackLinear']==s['cpuRegisters']['ssBase']+s['cpuRegisters']['esp'],'return stack address disagreement')
      return_physical=0x670b1 if u32(s['object2'],0x563e0) else 0x670dd
      need(u32(s['presentReturnStack'],0)==s['mapping']['nearCodeOffsetBias']+return_physical-0x61c54,'presentation called outside supported frame path')
      bias=s['mapping']['object2OperandBias']
      need(s['bufferPointerRaw'] in (bias+0x56524,bias+0x65f24),'unexpected native drawing buffer')
      need(len(s['dac'])==768 and s['dacBits'] in (6,8),'DAC state')
      # Raster palette handles must not silently be paired with a later allocation.
      a=g['entry']['object2'][0x75b00:0x75b00+60*8]
      need(a==s['object2'][0x75b00:0x75b00+60*8],'palette allocation changed since draw entry')
      self.ready=s
    def scheduler_entry(self,s):
      state=self.check(s,'scheduler_entry');need(self.ready is not None,'scheduler wait is not presentation proof')
      p=self.ready;r=self.generated['rendered']
      need(s['mapping']==p['mapping'],'mapping changed across presentation')
      witness=s['presentationReturnWitness'];expected=s['mapping']['csBase']+u32(p['presentReturnStack'],0)
      need(witness['instructionLinear']==expected and p['instructionSerial']<witness['instructionSerial']<=s['instructionSerial'],'missing matching presentation return event')
      need(state['lastPresentedBuffer']==p['bufferPointerRaw'],'presented source global mismatch')
      need(len(s['aperture'])==64000 and s['aperture']==r['buffer'],'presented aperture differs from captured draw')
      need(s['dac']==p['dac'] and s['dacBits']==p['dacBits'] and s['pelMask']==p['pelMask'],'DAC changed during presentation')
      self.completed={'drawEntry':self.generated['entry'],'drawComplete':r,'presentEntry':p,'postPresent':s}
      return self.completed

def save_private(plan,phases,path,*,input_fingerprints,adapter_identity):
    """Only completed collector output; exclusive new private directory/files."""
    out=Path(path).resolve();base=Path(r'F:\Dev\MKEXT\FIXTURES\VALIDATION').resolve()
    need(out.is_relative_to(base) and out!=base and not out.exists(),'new canonical private directory required')
    need(set(phases)=={'drawEntry','drawComplete','presentEntry','postPresent'},'incomplete collector output')
    need(input_fingerprints==plan['requiredOriginalFingerprints'],'observed original fingerprints required')
    need(set(adapter_identity)>={'upstreamCommit','patchSha256','executableSha256','core','pagingEnabled'},'adapter build identity incomplete')
    need(adapter_identity['core']=='normal' and adapter_identity['pagingEnabled'] is False,'unsupported adapter/core')
    collector=Collector(plan);collector.draw_entry(phases['drawEntry']);collector.draw_ret(phases['drawComplete'])
    collector.present_entry(phases['presentEntry']);collector.scheduler_entry(phases['postPresent'])
    manifest={'schema':'mk2_p91_native_snapshot_v1','classification':'VALIDATION PENDING','nativeGameVerified':False,
      'planSha256':sha(json.dumps(plan,sort_keys=True,separators=(',',':')).encode()),'sourceExeSha256':plan['sourceExeSha256'],
      'originalInputFingerprints':input_fingerprints,'adapterIdentity':adapter_identity,
      'phases':{},'files':[],'scanoutVerified':False}
    blobs={}
    for phase,s in phases.items():
      meta={k:v for k,v in s.items() if not isinstance(v,bytes)}
      meta['decodedState']=decode_state(plan,s['mapping'],s['object2'])
      for key,value in s.items():
        if isinstance(value,bytes):
          name=phase+'-'+key+'.bin';blobs[name]=value;meta[key+'File']=name
          manifest['files'].append({'path':name,'bytes':len(value),'sha256':sha(value)})
      manifest['phases'][phase]=meta
    out.mkdir()
    for name,value in blobs.items():
      with (out/name).open('xb') as f:f.write(value)
    with (out/'manifest.json').open('x',encoding='utf-8') as f:json.dump(manifest,f,indent=2)
    return manifest
