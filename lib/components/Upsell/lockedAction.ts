import { Alert } from 'react-native';
import type { PermissionGateResult, PermissionLockReason } from '../../context/PermissionGateContext';
import { getConfirmPresenter } from '../../hooks/useConfirm';
import { presentUpsellSheet } from './UpsellBottomSheet';
import type { LockVariant } from './UpsellContent';
import { workspaceNoun } from './workspaceNoun';

export type LockedPresentation = 'sheet' | 'alert';

// Single-button alert — via the host's native dialog presenter (Material 3 on Android) when installed,
// else the OS Alert.
function showAlert(title: string, message: string): void {
  const presenter = getConfirmPresenter();
  if (presenter) {
    void presenter({ title, description: message, confirmLabel: 'OK', alert: true });
    return;
  }
  Alert.alert(title, message);
}

// Maps a lock reason to the visual treatment: PLAN → the amber upsell; every other non-null reason
// (WORKSPACE, SERVICE, and any future backend reason) → the destructive treatment, since no plan upgrade can
// lift it. Single source so every lock surface derives the variant the same way.
export function lockVariant(reason: PermissionLockReason | null): LockVariant {
  switch (reason) {
    case 'PLAN':
      return 'plan';
    default:
      return 'workspace';
  }
}

// Presents a locked action's surface, themed by the lock reason. 'sheet' presents the upsell/site bottom
// sheet; 'alert' (actions whose real surface is an alert, e.g. delete confirms) shows a native alert.
// Copy mirrors web lockedTip. `actionLabel` names the specific locked action in the PLAN alert title
// (e.g. "Delete unit" → "Unlock delete unit"); workspace locks name the workspace.
export function presentLockedAction(
  result: PermissionGateResult,
  presentation: LockedPresentation = 'sheet',
  actionLabel?: string,
) {
  const variant = lockVariant(result.reason);
  if (presentation === 'alert') {
    if (variant === 'workspace') {
      const detail =
        result.reason === 'SERVICE'
          ? 'Requires setup by your administrator'
          : `Not enabled for ${workspaceNoun(result.workspaceLabel, result.workspaceScope)}`;
      showAlert(result.featureName ?? 'This feature', detail);
      return;
    }
    const availability = result.unlockPlans.length
      ? `Available in ${result.unlockPlans.join(', ')}`
      : 'Not included in your plan';
    const subject = actionLabel
      ? actionLabel.charAt(0).toLowerCase() + actionLabel.slice(1)
      : (result.featureName ?? 'this feature');
    showAlert(`Unlock ${subject}`, availability);
    return;
  }
  presentUpsellSheet({ featureName: result.featureName ?? '', unlockPlans: result.unlockPlans, variant });
}
