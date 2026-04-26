// Default fallback for non-iOS / non-Android platforms.
// The platform-flavored variants live in StaticAlert.ios.tsx and
// StaticAlert.android.tsx; Metro picks the right file at bundle time.
//
// "StaticAlert" disambiguates from React Native's `Alert.alert(...)` modal API
// — this component is the in-screen, non-modal notification banner.
//
// Surface matches the Card primitive (bg-card, hairline border) so alerts
// feel like a small card with a leading icon. The variant only affects the
// icon colour — title and description stay in the neutral foreground /
// muted-foreground tokens used everywhere else in the UI.
import type { ViewProps } from 'react-native';
import { View } from 'react-native';
import { Text } from '../../reusables/text';
import { cn } from '../../utils/cn';
import { COMMON_ICONS, DynamicIcon, type PlatformIconDescriptor } from '../DynamicIcon';

export type StaticAlertVariant = 'default' | 'destructive' | 'warning' | 'success' | 'info';

export interface StaticAlertProps extends ViewProps {
  variant?: StaticAlertVariant;
  title?: string;
  description?: string;
  icon?: PlatformIconDescriptor;
}

const variantIcons: Record<StaticAlertVariant, PlatformIconDescriptor> = {
  default: COMMON_ICONS.info,
  destructive: COMMON_ICONS.alertError,
  warning: COMMON_ICONS.alertWarning,
  success: COMMON_ICONS.alertSuccess,
  info: COMMON_ICONS.info,
};

const variantIconColor: Record<StaticAlertVariant, string> = {
  default: 'text-muted-foreground',
  destructive: 'text-destructive',
  warning: 'text-warning',
  success: 'text-success',
  info: 'text-info',
};

export const StaticAlert = ({
  variant = 'default',
  title,
  description,
  icon,
  className,
  children,
  ...props
}: StaticAlertProps) => {
  const iconDescriptor = icon ?? variantIcons[variant];
  return (
    <View
      role="alert"
      className={cn('flex-row items-start gap-3 rounded-md border border-border bg-card px-4 py-3', className)}
      {...props}
    >
      <View className="pt-0.5">
        <DynamicIcon icon={iconDescriptor} className={cn('size-4', variantIconColor[variant])} />
      </View>
      <View className="flex-1 gap-1">
        {title ? <Text className="text-sm font-semibold text-foreground">{title}</Text> : null}
        {description ? <Text className="text-sm leading-snug text-muted-foreground">{description}</Text> : null}
        {children}
      </View>
    </View>
  );
};

StaticAlert.displayName = 'StaticAlert';
