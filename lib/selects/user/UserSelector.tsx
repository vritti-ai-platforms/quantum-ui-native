import { forwardRef } from 'react';
import type { View } from 'react-native';
import { Select, type SelectProps } from '@vritti/quantum-ui-native/Select';

export type UserSelectorProps = Omit<SelectProps, 'optionsEndpoint'>;

// Pre-configured Select for user selection. Hits GET /users/select.
export const UserSelector = forwardRef<View, UserSelectorProps>((props, ref) => (
  <Select
    ref={ref}
    label="User"
    placeholder="Select user"
    searchable
    optionsEndpoint="users/select"
    fieldKeys={{ valueKey: 'id', labelKey: 'fullName', descriptionKey: 'email' }}
    {...props}
  />
));
UserSelector.displayName = 'UserSelector';
