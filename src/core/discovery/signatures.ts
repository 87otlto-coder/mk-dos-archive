import { BinaryReader } from '../binary/BinaryReader';
import {
  FileClassification,
  FileSignatureInfo,
} from '../models/InventoryEntry';

/**
 * Converts a small byte slice to a 2-digit hex string for research inspection.
 */
export function bytesToHex(bytes: Uint8Array, maxBytes = 8): string {
  const len = Math.min(bytes.length, maxBytes);
  const hexParts: string[] = [];
  for (let i = 0; i < len; i++) {
    hexParts.push(bytes[i].toString(16).padStart(2, '0').toUpperCase());
  }
  return hexParts.join(' ');
}

/**
 * Checks if a buffer contains printable ASCII text characters.
 */
function isAsciiText(bytes: Uint8Array): boolean {
  if (bytes.length === 0) return true;
  let nonAsciiCount = 0;
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    // Allow CR, LF, TAB, FormFeed, Esc, and printable ASCII 0x20 - 0x7E
    if (b === 0x09 || b === 0x0a || b === 0x0d || b === 0x1b || (b >= 0x20 && b <= 0x7e)) {
      continue;
    }
    nonAsciiCount++;
  }
  return nonAsciiCount / bytes.length < 0.05;
}

export interface SignatureDetectionResult {
  signature: FileSignatureInfo;
  classification: FileClassification;
}

const KNOWN_MILES_DRIVER_NAMES = [
  'ADRV688.DIG',
  'JAMMER.DIG',
  'PROAUDIO.DIG',
  'RAP10.DIG',
  'SB16.DIG',
  'SBLASTER.DIG',
  'SBPRO.DIG',
  'SNDSCAPE.DIG',
  'ULTRA.DIG',
  'ADLIB.MDI',
  'MPU401.MDI',
  'SBLASTER.MDI',
  'SBPRO.MDI',
  'PAS.MDI',
];

/**
 * Calculates the offset of an extended executable header (LE, LX, NE, PE) if the file has a DOS MZ header.
 * Returns null if not an MZ file or if e_lfanew is missing/invalid.
 */
