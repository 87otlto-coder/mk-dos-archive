# P79 interim handoff — MK3 leading non-IFF source export

## Observe

P73/P77 preserve an interval between parsed IFF forms at original DATA.MK3 offsets 667,866 through 2,508,499 inclusive. P78 explicitly excludes it from its 197 additional assets. P79 targets this interval alone. The source identity and P76/P78 acceptance are recorded in [the P78 handoff](EXTRACTOR_P78_MK3_CHAINED_APP_INTEGRATION.md).

## Record

All offsets in this table are relative to byte 667,866. Lengths and fields use little-endian encoding.

| Offset | Source observation |
| --- | --- |
| 0 | Three unsigned 16-bit values, 216, 320, 200 |
| 6 | 768 bytes grouped as 256 candidate RGB triples |
| 774 | Two unsigned 32-bit values, 0 and 64,000 |
| 782 | 64,000 consecutive index bytes, 187 distinct values |
| 64,782 | 216 records. Each has a 16-bit tag of 3 followed by three 32-bit fields. The third is the stored payload length. Each exported record includes its 14-byte header. |
| 1,840,634 | Exact end of the last payload and beginning of the next IFF FORM |

Payloads total 1,772,828 bytes. Six records (zero-based ordinals 120–125) have zero-length payloads and all three fields zero. Preserve all six. The early prototype incorrectly required every payload to be nonempty and failed against the original.

## Hypothesize

320 × 200 equals the declared 64,000-byte length. Interpreting successive bytes as row-major indices yields one exportable base image. The leading 216 predicts the exact number of following bounded records. The adjacent 768 bytes support a color comparison preview. No exact copy of that table was found among the 416 original IFF CMAPs.

## Test

From the interim checkout, with Python and Pillow installed, run the following in PowerShell. The exporter accepts the fingerprinted DATA.MK3, installation folder or private game ZIP. Choose a new private ZIP on a filesystem supporting hard links.

~~~powershell
$mk3 = 'E:\GOG\Games\Mortal Kombat 3\mk3'
$out = Join-Path $env:TEMP ("mk3-p79-" + [guid]::NewGuid() + ".zip")
python scripts/mk3_p79_leading_span.py "$mk3" "$out"
python scripts/verify_mk3_p79_leading_span.py "$mk3" "$out"
~~~

Windows original-game export and independent readback both passed on 2026-11-09. The verifier reopened all 223 ZIP members, independently walked the source lengths, and compared all 220 contiguous source parts and their recorded SHA-256 values. The archive reconstructs all 1,840,634 bytes. Pillow read back 128,000 RGBA pixel positions across the grayscale and experimental adjacent-RGB8 previews. The original 64,000-byte index plane has SHA-256 `3553eead898a40d15788ef8072634cef04b2047cf7d4055682e7129aa6e7dd2e`.

Four P79 synthetic regression tests passed, including truncation, wrong lengths, extra bytes, unknown identity and preservation of empty records. All nine inherited P77 synthetic tests passed. P76 source controls passed (3 positive, 16 refusal), as did P78 source controls (3 positive, 11 refusal).

## Confidence and continuation

Verified on the mounted Windows original: exact source identity, interval, index bytes, stored record boundaries, archive contents and preview conversion. The base-image geometry is source-supported. Native colors, opacity, scene identity, the two auxiliary record fields, continuation rendering and playback timing remain unresolved. P79 exports one base image with two views and 216 stored records. These records are separate from the 216 P77/P78 images.

P79 is a standalone command-line pass. P78 remains the accepted Chrome gallery and download workflow at 9,402 opt-in MK3 assets. P79 has no browser integration or Chrome acceptance. An in-app follow-up would need original Chrome import, opt-in and downloaded-byte parity. P81 remains the next consolidation. The next extraction question is whether a bounded source decoder can reconstruct the nonempty continuation payloads; fixture evidence must precede a frame count.
