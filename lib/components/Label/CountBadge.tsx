import { View } from 'react-native';
import { Text } from '../../reusables/text';
import { cn } from '../../utils/cn';

export interface CountBadgeProps {
  count: number;
  className?: string;
}

// Small red circle with white count number for notifications
function CountBadge({ count, className }: CountBadgeProps) {
  return (
    <View
      className={cn(
        'w-5 h-5 rounded-full bg-destructive items-center justify-center',
        className
      )}
    >
      <Text className="text-[11px] font-bold text-white">{String(count)}</Text>
    </View>
  );
}

CountBadge.displayName = 'CountBadge';

export { CountBadge };
