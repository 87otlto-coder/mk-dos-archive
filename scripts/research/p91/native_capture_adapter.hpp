// P91 experimental normal-core native Tomb generation observer.
// INCLUDED ONLY in the isolated pinned DOSBox-X normal core overlay.
// The header is inert unless a private user capture path is explicitly armed.
// Native capture has NOT been verified against a commercial game.
#ifndef MKEXT_P91_NATIVE_CAPTURE_ADAPTER_HPP
#define MKEXT_P91_NATIVE_CAPTURE_ADAPTER_HPP
#include "mem.h"
#include "vga.h"
#include "native_capture_core.hpp"
#include "native_generation_guard.hpp"
#include <array>
#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <memory>
#include <string>
#include <vector>
#if defined(_WIN32)
#include <windows.h>
#endif

namespace mkext_p91 {

static const uint32_t OBJ1_SIZE=257688u;
static const uint32_t OBJ2_SIZE=550496u;
static const uint32_t O2_LIST_HEADS[8]={
    541500u,541504u,541508u,541512u,541516u,541528u,541520u,541536u
};

#if defined(_WIN32)
static bool exclusive_file(const std::string &name,const uint8_t *p,size_t n) {
    HANDLE file=CreateFileA(name.c_str(),GENERIC_WRITE,0,nullptr,CREATE_NEW,
                            FILE_ATTRIBUTE_NORMAL,nullptr);
    if (file==INVALID_HANDLE_VALUE) return false;
    DWORD wrote=0;
    const bool ok=n<=DWORD(-1) &&
        WriteFile(file,p,DWORD(n),&wrote,nullptr) && wrote==n;
    const bool closed=CloseHandle(file)!=0;
    if (!ok || !closed) return false; // incomplete file is never acceptance
    return true;
}
static bool exclusive_text(const std::string &name,const std::string &data) {
    return exclusive_file(name,reinterpret_cast<const uint8_t*>(data.data()),
                          data.size());
}
static bool allowed_capture_folder(const std::string &folder) {
    char full[32768]={};
    const DWORD len=GetFullPathNameA(folder.c_str(),DWORD(sizeof(full)),full,nullptr);
    if (len==0 || len>=sizeof(full)) return false;
    std::string norm(full);
    for (char &c:norm) {
        if (c=='/') c='\\';
        if (c>='a' && c<='z') c=char(c-'a'+'A');
    }
    const std::string base="F:\\DEV\\MKEXT\\FIXTURES\\VALIDATION\\P91-";
    if (norm.compare(0,base.size(),base)!=0 ||
        norm.find("..")!=std::string::npos ||
        norm.size()<=base.size()) return false;
    // Capture directory must already exist. Never make/reorganize private paths.
    const DWORD attr=GetFileAttributesA(full);
    return attr!=INVALID_FILE_ATTRIBUTES && (attr&FILE_ATTRIBUTE_DIRECTORY);
}
#endif

static bool native_ram_read(uint32_t address,size_t size,uint8_t *dst) {
    if (PAGING_Enabled() || !dst) return false;
    const uint64_t limit=uint64_t(MEM_TotalPages())*4096ull;
    if (!within_ram(address,size,limit)) return false;
    MEM_BlockRead((LinearPt)address,dst,(Bitu)size);
    return true;
}

static bool read_dword(uint64_t addr,uint32_t &value) {
    if (addr>UINT32_MAX) return false;
    uint8_t b[4]={};
    if (!native_ram_read(uint32_t(addr),4,b)) return false;
    value=load32(b);
    return true;
}

struct PhaseData {
    std::unique_ptr<Event> event;
    std::vector<uint8_t> object1;
    std::vector<uint8_t> object2;
    std::array<uint32_t,17> cpuRegisters{};
    std::array<uint32_t,8> vgaRegisters{};
    std::array<uint8_t,4> returnStack{};
    uint32_t returnStackLinear=0;
    uint32_t returnOpcodeLinear=0;
    uint64_t returnOpcodeSerial=0;
    uint32_t returnOpcode=0;
    uint32_t returnEspBefore=0,returnEspAfter=0;
    uint32_t returnStackBefore=0,returnSsBaseBefore=0;
};

static bool read_object_lists(const std::vector<uint8_t> &data,uint32_t bias,
                              bool &hasObjects) {
    hasObjects=false;
    for (uint32_t head:O2_LIST_HEADS) {
        if (head>data.size()-4) return false;
        uint32_t ptr=load32(data.data()+head);
        std::vector<uint32_t> seen;
        for (unsigned steps=0;ptr;steps++) {
            if (steps>=1024 || ptr<bias || ptr-bias>data.size()-88) return false;
            for (uint32_t prior:seen) if (prior==ptr) return false;
            seen.push_back(ptr);
            hasObjects=true;
            ptr=load32(data.data()+(ptr-bias));
        }
    }
    return true;
}

#if defined(_WIN32)
class CaptureOutput {
public:
    explicit CaptureOutput(const std::string &folder):folder_(folder) {}

