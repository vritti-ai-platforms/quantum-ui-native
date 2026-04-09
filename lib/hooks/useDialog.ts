import { useCallback, useState } from 'react';

export interface UseDialogOptions {
  onClose?: () => void;
}

export interface DialogHandle {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  onOpenChange: (open: boolean) => void;
}

// Controls a dialog's open/close state with optional cleanup on close
export function useDialog(options?: UseDialogOptions): DialogHandle {
  const [isOpen, setIsOpen] = useState(false);

  const close = useCallback(() => {
    setIsOpen(false);
    options?.onClose?.();
  }, [options?.onClose]);

  const onOpenChange = useCallback(
    (value: boolean) => {
      if (value) {
        setIsOpen(true);
      } else {
        close();
      }
    },
    [close],
  );

  return {
    isOpen,
    open: useCallback(() => setIsOpen(true), []),
    close,
    onOpenChange,
  };
}
