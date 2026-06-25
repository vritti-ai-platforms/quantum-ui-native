// Total vertical space the Android floating pill occupies (pill height + the gap that lifts it
// above the system nav bar + a little breathing room). Computed locally by ScreenContainer rather
// than read from a context, because ScreenContainer often renders inside a Module Federation REMOTE
// whose bundle has its own context instances — a host-provided context would never reach it. The
// inputs (insets.bottom, screen width) are available everywhere via shared-singleton hooks.
//
// MUST mirror FloatingTabBar's sizing constants so reserved space matches what's drawn.
const REF_WIDTH = 390;
const SCALE_MIN = 0.85;
const SCALE_MAX = 1.3;
const BASE_TAB = 52;
const BASE_PAD = 5;

export function computeFloatingTabBarHeight(insetsBottom: number, screenWidth: number): number {
  const scale = Math.min(SCALE_MAX, Math.max(SCALE_MIN, screenWidth / REF_WIDTH));
  const tabSize = Math.round(BASE_TAB * scale);
  const pillPad = Math.round(BASE_PAD * scale);
  const barBottomGap = Math.max(insetsBottom, 6) + 6;
  return tabSize + pillPad * 2 + barBottomGap + 8;
}
