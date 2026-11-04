/**
 * O269 — Read-only, evidence-first research catalogue for the existing MK DOS Archive.
 *
 * This is a lookup and classification contract, NOT a decoder, patch authorizer,
 * common MK1/MK2 ABI, or promotion of similarities into shared game mechanisms.
 * No browser/Node APIs; usable from both the UI and independent tests.
 */
export type MechanismGame = 'mk1' | 'mk2';
export type MechanismCategory = 'resource' | 'graphics' | 'authoring' | 'stage' | 'animation' | 'runtime';
export type MechanismConfidence =
  | 'PROJECT_HISTORY_VERIFIED'
  | 'SOURCE_IMPLEMENTED_HISTORY_VERIFIED'
  | 'SOURCE_IMPLEMENTED_HISTORY_RUNTIME_VERIFIED'
  | 'PROJECT_HISTORY_RUNTIME_VERIFIED'
  | 'LIVE_DEBUGGER_WITNESSED'
  | 'SOURCE_VERIFIED_RUNTIME_PENDING';
export type EvidenceKind = 'source' | 'source_verifier' | 'artifact';
export type AddressSpace = 'physical_file' | 'live_code' | 'live_writable_data' | 'live_palette_source';
export interface EvidenceReference { kind: EvidenceKind; path: string; }
export interface EvidenceAddress { space: AddressSpace; hex: string; }
export interface MechanismRecord {
  id: string; game: MechanismGame; category: MechanismCategory; title: string;
  claim: string; confidence: MechanismConfidence; evidence: EvidenceReference[];
  addresses: EvidenceAddress[]; limitations: string[];
}
export interface CrossGameCandidate {
  id: string; mk1: string; mk2: string;
  promotion: 'NOT_PROMOTED' | 'GENERIC_VERIFICATION_PRACTICE_ONLY'; rationale: string;
}
export interface MechanismRegistry {
  schema: 'mk_dos_mechanism_evidence_registry_v1'; milestone: 'O269'; evidencePolicy: string;
  fixtures: Record<'mk1' | 'mk2' | 'mk3', {exe: string; sha256: string | null; validation: string}>;
  mechanisms: MechanismRecord[]; crossGameCandidates: CrossGameCandidate[];
  unresolved: Array<{id: string; game: 'mk1' | 'mk2' | 'cross_game'; reason: string}>;
}
const confidence = new Set<MechanismConfidence>([
  'PROJECT_HISTORY_VERIFIED', 'SOURCE_IMPLEMENTED_HISTORY_VERIFIED',
  'SOURCE_IMPLEMENTED_HISTORY_RUNTIME_VERIFIED', 'PROJECT_HISTORY_RUNTIME_VERIFIED',
  'LIVE_DEBUGGER_WITNESSED', 'SOURCE_VERIFIED_RUNTIME_PENDING',
]);
const categories = new Set<MechanismCategory>(['resource','graphics','authoring','stage','animation','runtime']);
const evidenceKinds = new Set<EvidenceKind>(['source','source_verifier','artifact']);
const spaces = new Set<AddressSpace>(['physical_file','live_code','live_writable_data','live_palette_source']);
const validPath = (s: unknown): s is string => typeof s === 'string' &&
  s.length > 0 && !s.startsWith('/') && !s.includes('\\') &&
  !s.split('/').some(part => part === '' || part === '.' || part === '..');
