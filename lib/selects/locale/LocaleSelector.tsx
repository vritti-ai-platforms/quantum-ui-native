import { forwardRef } from 'react';
import type { View } from 'react-native';
import { Select, type SelectProps } from '@vritti/quantum-ui-native/Select';
import { LOCALES } from './locales';

export type LocaleSelectorProps = Omit<SelectProps, 'optionsEndpoint'>;

// Pre-configured Select for locale selection with local searchable options.
export const LocaleSelector = forwardRef<View, LocaleSelectorProps>((props, ref) => (
  <Select ref={ref} label="Language" placeholder="Select language" searchable options={LOCALES} {...props} />
));
LocaleSelector.displayName = 'LocaleSelector';
