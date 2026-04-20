import type { ViewProps } from 'react-native';
import type { PlatformIconDescriptor } from '../DynamicIcon';
import { COMMON_ICONS } from '../DynamicIcon';
import {
  Alert as RnrAlert,
  AlertDescription as RnrAlertDescription,
  AlertTitle as RnrAlertTitle,
} from '../../reusables/alert';

const variantIcons: Record<string, PlatformIconDescriptor> = {
  default: COMMON_ICONS.info,
  destructive: COMMON_ICONS.alertError,
  warning: COMMON_ICONS.alertWarning,
  success: COMMON_ICONS.alertSuccess,
  info: COMMON_ICONS.info,
};

export interface AlertProps extends ViewProps {
  variant?: 'default' | 'destructive' | 'warning' | 'success' | 'info';
  title?: string;
  description?: string;
  icon?: PlatformIconDescriptor;
}

// Alert with variant-based auto icons — wraps the reusable Alert
function Alert({ variant = 'default', title, description, icon, children, ...props }: AlertProps) {
  const iconDescriptor = icon ?? variantIcons[variant] ?? COMMON_ICONS.info;

  return (
    <RnrAlert
      variant={variant === 'destructive' ? 'destructive' : 'default'}
      icon={iconDescriptor}
      {...props}
    >
      {title && <RnrAlertTitle>{title}</RnrAlertTitle>}
      {description && <RnrAlertDescription>{description}</RnrAlertDescription>}
      {children}
    </RnrAlert>
  );
}

Alert.displayName = 'Alert';

export { Alert };
