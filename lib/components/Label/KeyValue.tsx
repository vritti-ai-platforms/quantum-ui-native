import { View } from 'react-native';
import { Text } from '../Text';
import { cn } from '../../utils/cn';

export interface KeyValueProps {
  label: string;
  value: string;
  className?: string;
}

// Vertical stack with small muted key and larger bold value
function KeyValue({ label, value, className }: KeyValueProps) {
  return (
    <View className={cn('gap-0.5', className)}>
      <Text className="text-xs font-medium text-muted-foreground">{label}</Text>
      <Text className="text-[15px] font-semibold text-foreground">{value}</Text>
    </View>
  );
}

KeyValue.displayName = 'KeyValue';

export { KeyValue };
