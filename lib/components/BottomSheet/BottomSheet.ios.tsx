import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet';
import { forwardRef, useImperativeHandle, useRef } from 'react';

export interface BottomSheetRef {
  present: (index?: number, animated?: boolean) => Promise<void>;
  dismiss: (animated?: boolean) => Promise<void>;
  dismissStack: (animated?: boolean) => Promise<void>;
  resize: (index: number) => Promise<void>;
}

// iOS-specific: backgroundBlur and blurOptions enable the Liquid Glass / vibrancy
// effect on iOS 26.1+. pageSizing controls iPad form vs page sheet presentation.
// detached renders as a floating card instead of a bottom-attached sheet.
export interface BottomSheetProps extends TrueSheetProps {}

export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(
  (
    {
      detents = ['auto', 1],
      cornerRadius = 24,
      grabber = true,
      dismissible = true,
      draggable = true,
      dimmed = true,
      ...props
    },
    ref,
  ) => {
    const sheetRef = useRef<TrueSheet>(null);

    useImperativeHandle(ref, () => ({
      present: (index?: number, animated?: boolean) => sheetRef.current?.present(index, animated) ?? Promise.resolve(),
      dismiss: (animated?: boolean) => sheetRef.current?.dismiss(animated) ?? Promise.resolve(),
      dismissStack: (animated?: boolean) => sheetRef.current?.dismissStack(animated) ?? Promise.resolve(),
      resize: (index: number) => sheetRef.current?.resize(index) ?? Promise.resolve(),
    }));

    return (
      <TrueSheet
        ref={sheetRef}
        detents={detents}
        cornerRadius={cornerRadius}
        grabber={grabber}
        dismissible={dismissible}
        draggable={draggable}
        dimmed={dimmed}
        {...props}
      />
    );
  },
);

BottomSheet.displayName = 'BottomSheet';
