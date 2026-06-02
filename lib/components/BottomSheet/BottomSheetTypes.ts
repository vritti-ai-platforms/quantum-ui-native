import type { ColorValue } from 'react-native';

export interface BottomSheetRef {
  present: (index?: number) => void;
  dismiss: () => void;
}

export type SheetDetent = 'auto' | 'full' | number | `${number}%`;

export interface BottomSheetProps {
  children?: React.ReactNode;
  detents?: SheetDetent[];
  cornerRadius?: number;
  grabber?: boolean;
  dismissible?: boolean;
  draggable?: boolean;
  dimmed?: boolean;
  variant?: 'glass' | 'solid';
  onDismiss?: () => void;
  onPresent?: () => void;
  onChange?: (index: number) => void;
  title?: string;
  subtitle?: string;
  onClose?: () => void;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  scrollable?: boolean;
  /** Overrides the sheet surface color. Defaults to the theme background. */
  backgroundColor?: ColorValue;
}

export function mapDetents(detents: SheetDetent[]): {
  snapPoints: (string | number)[] | undefined;
  dynamic: boolean;
} {
  if (detents.includes('auto')) {
    return { snapPoints: undefined, dynamic: true };
  }
  return {
    snapPoints: detents.map((d) => {
      if (d === 'full') return '100%';
      if (typeof d === 'number' && d > 0 && d <= 1) return `${Math.round(d * 100)}%`;
      return d as string | number;
    }),
    dynamic: false,
  };
}
