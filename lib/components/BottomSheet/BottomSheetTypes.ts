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
  /**
   * Sheet surface / header style:
   * - `'glass'` (default): liquid-glass surface on iOS 26, solid elsewhere.
   * - `'solid'`: solid theme-background surface.
   * - `'inline'`: solid surface + a built-in in-flow header (centered `title` + right-side circular
   *   close button); `children` are laid out below it in a box sized to the caller-passed detent, and
   *   the floating scaler close is hidden. For percentage/fixed detents (not `auto`/`full`).
   */
  variant?: 'glass' | 'solid' | 'inline';
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
  /**
   * Show the floating close button rendered by the background scaler. Defaults to true.
   * Set false when the sheet content provides its own close affordance (e.g. Select).
   */
  showCloseButton?: boolean;
  /**
   * How this sheet behaves when presented while another sheet is already open (gorhom modal stack).
   * Defaults to `'push'` so a sheet opened from within another sheet (e.g. a Select inside a form sheet)
   * stacks on top instead of dismissing/minimizing the one beneath it. Only affects nested presentation.
   */
  stackBehavior?: 'push' | 'switch' | 'replace';
}

/** Resolve the first detent to a concrete pixel height for the inline-header content box.
 *  Uses the caller-passed detent (no hardcoded default): `'80%'` → 80% of `windowHeight`, a fraction
 *  (0–1) → that fraction of `windowHeight`, a pixel number → itself. Returns undefined for `auto`/`full`. */
export function resolveDetentHeight(detents: SheetDetent[], windowHeight: number): number | undefined {
  const first = detents[0];
  if (first == null || first === 'auto' || first === 'full') return undefined;
  if (typeof first === 'number') return first > 0 && first <= 1 ? windowHeight * first : first;
  const pct = Number.parseFloat(first);
  return Number.isFinite(pct) ? windowHeight * (pct / 100) : undefined;
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
