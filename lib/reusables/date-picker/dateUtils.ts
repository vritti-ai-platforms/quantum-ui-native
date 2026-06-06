// Date-only helpers — timezone-agnostic (local calendar terms) and DEPENDENCY-FREE.
// We deliberately avoid date-fns here: under the apps' Re.Pack `conditionNames` ('require' before
// 'import') date-fns v4 resolves to its CJS build, and the named-import CJS↔ESM interop throws
// "getter is not a function (it is undefined)" at runtime in the Hermes/MF bundle. Date-only
// parse/format is trivial, so plain JS + Intl is simpler and safe. (The deferred DateTime pickers
// can reintroduce date-fns/@date-fns/tz once that interop is sorted.)

const pad2 = (n: number): string => String(n).padStart(2, '0');

// Parse an ISO date-only string ('yyyy-MM-dd') to a local Date at midnight. Rejects invalid days.
export function parseIsoDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  // Reject overflow (e.g. 2026-02-31 rolling into March).
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return undefined;
  }
  return date;
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

// Locale-aware display for the trigger (Android / fallback). iOS's native compact control formats
// itself, so this only drives the Android trigger + web fallback text. `displayFormat` is accepted
// for API compatibility but no longer used (Intl drives the locale format).
export function formatDateDisplay(value: string | undefined, _displayFormat?: string): string | undefined {
  const date = parseIsoDate(value);
  if (!date) return undefined;
  try {
    return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
  } catch {
    return toIsoDate(date);
  }
}
