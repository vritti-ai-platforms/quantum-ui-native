import { View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Icon } from '../../reusables/icon';
import { Skeleton } from '../../reusables/skeleton';
import { Text } from '../../reusables/text';
import { cn } from '../../utils/cn';
import { Button } from '../Button';
import { PressableCard } from './PressableCard';

export interface ActionCardProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel: string;
  onAction?: () => void;
  onPress?: () => void;
  selected?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

// Centered card with icon, title, description, and full-width action button
function ActionCard({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  onPress,
  selected,
  disabled,
  isLoading,
  className,
}: ActionCardProps) {
  if (isLoading) {
    return (
      <View
        className={cn(
          'rounded-xl border border-border bg-muted items-center gap-6 py-6',
          className
        )}
      >
        <Skeleton className="w-12 h-12 rounded-full" />
        <View className="gap-1.5 px-6 w-full items-center">
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="h-3.5 w-48 rounded" />
        </View>
        <Skeleton className="mx-6 h-11 self-stretch rounded-xl" />
      </View>
    );
  }

  return (
    <PressableCard
      onPress={onPress}
      selected={selected}
      disabled={disabled}
      className={cn(
        'rounded-xl border border-border bg-card shadow-sm shadow-black/5 items-center gap-6 py-6',
        className
      )}
    >
      {icon && (
        <View className="w-12 h-12 rounded-full bg-primary/5 items-center justify-center">
          <Icon as={icon} size={22} className="text-primary" />
        </View>
      )}
      <View className="gap-1.5 px-6 w-full">
        <Text className="text-base font-semibold text-foreground text-center">
          {title}
        </Text>
        {description && (
          <Text className="text-sm text-muted-foreground text-center leading-relaxed">
            {description}
          </Text>
        )}
      </View>
      <Button
        onPress={onAction}
        disabled={disabled}
        className="mx-6 self-stretch rounded-xl h-11"
      >
        <Text className="text-[15px] font-semibold text-primary-foreground">
          {actionLabel}
        </Text>
      </Button>
    </PressableCard>
  );
}

ActionCard.displayName = 'ActionCard';

export { ActionCard };
