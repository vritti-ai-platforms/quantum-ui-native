import { useContext } from 'react';
import { FormatContext } from '../context/FormatContext';

// Active BU ISO-4217 currency code from FormatContext. Null ⇒ no currency context.
export function useBUCurrency(): string | null {
  return useContext(FormatContext).currency;
}
