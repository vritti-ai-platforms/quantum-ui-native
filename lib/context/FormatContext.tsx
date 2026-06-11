import { type Context, createContext, useMemo } from 'react';
import type React from 'react';

export interface FormatContextValue {
  /** Active BU IANA timezone (e.g. 'Asia/Kolkata'). Null ⇒ consumers fall back to the device zone. */
  timeZone: string | null;
  /** Active BU ISO-4217 currency code (e.g. 'INR'). Null ⇒ no currency context. */
  currency: string | null;
  /** BCP-47 locale tag (e.g. 'en-IN'). Null ⇒ Intl uses the device default. */
  locale: string | null;
}

const DEFAULT_VALUE: FormatContextValue = { timeZone: null, currency: null, locale: null };

// Module Federation: each bundle that imports this file would otherwise get its OWN `createContext()`
// instance, so a `<FormatProvider>` in the host would NOT connect to `useContext(FormatContext)` inside
// a micro-app remote — the context objects differ by identity even though React is a shared singleton.
// (Same reason usePickerTheme avoids ThemeContext, and ScreenContainer reaches HeaderHeightContext via a
// global map.) Stash ONE context object on a globalThis-keyed map so the host and every remote resolve
// to the identical instance; then Provider → useContext propagation works across the MF boundary.
const NAMED_CONTEXTS_KEY = '__quantum_ui_native_contexts';
type NamedContextsMap = Map<string, Context<unknown>>;
const namedContexts: NamedContextsMap =
  ((globalThis as Record<string, unknown>)[NAMED_CONTEXTS_KEY] as NamedContextsMap | undefined) ?? new Map();
(globalThis as Record<string, unknown>)[NAMED_CONTEXTS_KEY] = namedContexts;

export const FormatContext: Context<FormatContextValue> =
  (namedContexts.get('FormatContext') as Context<FormatContextValue> | undefined) ??
  (() => {
    const ctx = createContext<FormatContextValue>(DEFAULT_VALUE);
    ctx.displayName = 'FormatContext';
    namedContexts.set('FormatContext', ctx as Context<unknown>);
    return ctx;
  })();

export interface FormatProviderProps {
  timeZone?: string | null;
  currency?: string | null;
  locale?: string | null;
  children: React.ReactNode;
}

// Supplies the active Business Unit's timezone / currency / locale to the formatting hooks
// (useBUTimezone, useBUCurrency, useLocale, useFormatters) and the BU-aware date/time components.
// The host (e.g. core-app's PermissionProvider) feeds the active BU's values; switching BU/locale
// updates the context value and re-renders every consumer — including Module Federation remotes,
// because FormatContext is shared via globalThis (above) and react is a shared singleton.
export function FormatProvider({ timeZone = null, currency = null, locale = null, children }: FormatProviderProps) {
  const value = useMemo<FormatContextValue>(() => ({ timeZone, currency, locale }), [timeZone, currency, locale]);
  return <FormatContext.Provider value={value}>{children}</FormatContext.Provider>;
}
FormatProvider.displayName = 'FormatProvider';