function must(condition: unknown, reason: string): asserts condition {
  if (!condition) throw new Error(`O269 registry rejected: ${reason}`);
}
/** Fail closed on malformed and ungrounded cross-game research claims. */
export function validateMechanismRegistry(value: unknown): MechanismRegistry {
  must(value !== null && typeof value === 'object' && !Array.isArray(value), 'root object required');
  const r = value as MechanismRegistry;
  must(r.schema === 'mk_dos_mechanism_evidence_registry_v1' && r.milestone === 'O269', 'unknown schema/milestone');
  must(typeof r.evidencePolicy === 'string' && r.evidencePolicy.includes('DOS binaries authoritative'), 'evidence policy missing');
  must(r.fixtures && typeof r.fixtures === 'object', 'fixture catalogue missing');
  for(const g of ['mk1','mk2'] as const) must(/^[a-f0-9]{64}$/.test(r.fixtures[g]?.sha256 ?? ''), `${g} identity not pinned`);
  must(r.fixtures.mk3?.sha256 === null, 'MK3 must not inherit a guessed canonical identity');
  must(Array.isArray(r.mechanisms) && r.mechanisms.length > 0, 'no mechanisms');
  const ids = new Set<string>();
  for(const [i,m] of r.mechanisms.entries()) {
    must(m && typeof m === 'object', `mechanism ${i} missing`);
    must(/^(mk1|mk2)\.[a-z0-9_.-]+$/.test(m.id) && m.id.startsWith(`${m.game}.`), `${m.id} game/id mismatch`);
    must(!ids.has(m.id), `${m.id} duplicate id`); ids.add(m.id);
    must(categories.has(m.category) && confidence.has(m.confidence), `${m.id} invalid classification`);
    must(typeof m.claim === 'string' && m.claim.length > 30, `${m.id} no substantive claim`);
    must(typeof m.title === 'string' && m.title.length > 4, `${m.id} title missing`);
    must(Array.isArray(m.limitations) && m.limitations.length > 0 && m.limitations.every(s => typeof s === 'string' && s.length > 10), `${m.id} limitations required`);
    must(Array.isArray(m.evidence) && m.evidence.length > 0, `${m.id} has no evidence`);
    for(const e of m.evidence) must(e && evidenceKinds.has(e.kind) && validPath(e.path), `${m.id} invalid evidence path`);
    must(Array.isArray(m.addresses), `${m.id} addresses missing`);
    for(const a of m.addresses) must(a && spaces.has(a.space) && /^0x[0-9A-Fa-f]{4,8}$/.test(a.hex), `${m.id} untyped address`);
    if(m.confidence === 'LIVE_DEBUGGER_WITNESSED') must(m.evidence.some(e => e.kind === 'artifact') && m.evidence.some(e => e.kind === 'source_verifier'), `${m.id} live claim requires capture artifact and verifier`);
    if(m.confidence === 'SOURCE_VERIFIED_RUNTIME_PENDING') must(m.limitations.some(s => /runtime|live|display|unverified|unresolved|actual/i.test(s)), `${m.id} unsupported runtime boundary missing`);
  }
  must(Array.isArray(r.crossGameCandidates), 'cross-game candidate list missing');
  for(const c of r.crossGameCandidates) {
    must(ids.has(c.mk1) && c.mk1.startsWith('mk1.') && ids.has(c.mk2) && c.mk2.startsWith('mk2.'), `${c.id} dangling cross-game reference`);
    must(c.promotion === 'NOT_PROMOTED' || c.promotion === 'GENERIC_VERIFICATION_PRACTICE_ONLY', `${c.id} unjustified family promotion`);
    must(typeof c.rationale === 'string' && c.rationale.length > 25, `${c.id} no promotion rationale`);
  }
  must(Array.isArray(r.unresolved) && r.unresolved.length > 0, 'unresolved boundaries missing');
  for(const u of r.unresolved) must(typeof u.reason === 'string' && u.reason.length > 25 && ['mk1','mk2','cross_game'].includes(u.game), 'invalid unresolved claim');
  return r;
}
export function selectMechanisms(registry: MechanismRegistry, filters: {game?: MechanismGame; category?: MechanismCategory; confidence?: MechanismConfidence} = {}): MechanismRecord[] {
  return registry.mechanisms.filter(m => (!filters.game || m.game === filters.game) &&
    (!filters.category || m.category === filters.category) &&
    (!filters.confidence || m.confidence === filters.confidence));
}
export function evidenceForMechanism(registry: MechanismRegistry, id: string): EvidenceReference[] {
  return registry.mechanisms.find(m => m.id === id)?.evidence ?? [];
}