export function getExtendedHeaderOffset(
  headerSlice: Uint8Array,
  fileSize: number,
): number | null {
  if (headerSlice.length < 0x40) {
    return null;
  }

  const b0 = headerSlice[0];
  const b1 = headerSlice[1];
  const isMz = (b0 === 0x4d && b1 === 0x5a) || (b0 === 0x5a && b1 === 0x4d);
  if (!isMz) {
    return null;
  }

  try {
    const reader = new BinaryReader(headerSlice);
    const newHeaderOffset = reader.peekUint32LE(0x3c);

    // Validate bounds: must point beyond the 64-byte DOS header, within file size, and not exceed reasonable offset
    if (
      newHeaderOffset >= 0x40 &&
      newHeaderOffset + 4 <= fileSize &&
      newHeaderOffset <= 0x0fffffff
    ) {
      return newHeaderOffset;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Checks a secondary header slice (e.g. at e_lfanew) for LE, LX, NE, or PE signatures.
 */
export function identifySecondaryExecutableHeader(
  secondarySlice: Uint8Array,
  offset: number,
  baseHexStr: string,
): SignatureDetectionResult | null {
  if (secondarySlice.length < 2) {
    return null;
  }

  const sig0 = secondarySlice[0];
  const sig1 = secondarySlice[1];
  const sigAscii = String.fromCharCode(sig0, sig1);
  const offsetHex = offset.toString(16).toUpperCase();

  if (sigAscii === 'LE') {
    return {
      signature: {
        kind: 'DOS MZ / LE',
        confidence: 'verified',
        details: `DOS MZ header with Watcom Linear Executable (LE/DOS4GW) header at offset 0x${offsetHex}`,
        headerHex: baseHexStr,
      },
      classification: 'executable',
    };
  }

  if (sigAscii === 'LX') {
    return {
      signature: {
        kind: 'DOS MZ / LX',
        confidence: 'verified',
        details: `DOS MZ header with Linear Executable (LX) header at offset 0x${offsetHex}`,
        headerHex: baseHexStr,
      },
      classification: 'executable',
    };
  }

  if (sigAscii === 'NE') {
    return {
      signature: {
        kind: 'DOS MZ / NE',
        confidence: 'verified',
        details: `DOS MZ header with New Executable (NE/16-bit protected mode) header at offset 0x${offsetHex}`,
        headerHex: baseHexStr,
      },
      classification: 'executable',
    };
  }

  if (sigAscii === 'PE') {
    return {
      signature: {
        kind: 'DOS MZ / PE',
        confidence: 'verified',
        details: `DOS MZ header with Portable Executable (PE/Win32) header at offset 0x${offsetHex}`,
        headerHex: baseHexStr,
      },
      classification: 'executable',
    };
  }

  return null;
}

/**
 * Classifies file signature and candidate category purely from header bytes and extension metadata.
 */
export function detectFileSignature(
  headerSlice: Uint8Array,
  filename: string,
  extension: string,
  secondaryHeaderSlice?: Uint8Array,
  secondaryOffset?: number,
): SignatureDetectionResult {
  const hexStr = bytesToHex(headerSlice, 8);
  const ext = extension.toUpperCase();
  const upperFilename = filename.toUpperCase();

  // 1. Executable checks (DOS MZ + extended headers)
  if (headerSlice.length >= 2) {
    const b0 = headerSlice[0];
    const b1 = headerSlice[1];

    if ((b0 === 0x4d && b1 === 0x5a) || (b0 === 0x5a && b1 === 0x4d)) {
      // Check provided secondary header slice first
      if (secondaryHeaderSlice && secondaryHeaderSlice.length >= 2 && secondaryOffset !== undefined) {
        const secondaryResult = identifySecondaryExecutableHeader(
          secondaryHeaderSlice,
          secondaryOffset,
          hexStr,
        );
        if (secondaryResult) {
          return secondaryResult;
        }
      }

      // Check if e_lfanew lies within initial headerSlice
      if (headerSlice.length >= 0x40) {
        try {
          const reader = new BinaryReader(headerSlice);
          const newHeaderOffset = reader.peekUint32LE(0x3c);
          if (newHeaderOffset >= 0x40 && newHeaderOffset + 2 <= headerSlice.length) {
            const internalSlice = headerSlice.subarray(newHeaderOffset);
            const secondaryResult = identifySecondaryExecutableHeader(
              internalSlice,
              newHeaderOffset,
              hexStr,
            );
            if (secondaryResult) {
              return secondaryResult;
            }
          }
        } catch {
          // Fall through to plain DOS MZ
        }
      }

      return {
        signature: {
          kind: 'DOS MZ Executable',
          confidence: 'verified',
          details: 'Standard DOS 16-bit MZ executable header',
          headerHex: hexStr,
        },
        classification: 'executable',
      };
    }
  }

  // Common DOS Batch / Script files
  if (ext === 'BAT' || ext === 'CMD') {
    return {
      signature: {
        kind: 'DOS Batch Script',
        confidence: 'inferred',
        details: 'DOS Batch Command Script',
        headerHex: hexStr,
      },
      classification: 'executable',
    };
  }

  // 2. High-Confidence Generic Signatures

  // Miles AIL3 Digital Sound Driver: "AIL3DIG\x1A" (0x41 0x49 0x4C 0x33 0x44 0x49 0x47 0x1A)
  if (
    headerSlice.length >= 8 &&
    headerSlice[0] === 0x41 &&
    headerSlice[1] === 0x49 &&
    headerSlice[2] === 0x4c &&
    headerSlice[3] === 0x33 &&
    headerSlice[4] === 0x44 &&
    headerSlice[5] === 0x49 &&
    headerSlice[6] === 0x47 &&
    headerSlice[7] === 0x1a
  ) {
    return {
      signature: {
        kind: 'Miles AIL3 Digital Driver',
        confidence: 'verified',
        details: 'Miles Sound System AIL3 32-bit digital audio driver module',
        headerHex: hexStr,
      },
      classification: 'support_driver',
    };
  }

  // RIFF ... WAVE Audio: "RIFF" at 0..3, "WAVE" at 8..11
  if (
    headerSlice.length >= 12 &&
    headerSlice[0] === 0x52 &&
    headerSlice[1] === 0x49 &&
    headerSlice[2] === 0x46 &&
    headerSlice[3] === 0x46 &&
    headerSlice[8] === 0x57 &&
    headerSlice[9] === 0x41 &&
    headerSlice[10] === 0x56 &&
    headerSlice[11] === 0x45
  ) {
    return {
      signature: {
        kind: 'WAV Audio',
        confidence: 'verified',
        details: 'RIFF WAVE digital audio stream',
        headerHex: hexStr,
      },
      classification: 'audio_candidate',
    };
  }

  // Ogg container: "OggS" (0x4F 0x67 0x67 0x53)
  if (
    headerSlice.length >= 4 &&
    headerSlice[0] === 0x4f &&
    headerSlice[1] === 0x67 &&
    headerSlice[2] === 0x67 &&
    headerSlice[3] === 0x53
  ) {
    return {
      signature: {
        kind: 'Ogg Container',
        confidence: 'verified',
        details: 'Ogg Vorbis / media container stream candidate',
        headerHex: hexStr,
      },
      classification: 'audio_candidate',
    };
  }

  // Standard MIDI File: "MThd" (0x4D 0x54 0x68 0x64)
  if (
    headerSlice.length >= 4 &&
    headerSlice[0] === 0x4d &&
    headerSlice[1] === 0x54 &&
    headerSlice[2] === 0x68 &&
    headerSlice[3] === 0x64
  ) {
    return {
      signature: {
        kind: 'Standard MIDI File (SMF)',
        confidence: 'verified',
        details: 'Standard MIDI File (MThd header)',
        headerHex: hexStr,
      },
      classification: 'audio_candidate',
    };
  }

  // MK3 Fighter Container Candidate: "MFIL" (0x4D 0x46 0x49 0x4C)
  if (
    headerSlice.length >= 4 &&
    headerSlice[0] === 0x4d &&
    headerSlice[1] === 0x46 &&
    headerSlice[2] === 0x49 &&
    headerSlice[3] === 0x4c
  ) {
    return {
      signature: {
        kind: 'MFIL Container Candidate',
        confidence: 'inferred',
        details: 'Observed MK3 fighter data container (MFIL header)',
        headerHex: hexStr,
      },
      classification: 'data_candidate',
    };
  }

  // FORM Container Candidate: "FORM" (0x46 0x4F 0x52 0x4D)
  if (
    headerSlice.length >= 4 &&
    headerSlice[0] === 0x46 &&
    headerSlice[1] === 0x4f &&
    headerSlice[2] === 0x52 &&
    headerSlice[3] === 0x4d
  ) {
    return {
      signature: {
        kind: 'FORM Container Candidate',
        confidence: 'inferred',
        details: 'IFF/FORM structured container candidate (Observed in DATA.MK3)',
        headerHex: hexStr,
      },
      classification: 'data_candidate',
    };
  }

  // Known support drivers by filename or driver extension
  if (
    KNOWN_MILES_DRIVER_NAMES.includes(upperFilename) ||
    ext === 'DRV' ||
    ext === 'WL'
  ) {
    return {
      signature: {
        kind: 'Unknown Driver Binary',
        confidence: 'inferred',
        details: `DOS sound/hardware driver candidate (${upperFilename})`,
        headerHex: hexStr,
      },
      classification: 'support_driver',
    };
  }

  // 3. Plain Text detection for documents
  if (
    (ext === 'TXT' || ext === 'DOC' || ext === 'ME' || ext === 'NFO' || ext === 'CFG' || ext === 'INI' || ext === 'LOG') &&
    headerSlice.length > 0 &&
    isAsciiText(headerSlice)
  ) {
    return {
      signature: {
        kind: 'ASCII Text Document',
        confidence: 'verified',
        details: 'Plaintext document or configuration file',
        headerHex: hexStr,
      },
      classification: 'text_document',
    };
  }

  // 4. Extension-based candidate classification (conservative candidate tagging)
  const graphicsCandidateExtensions = ['GRA', 'VGA', 'PAL', 'SPR', 'PCX', 'RAW', 'ART', 'FNT', 'FON', 'LBM', 'BMP', 'PIC'];
  if (graphicsCandidateExtensions.includes(ext)) {
    return {
      signature: {
        kind: 'Unknown Binary',
        confidence: 'unknown',
        details: `Raw binary payload (Candidate graphics resource by .${ext} extension)`,
        headerHex: hexStr,
      },
      classification: 'graphics_candidate',
    };
  }

  const audioCandidateExtensions = ['SND', 'MID', 'WAV', 'VOC', 'ADL', 'HMI', 'CMF', 'MUS', 'BNK', 'SB', 'GUS', 'XMI', 'AWE', 'GVS', 'LAP', 'SBL'];
  if (audioCandidateExtensions.includes(ext)) {
    return {
      signature: {
        kind: 'Unknown Binary',
        confidence: 'unknown',
        details: `Raw binary payload (Candidate audio/sound resource by .${ext} extension; not verified SMF)`,
        headerHex: hexStr,
      },
      classification: 'audio_candidate',
    };
  }

  const dataCandidateExtensions = ['DAT', 'BIN', 'TBL', 'DEF', 'CAT', 'PAK', 'FTR', 'MK3', 'OVR', 'MAP', 'CFG'];
  if (dataCandidateExtensions.includes(ext)) {
    return {
      signature: {
        kind: 'Unknown Binary',
        confidence: 'unknown',
        details: `Raw binary payload (Candidate data resource by .${ext} extension)`,
        headerHex: hexStr,
      },
      classification: 'data_candidate',
    };
  }

  // Check if unclassified file is text
  if (headerSlice.length > 0 && isAsciiText(headerSlice)) {
    return {
      signature: {
        kind: 'ASCII Text',
        confidence: 'inferred',
        details: 'Text-like contents',
        headerHex: hexStr,
      },
      classification: 'text_document',
    };
  }

  // 5. Default Unknown
  return {
    signature: {
      kind: 'Unknown Binary',
      confidence: 'unknown',
      details: 'Unidentified binary format header',
      headerHex: hexStr,
    },
    classification: 'unknown',
  };
}
