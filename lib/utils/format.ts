// Pure value formatters for quantum-ui-native — Intl-based (NO date-fns: it breaks under the apps'
// Re.Pack/Hermes CJS↔ESM interop, see reusables/date-picker/dateUtils.ts). Mirrors the shape of
// @vritti/quantum-ui's web formatters: every function returns { primary, secondary? }.
//   `primary`   — what the consumer renders.
//   `secondary` — a muted supplementary line: the BU-currency equivalent (≈ INR 1,049.38) or the
//                 device-zone time ("Your time: …") on dateTime values.
// These take all locale/timezone/currency context as options and never call hooks; the
// useFormatters() hook adapts them to FormatContext.

export type CurrencyAmount = { currency: string; value: string };
export type FormattedValue = { primary: string; secondary?: string };

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EM_DASH = '—';

const deviceTimeZone = (): string | undefined => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
};

export function formatString(value: string | number | null | undefined): FormattedValue {
  if (value == null) return { primary: EM_DASH };
  return { primary: String(value) };
}

export interface FormatNumberOptions {
  localeTag?: string | null;
  fractionDigits?: number;
}

export function formatNumber(
  value: number | string | null | undefined,
  options: FormatNumberOptions = {},
): FormattedValue {
  if (value == null || value === '') return { primary: EM_DASH };
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return { primary: EM_DASH };
  try {
    const fmt = new Intl.NumberFormat(
      options.localeTag ?? undefined,
      options.fractionDigits != null
        ? { minimumFractionDigits: options.fractionDigits, maximumFractionDigits: options.fractionDigits }
        : undefined,
    );
    return { primary: fmt.format(num) };
  } catch {
    return { primary: String(num) };
  }
}

export interface FormatCurrencyOptions {
  // BU's authoritative currency (typically from useBUCurrency at the call site).
  buCurrency?: string | null;
  // Multiplier: value × exchangeRate = BU-currency amount. With a BU currency that differs from the
  // value's currency, a `≈ {bu-formatted}` secondary line is returned.
  exchangeRate?: number | null;
  localeTag?: string | null;
}

const currencyFormat = (amount: number, currency: string, localeTag?: string | null): string => {
  try {
    return new Intl.NumberFormat(localeTag ?? undefined, { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
};

export function formatCurrency(
  value: CurrencyAmount | null | undefined,
  options: FormatCurrencyOptions = {},
): FormattedValue {
  if (value == null) return { primary: EM_DASH };
  const amount = Number(value.value);
  if (!Number.isFinite(amount)) return { primary: EM_DASH };
  const primary = currencyFormat(amount, value.currency, options.localeTag);

  const { buCurrency, exchangeRate } = options;
  // Plain Number math for the BU-currency equivalent — adequate for mobile display. (Web uses
  // Decimal/dinero for bigint precision, which isn't available in this bundle.)
  if (exchangeRate != null && Number.isFinite(exchangeRate) && buCurrency && buCurrency !== value.currency) {
    const converted = amount * exchangeRate;
    if (Number.isFinite(converted)) {
      return { primary, secondary: `≈ ${currencyFormat(converted, buCurrency, options.localeTag)}` };
    }
  }
  return { primary };
}

export interface FormatDateOptions {
  localeTag?: string | null;
}

export function formatDate(value: string | null | undefined, options: FormatDateOptions = {}): FormattedValue {
  if (!value) return { primary: EM_DASH };
  // Render date-only values in UTC so the displayed day matches the stored YYYY-MM-DD regardless
  // of the device offset.
  const date = new Date(DATE_ONLY_PATTERN.test(value) ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return { primary: EM_DASH };
  try {
    return {
      primary: new Intl.DateTimeFormat(options.localeTag ?? undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(date),
    };
  } catch {
    return { primary: value };
  }
}

export interface FormatDateTimeOptions {
  localeTag?: string | null;
  // BU timezone (from useBUTimezone). Primary zone when no override is given.
  buTimeZone?: string | null;
  // Overrides the BU timezone for this value.
  timeZoneOverride?: string | null;
}

export function formatDateTime(
  value: string | null | undefined,
  options: FormatDateTimeOptions = {},
): FormattedValue {
  if (!value) return { primary: EM_DASH };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { primary: EM_DASH };

  const primaryTz = options.timeZoneOverride ?? options.buTimeZone ?? null;
  const fmt = (tz: string | undefined) =>
    new Intl.DateTimeFormat(options.localeTag ?? undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone: tz }).format(date);
  try {
    if (!primaryTz) return { primary: fmt(undefined) };
    const primary = `${fmt(primaryTz)} (${primaryTz})`;
    const userTz = deviceTimeZone();
    if (!userTz || userTz === primaryTz) return { primary };
    return { primary, secondary: `Your time: ${fmt(userTz)} (${userTz})` };
  } catch {
    return { primary: value };
  }
}
