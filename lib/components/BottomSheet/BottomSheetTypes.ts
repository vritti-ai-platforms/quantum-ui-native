export interface BottomSheetRef {
  present: (index?: number) => void;
  dismiss: () => void;
}

export type SheetDetent = 'auto' | number | `${number}%`;

export interface BottomSheetProps {
  children?: React.ReactNode;
  /** Snap points. Use 'auto' for content-height sizing (default: ['auto']). */
  detents?: SheetDetent[];
  cornerRadius?: number;
  /** Show the drag indicator handle. Default: true */
  grabber?: boolean;
  /** Allow swipe-down / backdrop-tap to dismiss. Default: true */
  dismissible?: boolean;
  /** Allow panning via the handle. Default: true */
  draggable?: boolean;
  /** Show dim backdrop. Default: true */
  dimmed?: boolean;
  /**
   * iOS 26+ only. Use @callstack/liquid-glass background.
   * Defaults to true on iOS 26+ when the package is installed.
   */
  glass?: boolean;
  onDismiss?: () => void;
  onPresent?: () => void;
  onChange?: (index: number) => void;
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
      if (typeof d === 'number' && d > 0 && d <= 1) return `${Math.round(d * 100)}%`;
      return d as string | number;
    }),
    dynamic: false,
  };
}
