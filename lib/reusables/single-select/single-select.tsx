import { BottomSheetTextInput, useBottomSheetScrollableCreator } from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import { useUnstableNativeVariable } from 'nativewind';
import * as React from 'react';
import {
  DynamicColorIOS,
  Platform,
  Pressable,
  type StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet, type BottomSheetRef } from '../../components/BottomSheet';
import { Button } from '../../components/Button';
import { COMMON_ICONS, DynamicIcon } from '../../components/DynamicIcon';
import type { SelectOption } from '../../components/Select/types';
import { Spinner } from '../../components/Spinner';
import { Text } from '../../components/Text';
import { usePlatformInfo } from '../../hooks/usePlatformInfo';
import { darkColors, lightColors, THEME } from '../../theme/colors';
import { ThemeContext } from '../../theme/ThemeProvider';
import { cn } from '../../utils/index';

// RN analog of the web shadcnSingleSelect — a half BottomSheet (80%) with a fixed title
// header (the field label), a fixed search bar, and a scrollable FlashList of options.
// Single-select closes the sheet on pick (via useSelectSheetContext().onOpenChange).

// Flattened row model so groups + options coexist in a single virtualized list
export type SelectListItem =
  | { type: 'group'; key: string; name: string }
  | { type: 'option'; key: string; option: SelectOption };

// className colors don't apply to a TextInput (and BottomSheetTextInput isn't NativeWind-registered),
// so the search resolves theme colors from the shared NativeWind variable context and applies them
// inline — same approach as reusables/input. Shared across the MF boundary, always the active theme.
const useVar = useUnstableNativeVariable as unknown as (name: string) => string | undefined;

type LiquidGlassComponent = React.ComponentType<{
  style?: StyleProp<ViewStyle>;
  effect?: 'clear' | 'regular' | 'none';
  interactive?: boolean;
}>;

// Optional iOS-26 liquid glass (null on Android / when the lib is absent), mirroring BottomSheet.ios.
const LiquidGlass: LiquidGlassComponent | null =
  Platform.OS === 'ios'
    ? (() => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          return require('@callstack/liquid-glass').LiquidGlassView ?? null;
        } catch {
          return null;
        }
      })()
    : null;

// Neutral icon color for the glass close button (NativeWind var lookup is unreliable inside glass).
const IOS_FG =
  Platform.OS === 'ios' ? DynamicColorIOS({ light: THEME.light.foreground, dark: THEME.dark.foreground }) : null;

const SEARCH_HEIGHT = 44;
const SEARCH_RADIUS = 9999; // clamps to a pill at SEARCH_HEIGHT

interface SelectSheetContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  disabled?: boolean;
}

const SelectSheetContext = React.createContext<SelectSheetContextValue | null>(null);

function useSelectSheetContext(): SelectSheetContextValue {
  const ctx = React.useContext(SelectSheetContext);
  if (!ctx) throw new Error('Select primitives must be used within <SelectListRoot>');
  return ctx;
}

interface SelectListRootProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}

const noop = () => {};

function SelectListRoot({ open, onOpenChange, disabled, title, children }: SelectListRootProps) {
  const value = React.useMemo<SelectSheetContextValue>(
    () => ({ open, onOpenChange: disabled ? noop : onOpenChange, title, disabled }),
    [open, onOpenChange, disabled, title],
  );
  return <SelectSheetContext.Provider value={value}>{children}</SelectSheetContext.Provider>;
}

interface SelectTriggerProps {
  children: React.ReactNode;
  disabled?: boolean;
  invalid?: boolean;
  minHeight?: boolean;
  className?: string;
}

const SelectTrigger = React.forwardRef<View, SelectTriggerProps>(
  ({ children, disabled, invalid, minHeight, className }, ref) => {
    const { onOpenChange } = useSelectSheetContext();
    // The host-owned (MF-shared) Select doesn't resolve NativeWind dark: variants across the
    // bundle boundary, so resolve the input fill from ThemeContext and apply it via style
    // (mirrors how ScreenContainer resolves --background). Dark: input/30 over the near-black bg.
    // Light: solid --input (light input/30 ≈ the white bg, so it would be invisible).
    const { colorScheme } = React.useContext(ThemeContext);
    const triggerStyle =
      colorScheme === 'dark'
        ? { backgroundColor: `hsla(${darkColors['--input'].split(' ').join(', ')}, 0.3)` }
        : { backgroundColor: `hsla(${lightColors['--input'].split(' ').join(', ')}, 0.3)` };
    // Match the TextField/Input height (platform-specific): iOS h-12, Android h-14.
    const triggerHeight = minHeight
      ? Platform.select({ ios: 'min-h-12', android: 'min-h-14', default: 'min-h-11' })
      : Platform.select({ ios: 'h-12', android: 'h-14', default: 'h-11' });
    return (
      <Pressable
        ref={ref}
        accessibilityRole="combobox"
        disabled={disabled}
        onPress={() => onOpenChange(true)}
        style={triggerStyle}
        className={cn(
          'border-input flex-row items-center justify-between gap-2 rounded-md border pl-3 pr-4 py-2 shadow-sm shadow-black/5',
          triggerHeight,
          invalid && 'border-destructive',
          disabled && 'opacity-50',
          className,
        )}
      >
        <View className="flex-1 flex-row flex-wrap items-center gap-2 overflow-hidden">{children}</View>
        <DynamicIcon icon={COMMON_ICONS.chevronDown} className="text-muted-foreground size-4 shrink-0" />
      </Pressable>
    );
  },
);
SelectTrigger.displayName = 'SelectTrigger';

