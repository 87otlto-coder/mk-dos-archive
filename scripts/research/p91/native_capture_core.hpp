// P91: original-free native source-window and relocation verifier.
// Small self-contained SHA-256 for pinned 5 short windows and private blob digests.
// Commercial instruction bytes are never embedded in this header.
#ifndef MKEXT_P91_NATIVE_CAPTURE_CORE_HPP
#define MKEXT_P91_NATIVE_CAPTURE_CORE_HPP

#include <array>
#include <cstddef>
#include <cstdint>
#include <cstring>
#include <limits>
#include <string>
#include <vector>

namespace mkext_p91 {

static inline uint32_t load32(const uint8_t *p) {
    return uint32_t(p[0]) | (uint32_t(p[1]) << 8u) |
           (uint32_t(p[2]) << 16u) | (uint32_t(p[3]) << 24u);
}

static inline uint32_t rotate(uint32_t x, unsigned n) {
    return (x >> n) | (x << (32u - n));
}

class Hash256 {
public:
    Hash256() : state_{{0x6a09e667u,0xbb67ae85u,0x3c6ef372u,0xa54ff53au,
                       0x510e527fu,0x9b05688cu,0x1f83d9abu,0x5be0cd19u}},
                used_(0), bytes_(0) { std::memset(block_, 0, sizeof(block_)); }

    void update(const uint8_t *p, size_t n) {
        bytes_ += n;
        while (n != 0) {
            const size_t take = n < 64u-used_ ? n : 64u-used_;
            std::memcpy(block_+used_, p, take);
            used_ += take; p += take; n -= take;
            if (used_ == 64u) { compress(block_); used_=0; }
        }
    }

    std::string hex() const {
        Hash256 h=*this;
        const uint64_t bits = h.bytes_ * 8u;
        const uint8_t one = 0x80;
        h.update(&one, 1);
        const uint8_t zero = 0;
        while (h.used_ != 56u) h.update(&zero, 1);
        uint8_t length[8] = {};
        for (int i=0;i<8;++i) length[7-i]=uint8_t(bits >> (i*8));
        h.update(length, 8);
        static const char alphabet[]="0123456789abcdef";
        std::string out; out.reserve(64);
        for (auto word : h.state_) {
            for (int j=3;j>=0;--j) {
                const uint8_t c=uint8_t(word >> (j*8));
                out.push_back(alphabet[c >> 4u]);
                out.push_back(alphabet[c & 15u]);
            }
        }
        return out;
    }

private:
    std::array<uint32_t,8> state_;
    uint8_t block_[64];
    size_t used_;
    uint64_t bytes_;

