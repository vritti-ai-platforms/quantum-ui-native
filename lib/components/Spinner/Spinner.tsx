import { ActivityIndicator, type ActivityIndicatorProps } from 'react-native';

export interface SpinnerProps extends ActivityIndicatorProps {}

// Loading spinner — wraps ActivityIndicator with consistent defaults
const Spinner = ({ size = 'small', ...props }: SpinnerProps) => (
  <ActivityIndicator size={size} {...props} />
);

Spinner.displayName = 'Spinner';

export { Spinner };
