// P91 native four-phase generation guard, independent of emulator and game.
// Source-only, portable C++14: used by the upcoming native DOSBox observer.
// No original commercial bytes or runtime observations are embedded here.
#ifndef MKEXT_P91_NATIVE_GENERATION_GUARD_HPP
#define MKEXT_P91_NATIVE_GENERATION_GUARD_HPP

#include <array>
#include <cstdint>
#include <string>

namespace mkext_p91 {

constexpr std::size_t PIXELS = 64000;
constexpr std::size_t DAC_COMPONENTS = 768;
constexpr std::size_t PALETTE_SLOTS = 480;

enum class Phase { DrawEntry, DrawComplete, PresentEntry, PostPresent };
enum class Status { Idle, Drawing, Drawn, Ready, Accepted, Refused };

// The native RAM/DAC adapter must fill fields from one synchronous instruction
// boundary. This guard never reads guest memory or assigns palette ownership.
struct Event {
    uint64_t serial = 0;
    uint32_t instructionLinear = 0;
    uint32_t object1LinearBase = 0;
    uint32_t object2LinearBase = 0;
    uint32_t operandBias = 0;
    uint32_t csBase = 0;
    uint32_t dsBase = 0;
    uint32_t stage = 0;
    uint32_t mode = 0;
    uint32_t controlStream = 0;
    uint32_t renderGate = 0;
    uint32_t drawBuffer = 0;
    uint32_t lastPresentedBuffer = 0;
    uint32_t alternatePresentation = 0;
    uint32_t expectedReturnOffset = 0;
    bool alternateReturnSite = false;
    uint32_t observedReturnOffset = 0;
    uint32_t returnWitnessLinear = 0;
    uint64_t returnWitnessSerial = 0;
    bool protected32 = false;
    bool noPaging = false;
    bool hasObjects = false;
    bool hasReturnStack = false;
    bool hasAperture = false;
    bool hasDac = false;
    uint8_t dacBits = 0;
    uint8_t pelMask = 0;
    std::array<uint8_t, PIXELS> buffer{};
    std::array<uint8_t, PIXELS> aperture{};
    std::array<uint8_t, DAC_COMPONENTS> dac{};
    std::array<uint8_t, PALETTE_SLOTS> paletteSlots{};
};

class Guard {
public:
    Status status() const { return status_; }
    const std::string& reason() const { return reason_; }
    uint64_t lastSerial() const { return lastSerial_; }

    // A source-backed source-window/relocation verifier must validate loaded
    // bases before feeding these events. Passing the guard is not native proof.
    bool observe(Phase phase, const Event& event) {
        if (status_ == Status::Refused || status_ == Status::Accepted)
            return false;
        if (event.serial <= lastSerial_) return refuse("non-monotonic serial");
        lastSerial_ = event.serial;
        if (!event.protected32 || !event.noPaging)
            return refuse("unsupported CPU or paging context");
        if (event.stage != 1 || event.mode != 2 ||
            event.controlStream != event.operandBias + 0x17300u)
            return refuse("not Tomb mode 2 rooted stream");
        if (event.object1LinearBase == 0 || event.object2LinearBase == 0)
            return refuse("missing loaded bases");
        switch (phase) {
        case Phase::DrawEntry:
            if (!(event.renderGate & 1u)) {
                // Gate-off traversal may mutate objects; it cannot replace a
                // previously completed pixel-producing generation.
                return true;
            }
            if (!event.hasObjects) return refuse("empty draw lists");
            draw_ = event;
            status_ = Status::Drawing;
            return true;
        case Phase::DrawComplete:
            if (status_ != Status::Drawing) return true; // gate-off draw
            if (!sameMapping(draw_, event) ||
                draw_.drawBuffer != event.drawBuffer ||
                !(event.renderGate & 1u))
                return refuse("draw mapping, buffer or gate changed");
            complete_ = event;
            status_ = Status::Drawn;
            return true;
        case Phase::PresentEntry: {
            if (status_ != Status::Drawn)
                return refuse("presentation without completed draw generation");
            if (!sameMapping(complete_, event) ||
                complete_.drawBuffer != event.drawBuffer ||
                complete_.buffer != event.buffer)
                return refuse("presentation source differs from completed draw");
            if (draw_.paletteSlots != event.paletteSlots)
                return refuse("palette allocation changed since drawing");
            if (event.alternatePresentation != 0)
                return refuse("unsupported fixed-buffer presentation");
            if (event.drawBuffer != event.operandBias + 0x56524u &&
                event.drawBuffer != event.operandBias + 0x65f24u)
                return refuse("unexpected native buffer");
            // The saved near-call return must identify an original frame
            // driver site, not an arbitrary number supplied by the adapter.
            if (event.object1LinearBase < event.csBase)
                return refuse("invalid near-code bias");
            const uint64_t returnPhysical = event.alternateReturnSite ?
                0x670b1u : 0x670ddu;
            const uint64_t expectedNear =
                uint64_t(event.object1LinearBase - event.csBase) +
                (returnPhysical - 0x61c54u);
            if (expectedNear > 0xffffffffu || !event.hasReturnStack ||
                event.expectedReturnOffset != expectedNear ||
                event.observedReturnOffset != expectedNear)
                return refuse("presentation call return stack not verified");
            if (!event.hasDac || (event.dacBits != 6 && event.dacBits != 8))
                return refuse("missing or unsupported DAC evidence");
            present_ = event;
            status_ = Status::Ready;
            return true;
        }
        case Phase::PostPresent:
            if (status_ != Status::Ready)
                return refuse("scheduler is not presentation proof");
            if (!sameMapping(present_, event))
                return refuse("mapping changed before post-present");
            if (event.returnWitnessLinear !=
                present_.csBase + present_.observedReturnOffset ||
                event.returnWitnessSerial <= present_.serial ||
                event.returnWitnessSerial > event.serial)
                return refuse("missing matching presentation return event");
            if (event.lastPresentedBuffer != present_.drawBuffer)
                return refuse("last-presented source differs");
            if (!event.hasAperture || event.aperture != complete_.buffer)
                return refuse("VGA aperture differs from completed draw");
            if (!event.hasDac || event.dac != present_.dac ||
                event.dacBits != present_.dacBits ||
                event.pelMask != present_.pelMask)
                return refuse("DAC differs after presentation");
            status_ = Status::Accepted;
            return true;
        }
        return refuse("unknown phase");
    }

private:
    Status status_ = Status::Idle;
    std::string reason_;
    uint64_t lastSerial_ = 0;
    Event draw_;
    Event complete_;
    Event present_;

    bool refuse(const char *why) {
        status_ = Status::Refused;
        reason_ = why;
        return false;
    }
    static bool sameMapping(const Event& a, const Event& b) {
        return a.object1LinearBase == b.object1LinearBase &&
               a.object2LinearBase == b.object2LinearBase &&
               a.operandBias == b.operandBias &&
               a.csBase == b.csBase && a.dsBase == b.dsBase;
    }
};

} // namespace mkext_p91

#endif // MKEXT_P91_NATIVE_GENERATION_GUARD_HPP
