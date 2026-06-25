import * as React from 'react';
import { View } from 'react-native';
import * as DropdownMenu from 'zeego/dropdown-menu';
import { Button, type ButtonProps } from '../Button';

export interface MenuAction {
  /** Unique within the menu — zeego requires a stable key on every item. */
  key: string;
  /** Row label. */
  title: string;
  /** iOS SF Symbol name shown next to the title (e.g. `'plus'`). No-op on Android unless `androidIconName` is set. */
  sfSymbol?: string;
  /** Android drawable/resource name for the row icon. */
  androidIconName?: string;
  /** Native red/destructive styling. */
  destructive?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

export interface MenuButtonProps {
  /** Menu rows, rendered as native menu items (UIMenu on iOS / PopupMenu on Android). */
  actions: MenuAction[];
  /** Trigger content — the icon shown in the button (e.g. `<DynamicIcon … />`). */
  children?: React.ReactNode;
  accessibilityLabel?: string;
  /** Trigger button variant. Defaults to `'glass'` (liquid glass on iOS 26, solid fallback elsewhere). */
  variant?: ButtonProps['variant'];
  /** Trigger button size. Defaults to `'icon'`. */
  size?: ButtonProps['size'];
  /** Disable the whole trigger (and menu). */
  disabled?: boolean;
  /** Extra passthrough to the trigger Button (hitSlop, className, testID, …). */
  buttonProps?: Omit<ButtonProps, 'variant' | 'size' | 'children' | 'disabled' | 'onPress'>;
}

// A glass icon button that opens a NATIVE menu on tap (zeego DropdownMenu → react-native-ios-context-menu
// on iOS / @react-native-menu/menu on Android). The menu surface is system-rendered (liquid glass on
// iOS 26, plain menu on iOS<26, Material dropdown on Android) and auto-themes; only the trigger is styled
// (by Button). The native menu opens itself on tap of the anchor — the Button takes no onPress.
export const MenuButton = ({
  actions,
  children,
  accessibilityLabel,
  variant = 'glass',
  size = 'icon',
  disabled,
  buttonProps,
}: MenuButtonProps) => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        {/* collapsable={false} so Fabric doesn't flatten the native menu's anchor view. */}
        <View collapsable={false}>
          <Button variant={variant} size={size} disabled={disabled} accessibilityLabel={accessibilityLabel} {...buttonProps}>
            {children}
          </Button>
        </View>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {actions.map((action) => (
          <DropdownMenu.Item key={action.key} onSelect={action.onSelect} destructive={action.destructive} disabled={action.disabled}>
            <DropdownMenu.ItemTitle>{action.title}</DropdownMenu.ItemTitle>
            {action.sfSymbol ? (
              // zeego types `name` as an SF-symbol literal union; we accept a plain string for ergonomics.
              <DropdownMenu.ItemIcon ios={{ name: action.sfSymbol as never }} androidIconName={action.androidIconName} />
            ) : null}
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};
