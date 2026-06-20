import { gql } from '@apollo/client';
import { forwardRef } from 'react';
import type { View } from 'react-native';
import { Select, type SelectProps } from '@vritti/quantum-ui-native/Select';

export type UserSelectorProps = Omit<SelectProps, 'optionsQuery' | 'optionsDataKey' | 'optionsEndpoint'>;

// GraphQL options query — forwards the shared SelectOptionsInput to the server's `usersOptions` resolver,
// which reuses the existing `UserService.findForSelect` (backs GET /users/select). No entity params.
const USERS_OPTIONS = gql`
  query UsersOptions($input: SelectOptionsInput) {
    usersOptions(input: $input) {
      options {
        value
        label
        description
        groupId
        additionals
      }
      groups {
        id
        name
      }
      hasMore
    }
  }
`;

// Pre-configured Select for user selection.
export const UserSelector = forwardRef<View, UserSelectorProps>((props, ref) => (
  <Select
    ref={ref}
    label="User"
    placeholder="Select user"
    searchable
    optionsQuery={USERS_OPTIONS}
    optionsDataKey="usersOptions"
    fieldKeys={{ valueKey: 'id', labelKey: 'fullName', descriptionKey: 'email' }}
    {...props}
  />
));
UserSelector.displayName = 'UserSelector';
