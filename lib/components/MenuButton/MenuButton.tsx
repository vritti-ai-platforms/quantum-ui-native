import { useUnstableNativeVariable } from 'nativewind';
import type * as React from 'react';
import { View } from 'react-native';
import * as DropdownMenu from 'zeego/dropdown-menu';
import { usePermissionGate } from '../../context/PermissionGateContext';
import { confirmDelete, useConfirm } from '../../hooks/useConfirm';
import { usePlatformInfo } from '../../hooks/usePlatformInfo';
import { Button, type ButtonProps } from '../Button';
import { DynamicIcon } from '../DynamicIcon';
import { type LockedPresentation, lockVariant, presentLockedAction } from '../Upsell';

// Default trigger: iOS 26's liquid-glass trigger carries the bare dots; pre-iOS 26 + Android use an
// outlined (circled) icon so it reads as a button on the flat background.
const MENU_ICON_GLASS = { sfSymbol: 'ellipsis', materialSymbol: 'more_vert' } as const;
const MENU_ICON_OUTLINED = { sfSymbol: 'ellipsis.circle', materialSymbol: 'more_vert' } as const;

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
  /**
   * Permission code for this action (mirrors web RowActions.permission). Role-denied (!granted) → the item
   * is hidden. Granted-but-locked → amber lock icon (+ amber label on Android; iOS UIMenu cannot color
   * titles) and selecting presents the upsell sheet instead of onSelect. Omitted → ungated (fail open).
   */
  permission?: string;
  /**
   * How a LOCKED select presents, mirroring the action's real surface: 'sheet' (default) presents the
   * upsell bottom sheet — for actions that open forms/sheets; 'alert' shows a native availability alert —
   * for actions whose real surface is an alert (e.g. delete confirms).
   */
  lockedPresentation?: LockedPresentation;
  /**
   * Opt-in native confirm before `onSelect` (for destructive actions like delete). When set, selecting
   * shows "Delete {name}?" (name defaults to `title`) with the optional custom `message`, and only runs
   * `onSelect` on confirm. Omit for actions that confirm elsewhere (no double-prompt).
   */
  confirm?: { name?: string; message?: string };
  onSelect: () => void;
}

