import { Pressable, View } from 'react-native';
import { Text } from '../../reusables/text';
import { cn } from '../../utils/cn';

export interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

// Full-width row with uppercase title and optional action link
function SectionHeader({ title, actionLabel, onAction, className }: SectionHeaderProps) {
  return (
    <View className={cn('flex-row items-center justify-between', className)}>
      <Text className="text-[13px] font-bold text-muted-foreground tracking-wide uppercase">
        {title}
      </Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text className="text-[13px] font-semibold text-primary">
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

SectionHeader.displayName = 'SectionHeader';

export { SectionHeader };
