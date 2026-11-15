"""Independent P90 original-instruction replay; never imports candidate parser.

Runs the bounded original initializer instruction subset against private
Object-2 memory. This is static symbolic execution, NOT original DOS runtime.
"""
import argparse,hashlib,json,struct
from pathlib import Path
SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
BASE=0xa0c54
def need(x,m):
    if not x:raise ValueError('P90 independent: '+m)
def signed(x,bits=32):return (x&((1<<bits)-1))-(1<<bits) if x&(1<<(bits-1)) else x&((1<<bits)-1)

def replay(code, data, root, *, start=0x81f60, stop=0x81fa6, budget=800):
    """Small fail-closed x86 instruction interpreter, separate from pair parser.

    Registers/pointers are Object-2 relative. Code PC is on-disk Object-1
    physical; immediate pointers in this exact subset all target Object-2.
    Only data writes go to an in-memory overlay; original bytes never change.
    """
    r={'a':root+0x1c,'b':0,'d':0};mem={};stack=[];pc=start;equal=False;trace=[];centers=[];center_setup=None
    def u(p):return struct.unpack_from('<I',code,p)[0]
    def read(a):
        if a in mem:return mem[a]
        need(0<=a<=len(data)-4,'uninitialized virtual read '+hex(a))
        return struct.unpack_from('<I',data,a)[0]
    def write(a,v):need(0<=a<0x100000,'bounded mutable address');mem[a]=v&0xffffffff
    for _ in range(budget):
      if pc==stop:
        need(not stack,'stack imbalance');return mem,trace,r,centers
      trace.append(pc); op=code[pc:pc+2]
      if op==b'\x8b\x18':r['b']=read(r['a']);pc+=2
      elif op==b'\x8b\x10':r['d']=read(r['a']);pc+=2
      elif op==b'\x8b\x15':r['d']=read(u(pc+2));pc+=6
      elif op==b'\x83\xc0':r['a']=(r['a']+code[pc+2])&0xffffffff;pc+=3
      elif op==b'\x83\xc3':r['b']=(r['b']+code[pc+2])&0xffffffff;pc+=3
      elif op==b'\x89\x15':write(u(pc+2),r['d']);pc+=6
      elif op==b'\x89\x13':write(r['b'],r['d']);pc+=2
      elif op==b'\x89\x03':write(r['b'],r['a']);pc+=2
      elif op==b'\x89\x18':
        write(r['a'],r['b'])
        centers.append({'setupObject2':center_setup,'channelObject2':r['a'],'initialInteger':signed(r['b'])>>16});pc+=2
      elif op==b'\x83\x3d':equal=read(u(pc+2))==(signed(code[pc+6],8)&0xffffffff);pc+=7
      elif op==b'\x81\xeb':r['b']=(r['b']-u(pc+2))&0xffffffff;pc+=6
      elif op==b'\xd1\xeb':r['b']>>=1;pc+=2
      elif code[pc:pc+3]==b'\x0f\xbf\x1b':
        center_setup=r['b'];r['b']=signed(read(r['b'])&65535,16)&0xffffffff;pc+=3
      elif code[pc:pc+3]==b'\xc1\xe3\x10':r['b']=(r['b']<<16)&0xffffffff;pc+=3
      elif op==b'\x85\xdb':equal=r['b']==0;pc+=2
      elif op==b'\xf7\xc3':equal=(r['b']&u(pc+2))==0;pc+=6
      elif code[pc]==0xa1:r['a']=read(u(pc+1));pc+=5
      elif code[pc]==0x52:stack.append(r['d']);pc+=1
      elif code[pc]==0x5a:need(bool(stack),'empty stack');r['d']=stack.pop();pc+=1
      elif code[pc]==0x50:stack.append(r['a']);pc+=1
      elif code[pc]==0x58:need(bool(stack),'empty stack');r['a']=stack.pop();pc+=1
      elif code[pc] in (0x74,0x75,0xeb):
        take=code[pc]==0xeb or (equal if code[pc]==0x74 else not equal)
        pc=pc+2+(signed(code[pc+1],8) if take else 0)
      else:raise ValueError('P90 independent: unsupported opcode '+hex(pc)+' '+code[pc:pc+8].hex())
    raise ValueError('P90 independent: instruction budget exceeded')

