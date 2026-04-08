import { View } from 'react-native';
import { TrendingDown, TrendingUp } from 'lucide-react-native';
import { Icon } from '../../reusables/icon';
import { Skeleton } from '../../reusables/skeleton';
import { Text } from '../../reusables/text';
import { cn } from '../../utils/cn';
import { PressableCard } from './PressableCard';

export interface StatCardProps {
  label: string;
  value: string | number;
  trendValue?: string;
  trendDirection?: 'up' | 'down';
  onPress?: () => void;
  selected?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

// Compact metric card with label, value, and optional trend indicator
function StatCard({
  label,
  value,
  trendValue,
  trendDirection,
  onPress,
  selected,
  disabled,
  isLoading,
  className,
}: StatCardProps) {
  if (isLoading) {
    return (
      <View
        className={cn(
          'rounded-2xl border border-border bg-muted p-4 gap-2',
          className
        )}
      >
        <Skeleton className="h-3 w-16 rounded" />
        <Skeleton className="h-7 w-24 rounded" />
        <Skeleton className="h-3 w-20 rounded" />
      </View>
    );
  }

  const TrendIcon = trendDirection === 'down' ? TrendingDown : TrendingUp;
  const trendColor =
    trendDirection === 'down' ? 'text-destructive' : 'text-success';

  return (
    <PressableCard
      onPress={onPress}
      selected={selected}
      disabled={disabled}
      className={cn(
        'rounded-2xl border border-border bg-card p-4 gap-2',
        className
      )}
    >
      <Text className="text-[13px] font-medium text-muted-foreground">
        {label}
      </Text>
      <Text className="text-[28px] font-bold text-foreground">
        {String(value)}
      </Text>
      {trendValue && trendDirection && (
        <View className="flex-row items-center gap-1">
          <Icon as={TrendIcon} size={14} className={trendColor} />
          <Text className={cn('text-[13px] font-semibold', trendColor)}>
            {trendValue}
          </Text>
        </View>
      )}
    </PressableCard>
  );
}

StatCard.displayName = 'StatCard';

export { StatCard };
