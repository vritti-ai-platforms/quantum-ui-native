import { useMemo } from 'react';
import {
  type CurrencyAmount,
  type FormattedValue,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatString,
} from '../utils/format';
import { useBUCurrency } from './useBUCurrency';
import { useBUTimezone } from './useBUTimezone';
import { useLocale } from './useLocale';

// Formatters with the active BU's locale / currency / timezone pre-bound from FormatContext. Use
// inside any component/cell where you need consistent number/currency/date output without threading
// the context yourself. The returned object is stable across renders unless locale / currency /
// timezone change, so it's safe in dependency arrays. Intl-based (no date-fns).
//
// Example:
//   const fmt = useFormatters();
//   const { primary, secondary } = fmt.currency(po.totalAmount, { exchangeRate: po.exchangeRate });
export interface Formatters {
  string: (value: string | number | null | undefined) => FormattedValue;
  number: (value: number | string | null | undefined, options?: { fractionDigits?: number }) => FormattedValue;
  currency: (value: CurrencyAmount | null | undefined, options?: { exchangeRate?: number | null }) => FormattedValue;
  date: (value: string | null | undefined) => FormattedValue;
  dateTime: (value: string | null | undefined, options?: { timeZone?: string }) => FormattedValue;
}

export function useFormatters(): Formatters {
  const timeZone = useBUTimezone();
  const currency = useBUCurrency();
  const locale = useLocale();

  return useMemo<Formatters>(
    () => ({
      string: formatString,
      number: (value, options) => formatNumber(value, { localeTag: locale, fractionDigits: options?.fractionDigits }),
      currency: (value, options) =>
        formatCurrency(value, { buCurrency: currency, exchangeRate: options?.exchangeRate ?? null, localeTag: locale }),
      date: (value) => formatDate(value, { localeTag: locale }),
      dateTime: (value, options) =>
        formatDateTime(value, { localeTag: locale, buTimeZone: timeZone, timeZoneOverride: options?.timeZone }),
    }),
    [timeZone, currency, locale],
  );
}
