import { useCallback } from 'react';
import { Alert } from '../components/Alert';

export interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  /** Single-button informational alert (no cancel). The Promise still resolves true when dismissed. */
  alert?: boolean;
}

const DEFAULTS: Required<Omit<ConfirmOptions, 'alert'>> = {
  title: 'Are you sure?',
  description: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  variant: 'default',
};

export type ConfirmFn = (options?: ConfirmOptions) => Promise<boolean>;

// A host may install a native presenter (e.g. Android MaterialAlertDialogBuilder) that replaces the OS
// `Alert.alert` for confirms/alerts — the RN Alert renders a dated dialog on Android. The presenter is
// stashed on globalThis (MF-safe: every bundle resolves the same slot, like the Upsell host / gates).
// `alert: true` = single-button (no cancel). When no presenter is installed, useConfirm falls back to
// Alert.alert (native iOS dialog is already fine; other apps keep working).
export type ConfirmPresenter = (options: ConfirmOptions) => Promise<boolean>;

const PRESENTER_KEY = '__quantum_ui_native_confirm';

export function setConfirmPresenter(fn: ConfirmPresenter | null): void {
  (globalThis as Record<string, unknown>)[PRESENTER_KEY] = fn;
}

export function getConfirmPresenter(): ConfirmPresenter | null {
  return ((globalThis as Record<string, unknown>)[PRESENTER_KEY] as ConfirmPresenter | null) ?? null;
}

// Shared destructive-confirm copy for delete actions (ActionCard, MenuButton, …) — one source for the
// "Delete {name}?" title + default body, so the wording stays consistent everywhere.
export function confirmDelete(confirm: ConfirmFn, name: string, message?: string): Promise<boolean> {
  return confirm({
    title: `Delete ${name}?`,
    description: message ?? `${name} will be removed. This can't be undone.`,
    confirmLabel: 'Delete',
    variant: 'destructive',
  });
}

export function useConfirm(): ConfirmFn {
  return useCallback((options?: ConfirmOptions) => {
    const merged = { ...DEFAULTS, ...options };
    // Host-provided native dialog (Material 3 on Android) when installed; else the OS Alert.
    const presenter = getConfirmPresenter();
    if (presenter) return presenter(merged);
    return new Promise<boolean>((resolve) => {
      let settled = false;
      const settle = (value: boolean) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      const confirmButton = {
        text: merged.confirmLabel,
        style: (merged.variant === 'destructive' ? 'destructive' : 'default') as 'destructive' | 'default',
        onPress: () => settle(true),
      };
      // Single-button alert omits the cancel action.
      const buttons = options?.alert
        ? [confirmButton]
        : [{ text: merged.cancelLabel, style: 'cancel' as const, onPress: () => settle(false) }, confirmButton];
      Alert.alert(merged.title, merged.description || undefined, buttons, {
        cancelable: true,
        onDismiss: () => settle(false),
      });
    });
  }, []);
}
