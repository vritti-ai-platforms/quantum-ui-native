import { useBUTimezone } from '../../hooks/useBUTimezone';
import { useLocale } from '../../hooks/useLocale';
import { Text } from '../Text';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface FormattedDateProps {
  /** A UTC ISO instant ('…T…Z') or a date-only string ('YYYY-MM-DD'). */
  value: string | null | undefined;
  /** Force date-only rendering (UTC, no time). Auto-detected for 'YYYY-MM-DD' values. */
  dateOnly?: boolean;
  /** IANA timezone override. Defaults to the active BU zone (useBUTimezone), then the device zone. */
  timeZone?: string;
  fallback?: string;
  className?: string;
}

// Renders a stored UTC date/instant in the active BU timezone (Intl-based, no date-fns — same
// constraint as the rest of the package). Date-only values render in UTC so the displayed day
// never shifts with the device offset. Mirrors @vritti/quantum-ui's web <FormattedDate>.
export function FormattedDate({ value, dateOnly, timeZone, fallback = '—', className }: FormattedDateProps) {
  const buTimeZone = useBUTimezone();
  const locale = useLocale() ?? undefined;

  if (!value) return <Text className={className}>{fallback}</Text>;

  const isDateOnly = dateOnly || DATE_ONLY_PATTERN.test(value);
  const date = new Date(isDateOnly && DATE_ONLY_PATTERN.test(value) ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return <Text className={className}>{fallback}</Text>;

  try {
    const options: Intl.DateTimeFormatOptions = isDateOnly
      ? { dateStyle: 'medium', timeZone: 'UTC' }
      : { dateStyle: 'medium', timeStyle: 'short', timeZone: timeZone ?? buTimeZone ?? undefined };
    return <Text className={className}>{new Intl.DateTimeFormat(locale, options).format(date)}</Text>;
  } catch {
    return <Text className={className}>{value}</Text>;
  }
}

FormattedDate.displayName = 'FormattedDate';
