import type { PlatformIconDescriptor } from './types';

export const COMMON_ICONS: Record<string, PlatformIconDescriptor> = {
  alertError: { sfSymbol: 'exclamationmark.circle', materialSymbol: 'error_outline' },
  alertSuccess: { sfSymbol: 'checkmark.circle', materialSymbol: 'check_circle' },
  alertWarning: { sfSymbol: 'exclamationmark.triangle', materialSymbol: 'warning_amber' },
  arrowForward: { sfSymbol: 'arrow.right', materialSymbol: 'arrow_forward' },
  calendar: { sfSymbol: 'calendar', materialSymbol: 'calendar_today' },
  check: { sfSymbol: 'checkmark', materialSymbol: 'check' },
  chevronDown: { sfSymbol: 'chevron.down', materialSymbol: 'keyboard_arrow_down' },
  chevronLeft: { sfSymbol: 'chevron.left', materialSymbol: 'keyboard_arrow_left' },
  chevronRight: { sfSymbol: 'chevron.right', materialSymbol: 'keyboard_arrow_right' },
  chevronUp: { sfSymbol: 'chevron.up', materialSymbol: 'keyboard_arrow_up' },
  close: { sfSymbol: 'xmark', materialSymbol: 'close' },
  info: { sfSymbol: 'info.circle', materialSymbol: 'info' },
  trendDown: { sfSymbol: 'chart.line.downtrend.xyaxis', materialSymbol: 'trending_down' },
  trendUp: { sfSymbol: 'chart.line.uptrend.xyaxis', materialSymbol: 'trending_up' },
};