def verify(b, report):
    need(hashlib.sha256(b).hexdigest()==SHA,'noncanonical executable')
    need(report['schema']=='mk2_p90_root_layout_static_v1' and report['status']=='PASS_STATIC_ROOT_LAYOUT','schema/status')
    need(report['sourceExeSha256']==SHA and report['classificationScope']=='ORIGINAL_STATIC_DATAFLOW_ONLY','source classification')
    for field in ('runtimeObserved','completeStageReconstruction','nativePaletteAllocationVerified','nativeAnimationTimingVerified'):
        need(report[field] is False,'unsupported claim '+field)
    need(report['cameraPositionsObserved']==0,'invented camera observation')
    data=b[BASE:]; rows=report['records'];need(len(rows)==9,'three stages x three modes')
    checks=0;coverage=set();modes={'mode_equals_2':0x15bec,'mode_equals_1':0x15c68,'mode_other':0x15ce4}
    def eq(a,z,m):
        nonlocal checks
        need(a==z,m);checks+=1
    def u(p):return struct.unpack_from('<I',data,p)[0]
    for row in rows:
      idx={'tomb':1,'portal':7,'tower':3}[row['stage']];mode=row['mode'];key=(idx,mode)
      need(key not in coverage,'duplicate stage/mode');coverage.add(key)
      root=u(modes[mode]+4*idx);eq(row['rootObject2'],root,'mode table root')
      eq(row['stageIndex'],idx,'stage index')
      memory,trace,registers,centers=replay(b,data,root)
      eq(row['endExclusiveObject2'],registers['a'],'instruction-replayed end boundary')
      eq(row['centerOverrides'],centers,'instruction-replayed setup to channel centers')
      eq(row['headerSignedWords'],list(struct.unpack_from('<6h',data,root+4)),'root header')
      eq(row['initialDefaultHorizontalInteger'],struct.unpack_from('<h',data,root+10)[0],'initial horizontal')
      bindings=row['setupBindings'];eq(len(bindings),6,'six assigned slots')
      for i,a in enumerate(bindings):
        slot=0x77453+4*i; value=memory[slot]
        eq(a['slotObject2'],slot,'slot identity')
        if value==1:eq(a['kind'],'disabled_sentinel','sentinel');eq(a['value'],1,'sentinel value')
        else:
          eq(a['kind'],'setup_pair','pair');eq(a['entryObject2'],value,'ADDRESS stored, not first DWORD')
          setup=u(value);eq(a['setupObject2'],setup,'setup pointer')
          eq(a['originSignedXY'],list(struct.unpack_from('<hh',data,value+4)),'origin')
          eq(a['size'],list(struct.unpack_from('<HH',data,setup)),'dimensions')
          eq(a['controlCount'],struct.unpack_from('<H',data,setup+4)[0],'controls')
        mask,vertical,horizontal,table_slot=struct.unpack_from('<4I',data,0x15b68+16*i)
        eq(table_slot,slot,'update table slot');eq(a['selectionMaskObject2'],mask,'selection mask')
        eq(a['verticalAccumulatorObject2'],vertical,'vertical source');eq(a['horizontalAccumulatorObject2'],horizontal,'horizontal source')
        expected=signed(memory.get(horizontal,row['initialDefaultHorizontalInteger']<<16))>>16
        eq(a['initialHorizontalInteger'],expected,'instruction-replayed center')
        eq(a['objectListHeadObject2'],0x84350-4*i,'updater list head')
        if value!=1:
          x,y=struct.unpack_from('<hh',data,value+4)
          eq(a['initialOriginMinusHorizontal'],[x-expected,y],'conditional projection')
          eq(a['projectionQualification'],'CONDITIONAL_SOURCE_ARITHMETIC_NOT_OBSERVED_VIEWPORT','projection qualification')
      eq({c['channelObject2']:c['initialInteger'] for c in row['centerOverrides']},
         {a:signed(v)>>16 for a,v in memory.items() if 0x84310<=a<=0x84330},'all center writes')
      for c in row['centerOverrides']:
        eq(c['initialInteger'],(struct.unpack_from('<h',data,c['setupObject2'])[0]>>1)-159,'center setup width')
      # Independently parse only the draw stream, without importing producer.
      p=u(root+0x18);ops=[]
      for _ in range(128):
        t=signed(u(p));site=p;p+=4
        if t==0:break
        if t>0:ops.append({'opcode':'positive_pair','object2Offset':site,'tokenPointerObject2':t,'payloadPointerObject2':u(p)});p+=4
        elif t==-1:ops.append({'opcode':'minus_one_draw','object2Offset':site,'sourcePointerObject2':u(p),'rawParameter2':u(p+4),'rawParameter3':u(p+8)});p+=12
        else:need(t==-2,'unknown command');ops.append({'opcode':'other_negative','object2Offset':site,'signedToken':t})
      else:raise ValueError('P90 independent: unterminated draw list')
      eq(row['drawCommands'],ops,'original draw order')
      end=row['endExclusiveObject2'];need(root<end<=len(data),'root span bounds')
      eq(row['rootSpanSha256'],hashlib.sha256(data[root:end]).hexdigest(),'root span hash')
    for span in report['sourceCodeSpans']:
      a,z=span['physicalStart'],span['physicalEndExclusive'];eq(span['sha256'],hashlib.sha256(b[a:z]).hexdigest(),'instruction span digest')
    return {'status':'PASS_P90_INDEPENDENT_STATIC_REPLAY','assertions':checks,'stageModeCases':len(coverage),
       'method':'BOUNDED_ORIGINAL_X86_INITIALIZER_SUBSET_INTERPRETATION','originalGameExecuted':False,'fullStageVerified':False}

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--exe',required=True,type=Path);p.add_argument('--report',required=True,type=Path);a=p.parse_args()
    print(json.dumps(verify(a.exe.read_bytes(),json.loads(a.report.read_text(encoding='utf-8'))),indent=2))

