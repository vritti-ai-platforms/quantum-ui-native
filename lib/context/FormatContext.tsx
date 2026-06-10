import { createContext, useMemo } from 'react';
import type React from 'react';

export interface FormatContextValue {
  /** Active BU IANA timezone (e.g. 'Asia/Kolkata'). Null ⇒ consumers fall back to the device zone. */
  timeZone: string | null;
  /** Active BU ISO-4217 currency code (e.g. 'INR'). Null ⇒ no currency context. */
  currency: string | null;
  /** BCP-47 locale tag (e.g. 'en-IN'). Null ⇒ Intl uses the device default. */
  locale: string | null;
}

export const FormatContext = createContext<FormatContextValue>({
  timeZone: null,
  currency: null,
  locale: null,
});
FormatContext.displayName = 'FormatContext';

export interface FormatProviderProps {
  timeZone?: string | null;
  currency?: string | null;
  locale?: string | null;
  children: React.ReactNode;
}

// Supplies the active Business Unit's timezone / currency / locale to the formatting hooks
// (useBUTimezone, useBUCurrency, useLocale, useFormatters) and the BU-aware date/time components.
// The host (e.g. core-app's PermissionProvider) feeds the active BU's values; switching BU updates
// the context value and re-renders every consumer — including Module Federation remotes, provided
// @vritti/quantum-ui-native + react are shared singletons (the same requirement as the rest of the
// package). This is the native analogue of web's URL-driven resolveTimeZone/useBUTimezone.
export function FormatProvider({ timeZone = null, currency = null, locale = null, children }: FormatProviderProps) {
  const value = useMemo<FormatContextValue>(() => ({ timeZone, currency, locale }), [timeZone, currency, locale]);
  return <FormatContext.Provider value={value}>{children}</FormatContext.Provider>;
}
FormatProvider.displayName = 'FormatProvider';
