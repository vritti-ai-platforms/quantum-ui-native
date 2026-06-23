// Temp + mutation ids without a native dep (Hermes has no crypto.randomUUID). A per-session counter
// rules out intra-session collisions; Date.now() + random make cross-session collisions vanishingly
// unlikely. Temp ids embed the typename so reconciliation/rollback can evict the right normalized entity.
const TEMP_PREFIX = 'temp:';
let _seq = 0;
const rand = (): string => Math.random().toString(36).slice(2, 10);

export function newTempId(typename: string): string {
  return `${TEMP_PREFIX}${typename}:${Date.now()}-${_seq++}-${rand()}`;
}

export function newMutationId(): string {
  return `m:${Date.now()}-${_seq++}-${rand()}`;
}

export function isTempId(id: string | number | null | undefined): boolean {
  return typeof id === 'string' && id.startsWith(TEMP_PREFIX);
}
