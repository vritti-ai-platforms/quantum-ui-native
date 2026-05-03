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

export function useConfirm(): (options?: ConfirmOptions) => Promise<boolean> {
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
