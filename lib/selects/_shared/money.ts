// Minimal currency formatter for the select label transforms. The backend serves unit prices as
// minor-unit integer strings; this converts to the currency's major units and formats via Intl —
// avoiding the dinero/decimal dependency the web `utils/money` carries. Falls back to
// "<code> <minor>" if the runtime lacks Intl currency data.
export function formatCurrency(minor: string, currencyCode: string): string {
  try {
    const nf = new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode });
    const digits = nf.resolvedOptions().maximumFractionDigits ?? 2;
    const major = Number(minor) / 10 ** digits;
    return nf.format(major);
  } catch {
    return `${currencyCode} ${minor}`;
  }
}
