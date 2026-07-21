import { useCallback } from 'react';
import { Alert } from '../components/Alert';

export interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
}

const DEFAULTS: Required<ConfirmOptions> = {
  title: 'Are you sure?',
  description: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  variant: 'default',
};

export type ConfirmFn = (options?: ConfirmOptions) => Promise<boolean>;

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
    return new Promise<boolean>((resolve) => {
      let settled = false;
      const settle = (value: boolean) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      Alert.alert(
        merged.title,
        merged.description || undefined,
        [
          { text: merged.cancelLabel, style: 'cancel', onPress: () => settle(false) },
          {
            text: merged.confirmLabel,
            style: merged.variant === 'destructive' ? 'destructive' : 'default',
            onPress: () => settle(true),
          },
        ],
        { cancelable: true, onDismiss: () => settle(false) },
      );
    });
  }, []);
}
