import type * as PopoverPrimitive from '@rn-primitives/popover';
import * as React from 'react';
import { Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { COMMON_ICONS, DynamicIcon } from '../../components/DynamicIcon';
import { FlashList } from '../../components/FlashList';
import type { SelectOption } from '../../components/Select/types';
import { Spinner } from '../../components/Spinner';
import { Text } from '../../components/Typography';
import { darkColors, lightColors } from '../../theme/colors';
import { ThemeContext } from '../../theme/ThemeProvider';
import { cn } from '../../utils/index';
import { Input } from '../input';
import { Popover, PopoverContent, PopoverTrigger, usePopoverContext } from '../popover';

// RN analog of the web shadcnSingleSelect — Popover + a custom FlashList listbox.
// The popover is uncontrolled; the row/clear close it via usePopoverContext().

// Flattened row model so groups + options coexist in a single virtualized list
export type SelectListItem =
  | { type: 'group'; key: string; name: string }
  | { type: 'option'; key: string; option: SelectOption };

interface SelectListRootProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

// `open` is accepted for API symmetry but the popover is uncontrolled (Root owns its open
// state); onOpenChange syncs it out, and the rows close it via usePopoverContext().
function SelectListRoot({ open: _open, onOpenChange, disabled, children }: SelectListRootProps) {
  return <Popover onOpenChange={disabled ? undefined : onOpenChange}>{children}</Popover>;
}

interface SelectTriggerProps {
  children: React.ReactNode;
  disabled?: boolean;
  invalid?: boolean;
  minHeight?: boolean;
  className?: string;
}

const SelectTrigger = React.forwardRef<PopoverPrimitive.TriggerRef, SelectTriggerProps>(
  ({ children, disabled, invalid, minHeight, className }, ref) => {
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
      <PopoverTrigger ref={ref} disabled={disabled} asChild>
        <Pressable
          accessibilityRole="combobox"
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
      </PopoverTrigger>
    );
  },
);
SelectTrigger.displayName = 'SelectTrigger';

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
  portalHost?: string;
}

function SelectContent({ children, className, portalHost }: SelectContentProps) {
  const { triggerPosition } = usePopoverContext();
  const insets = useSafeAreaInsets();
  return (
    <PopoverContent
      portalHost={portalHost}
      insets={{ top: insets.top + 8, bottom: insets.bottom + 8, left: 12, right: 12 }}
      style={triggerPosition?.width ? { width: triggerPosition.width } : undefined}
      className={cn('p-1', className)}
    >
      {children}
    </PopoverContent>
  );
}

interface SelectSearchProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

function SelectSearch({ value, onValueChange, placeholder = 'Search...' }: SelectSearchProps) {
  return (
    <View className="px-1 pb-1">
      <Input
        value={value}
        onChangeText={onValueChange}
        placeholder={placeholder}
        accessibilityLabel="Search options"
        autoCapitalize="none"
        autoCorrect={false}
        className="h-9 rounded-lg"
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

const OPTION_ROW = 44;
const GROUP_ROW = 26;
const FOOTER = 40;
const EMPTY = 56;
const LIST_MAX_HEIGHT = 280;

function SelectList({ data, renderRow, onEndReached, loadingMore }: SelectListProps) {
  const renderItem = React.useCallback(
    ({ item }: { item: SelectListItem }) =>
      item.type === 'group' ? <SelectGroupLabel>{item.name}</SelectGroupLabel> : renderRow(item.option),
    [renderRow],
  );

  // FlashList needs a definite height to render; rows are single-line so heights are deterministic
  const listHeight =
    data.length === 0
      ? EMPTY
      : Math.min(
          data.reduce((h, item) => h + (item.type === 'group' ? GROUP_ROW : OPTION_ROW), 0) +
            (loadingMore ? FOOTER : 0),
          LIST_MAX_HEIGHT,
        );

  return (
    <View style={{ height: listHeight }}>
      <FlashList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        keyboardShouldPersistTaps="handled"
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        EmptyComponent={<SelectEmpty />}
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
    <View className="flex-row items-center justify-center gap-2 py-6">
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
  const { onOpenChange } = usePopoverContext();
  return (
    <Pressable
      accessibilityRole="menuitem"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={() => {
        onSelect();
        onOpenChange(false); // single-select closes on pick (popover is uncontrolled)
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
  const { onOpenChange } = usePopoverContext();
  return (
    <View className="border-border mt-1 flex-row items-center justify-end border-t px-1 pt-1">
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