    bool write(const std::array<std::unique_ptr<PhaseData>,4> &phases) {
        if (!allowed_capture_folder(folder_)) return false;
        for (const auto &p:phases) if (!p || !p->event) return false;
        const std::string file=folder_+"\\p91-native-raw.bin";
        HANDLE out=CreateFileA(file.c_str(),GENERIC_WRITE,0,nullptr,CREATE_NEW,
                               FILE_ATTRIBUTE_NORMAL,nullptr);
        if (out==INVALID_HANDLE_VALUE) return false;
        Hash256 digest;
        uint64_t bytes=0;
        bool ok=true;
        auto put=[&](const uint8_t *p,size_t count) {
            if (!ok || count>DWORD(-1)) {ok=false;return;}
            DWORD written=0;
            if (!WriteFile(out,p,DWORD(count),&written,nullptr) || written!=count) {
                ok=false;return;
            }
            bytes+=count;
            if (count) digest.update(p,count);
        };
        auto u32=[&](uint32_t v) {
            uint8_t b[4] = {uint8_t(v),uint8_t(v>>8),uint8_t(v>>16),uint8_t(v>>24)};
            put(b,4);
        };
        auto u64=[&](uint64_t v) {u32(uint32_t(v));u32(uint32_t(v>>32));};
        auto blob=[&](const uint8_t *p,size_t n) {
            if (n>UINT32_MAX) {ok=false;return;}
            u32(uint32_t(n));if (n) put(p,n);
        };
        static const uint8_t magic[8]={'P','9','1','N','A','T','0','2'};
        put(magic,8);u32(2);u32(4);
        for (unsigned i=0;i<4;++i) {
            const auto &d=*phases[i];const auto &e=*d.event;
            u32(i);u64(e.serial);u32(e.instructionLinear);
            u32(e.object1LinearBase);u32(e.object2LinearBase);
            u32(e.operandBias);u32(e.csBase);u32(e.dsBase);
            u32(e.stage);u32(e.mode);u32(e.controlStream);u32(e.renderGate);
            u32(e.drawBuffer);u32(e.lastPresentedBuffer);
            u32(e.alternatePresentation);
            u32(e.expectedReturnOffset);u32(e.observedReturnOffset);
            u32(e.returnWitnessLinear);u64(e.returnWitnessSerial);
            u32(e.dacBits);u32(e.pelMask);
            u32(d.returnStackLinear);
            u32(d.returnOpcodeLinear);u64(d.returnOpcodeSerial);
            u32(d.returnOpcode);u32(d.returnEspBefore);
            u32(d.returnEspAfter);u32(d.returnStackBefore);
            u32(d.returnSsBaseBefore);
            for (uint32_t reg:d.cpuRegisters) u32(reg);
            for (uint32_t reg:d.vgaRegisters) u32(reg);
            blob(d.object1.data(),d.object1.size());
            blob(d.object2.data(),d.object2.size());
            blob(e.buffer.data(),e.buffer.size());
            blob(e.aperture.data(),e.aperture.size());
            blob(e.dac.data(),e.dac.size());
            blob(d.returnStack.data(),d.returnStack.size());
        }
        const bool closed=CloseHandle(out)!=0;
        if (!ok || !closed) return false; // file has no completion witness
        char marker[768]={};
        const int n=std::snprintf(marker,sizeof(marker),
            "{\"schema\":\"mkext_p91_native_raw_complete_v2\","
            "\"raw\":\"p91-native-raw.bin\",\"bytes\":%llu,\"sha256\":\"%s\","
            "\"phases\":4,\"nativeGameVerified\":false,"
            "\"scanoutVerified\":false,\"adapterAcceptancePending\":true}\n",
            static_cast<unsigned long long>(bytes),digest.hex().c_str());
        if (n<=0 || size_t(n)>=sizeof(marker)) return false;
        return exclusive_text(folder_+"\\p91-native-raw-complete.json",
                              std::string(marker,size_t(n)));
    }
private:
    std::string folder_;
};
#endif

class NativeObserver {
public:
    NativeObserver() {
#if defined(_WIN32)
        const char *selftest=std::getenv("MKEXT_P91_ADAPTER_SELFTEST_DIR");
        if (selftest && *selftest) {
            selftestDir_=selftest;
            return;
        }
        const char *folder=std::getenv("MKEXT_P91_NATIVE_CAPTURE_DIR");
        if (folder && *folder && allowed_capture_folder(folder)) {
            captureDir_=folder;
            active_=true;
        }
#endif
    }

