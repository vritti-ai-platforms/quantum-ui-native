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

// Locale-aware display for the trigger text. `locale` is the active BCP-47 tag (from useLocale);
// undefined ⇒ device default. (iOS's native compact control formats its own pill, so this mainly
// drives the Android trigger + web fallback text and the date-only field display.)
export function formatDateDisplay(value: string | undefined, locale?: string): string | undefined {
  const date = parseIsoDate(value);
  if (!date) return undefined;
  try {
    return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
  } catch {
    return toIsoDate(date);
  }
}

// --- Instant (date + time) helpers for the DateTime pickers --------------------------------------
// Still Intl-based and dependency-free (no date-fns). Instants are full UTC ISO strings; the native
// pickers' `timeZoneName` handles wall-clock selection/display in the BU zone, and these only
// parse/serialize the instant and format the trigger text.

// Parse a UTC ISO instant string to a Date. Returns undefined for empty/invalid input.
export function parseInstant(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

// Serialize an instant to a UTC ISO string (the value contract for the DateTime pickers).
export function toInstantIso(date: Date): string {
  return date.toISOString();
}

// Display an instant in the given IANA timezone (undefined ⇒ device zone). `locale` undefined ⇒
// device locale. Falls back to the device zone if the runtime rejects the timezone.
export function formatInstantDisplay(
  value: string | undefined,
  timeZone?: string,
  locale?: string,
): string | undefined {
  const date = parseInstant(value);
  if (!date) return undefined;
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(date);
  } catch {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  }
}
