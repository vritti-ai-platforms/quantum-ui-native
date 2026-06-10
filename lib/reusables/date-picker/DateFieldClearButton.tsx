import { Pressable, View } from 'react-native';
import { COMMON_ICONS, DynamicIcon } from '../../components/DynamicIcon';

// An absolutely-positioned, right-aligned clear (X) control. Rendered as the LAST child of a field's
// `relative` wrapper so it sits ABOVE the transparent native DateTimePicker overlay (which would
// otherwise swallow taps if the X were nested inside DateFieldTrigger). Positioning lives on this
// Pressable — DynamicIcon ignores layout className (margin), so size is set via its `size` prop.
export function DateFieldClearButton({ onClear }: { onClear: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Clear"
      hitSlop={8}
      onPress={onClear}
      className="absolute bottom-0 right-0 top-0 justify-center px-3"
    >
     <View className="pl-2 pr-2"><DynamicIcon icon={COMMON_ICONS.close} className="text-muted-foreground" /></View> 
    </Pressable>
  );
}
