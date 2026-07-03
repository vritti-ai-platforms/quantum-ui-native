import { type Context, createContext, useContext } from 'react';

// Whether the current subtree renders inside a ScreenHeader tabs PAGER PAGE (a UIPageViewController /
// ViewPager2 child). Scroll surfaces need DIFFERENT iOS inset regimes per context:
//  - Root screens: `contentInsetAdjustmentBehavior='automatic'` + contentInset {top: headerInset} — UIKit
//    adds the safe-area share natively (the long-proven configuration; forcing 'never' + full inset there
//    races iOS's nav scroll-view adoption and mis-rests the list, timing-dependently).
//  - Pager pages: 'automatic' contributes NOTHING inside child view controllers, so the full height must
//    ride the prop inset ('never' + full + initial contentOffset — deterministic there).
// globalThis-keyed like FormatContext so host and MF remotes resolve the identical context instance.
const NAMED_CONTEXTS_KEY = '__quantum_ui_native_contexts';
type NamedContextsMap = Map<string, Context<unknown>>;
const namedContexts: NamedContextsMap =
  ((globalThis as Record<string, unknown>)[NAMED_CONTEXTS_KEY] as NamedContextsMap | undefined) ?? new Map();
(globalThis as Record<string, unknown>)[NAMED_CONTEXTS_KEY] = namedContexts;

export const ScreenHeaderTabPageContext: Context<boolean> =
  (namedContexts.get('ScreenHeaderTabPageContext') as Context<boolean> | undefined) ??
  (() => {
    const ctx = createContext<boolean>(false);
    ctx.displayName = 'ScreenHeaderTabPageContext';
    namedContexts.set('ScreenHeaderTabPageContext', ctx as Context<unknown>);
    return ctx;
  })();

export function useInScreenHeaderTabPage(): boolean {
  return useContext(ScreenHeaderTabPageContext);
}