    void compress(const uint8_t *p) {
        static const uint32_t K[64] = {
          0x428a2f98u,0x71374491u,0xb5c0fbcfu,0xe9b5dba5u,0x3956c25bu,0x59f111f1u,0x923f82a4u,0xab1c5ed5u,
          0xd807aa98u,0x12835b01u,0x243185beu,0x550c7dc3u,0x72be5d74u,0x80deb1feu,0x9bdc06a7u,0xc19bf174u,
          0xe49b69c1u,0xefbe4786u,0x0fc19dc6u,0x240ca1ccu,0x2de92c6fu,0x4a7484aau,0x5cb0a9dcu,0x76f988dau,
          0x983e5152u,0xa831c66du,0xb00327c8u,0xbf597fc7u,0xc6e00bf3u,0xd5a79147u,0x06ca6351u,0x14292967u,
          0x27b70a85u,0x2e1b2138u,0x4d2c6dfcu,0x53380d13u,0x650a7354u,0x766a0abbu,0x81c2c92eu,0x92722c85u,
          0xa2bfe8a1u,0xa81a664bu,0xc24b8b70u,0xc76c51a3u,0xd192e819u,0xd6990624u,0xf40e3585u,0x106aa070u,
          0x19a4c116u,0x1e376c08u,0x2748774cu,0x34b0bcb5u,0x391c0cb3u,0x4ed8aa4au,0x5b9cca4fu,0x682e6ff3u,
          0x748f82eeu,0x78a5636fu,0x84c87814u,0x8cc70208u,0x90befffau,0xa4506cebu,0xbef9a3f7u,0xc67178f2u
        };
        uint32_t w[64] = {};
        for (unsigned i=0;i<16;++i)
            w[i]=(uint32_t(p[4*i])<<24u)|(uint32_t(p[4*i+1])<<16u)|
                 (uint32_t(p[4*i+2])<<8u)|uint32_t(p[4*i+3]);
        for (unsigned i=16;i<64;++i) {
            const uint32_t a=w[i-15],b=w[i-2];
            const uint32_t s0=rotate(a,7)^rotate(a,18)^(a>>3);
            const uint32_t s1=rotate(b,17)^rotate(b,19)^(b>>10);
            w[i]=w[i-16]+s0+w[i-7]+s1;
        }
        uint32_t a=state_[0],b=state_[1],c=state_[2],d=state_[3],
                 e=state_[4],f=state_[5],g=state_[6],h=state_[7];
        for (unsigned i=0;i<64;++i) {
            const uint32_t S1=rotate(e,6)^rotate(e,11)^rotate(e,25);
            const uint32_t ch=(e&f)^(~e&g);
            const uint32_t t1=h+S1+ch+K[i]+w[i];
            const uint32_t S0=rotate(a,2)^rotate(a,13)^rotate(a,22);
            const uint32_t maj=(a&b)^(a&c)^(b&c);
            const uint32_t t2=S0+maj;
            h=g;g=f;f=e;e=d+t1;d=c;c=b;b=a;a=t1+t2;
        }
        state_[0]+=a;state_[1]+=b;state_[2]+=c;state_[3]+=d;
        state_[4]+=e;state_[5]+=f;state_[6]+=g;state_[7]+=h;
    }
};

static inline std::string hash256(const uint8_t *bytes, size_t count) {
    Hash256 h;
    if (count) h.update(bytes,count);
    return h.hex();
}

struct Reloc { uint8_t offset; uint32_t targetObject2Offset; };
struct Window {
    const char *name;
    uint32_t object1Offset;
    uint8_t size;
    const Reloc *relocations;
    uint8_t relocationCount;
    const char *maskedSha256;
};

// All metadata below comes from P91_CAPTURE_SOURCE_PLAN_20261115.json, not
// copied executable bytes. Source positions are Object1-relative.
static const Reloc frame_relocs[]={{2,352980},{14,482546}};
static const Reloc draw_relocs[]={{2,352980},{14,484918},{23,484906}};
static const Reloc present_relocs[]={{2,196940},{11,482542}};
static const Reloc scheduler_relocs[]={{2,202620},{14,219916},{22,219920},{32,219920},{44,219908}};
static const Window windows[5] = {
  {"frame_entry",21500,24,frame_relocs,2,
   "a67258592f0550e312761184f4e23754bb51b61219f517ce3f4c3d44ff424f45"},
  {"draw_entry",202606,39,draw_relocs,3,
   "8cdd5f0e31d27be6fc40a21962c7af202a42473008308107c3db69b8a2a259e6"},
  {"draw_ret",203153,1,nullptr,0,
   "ae3f4619b0413d70d3004b9131c3752153074e45725be13b9a148978895e359e"},
  {"present_entry",14284,21,present_relocs,2,
   "d60bf17d7db9538c634b03b4befb3c61fe577c424ae5fb9c73b67446da263753"},
  {"scheduler_entry",21641,50,scheduler_relocs,5,
   "d038006b13341f6691a7601d11a965241e84aa74559dcdef8481c04e65ee0073"}
};

static_assert(sizeof(windows)/sizeof(windows[0])==5,"five original plan windows");

static inline bool validate_window(const Window &w,const std::vector<uint8_t> &raw,
                                   uint32_t bias) {
    if (raw.size()!=w.size) return false;
    std::vector<uint8_t> masked=raw;
    for (uint8_t i=0;i<w.relocationCount;++i) {
        const Reloc &r=w.relocations[i];
        if (uint32_t(r.offset)+4u>raw.size()) return false;
        const uint64_t value=uint64_t(bias)+r.targetObject2Offset;
        if (value>UINT32_MAX || load32(raw.data()+r.offset)!=value) return false;
        for (unsigned j=0;j<4;++j) masked[r.offset+j]=0;
    }
    return hash256(masked.data(),masked.size())==w.maskedSha256;
}

struct Binding {
    uint32_t object1Base=0;
    uint32_t object2Base=0;
    uint32_t operandBias=0;
    uint32_t csBase=0;
    uint32_t dsBase=0;
    std::array<std::vector<uint8_t>,5> rawWindows;
};

template <typename Reader>
static bool resolve_windows(uint32_t ip,uint32_t csBase,uint32_t dsBase,
                            Reader &read,Binding &out) {
    const uint32_t frameOffset=windows[0].object1Offset;
    if (ip<frameOffset) return false;
    uint8_t first[7]={};
    if (!read(ip,first,7) || first[0]!=0x83u ||
        first[1]!=0x35u || first[6]!=0x01u)
        return false;
    const uint32_t value=load32(first+2);
    const uint32_t target=352980u;
    if (value<target) return false;
    const uint32_t bias=value-target, base1=ip-frameOffset;
    const uint64_t base2=uint64_t(dsBase)+bias;
    if (base1<csBase || base2>UINT32_MAX) return false;
    Binding checked;
    checked.object1Base=base1;checked.object2Base=uint32_t(base2);
    checked.operandBias=bias;checked.csBase=csBase;checked.dsBase=dsBase;
    for (unsigned i=0;i<5;++i) {
        const Window &w=windows[i];
        const uint64_t at=uint64_t(base1)+w.object1Offset;
        if (at>UINT32_MAX) return false;
        auto &raw=checked.rawWindows[i];
        raw.resize(w.size);
        if (!read(uint32_t(at),raw.data(),raw.size()) ||
            !validate_window(w,raw,bias)) return false;
    }
    out=std::move(checked);
    return true;
}

static inline bool within_ram(uint64_t address, uint64_t size, uint64_t bytes) {
    return size!=0 && address<=bytes && size<=bytes-address &&
           address<=UINT32_MAX && size<=UINT32_MAX-address;
}

} // namespace mkext_p91
#endif
