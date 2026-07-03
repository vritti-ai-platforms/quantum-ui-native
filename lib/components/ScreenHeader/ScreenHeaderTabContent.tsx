import { type ReactNode, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import PagerView, { type PagerViewOnPageSelectedEvent } from 'react-native-pager-view';
import { useScreenScrollY } from '../ScreenContainer/screenScrollRegistry';
import { ScreenHeaderTabPageContext } from './screenHeaderTabPageContext';
import {
  setScreenHeaderActiveTabId,
  useScreenHeaderRouteKey,
  useScreenHeaderTabsEntry,
} from './screenHeaderTabsRegistry';

// Native pager for the ScreenHeader tabs (UIPageViewController on iOS / ViewPager2 on Android via
// react-native-pager-view). The page transition runs fully natively — a heavy React commit (mounting a
// data-populated tab) cannot stall it, which the previous JS-orchestrated cross-fade suffered from — and
// users get native swipe-between-tabs for free.
//
// Pages are LAZY KEEP-ALIVE (the material-top-tabs pattern): a tab's content mounts on its first visit and
// then stays mounted. Revisits are instant — no remount, no query refetch, per-tab scroll position kept.
// Only the visible page receives touches, and screenScroll FlashLists gate their header-collapse writes on
// user drags, so the shared per-route scrollY is only ever driven by the active tab.
function ScreenHeaderTabContentView() {
  const { tabs, activeIndex } = useScreenHeaderTabsEntry();
  const routeKey = useScreenHeaderRouteKey();
  const scrollY = useScreenScrollY();
  const pagerRef = useRef<PagerView | null>(null);
  // The pager's current native position (initialPage / last onPageSelected). Guards against tap→setPage→
  // onPageSelected→registry→effect loops.
  const positionRef = useRef(activeIndex);
  // Last header-collapse scrollY per tab id. Keep-alive pages preserve their real scroll offset, so the
  // shared per-route scrollY must be restored (not reset) when returning to a scrolled tab — otherwise the
  // header expands to its transparent state while content actually sits underneath it (visible on pre-iOS 26
  // where only the COLLAPSED header draws a background; iOS 26's glass material masked it).
  const scrollMemoryRef = useRef(new Map<string, number>());
  const [visitedIds, setVisitedIds] = useState<Set<string>>(() => {
    const id = tabs[activeIndex]?.id;
    return new Set(id ? [id] : []);
  });

  // Registry (tab-bar tap) → pager. Mark the target visited in the same pass so its content mounts while
  // the native scroll animates (the commit runs on JS; the animation runs on the platform thread).
  useEffect(() => {
    const id = tabs[activeIndex]?.id;
    if (id) setVisitedIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
    if (activeIndex !== positionRef.current) {
      pagerRef.current?.setPage(activeIndex);
    }
  }, [activeIndex, tabs]);

  // Pager (swipe or settled tap animation) → registry. setScreenHeaderActiveTabId no-ops when the change
  // originated from the tab bar, so there is no feedback loop.
  const onPageSelected = (e: PagerViewOnPageSelectedEvent) => {
    const position = e.nativeEvent.position;
    const prevPosition = positionRef.current;
    if (position === prevPosition) return; // cancelled swipe back to the same page — nothing changes
    // The outgoing tab was the only scrollY writer — its live value IS its collapse state; remember it.
    const prevTab = tabs[prevPosition];
    if (prevTab) scrollMemoryRef.current.set(prevTab.id, scrollY.value);
    positionRef.current = position;
    const tab = tabs[position];
    if (!tab) return;
    setVisitedIds((prev) => (prev.has(tab.id) ? prev : new Set(prev).add(tab.id)));
    setScreenHeaderActiveTabId(routeKey, tab.id);
    // Restore the incoming tab's collapse state (0 for never-scrolled tabs → expanded header). Keep-alive
    // pages keep their real scroll offset, so the header must match it, not force-expand over it.
    scrollY.value = scrollMemoryRef.current.get(tab.id) ?? 0;
  };

  return (
    <PagerView ref={pagerRef} style={styles.pager} initialPage={activeIndex} onPageSelected={onPageSelected}>
      {tabs.map((tab) => (
        // Pager children must be plain, keyed, non-collapsable Views (ViewPager2 needs real native pages).
        // The context tells scroll surfaces they're inside a pager page, where the iOS inset regime differs
        // (see screenHeaderTabPageContext).
        <View key={tab.id} style={styles.page} collapsable={false}>
          <ScreenHeaderTabPageContext.Provider value={true}>
            {visitedIds.has(tab.id) ? tab.content : null}
          </ScreenHeaderTabPageContext.Provider>
        </View>
      ))}
    </PagerView>
  );
}

const styles = StyleSheet.create({
  pager: { flex: 1 },
  page: { flex: 1 },
});

// Public hook the screen body renders. Returns the pager so the consumer's
// `<ScreenContainer>{useScreenHeaderTabContent()}</ScreenContainer>` pattern keeps working unchanged.
export function useScreenHeaderTabContent(): ReactNode {
  return <ScreenHeaderTabContentView />;
}
