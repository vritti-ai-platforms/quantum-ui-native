import { View } from 'react-native';
import { Skeleton } from '../../reusables/skeleton';
import { Text } from '../../reusables/text';
import { cn } from '../../utils/cn';
import { PressableCard } from './PressableCard';

export interface ListItemCardProps {
  title: string;
  subtitle?: string;
  meta?: string;
  statusColor?: string;
  badge?: string;
  onPress?: () => void;
  selected?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

// Horizontal list item card with status dot, title/subtitle, and badge
function ListItemCard({
  title,
  subtitle,
  meta,
  statusColor = 'bg-success',
  badge,
  onPress,
  selected,
  disabled,
  isLoading,
  className,
}: ListItemCardProps) {
  if (isLoading) {
    return (
      <View
        className={cn(
          'rounded-2xl border border-border bg-muted flex-row items-center p-4 gap-3',
          className
        )}
      >
        <Skeleton className="w-2 h-2 rounded-full" />
        <View className="flex-1 gap-1.5">
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="h-3 w-24 rounded" />
        </View>
        <Skeleton className="h-6 w-12 rounded-md" />
      </View>
    );
  }

  return (
    <PressableCard
      onPress={onPress}
      selected={selected}
      disabled={disabled}
      className={cn(
        'rounded-2xl border border-border bg-card flex-row items-center p-4 gap-3',
        className
      )}
    >
      <View className={cn('w-2 h-2 rounded-full', statusColor)} />
      <View className="flex-1 gap-0.5">
        <Text className="text-[15px] font-semibold text-foreground">
          {title}
        </Text>
        {(subtitle || meta) && (
          <View className="flex-row items-center gap-1.5">
            {subtitle && (
              <Text className="text-[13px] text-muted-foreground">
                {subtitle}
              </Text>
            )}
            {subtitle && meta && (
              <Text className="text-[13px] text-muted-foreground">·</Text>
            )}
            {meta && (
              <Text className="text-[13px] text-muted-foreground">{meta}</Text>
            )}
          </View>
        )}
      </View>
      {badge && (
        <View className="rounded-md bg-muted px-2 py-1">
          <Text className="text-[11px] font-semibold text-muted-foreground">
            {badge}
          </Text>
        </View>
      )}
    </PressableCard>
  );
}

ListItemCard.displayName = 'ListItemCard';

export { ListItemCard };