    void instruction(uint32_t ip) {
#if defined(_WIN32)
        if (!selftestDir_.empty() && !selftestDone_) {
            selftestDone_=true;run_selftest(ip);
            return;
        }
        if (!active_ || stopped_) return;
        if (++serial_ > 2000000000ull) {refuse("global instruction budget");return;}
        if (!cpu.pmode || !cpu.code.big || !cpu.stack.big || PAGING_Enabled())
            return;
        if (!bound_) {
            // Cheap opcode filter, then all five SHA-256 source windows plus
            // all twelve Object2 relocations. No preferred LE base assumed.
            if (mem_readb((LinearPt)ip)!=0x83u) return;
            if (mem_readb((LinearPt)(ip+1))!=0x35u) return;
            const uint32_t csBase=uint32_t(SegPhys(cs));
            const uint32_t dsBase=uint32_t(SegPhys(ds));
            auto reader=[](uint32_t at,uint8_t *out,size_t n) {
                return native_ram_read(at,n,out);
            };
            Binding candidate;
            if (resolve_windows(ip,csBase,dsBase,reader,candidate) &&
                within_ram(candidate.object1Base,OBJ1_SIZE,
                           uint64_t(MEM_TotalPages())*4096ull) &&
                within_ram(candidate.object2Base,OBJ2_SIZE,
                           uint64_t(MEM_TotalPages())*4096ull)) {
                mapping_=std::move(candidate);
                bound_=true;
                boundSerial_=serial_;
            }
            return;
        }
        if (targetSeen_ && serial_-targetSerial_>20000000ull) {
            refuse("no completed target frame in bounded instruction budget");return;
        }
        if (ip<mapping_.object1Base) return;
        const uint32_t offset=ip-mapping_.object1Base;
        observe_presentation_return(ip,offset);
        Phase phase;
        unsigned slot=0;
        if (offset==windows[1].object1Offset) {
            phase=Phase::DrawEntry;slot=0;
        } else if (offset==windows[2].object1Offset) {
            phase=Phase::DrawComplete;slot=1;
        } else if (offset==windows[3].object1Offset) {
            phase=Phase::PresentEntry;slot=2;
        } else if (offset==windows[4].object1Offset) {
            if (guard_.status()!=Status::Ready) return;
            phase=Phase::PostPresent;slot=3;
            if (witnessSerial_==0) {
                refuse("scheduler reached without observed near-RET proof");
                return;
            }
        } else return;
        if (uint32_t(SegPhys(cs))!=mapping_.csBase ||
            uint32_t(SegPhys(ds))!=mapping_.dsBase) {
            refuse("segment mapping changed at boundary");return;
        }
        auto snapshot=std::unique_ptr<PhaseData>(new PhaseData());
        if (!sample(ip,phase,*snapshot)) {
            refuse("source/memory/list capture failure");return;
        }
        const Event &e=*snapshot->event;
        if (e.stage!=1 || e.mode!=2 ||
            e.controlStream!=e.operandBias+0x17300u) {
            if (guard_.status()!=Status::Idle)
                refuse("target stage/mode lost during generation");
            return;
        }
        if (!targetSeen_) {targetSeen_=true;targetSerial_=serial_;}
        if (phase==Phase::DrawEntry && !(e.renderGate&1u)) {
            guard_.observe(phase,e);
            return;
        }
        if (phase==Phase::DrawComplete && !(e.renderGate&1u)) {
            guard_.observe(phase,e);
            return;
        }
        if (phase==Phase::DrawComplete && guard_.status()!=Status::Drawing)
            return; // not a completed gate-on draw
        if (phase==Phase::PresentEntry && guard_.status()!=Status::Drawn)
            return; // presentation of an earlier uncaptured generation
        if (!guard_.observe(phase,e)) {
            refuse(guard_.reason().c_str());return;
        }
        if (phase==Phase::PostPresent) {
            snapshot->returnOpcodeLinear=returnOpcodeLinear_;
            snapshot->returnOpcodeSerial=returnOpcodeSerial_;
            snapshot->returnOpcode=0xc3u;
            snapshot->returnEspBefore=returnEspBefore_;
            snapshot->returnEspAfter=returnEspAfter_;
            snapshot->returnStackBefore=returnStackBefore_;
            snapshot->returnSsBaseBefore=returnSsBaseBefore_;
        }
        snapshots_[slot]=std::move(snapshot);
        if (phase==Phase::DrawEntry) {
            snapshots_[1].reset();snapshots_[2].reset();snapshots_[3].reset();
            witnessSerial_=0;witnessLinear_=0;
            returnCandidateSerial_=0;returnOpcodeSerial_=0;
            returnOpcodeLinear_=0;
        }
        if (phase==Phase::PostPresent && guard_.status()==Status::Accepted) {
            const bool written=CaptureOutput(captureDir_).write(snapshots_);
            stopped_=true;
            if (!written) record_failure("private packet write incomplete");
        }
#else
        (void)ip;
#endif
    }

private:
    bool active_=false;
    bool stopped_=false;
    bool bound_=false;
    bool selftestDone_=false;
    uint64_t serial_=0,boundSerial_=0,witnessSerial_=0,targetSerial_=0;
    bool targetSeen_=false;
    uint32_t witnessLinear_=0;
    uint64_t returnCandidateSerial_=0,returnOpcodeSerial_=0;
    uint32_t returnCandidateIp_=0,returnEspBefore_=0,returnEspAfter_=0;
    uint32_t returnStackBefore_=0,returnSsBaseBefore_=0,returnOpcodeLinear_=0;
    std::string captureDir_,selftestDir_;
    Binding mapping_;
    Guard guard_;
    std::array<std::unique_ptr<PhaseData>,4> snapshots_;

