"""Read-only physical-offset disassembly helper for the authentic MK3 fixture."""
import sys, struct, re
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / '.tools'))
from capstone import Cs, CS_ARCH_X86, CS_MODE_32
b = Path(sys.argv[1]).read_bytes()
md = Cs(CS_ARCH_X86, CS_MODE_32)
if sys.argv[2] == 'strings':
    for sp in [int(s, 0) for s in sys.argv[3:]]:
        val = sp - 0x12b454
        hits = [m.start() for m in re.finditer(re.escape(struct.pack('<I',val)),b)]
        print('string', hex(sp), 'data offset', hex(val), 'refs', [hex(x) for x in hits])
        for p in hits:
            for i in md.disasm(b[p-32:p+40],p-32): print(f'{i.address:08x}: {i.mnemonic:8} {i.op_str}')
else:
    p = int(sys.argv[2],0); n = int(sys.argv[3],0)
    for i in md.disasm(b[p:p+n],p): print(f'{i.address:08x}: {i.mnemonic:8} {i.op_str}')
