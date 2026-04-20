import { Pressable, View } from 'react-native';
import type { PlatformIconDescriptor } from '../DynamicIcon';
import { COMMON_ICONS } from '../DynamicIcon';
import { DynamicIcon } from '../DynamicIcon';
import { Skeleton } from '../../reusables/skeleton';
import { Text } from '../../reusables/text';
import { cn } from '../../utils/cn';
import { PressableCard } from './PressableCard';

export interface BannerCardProps {
  icon?: PlatformIconDescriptor;
  iconClassName?: string;
  message: string;
  onClose?: () => void;
  onPress?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

// Compact horizontal banner with icon, message, and optional close button
function BannerCard({
  icon = COMMON_ICONS.info,
  iconClassName,
  message,
  onClose,
  onPress,
  disabled,
  isLoading,
  className,
}: BannerCardProps) {
  if (isLoading) {
    return (
      <View
        className={cn(
          'rounded-lg border border-border bg-muted flex-row items-center py-2 px-2.5 gap-2',
          className
        )}
      >
        <Skeleton className="w-4 h-4 rounded-full" />
        <Skeleton className="flex-1 h-3.5 rounded" />
        <Skeleton className="w-3.5 h-3.5 rounded" />
      </View>
    );
  }

  return (
    <PressableCard
      onPress={onPress}
      disabled={disabled}
      className={cn(
        'rounded-lg border border-border bg-card flex-row items-center py-2 px-2.5 gap-2',
        className
      )}
    >
      <DynamicIcon
        icon={icon}
        size={16}
        className={cn('text-info', iconClassName)}
      />
      <Text className="text-sm font-medium text-foreground flex-1 leading-relaxed">
        {message}
      </Text>
      {onClose && (
        <Pressable onPress={onClose} hitSlop={8}>
          <DynamicIcon icon={COMMON_ICONS.close} size={14} className="text-muted-foreground" />
        </Pressable>
      )}
    </PressableCard>
  );
}

BannerCard.displayName = 'BannerCard';

export { BannerCard };
