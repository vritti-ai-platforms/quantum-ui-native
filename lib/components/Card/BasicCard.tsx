import { View } from 'react-native';
import { Skeleton } from '../../reusables/skeleton';
import { Text } from '../../reusables/text';
import { cn } from '../../utils/cn';
import { PressableCard } from './PressableCard';

export interface BasicCardProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  onPress?: () => void;
  selected?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

// Basic card with header, content slot, and footer
function BasicCard({
  title,
  description,
  children,
  footer,
  onPress,
  selected,
  disabled,
  isLoading,
  className,
}: BasicCardProps) {
  if (isLoading) {
    return (
      <View
        className={cn(
          'rounded-2xl border border-border bg-muted py-6 gap-6',
          className
        )}
      >
        <View className="gap-1.5 px-6">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-3.5 w-48 rounded" />
        </View>
        <Skeleton className="mx-6 h-12 rounded-lg" />
        <View className="flex-row justify-end px-6">
          <Skeleton className="h-9 w-20 rounded-lg" />
        </View>
      </View>
    );
  }

  return (
    <PressableCard
      onPress={onPress}
      selected={selected}
      disabled={disabled}
      className={cn(
        'rounded-2xl border border-border bg-card shadow-sm shadow-black/5 py-6 gap-6',
        className
      )}
    >
      <View className="gap-1.5 px-6">
        <Text className="text-base font-semibold text-foreground">{title}</Text>
        {description && (
          <Text className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </Text>
        )}
      </View>
      {children && <View className="px-6">{children}</View>}
      {footer && (
        <View className="flex-row justify-end px-6">{footer}</View>
      )}
    </PressableCard>
  );
}

BasicCard.displayName = 'BasicCard';

export { BasicCard };
