import { Pressable, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Icon } from '../../reusables/icon';
import { Skeleton } from '../../reusables/skeleton';
import { Text } from '../../reusables/text';
import { cn } from '../../utils/cn';
import { PressableCard } from './PressableCard';

export interface ProfileCardAction {
  icon: LucideIcon;
  onPress: () => void;
}

export interface ProfileCardProps {
  initials: string;
  name: string;
  role?: string;
  actions?: ProfileCardAction[];
  onPress?: () => void;
  selected?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

// Centered profile card with avatar circle, name, role, and action icon buttons
function ProfileCard({
  initials,
  name,
  role,
  actions,
  onPress,
  selected,
  disabled,
  isLoading,
  className,
}: ProfileCardProps) {
  if (isLoading) {
    return (
      <View
        className={cn(
          'rounded-2xl border border-border bg-muted items-center gap-4 p-6',
          className
        )}
      >
        <Skeleton className="w-14 h-14 rounded-full" />
        <View className="gap-1.5 items-center">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-3 w-40 rounded" />
        </View>
        <View className="flex-row gap-2">
          <Skeleton className="w-9 h-9 rounded-[10px]" />
          <Skeleton className="w-9 h-9 rounded-[10px]" />
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
        'rounded-2xl border border-border bg-card shadow-sm shadow-black/5 items-center gap-4 p-6',
        className
      )}
    >
      <View className="w-14 h-14 rounded-full bg-primary items-center justify-center">
        <Text className="text-lg font-bold text-primary-foreground">
          {initials}
        </Text>
      </View>
      <View className="gap-1 items-center w-full">
        <Text className="text-[17px] font-semibold text-foreground text-center">
          {name}
        </Text>
        {role && (
          <Text className="text-[13px] text-muted-foreground text-center">
            {role}
          </Text>
        )}
      </View>
      {actions && actions.length > 0 && (
        <View className="flex-row gap-2">
          {actions.map((action, index) => (
            <Pressable
              key={index}
              onPress={action.onPress}
              className="w-9 h-9 rounded-[10px] bg-muted items-center justify-center active:bg-accent"
            >
              <Icon
                as={action.icon}
                size={18}
                className="text-muted-foreground"
              />
            </Pressable>
          ))}
        </View>
      )}
    </PressableCard>
  );
}

ProfileCard.displayName = 'ProfileCard';

export { ProfileCard };
