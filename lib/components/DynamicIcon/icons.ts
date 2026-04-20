import type { PlatformIconDescriptor } from './types';

export const COMMON_ICONS: Record<string, PlatformIconDescriptor> = {
  alertError: { sfSymbol: 'exclamationmark.circle', materialIcon: 'error-outline' },
  alertSuccess: { sfSymbol: 'checkmark.circle', materialIcon: 'check-circle' },
  alertWarning: { sfSymbol: 'exclamationmark.triangle', materialIcon: 'warning-amber' },
  arrowForward: { sfSymbol: 'arrow.right', materialIcon: 'arrow-forward' },
  check: { sfSymbol: 'checkmark', materialIcon: 'check' },
  chevronDown: { sfSymbol: 'chevron.down', materialIcon: 'keyboard-arrow-down' },
  chevronLeft: { sfSymbol: 'chevron.left', materialIcon: 'keyboard-arrow-left' },
  chevronRight: { sfSymbol: 'chevron.right', materialIcon: 'keyboard-arrow-right' },
  chevronUp: { sfSymbol: 'chevron.up', materialIcon: 'keyboard-arrow-up' },
  close: { sfSymbol: 'xmark', materialIcon: 'close' },
  info: { sfSymbol: 'info.circle', materialIcon: 'info' },
  trendDown: { sfSymbol: 'chart.line.downtrend.xyaxis', materialIcon: 'trending-down' },
  trendUp: { sfSymbol: 'chart.line.uptrend.xyaxis', materialIcon: 'trending-up' },
};
