import { useContext } from 'react';
import { FormatContext } from '../context/FormatContext';

// Active BU IANA timezone from FormatContext. Null ⇒ consumers fall back to the device zone.
// Re-renders when the host switches BU (context value changes) — the native analogue of web's
// useBUTimezone (which re-resolves on router URL change).
export function useBUTimezone(): string | null {
  return useContext(FormatContext).timeZone;
}
