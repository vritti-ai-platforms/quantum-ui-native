import { forwardRef } from 'react';
import type { View } from 'react-native';
import { Select, type SelectProps } from '@vritti/quantum-ui-native/Select';
import { CURRENCIES } from './currencies';

export type CurrencySelectorProps = Omit<SelectProps, 'optionsEndpoint'> & {
  excludeCodes?: string[];
};

// Pre-configured Select for currency selection with local searchable options.
export const CurrencySelector = forwardRef<View, CurrencySelectorProps>(({ excludeCodes, ...props }, ref) => (
  <Select
    ref={ref}
    label="Currency"
    placeholder="Select currency"
    searchable
    options={
      excludeCodes && excludeCodes.length > 0
        ? CURRENCIES.filter((c) => !excludeCodes.includes(String(c.value)))
        : CURRENCIES
    }
    {...props}
  />
));
CurrencySelector.displayName = 'CurrencySelector';