    void refuse(const char *reason) {
        stopped_=true;
        record_failure(reason);
    }
    void record_failure(const char *reason) {
#if defined(_WIN32)
        if (!allowed_capture_folder(captureDir_)) return;
        const std::string text=
            std::string("{\"schema\":\"mkext_p91_capture_refusal_v1\",")+
            "\"classification\":\"VALIDATION PENDING\",\"reason\":\""+
            reason+"\",\"nativeFrameCaptured\":false}\n";
        exclusive_text(captureDir_+"\\p91-capture-refusal.json",text);
#else
        (void)reason;
#endif
    }

    bool sample(uint32_t ip,Phase phase,PhaseData &d) {
        const uint64_t limit=uint64_t(MEM_TotalPages())*4096ull;
        if (!within_ram(mapping_.object1Base,OBJ1_SIZE,limit) ||
            !within_ram(mapping_.object2Base,OBJ2_SIZE,limit))return false;
        d.object1.resize(OBJ1_SIZE);d.object2.resize(OBJ2_SIZE);
        if (!native_ram_read(mapping_.object1Base,OBJ1_SIZE,d.object1.data()) ||
            !native_ram_read(mapping_.object2Base,OBJ2_SIZE,d.object2.data()))
            return false;
        // Source identity is re-established at every retained boundary.
        for (unsigned i=0;i<5;++i) {
            const Window &w=windows[i];
            const auto begin=d.object1.begin()+w.object1Offset;
            std::vector<uint8_t> raw(begin,begin+w.size);
            if (!validate_window(w,raw,mapping_.operandBias))
                return false;
        }
        const auto &o2=d.object2;
        auto word=[&](uint32_t offset) {return load32(o2.data()+offset);};
        auto ev=std::unique_ptr<Event>(new Event());
        ev->serial=serial_;ev->instructionLinear=ip;
        ev->object1LinearBase=mapping_.object1Base;
        ev->object2LinearBase=mapping_.object2Base;
        ev->operandBias=mapping_.operandBias;
        ev->csBase=mapping_.csBase;ev->dsBase=mapping_.dsBase;
        ev->stage=word(0x7747fu);ev->mode=word(0x3014cu);
        ev->controlStream=word(0x75cf6u);ev->renderGate=word(0x562d4u);
        ev->drawBuffer=word(0x7662au);
        ev->lastPresentedBuffer=word(0x7662eu);
        ev->alternatePresentation=word(0x75ceeu);
        ev->protected32=cpu.pmode && cpu.code.big && cpu.stack.big;
        ev->noPaging=!PAGING_Enabled();
        ev->buffer.fill(0);
        const uint64_t linearBuffer=uint64_t(mapping_.dsBase)+ev->drawBuffer;
        if (!within_ram(linearBuffer,PIXELS,limit) ||
            !native_ram_read(uint32_t(linearBuffer),PIXELS,ev->buffer.data()))
            return false;
        // List heads are mode/stage-dependent. Never reject an unrelated
        // stage because its pointers do not follow Tomb's list contract.
        if (ev->stage==1 && ev->mode==2 &&
            ev->controlStream==ev->operandBias+0x17300u &&
            !read_object_lists(o2,mapping_.operandBias,ev->hasObjects))
            return false;
        std::memcpy(ev->paletteSlots.data(),o2.data()+0x75b00u,
                    PALETTE_SLOTS);
        ev->hasDac=true;ev->dacBits=vga.dac.bits;
        ev->pelMask=vga.dac.pel_mask;
        for (unsigned i=0;i<256;++i) {
            ev->dac[3*i]=vga.dac.rgb[i].red;
            ev->dac[3*i+1]=vga.dac.rgb[i].green;
            ev->dac[3*i+2]=vga.dac.rgb[i].blue;
        }
        d.vgaRegisters={{
            uint32_t(vga.mode),uint32_t(vga.seq.memory_mode),
            uint32_t(vga.seq.map_mask),uint32_t(vga.gfx.mode),
            uint32_t(vga.gfx.miscellaneous),uint32_t(vga.crtc.offset),
            uint32_t(vga.crtc.start_address_high)*256u+vga.crtc.start_address_low,
            uint32_t(vga.attr.mode_control)
        }};
        FillFlags(); // CPU's lazy flags must be materialized for the evidence.
        d.cpuRegisters={{
            reg_eax,reg_ebx,reg_ecx,reg_edx,reg_esi,reg_edi,reg_ebp,
            reg_esp,reg_eip,uint32_t(reg_flags),SegValue(cs),SegValue(ds),
            SegValue(es),SegValue(ss),uint32_t(SegPhys(ss)),
            uint32_t(CPU_GET_CRX(0)),uint32_t(CPU_GET_CRX(3))
        }};
        if (phase==Phase::PresentEntry) {
            const uint64_t stack=uint64_t(SegPhys(ss))+reg_esp;
            if (!within_ram(stack,4,limit) ||
                !native_ram_read(uint32_t(stack),4,d.returnStack.data()))
                return false;
            d.returnStackLinear=uint32_t(stack);
            ev->hasReturnStack=true;
            ev->alternateReturnSite=word(0x563e0u)!=0;
            const uint32_t site=ev->alternateReturnSite?0x670b1u:0x670ddu;
            ev->expectedReturnOffset=mapping_.object1Base-mapping_.csBase+
                                      (site-0x61c54u);
            ev->observedReturnOffset=load32(d.returnStack.data());
        }
        if (phase==Phase::PostPresent) {
            const VGA_Latch prior=vga.latch;
            const bool ok=native_ram_read(0xa0000u,PIXELS,ev->aperture.data());
            vga.latch=prior; // CPU aperture may alter VGA read latches
            if (!ok) return false;
            ev->hasAperture=true;
            ev->returnWitnessLinear=witnessLinear_;
            ev->returnWitnessSerial=witnessSerial_;
        }
        d.event=std::move(ev);
        return true;
    }

