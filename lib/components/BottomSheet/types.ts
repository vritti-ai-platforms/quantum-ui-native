import type React from 'react';
import type { ViewStyle } from 'react-native';

/** Props for `<BottomSheet>` */
export interface BottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: string[];
  initialSnapIndex?: number;
  showHandle?: boolean;
  closeOnBackdrop?: boolean;
  style?: ViewStyle;
}
