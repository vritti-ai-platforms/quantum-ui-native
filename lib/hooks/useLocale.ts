import { useContext } from 'react';
import { FormatContext } from '../context/FormatContext';

// Active BCP-47 locale tag from FormatContext. Null ⇒ Intl formatters use the device default.
export function useLocale(): string | null {
  return useContext(FormatContext).locale;
}
