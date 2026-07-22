import { Alert } from 'react-native';
import type { PermissionGateResult, PermissionLockReason } from '../../context/PermissionGateContext';
import { getConfirmPresenter } from '../../hooks/useConfirm';
import type { LockVariant } from './UpsellContent';
import { presentUpsellSheet } from './UpsellBottomSheet';

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

// Maps a lock reason to the visual treatment: PLAN → the amber upsell; ANY other non-null reason (SITE,
// and any future backend reason) → the destructive "Not enabled for this site" treatment (no upsell — a
// plan upgrade can't lift it). Single source so every lock surface derives the variant the same way.
export function lockVariant(reason: PermissionLockReason | null): LockVariant {
  return reason === 'PLAN' ? 'plan' : 'site';
}

// Presents a locked action's surface, themed by the lock reason. 'sheet' presents the upsell/site bottom
// sheet; 'alert' (actions whose real surface is an alert, e.g. delete confirms) shows a native alert.
// Copy mirrors web lockedTip. `actionLabel` names the specific locked action in the PLAN alert title
// (e.g. "Delete unit" → "Unlock delete unit"); site locks always read "Not enabled for this site".
export function presentLockedAction(
  result: PermissionGateResult,
  presentation: LockedPresentation = 'sheet',
  actionLabel?: string,
) {
  const variant = lockVariant(result.reason);
  if (presentation === 'alert') {
    if (variant === 'site') {
      showAlert(result.featureName ?? 'This feature', 'Not enabled for this site');
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
