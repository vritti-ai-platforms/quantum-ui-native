import { DynamicColorIOS, Platform, View } from 'react-native';
import { usePlatformInfo } from '../../hooks/usePlatformInfo';
import { THEME } from '../../theme/colors';
import { Button } from '../Button';
import { COMMON_ICONS, DynamicIcon } from '../DynamicIcon';
import { Text } from '../Text';

// Glass is available only on iOS 26 with @callstack/liquid-glass present; otherwise the close button
// falls back to a solid secondary circle (Button's own glass→default fallback isn't the look we want).
const LiquidGlassAvailable =
  Platform.OS === 'ios'
    ? (() => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          return require('@callstack/liquid-glass').LiquidGlassView != null;
        } catch {
          return false;
        }
      })()
    : false;

// Neutral icon color for the glass close button (NativeWind var lookup is unreliable inside glass).
const IOS_FG =
  Platform.OS === 'ios' ? DynamicColorIOS({ light: THEME.light.foreground, dark: THEME.dark.foreground }) : null;

export interface BottomSheetHeaderBarProps {
  title?: string;
  onClose: () => void;
}

/**
 * In-flow sheet header: a centered title with a right-side circular close button (glass on iOS 26,
 * solid secondary otherwise). A left spacer matches the close-button width so the title stays centered.
 * Rendered by `<BottomSheet inlineHeader />`.
 */
export function BottomSheetHeaderBar({ title, onClose }: BottomSheetHeaderBarProps) {
  const platform = usePlatformInfo();
  const isIos26 = platform.os === 'ios' && platform.version >= 26 && LiquidGlassAvailable;

  return (
    <View className="flex-row items-center pb-3">
      <View className="w-12" />
      <Text className="text-foreground flex-1 text-center text-base font-semibold" numberOfLines={1}>
        {title}
      </Text>
      {isIos26 ? (
        <Button variant="glass" size="icon" onPress={onClose} accessibilityLabel="Close">
          <DynamicIcon icon={COMMON_ICONS.close} size={18} color={IOS_FG as unknown as string} />
        </Button>
      ) : (
        <Button variant="secondary" size="icon" onPress={onClose} accessibilityLabel="Close">
          <DynamicIcon icon={COMMON_ICONS.close} className="text-foreground" size={20} />
        </Button>
      )}
    </View>
  );
}

BottomSheetHeaderBar.displayName = 'BottomSheetHeaderBar';
