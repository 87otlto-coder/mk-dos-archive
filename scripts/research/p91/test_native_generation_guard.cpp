// Original-free native C++14 protocol tests. No emulator or commercial assets.
#include "native_generation_guard.hpp"
#include <cassert>
#include <cstdio>
#include <functional>
using namespace mkext_p91;

Event sample(uint64_t serial) {
    Event e;
    e.serial = serial;
    e.object1LinearBase = 0x100000;
    e.object2LinearBase = 0x200000;
    e.operandBias = 0x180000;
    e.csBase = 0x1000;
    e.dsBase = 0x2000;
    e.stage = 1;
    e.mode = 2;
    e.controlStream = e.operandBias + 0x17300u;
    e.renderGate = 1;
    e.drawBuffer = e.operandBias + 0x56524u;
    e.lastPresentedBuffer = e.drawBuffer;
    e.protected32 = true;
    e.noPaging = true;
    e.hasObjects = true;
    e.hasReturnStack = true;
    e.expectedReturnOffset = e.object1LinearBase - e.csBase + (0x670ddu - 0x61c54u);
    e.observedReturnOffset = e.expectedReturnOffset;
    e.hasDac = true;
    e.dacBits = 6;
    e.pelMask = 255;
    e.hasAperture = true;
    e.buffer.fill(17);
    e.aperture = e.buffer;
    e.dac.fill(31);
    e.paletteSlots.fill(2);
    return e;
}

bool sequence(const std::function<void(Event&,Event&,Event&,Event&)>& mutate,
              bool gateOff = false) {
    Event a=sample(1), b=sample(2), c=sample(5), d=sample(7);
    d.drawBuffer += 0xfa00u; // post-present selected next buffer
    d.returnWitnessSerial=6;
    d.returnWitnessLinear=c.csBase+c.observedReturnOffset;
    mutate(a,b,c,d);
    Guard g;
    if (!g.observe(Phase::DrawEntry,a)) return false;
    if (!g.observe(Phase::DrawComplete,b)) return false;
    if (gateOff) {
        Event off=sample(3), offRet=sample(4);
        off.renderGate=0; offRet.renderGate=0;
        off.buffer.fill(99); offRet.buffer.fill(99);
        if (!g.observe(Phase::DrawEntry,off)) return false;
        if (!g.observe(Phase::DrawComplete,offRet)) return false;
    }
    if (!g.observe(Phase::PresentEntry,c)) return false;
    if (!g.observe(Phase::PostPresent,d)) return false;
    return g.status()==Status::Accepted;
}

int main() {
    auto noop=[](Event&,Event&,Event&,Event&){};
    assert(sequence(noop));
    assert(sequence(noop,true));
    assert(!sequence([](Event&,Event&,Event& c,Event&){c.buffer[0]^=1;}));
    assert(!sequence([](Event&,Event&,Event& c,Event&){c.paletteSlots[0]^=1;}));
    assert(!sequence([](Event&,Event&,Event& c,Event&){c.expectedReturnOffset++;}));
    assert(!sequence([](Event&,Event&,Event& c,Event&){
        c.expectedReturnOffset++; c.observedReturnOffset++;
    }));
    assert(!sequence([](Event&,Event&,Event& c,Event&){c.alternatePresentation=1;}));
    assert(!sequence([](Event&,Event&,Event&,Event& d){d.aperture[0]^=1;}));
    assert(!sequence([](Event&,Event&,Event&,Event& d){d.dac[0]^=1;}));
    assert(!sequence([](Event&,Event&,Event&,Event& d){d.pelMask=0;}));
    assert(!sequence([](Event&,Event&,Event&,Event& d){d.returnWitnessSerial=0;}));
    assert(!sequence([](Event& a,Event&,Event&,Event&){a.stage=2;}));
    assert(!sequence([](Event& a,Event&,Event&,Event&){a.noPaging=false;}));
    assert(!sequence([](Event& a,Event&,Event&,Event&){a.hasObjects=false;}));
    assert(!sequence([](Event&,Event& b,Event&,Event&){b.object2LinearBase++;}));
    assert(!sequence([](Event&,Event&,Event& c,Event&){c.drawBuffer++;}));
    assert(!sequence([](Event&,Event&,Event& c,Event&){c.hasDac=false;}));
    assert(!sequence([](Event&,Event&,Event&,Event& d){d.hasAperture=false;}));
    assert(!sequence([](Event&,Event&,Event&,Event& d){d.lastPresentedBuffer++;}));
    Guard missing;
    Event wait=sample(1); wait.returnWitnessSerial=1;
    assert(!missing.observe(Phase::PostPresent,wait));
    assert(missing.status()==Status::Refused);
    Guard monotonic;
    assert(monotonic.observe(Phase::DrawEntry,sample(1)));
    assert(!monotonic.observe(Phase::DrawComplete,sample(1)));
    std::puts("P91_NATIVE_GENERATION_GUARD=PASS (21 original-free cases)");
}
