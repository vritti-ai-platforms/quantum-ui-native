import { View } from 'react-native';
import { Text } from '../../reusables/text';
import { cn } from '../../utils/cn';

export interface StatusDotProps {
  label: string;
  color?: string;
  className?: string;
}

// Small colored dot with text label for status indicators
function StatusDot({ label, color = 'bg-success', className }: StatusDotProps) {
  return (
    <View className={cn('flex-row items-center gap-1.5', className)}>
      <View className={cn('w-1.5 h-1.5 rounded-full', color)} />
      <Text className="text-[13px] font-medium text-foreground">{label}</Text>
    </View>
  );
}

StatusDot.displayName = 'StatusDot';

export { StatusDot };
