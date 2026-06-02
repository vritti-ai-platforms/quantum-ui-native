import { Pressable, View } from 'react-native';
import { COMMON_ICONS } from '../DynamicIcon';
import { DynamicIcon } from '../DynamicIcon';
import { Text } from '../Text';
import { cn } from '../../utils/cn';

export interface ChipProps {
  label: string;
  onRemove?: () => void;
  className?: string;
}

// Rounded pill with label and optional close icon for removable tags
function Chip({ label, onRemove, className }: ChipProps) {
  return (
    <View
      className={cn(
        'rounded-full border border-border bg-card flex-row items-center gap-1.5 py-1.5 px-3',
        className
      )}
    >
      <Text className="text-[13px] font-medium text-foreground">{label}</Text>
      {onRemove && (
        <Pressable onPress={onRemove} hitSlop={6}>
          <DynamicIcon icon={COMMON_ICONS.close} size={14} className="text-muted-foreground" />
        </Pressable>
      )}
    </View>
  );
}

Chip.displayName = 'Chip';

export { Chip };
