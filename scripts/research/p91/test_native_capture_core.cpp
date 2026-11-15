// Original-free verification of P91 source SHA and relocation logic.
#include "native_capture_core.hpp"
#include <cassert>
#include <cstdio>
#include <vector>
using namespace mkext_p91;

int main() {
    const uint8_t abc[]={'a','b','c'};
    assert(hash256(nullptr,0) ==
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    assert(hash256(abc,sizeof(abc)) ==
        "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    std::vector<uint8_t> million(1000000,'a');
    assert(hash256(million.data(),million.size()) ==
        "cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0");
    for (size_t n: {size_t(1),size_t(55),size_t(56),size_t(63),size_t(64),size_t(65)}) {
        std::vector<uint8_t> raw(n,0x91u);
        Hash256 a,b;
        a.update(raw.data(),n);
        for (uint8_t v:raw) b.update(&v,1);
        assert(a.hex()==b.hex());
    }
    const Reloc reloc[]={{2,0x1234},{9,0x5678}};
    std::vector<uint8_t> raw(14,0xA5u);
    raw[2]=0x44;raw[3]=0x23;raw[4]=0x00;raw[5]=0x00;
    raw[9]=0x88;raw[10]=0x67;raw[11]=0x00;raw[12]=0x00;
    std::vector<uint8_t> masked=raw;
    for (const Reloc &r:reloc)
        for (unsigned j=0;j<4;++j)masked[r.offset+j]=0;
    const std::string expected=hash256(masked.data(),masked.size());
    Window example={"synthetic",10,14,reloc,2,expected.c_str()};
    assert(validate_window(example,raw,0x1110u));
    raw[0]^=1;
    assert(!validate_window(example,raw,0x1110u));
    raw[0]^=1;
    raw[11]^=1;
    assert(!validate_window(example,raw,0x1110u));
    raw[11]^=1;
    assert(!validate_window(example,raw,0x1111u));
    assert(!within_ram(999,2,1000));
    assert(within_ram(998,2,1000));
    assert(!within_ram(UINT32_MAX,8,UINT64_MAX));
    assert(!within_ram(10,0,1000));
    assert(!within_ram(UINT64_MAX,10,UINT64_MAX));
    unsigned count=0;
    for (const Window &w:windows) count+=w.relocationCount;
    assert(count==12 && windows[0].object1Offset==21500);
    std::puts("P91_NATIVE_SOURCE_MAPPING=PASS (SHA256, 12 relocations, bounds)");
}
