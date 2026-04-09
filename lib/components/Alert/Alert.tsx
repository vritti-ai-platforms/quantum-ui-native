import type { ViewProps } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react-native';
import {
  Alert as RnrAlert,
  AlertDescription as RnrAlertDescription,
  AlertTitle as RnrAlertTitle,
} from '../../reusables/alert';

const variantIcons: Record<string, LucideIcon> = {
  default: Info,
  destructive: AlertCircle,
  warning: TriangleAlert,
  success: CheckCircle2,
  info: Info,
};

export interface AlertProps extends ViewProps {
  variant?: 'default' | 'destructive' | 'warning' | 'success' | 'info';
  title?: string;
  description?: string;
  icon?: LucideIcon;
}

// Alert with variant-based auto icons — wraps the reusable Alert
function Alert({ variant = 'default', title, description, icon, children, ...props }: AlertProps) {
  const IconComponent = icon ?? variantIcons[variant] ?? Info;

  return (
    <RnrAlert
      variant={variant === 'destructive' ? 'destructive' : 'default'}
      icon={IconComponent}
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
