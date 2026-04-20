import { View } from 'react-native';
import type { PlatformIconDescriptor } from '../DynamicIcon';
import { COMMON_ICONS } from '../DynamicIcon';
import { DynamicIcon } from '../DynamicIcon';
import { Skeleton } from '../../reusables/skeleton';
import { Text } from '../../reusables/text';
import { cn } from '../../utils/cn';
import { PressableCard } from './PressableCard';

export interface SettingsRowCardProps {
  icon?: PlatformIconDescriptor;
  label: string;
  description?: string;
  onPress?: () => void;
  selected?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

// Horizontal settings row with icon, label/description, and chevron
function SettingsRowCard({
  icon,
  label,
  description,
  onPress,
  selected,
  disabled,
  isLoading,
  className,
}: SettingsRowCardProps) {
  if (isLoading) {
    return (
      <View
        className={cn(
          'bg-muted flex-row items-center py-3 px-4 gap-3',
          className
        )}
      >
        <Skeleton className="w-8 h-8 rounded-lg" />
        <View className="flex-1 gap-1">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-3 w-36 rounded" />
        </View>
        <Skeleton className="w-4.5 h-4.5 rounded" />
      </View>
    );
  }

  return (
    <PressableCard
      onPress={onPress}
      selected={selected}
      disabled={disabled}
      className={cn('bg-card flex-row items-center py-3 px-4 gap-3', className)}
    >
      {icon && (
        <View className="w-8 h-8 rounded-lg bg-muted items-center justify-center">
          <DynamicIcon icon={icon} size={18} className="text-muted-foreground" />
        </View>
      )}
      <View className="flex-1 gap-0.5">
        <Text className="text-[15px] font-medium text-foreground">{label}</Text>
        {description && (
          <Text className="text-xs text-muted-foreground">{description}</Text>
        )}
      </View>
      <DynamicIcon icon={COMMON_ICONS.chevronRight} size={18} className="text-muted-foreground" />
    </PressableCard>
  );
}

SettingsRowCard.displayName = 'SettingsRowCard';

export { SettingsRowCard };
