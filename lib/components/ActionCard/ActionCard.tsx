import type { ReactNode } from 'react';
import { View } from 'react-native';
import { usePermission } from '../../context/PermissionGateContext';
import { confirmDelete, useConfirm } from '../../hooks/useConfirm';
import { cn } from '../../utils/cn';
import { Button } from '../Button';
import { Card } from '../Card';
import { DynamicIcon, type PlatformIconDescriptor } from '../DynamicIcon';
import { type MenuAction, MenuButton } from '../MenuButton';
import { Text } from '../Text';
import { type LockedPresentation, lockVariant, presentLockedAction } from '../Upsell';

const EDIT_ICON: PlatformIconDescriptor = { sfSymbol: 'pencil', materialSymbol: 'edit' };
const TRASH_ICON: PlatformIconDescriptor = { sfSymbol: 'trash', materialSymbol: 'delete' };
// Outlined on both platforms (SF `lock` is the outline symbol; the bundled Material font is outline-style).
const LOCK_ICON: PlatformIconDescriptor = { sfSymbol: 'lock', materialSymbol: 'lock' };

export interface ActionCardProps {
  title: string;
  /** Leading h-14 w-14 rounded-xl tile content: a symbol/code string (styled) or a custom node. Omit to hide. */
  leading?: ReactNode;
  /** Optional subline/badge row rendered under the title. */
  subtitle?: ReactNode;
  /** Edit action — bordered pencil square; hidden when omitted. Plan-locked → amber lock, press → upsell sheet. */
  onEdit?: () => void;
  editPermission?: string;
  editAccessibilityLabel?: string;
  /** Delete action — destructive-bordered trash square; hidden when omitted. Pressing runs a native
   *  confirm first (owned here); only fires `onDelete` on confirm. Plan-locked → amber lock, press → alert. */
  onDelete?: () => void;
  deletePermission?: string;
  deleteAccessibilityLabel?: string;
  /** Name shown in the delete confirm copy ("Delete {name}?"). Defaults to `title`. */
  deleteName?: string;
  /** Custom delete-confirm description. When omitted, a default is built from the name. */
  deleteMessage?: string;
  /** Overflow "⋯" menu (MenuButton — its actions are permission-aware) rendered after the inline buttons. */
  menuActions?: MenuAction[];
  /** Escape hatch for bespoke right-side content, rendered before the action buttons. */
  rightActions?: ReactNode;
  /** Custom bottom section (description pill, stat grid, …) — the card adds no padding of its own here. */
  children?: ReactNode;
  className?: string;
}

// The bordered-square action button every detail card used to copy-paste: ghost icon Button with a
// rounded-sm border. Role-denied (!granted) → hidden (mirrors web). Plan-locked (granted && locked) →
// amber border + amber lock icon, pressing presents the locked surface (sheet/alert) instead of onPress.
function ActionIconButton({
  icon,
  tone,
  permission,
  lockedPresentation,
  accessibilityLabel,
  onPress,
}: {
  icon: PlatformIconDescriptor;
  tone: 'default' | 'destructive';
  permission?: string;
  lockedPresentation: LockedPresentation;
  accessibilityLabel?: string;
  onPress: () => void;
}) {
  const gate = usePermission(permission);
  // Role axis: no permission → the control isn't shown at all (fail-open when there's no gate/code).
  if (!gate.granted) return null;
  const locked = gate.granted && gate.locked;
  // Site (non-PLAN) locks use the destructive accent; plan locks use amber.
  const siteLocked = locked && lockVariant(gate.reason) === 'site';
  return (
    <Button
      variant="ghost"
      size="icon"
      hitSlop={8}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={locked ? { disabled: true } : undefined}
      className={cn(
        'h-10 w-10 rounded-sm border',
        locked
          ? siteLocked
            ? 'border-destructive'
            : 'border-warning'
          : tone === 'destructive'
            ? 'border-destructive'
            : 'border-border',
      )}
      onPress={() => {
        if (locked) {
          // The accessibility label doubles as the action name in the alert title ("Unlock delete unit").
          presentLockedAction(gate, lockedPresentation, accessibilityLabel);
          return;
        }
        onPress();
      }}
    >
      {locked ? (
        <DynamicIcon icon={LOCK_ICON} size={14} className={siteLocked ? 'text-destructive' : 'text-warning'} />
      ) : (
        <DynamicIcon
          icon={icon}
          size={14}
          className={tone === 'destructive' ? 'text-destructive' : 'text-foreground'}
        />
      )}
    </Button>
  );
}

// Reusable detail-screen card: leading tile + title (+ subtitle) + right action cluster (edit / delete /
// overflow menu), over a customizable bottom section. Replaces the per-feature copies of this layout
// (UomUnitCard, TaxGroupCard, CostCategoryCard, …). Permission codes gate the actions' LOCK treatment;
// role-based visibility stays on the caller (pass onEdit/onDelete only when the entity allows them).
export function ActionCard({
  title,
  leading,
  subtitle,
  onEdit,
  editPermission,
  editAccessibilityLabel,
  onDelete,
  deletePermission,
  deleteAccessibilityLabel,
  deleteName,
  deleteMessage,
  menuActions,
  rightActions,
  children,
  className,
}: ActionCardProps) {
  const confirm = useConfirm();
  // Delete always confirms first (destructive); the name/message shape the copy. The lock check inside
  // ActionIconButton runs BEFORE this, so a plan-locked delete shows the upsell surface, never the confirm.
  const requestDelete = async () => {
    if (await confirmDelete(confirm, deleteName ?? title, deleteMessage)) onDelete?.();
  };

  return (
    <Card className={cn('gap-0 overflow-hidden p-0', className)}>
      <View className="flex-row items-center gap-3 px-4 pb-0 pt-4">
        {leading != null ? (
          <View className="h-14 w-14 items-center justify-center rounded-xl bg-secondary">
            {typeof leading === 'string' || typeof leading === 'number' ? (
              <Text className="text-xl font-bold text-primary" numberOfLines={1}>
                {leading}
              </Text>
            ) : (
              leading
            )}
          </View>
        ) : null}

        <View className="min-w-0 flex-1">
          <Text className="text-lg font-bold text-foreground" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ?? null}
        </View>

        <View className="flex-row items-center gap-2">
          {rightActions}
          {onEdit ? (
            <ActionIconButton
              icon={EDIT_ICON}
              tone="default"
              permission={editPermission}
              lockedPresentation="sheet"
              accessibilityLabel={editAccessibilityLabel ?? 'Edit'}
              onPress={onEdit}
            />
          ) : null}
          {onDelete ? (
            <ActionIconButton
              icon={TRASH_ICON}
              tone="destructive"
              permission={deletePermission}
              lockedPresentation="sheet"
              accessibilityLabel={deleteAccessibilityLabel ?? 'Delete'}
              onPress={requestDelete}
            />
          ) : null}
          {menuActions && menuActions.length > 0 ? (
            <MenuButton actions={menuActions} variant="ghost" accessibilityLabel="More actions" />
          ) : null}
        </View>
      </View>

      {children}
    </Card>
  );
}
