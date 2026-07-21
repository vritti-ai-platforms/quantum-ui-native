import { useUnstableNativeVariable } from 'nativewind';
import { Platform, View } from 'react-native';
import { usePlatformInfo } from '../../hooks/usePlatformInfo';
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

// APP-theme foreground for the glass close button. Resolved from the shared NativeWind variable — NOT
// DynamicColorIOS/Appearance, which follow the SYSTEM scheme and painted the ✕ black when the app was
// dark over a light system. Same var-read pattern as ScreenHeaderBase/DynamicIcon.
const useVar = useUnstableNativeVariable as unknown as (name: string) => string | undefined;

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
  const fgVar = useVar('--foreground');
  const iosFg = typeof fgVar === 'string' ? `hsl(${fgVar})` : undefined;

  return (
    <View className="flex-row items-center pb-3">
      <View className="w-12" />
      <Text className="text-foreground flex-1 text-center text-base font-semibold" numberOfLines={1}>
        {title}
      </Text>
      {isIos26 ? (
        <Button variant="glass" size="icon" onPress={onClose} accessibilityLabel="Close">
          <DynamicIcon icon={COMMON_ICONS.close} size={18} color={iosFg} />
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