interface SelectContentProps {
  // The scrollable options list (SelectList / SelectLoading)
  children: React.ReactNode;
  // Fixed region above the list
  search?: React.ReactNode;
  // Fixed region below the list (Clear / Select-All・Clear)
  footer?: React.ReactNode;
}

function SelectContent({ children, search, footer }: SelectContentProps) {
  const ctx = useSelectSheetContext();
  const { open, onOpenChange, title } = ctx;
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  const platform = usePlatformInfo();
  const isIos26 = platform.os === 'ios' && platform.version >= 26 && LiquidGlass != null;
  const sheetRef = React.useRef<BottomSheetRef>(null);
  // Bridges the declarative `open` to the imperative sheet without looping: a drag-down dismiss
  // fires onDismiss → onOpenChange(false), which must not trigger another dismiss().
  const presentedRef = React.useRef(false);

  React.useEffect(() => {
    if (open && !presentedRef.current) {
      presentedRef.current = true;
      sheetRef.current?.present();
    } else if (!open && presentedRef.current) {
      presentedRef.current = false;
      sheetRef.current?.dismiss();
    }
  }, [open]);

  const handleDismiss = React.useCallback(() => {
    presentedRef.current = false;
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <BottomSheet ref={sheetRef} detents={['80%']} variant="solid" showCloseButton={false} onDismiss={handleDismiss}>
      {/* The sheet renders children in a portal (context doesn't cross it) — re-inject so the
          rows/footer can close the sheet, mirroring how BottomSheet re-injects ThemeContext. */}
      <SelectSheetContext.Provider value={ctx}>
        {/* Explicit height so the flex-1 list is bounded on iOS too (BottomSheetView sizes to content there). */}
        <View className="px-4" style={{ height: winH * 0.8, paddingBottom: insets.bottom }}>
          {/* Header — circular close on the left + centered title (WhatsApp-style). */}
          <View className="flex-row items-center pb-3">
            {isIos26 ? (
              // iOS 26: glass icon button (size="icon" → 48×48 LiquidGlass circle).
              <Button variant="glass" size="icon" onPress={() => onOpenChange(false)} accessibilityLabel="Close">
                <DynamicIcon icon={COMMON_ICONS.close} size={18} color={IOS_FG as unknown as string} />
              </Button>
            ) : (
              // Other platforms: a solid circular secondary button mirroring the iOS-26 close.
              <Button variant="secondary" size="icon" onPress={() => onOpenChange(false)} accessibilityLabel="Close">
                <DynamicIcon icon={COMMON_ICONS.close} className="text-foreground" size={20} />
              </Button>
            )}
            <Text className="text-foreground flex-1 text-center text-base font-semibold" numberOfLines={1}>
              {title}
            </Text>
            {/* Spacer matching the close button width so the title stays optically centered. */}
            <View className="w-12" />
          </View>
          {search}
          {children}
          {footer}
        </View>
      </SelectSheetContext.Provider>
    </BottomSheet>
  );
}

interface SelectSearchProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

function SelectSearch({ value, onValueChange, placeholder = 'Search...' }: SelectSearchProps) {
  const [focused, setFocused] = React.useState(false);
  const platform = usePlatformInfo();
  const isIos26 = platform.os === 'ios' && platform.version >= 26 && LiquidGlass != null;
  const inputVar = useVar('--input');
  const borderVar = useVar('--border');
  const primaryVar = useVar('--primary');
  const foregroundVar = useVar('--foreground');
  const mutedFgVar = useVar('--muted-foreground');

  // The input floats on top of the glass (not inside it), so useVar colors still resolve.
  const textColor = foregroundVar ? `hsl(${foregroundVar})` : undefined;
  const placeholderColor = mutedFgVar ? `hsla(${mutedFgVar.split(' ').join(', ')}, 0.5)` : undefined;
  const commonProps = {
    value,
    onChangeText: onValueChange,
    placeholder,
    placeholderTextColor: placeholderColor,
    accessibilityLabel: 'Search options',
    autoCapitalize: 'none' as const,
    autoCorrect: false,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
  };

  // iOS 26: a glass capsule — LiquidGlass fills a rounded clip, the input floats on top (transparent).
  if (isIos26 && LiquidGlass) {
    return (
      <View className="pb-2">
        <View style={{ height: SEARCH_HEIGHT, borderRadius: SEARCH_RADIUS, overflow: 'hidden' }}>
          <LiquidGlass
            style={[StyleSheet.absoluteFillObject, { borderRadius: SEARCH_RADIUS }]}
            effect="regular"
            interactive={false}
          />
          <BottomSheetTextInput
            {...commonProps}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              borderWidth: 0,
              paddingHorizontal: 16,
              fontSize: 16,
              color: textColor,
            }}
          />
        </View>
      </View>
    );
  }

  // pre-iOS 26 / Android: bordered fill, pill-shaped.
  const borderToken = focused ? primaryVar : borderVar;
  return (
    <View className="pb-2">
      <BottomSheetTextInput
        {...commonProps}
        style={{
          backgroundColor: inputVar ? `hsla(${inputVar.split(' ').join(', ')}, 0.3)` : undefined,
          borderColor: borderToken ? `hsl(${borderToken})` : undefined,
          borderWidth: focused ? 1.5 : 1,
          borderRadius: SEARCH_RADIUS,
          height: SEARCH_HEIGHT,
          paddingHorizontal: 16,
          fontSize: 16,
          color: textColor,
        }}
      />
    </View>
  );
}