// App-theme amber for the locked treatment: NativeWind var → hex (the native menu color parsers on both
// platforms want a concrete color; hex is safe where hsl() strings may not parse).
const useVar = useUnstableNativeVariable as unknown as (name: string) => string | undefined;
function hslTripleToHex(triple: string): string | undefined {
  const match = triple.match(/([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/);
  if (!match) return undefined;
  const h = Number(match[1]);
  const s = Number(match[2]) / 100;
  const l = Number(match[3]) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r, g, b] =
    hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x] : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x];
  const m = l - c / 2;
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export interface MenuButtonProps {
  /** Menu rows, rendered as native menu items (UIMenu on iOS / PopupMenu on Android). */
  actions: MenuAction[];
  /**
   * Trigger content shown in the button. Defaults to the platform-aware ellipsis "⋯" (bare dots on the
   * iOS 26 glass trigger, circled elsewhere) — pass a custom node only for non-standard triggers.
   */
  anchor?: React.ReactNode;
  accessibilityLabel?: string;
  /**
   * Trigger button variant. Defaults to `'glass'` (liquid glass on iOS 26, solid fallback elsewhere).
   * Inside a NATIVE-stack header (navigation.setOptions headerRight/Left) pass `'ghost'` — iOS 26 wraps
   * header items in its own glass capsule, so a glass trigger renders a double glass circle there.
   */
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
  anchor,
  accessibilityLabel,
  variant = 'glass',
  size = 'icon',
  disabled,
  buttonProps,
}: MenuButtonProps) => {
  // ONE hook for all actions — the raw gate fn is called per action inside the map (no hook-per-item).
  const gate = usePermissionGate();
  const confirm = useConfirm();
  const warningVar = useVar('--warning');
  const warningHex = typeof warningVar === 'string' ? hslTripleToHex(warningVar) : undefined;
  const destructiveVar = useVar('--destructive');
  const destructiveHex = typeof destructiveVar === 'string' ? hslTripleToHex(destructiveVar) : undefined;
  const platform = usePlatformInfo();
  const defaultAnchor = (
    <DynamicIcon
      icon={platform.os === 'ios' && platform.version >= 26 ? MENU_ICON_GLASS : MENU_ICON_OUTLINED}
      size={24}
    />
  );

  // Resolve each action's gate ONCE. Role-denied items (!granted) are dropped entirely (hidden, mirrors
  // web RowActions); the rest keep their resolved result for the lock treatment below.
  const visibleActions = actions
    .map((action) => ({ action, result: action.permission && gate ? gate(action.permission) : null }))
    .filter(({ result }) => result == null || result.granted);

  // iOS 26 attaches the native UIMenu at mount and does NOT rebuild it when item props change — a lock
  // state that resolves after the first render (SSE features landing) updated the JS onSelect but left
  // the stale pencil/normal item visuals. Remounting the root on any lock-state change forces a rebuild.
  const lockSignature = visibleActions.map(({ result }) => (result?.granted && result?.locked ? '1' : '0')).join('');

  // Nothing this role can see → no trigger at all (matches web's empty-actions → null).
  if (visibleActions.length === 0) return null;

  return (
    <DropdownMenu.Root key={lockSignature}>
      <DropdownMenu.Trigger asChild>
        {/* collapsable={false} so Fabric doesn't flatten the native menu's anchor view. */}
        <View collapsable={false}>
          <Button
            variant={variant}
            size={size}
            disabled={disabled}
            accessibilityLabel={accessibilityLabel}
            {...buttonProps}
          >
            {anchor ?? defaultAnchor}
          </Button>
        </View>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {visibleActions.map(({ action, result }) => {
          const locked = result != null && result.granted && result.locked;
          // Site (non-PLAN) locks tint the lock destructive; plan locks amber.
          const lockHex = result && lockVariant(result.reason) === 'site' ? destructiveHex : warningHex;
          // Keyed dispatch (no ternary chain): locked → upsell surface; confirm → native confirm then run;
          // plain → run directly. Lock precedes confirm so a locked item never shows the confirm.
          const mode = locked ? 'locked' : action.confirm ? 'confirm' : 'plain';
          const onSelect = {
            locked: () => result && presentLockedAction(result, action.lockedPresentation, action.title),
            confirm: async () => {
              const c = action.confirm;
              if (c && (await confirmDelete(confirm, c.name ?? action.title, c.message))) action.onSelect();
            },
            plain: action.onSelect,
          }[mode];
          return (
            <DropdownMenu.Item
              key={action.key}
              onSelect={onSelect}
              // A locked destructive item drops the red styling — amber lock + red title reads as two
              // conflicting states; locked wins.
              destructive={locked ? undefined : action.destructive}
              disabled={action.disabled}
              // titleColor is our patched-zeego Android passthrough (amber/destructive label; iOS UIMenu
              // ignores it — UIKit has no menu-item title color).
              {...(locked && lockHex ? ({ titleColor: lockHex } as unknown as Record<string, never>) : {})}
            >
              <DropdownMenu.ItemTitle>{action.title}</DropdownMenu.ItemTitle>
              {locked ? (
                // Lock tint (amber for plan, destructive for site): iOS via the SF-symbol hierarchicalColor;
                // Android via the patched-zeego androidImageColor passthrough tinting the drawable.
                <DropdownMenu.ItemIcon
                  ios={{ name: 'lock' as never, ...(lockHex ? { hierarchicalColor: lockHex } : {}) } as never}
                  androidIconName="ic_lock_lock"
                  {...({ androidImageColor: lockHex } as unknown as Record<string, never>)}
                />
              ) : action.sfSymbol ? (
                // zeego types `name` as an SF-symbol literal union; we accept a plain string for ergonomics.
                <DropdownMenu.ItemIcon
                  ios={{ name: action.sfSymbol as never }}
                  androidIconName={action.androidIconName}
                />
              ) : null}
            </DropdownMenu.Item>
          );
        })}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};
