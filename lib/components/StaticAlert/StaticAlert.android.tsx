// Android-flavored StaticAlert.
// Surface matches the Card primitive (bg-card, hairline border, rounded-md
// — the tighter Material 3 shape) so alerts feel like a small card with a
// leading icon. The variant only affects the icon colour — title and
// description stay in the neutral foreground / muted-foreground tokens
// used everywhere else in the UI.
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
      // Use individual sides (border-l/-r/-t/-b) instead of the `border` or
      // `border-x` shorthand — react-native-css occasionally drops one edge
      // on rounded surfaces when borders are declared via shorthands. Spelling
      // out all four sides forces every edge to render.
      className={cn(
        'flex-row items-start gap-3 rounded-xl shadow-sm border border-border bg-card px-4 py-3',
        className,
      )}
      {...props}
    >
      {/* h-[22px] matches the text-sm line-height (16px font × 1.375 leading)
          so the icon centres inside the title line regardless of font scaling. */}
      <View className="h-[22px] items-center justify-center">
        <DynamicIcon icon={iconDescriptor} className={cn('size-4', variantIconColor[variant])} />
      </View>
      <View className="flex-1 gap-1">
        {title ? <Text className="text-sm font-medium text-foreground">{title}</Text> : null}
        {description ? <Text className="text-sm leading-snug text-muted-foreground">{description}</Text> : null}
        {children}
      </View>
    </View>
  );
};

StaticAlert.displayName = 'StaticAlert';