    void run_selftest(uint32_t ip) {
#if defined(_WIN32)
        // CI self-test never accesses or mounts a commercial game.
        // This is deliberately separate from the canonical raw-capture arming.
        const std::string &folder=selftestDir_;
        if (folder.find("FIXTURES")==std::string::npos ||
            folder.find("VALIDATION")==std::string::npos ||
            folder.find("P91-")==std::string::npos) return;
        uint8_t sample[16]={};
        const bool ram=native_ram_read(0x400u,sizeof(sample),sample);
        bool parity=ram;
        for (unsigned i=0;i<sizeof(sample) && ram;++i)
            if (sample[i]!=mem_readb((LinearPt)(0x400u+i)))parity=false;
        const uint32_t latch=vga.latch.d;
        uint8_t dacXor=0;
        for (unsigned i=0;i<256;++i) {
            dacXor^=vga.dac.rgb[i].red;
            dacXor^=vga.dac.rgb[i].green;
            dacXor^=vga.dac.rgb[i].blue;
        }
        const bool noMutation=latch==vga.latch.d;
        const uint8_t abc[]={'a','b','c'};
        const bool sha=hash256(abc,3)==
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
        const bool good=parity && noMutation && sha;
        char report[512]={};
        const int n=std::snprintf(report,sizeof(report),
            "{\"schema\":\"mkext_p91_native_adapter_selftest_v1\","
            "\"result\":\"%s\",\"normalCoreHookReached\":true,"
            "\"boundedRamParity\":%s,\"dacReadNonMutating\":%s,"
            "\"sha256Verified\":%s,\"instructionLinear\":%u,"
            "\"paletteXor\":%u,\"originalGameExecuted\":false,"
            "\"nativeTombPacketCaptured\":false}\n",
            good?"PASS":"FAIL",parity?"true":"false",
            noMutation?"true":"false",sha?"true":"false",
            unsigned(ip),unsigned(dacXor));
        if (n>0 && size_t(n)<sizeof(report))
            exclusive_text(folder+"\\p91-adapter-selftest.json",
                           std::string(report,size_t(n)));
#else
        (void)ip;
#endif
    }
};

} // namespace mkext_p91

static void MKEXT_P91_CaptureObserve(const PhysPt linear) {
    static mkext_p91::NativeObserver observer;
    observer.instruction(uint32_t(linear));
}

#endif // MKEXT_P91_NATIVE_CAPTURE_ADAPTER_HPP
