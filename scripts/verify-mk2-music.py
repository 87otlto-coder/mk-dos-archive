"""Compare converted events against isolated original GMI.BIN sequence interpreter."""
import sys,json,struct,hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[1];sys.path.insert(0,str(root/'.tools'))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
driver=(root.parent/'fixtures/mk2/gmi.bin').read_bytes()
songs=json.loads((root/'evidence/mk2-music.json').read_text());failures=[];passed=0
for song in songs:
    source=(root.parent/'fixtures/mk2/sound'/song['name']).read_bytes()
    for track in song['tracks']:
        uc=Uc(UC_ARCH_X86,UC_MODE_16);uc.mem_map(0,0x10000);uc.mem_write(0,driver);uc.mem_write(0x3000,source)
        uc.mem_write(0x8a,b'\0'*23);uc.mem_write(0x1ac0,struct.pack('<H',0x3000));uc.mem_write(0x22a,b'\1\0')
        # Original initializer at 0x43E reads one song track pointer.
        uc.mem_write(0xef00,struct.pack('<H',track['start']));uc.reg_write(UC_X86_REG_SI,0xef00);uc.reg_write(UC_X86_REG_DI,0x8a)
        actual=[];tick=0;looped=False
        def ret():
            sp=uc.reg_read(UC_X86_REG_SP);ip=struct.unpack('<H',uc.mem_read(sp,2))[0];uc.reg_write(UC_X86_REG_SP,sp+2);uc.reg_write(UC_X86_REG_IP,ip)
        def hook(u,address,size,user):
            nonlocal_dummy=None
            global looped
            if address==0x795:actual.append({'tick':tick,'data':[u.reg_read(UC_X86_REG_AL)]});ret()
            elif address==0x79e:actual[-1]['data'].append(u.reg_read(UC_X86_REG_AL));ret()
            elif address==0x664:ret() # Tempo command only updates hardware scheduler; logical ticks checked here.
            elif address==0x3ad:looped=True;u.emu_stop()
        uc.hook_add(UC_HOOK_CODE,hook)
        def call(address):
            uc.reg_write(UC_X86_REG_SP,0xf000);uc.mem_write(0xf000,struct.pack('<H',0xff00));uc.emu_start(address,0xff00,count=1000000)
        try:
            call(0x43e)
            for tick in range(track['ticks']+2):
                call(0x2fa)
                if looped or not uc.mem_read(0x94,1)[0]:break
            expected=[{'tick':e['tick'],'data':e['data']} for e in song['events'] if e['track']==track['track']]
            assert actual==expected,f'MIDI mismatch expected {len(expected)} got {len(actual)}; first mismatch '+str(next(((a,b) for a,b in zip(actual,expected) if a!=b),None))
            assert tick==track['ticks'],f'End tick mismatch {tick}'
            assert looped==track['looped'],'Loop mismatch'
            passed+=1
        except Exception as e:failures.append({'song':song['name'],'track':track['track'],'error':str(e)})
result={'method':'Original GMI.BIN x86-16 routines 0x43E and 0x2FA executed in Unicorn. MIDI output captured at 0x795/0x79E. Compare every emitted event byte, event tick, ending tick and loop boundary. Hardware tempo scheduling not emulated.','driverSha256':hashlib.sha256(driver).hexdigest(),'songs':len(songs),'tracksPassed':passed,'failures':failures}
(root/'evidence/mk2-music-emulation.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2)[:5000]);sys.exit(bool(failures))