interface SelectListProps {
  data: SelectListItem[];
  renderRow: (option: SelectOption) => React.ReactElement;
  onEndReached?: () => void;
  loadingMore?: boolean;
}

function SelectList({ data, renderRow, onEndReached, loadingMore }: SelectListProps) {
  const renderItem = React.useCallback(
    ({ item }: { item: SelectListItem }) =>
      item.type === 'group' ? <SelectGroupLabel>{item.name}</SelectGroupLabel> : renderRow(item.option),
    [renderRow],
  );

  // Bottom-sheet-aware scroll component (replaces the deprecated BottomSheetFlashList wrapper) so the
  // FlashList's scroll/drag interactions integrate with the sheet.
  const renderScrollComponent = useBottomSheetScrollableCreator();

  // flex-1 fills the middle of the explicit-height sheet box; the FlashList scrolls within it.
  return (
    <View style={{ flex: 1 }}>
      <FlashList
        renderScrollComponent={renderScrollComponent}
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        keyboardShouldPersistTaps="handled"
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={<SelectEmpty />}
        ListFooterComponent={
          loadingMore ? (
            <View className="flex-row items-center justify-center gap-2 py-2">
              <Spinner size="small" />
              <Text className="text-muted-foreground text-xs">Loading more...</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

function SelectLoading() {
  return (
    <View className="flex-1 flex-row items-center justify-center gap-2 py-6">
      <Spinner size="small" />
      <Text className="text-muted-foreground text-sm">Loading...</Text>
    </View>
  );
}

function SelectEmpty({ children }: { children?: React.ReactNode }) {
  return (
    <View className="items-center justify-center py-6">
      <Text className="text-muted-foreground text-sm">{children ?? 'No options found.'}</Text>
    </View>
  );
}

function SelectGroupLabel({ children }: { children: React.ReactNode }) {
  return <Text className="text-primary px-2 py-1 text-[10px] font-semibold uppercase tracking-wide">{children}</Text>;
}

interface SingleSelectRowProps {
  name: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

const SingleSelectRow = React.memo(function SingleSelectRow({
  name,
  description,
  selected,
  onSelect,
  disabled,
}: SingleSelectRowProps) {
  const { onOpenChange } = useSelectSheetContext();
  return (
    <Pressable
      accessibilityRole="menuitem"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={() => {
        onSelect();
        onOpenChange(false); // single-select closes the sheet on pick
      }}
      className={cn(
        'active:bg-accent relative flex-col justify-center rounded-sm px-2 pr-8',
        description ? 'min-h-11 py-1.5' : 'h-9',
        disabled && 'opacity-50',
      )}
    >
      <Text className="text-foreground text-sm" numberOfLines={1}>
        {name}
      </Text>
      {description ? (
        <Text className="text-muted-foreground mt-0.5 text-xs" numberOfLines={1}>
          {description}
        </Text>
      ) : null}
      <View className="absolute right-2 size-3.5 items-center justify-center">
        {selected ? <DynamicIcon icon={COMMON_ICONS.check} className="text-foreground size-4" /> : null}
      </View>
    </Pressable>
  );
});

interface SingleSelectClearProps {
  onClear: () => void;
  disabled?: boolean;
}

function SingleSelectClear({ onClear, disabled }: SingleSelectClearProps) {
  const { onOpenChange } = useSelectSheetContext();
  return (
    <View className="border-border mt-2 flex-row items-center justify-end border-t px-1 pt-2">
      <Button
        variant="ghost"
        size="sm"
        disabled={disabled}
        onPress={() => {
          onClear();
          onOpenChange(false);
        }}
      >
        <Text className="text-muted-foreground text-xs font-medium">Clear</Text>
      </Button>
    </View>
  );
}

export {
  SelectContent,
  SelectEmpty,
  SelectGroupLabel,
  SelectList,
  SelectListRoot,
  SelectLoading,
  SelectSearch,
  SelectTrigger,
  SingleSelectClear,
  SingleSelectRow,
};
