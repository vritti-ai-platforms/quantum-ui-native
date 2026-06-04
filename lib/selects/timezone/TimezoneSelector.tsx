import { forwardRef } from 'react';
import type { View } from 'react-native';
import { Select, type SelectProps } from '@vritti/quantum-ui-native/Select';
import { TIMEZONES } from './timezones';

export type TimezoneSelectorProps = Omit<SelectProps, 'optionsEndpoint'>;

// Pre-configured Select for timezone selection with runtime-supported IANA options.
export const TimezoneSelector = forwardRef<View, TimezoneSelectorProps>((props, ref) => (
  <Select ref={ref} label="Timezone" placeholder="Select timezone" searchable options={TIMEZONES} {...props} />
));
TimezoneSelector.displayName = 'TimezoneSelector';
