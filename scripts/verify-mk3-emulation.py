"""Replay authentic MK3 x86 decompressor, comparing independent CPU output to TS output."""
import sys,json,hashlib,struct,time
from pathlib import Path
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'.tools'))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_32
from unicorn.x86_const import UC_X86_REG_EAX,UC_X86_REG_EBX,UC_X86_REG_ECX,UC_X86_REG_EDX,UC_X86_REG_ESP
fixtures=root.parent/'fixtures'/'mk3'
exe=(fixtures/'MK3.EXE').read_bytes()
cases=json.loads((root/'evidence/mk3-emulation-cases.json').read_text())
uc=Uc(UC_ARCH_X86,UC_MODE_32)
uc.mem_map(0,0x800000)
uc.mem_write(0xD1BD4,exe[0xD1BD4:0xD2B17])
files={};failures=[];start=time.time()
for i,c in enumerate(cases):
    b=files.setdefault(c['file'],(fixtures/c['file']).read_bytes())
    src=b[c['offset']:c['offset']+c['length']]
    uc.mem_write(0x200000,src+b'\0'*16)
    uc.mem_write(0x400000,b'\xCD'*(c['expandedSize']+16))
    uc.mem_write(0x700000,struct.pack('<I',0x7F0000))
    for reg,value in [(UC_X86_REG_EAX,0x200000),(UC_X86_REG_EBX,0x400000),(UC_X86_REG_ECX,c['depth']),(UC_X86_REG_EDX,c['expandedSize']),(UC_X86_REG_ESP,0x700000)]:uc.reg_write(reg,value)
    try:
        uc.emu_start(0xD1BD4,0x7F0000,count=20000000)
        output=bytes(uc.mem_read(0x400000,c['expandedSize']))
        assert hashlib.sha256(output).hexdigest()==c['sha256'],'Expanded byte mismatch'
        assert bytes(uc.mem_read(0x400000+c['expandedSize'],16))==b'\xCD'*16,'Output overrun'
    except Exception as e:failures.append({'case':i,**c,'error':str(e)})
result={'method':'Original MK3.EXE physical 0xD1BD4 routine executed in Unicorn x86-32; register inputs from FHDS/dispatch; compare full expanded bytes SHA256 to TypeScript decoder','exeSha256':hashlib.sha256(exe).hexdigest(),'cases':len(cases),'passed':len(cases)-len(failures),'failures':failures,'seconds':round(time.time()-start,2),'scope':'Decompressor bytes and output extent only; palette ownership, gameplay sequences, and timing not tested'}
(root/'evidence/mk3-emulation-verification.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result,indent=2)[:4000])
sys.exit(bool(failures))
