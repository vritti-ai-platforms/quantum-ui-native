import {
  FlashList as ShopifyFlashList,
  type FlashListProps as ShopifyFlashListProps,
  type FlashListRef,
} from '@shopify/flash-list';
import { cloneElement, isValidElement, type ReactElement, useRef } from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  type RefreshControlProps,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePermission } from '../../context/PermissionGateContext';
import { cn } from '../../utils/cn';
import { resolveTopPadding } from '../../utils/resolveTopPadding';
import { DynamicIcon, type PlatformIconDescriptor } from '../DynamicIcon';
import { ListItem } from '../ListItem';
import { CardSkeleton } from '../Skeleton/CardSkeleton';
import { lockVariant, Upsell } from '../Upsell';
import {
  useMeasuredScreenHeaderHeight,
  useScreenHeaderInset,
  useScreenScrollY,
} from '../ScreenContainer/screenScrollRegistry';
import { useInScreenHeaderTabPage } from '../ScreenHeader/screenHeaderTabPageContext';
import { Text } from '../Text';

// Role-denied view state icon (warning lock — same descriptor as ScreenHeader/ActionCard/Fab).
const LOCK_ICON: PlatformIconDescriptor = { sfSymbol: 'lock', materialSymbol: 'lock' };

export interface FlashListProps<T> extends Omit<ShopifyFlashListProps<T>, 'ListEmptyComponent'> {
  isLoading?: boolean;
  skeletonCount?: number;
  renderSkeletonItem?: () => ReactElement;
  /**
   * Shape of the built-in loading skeleton when `renderSkeletonItem` is not supplied. `'list'` (default) uses
   * a `<ListItem>` row; `'card'` uses the generic `<CardSkeleton>` — use it for card lists so you never have to
   * hand-write a per-card skeleton. Pass `renderSkeletonItem` only for a truly custom case.
   */
  skeletonVariant?: 'list' | 'card';
  emptyText?: string;
  EmptyComponent?: ReactElement;
  /**
   * Make this FlashList a screen body that drives the ScreenHeader's large-title collapse via the
   * ScreenContainer scroll registry: it becomes the bounded scroller (fills the screen under the
   * transparent header, pads its content + the pull-to-refresh spinner by the header's expanded
   * height, and reports its scroll position so the header collapses). Use for a full-screen list under
   * a `<ScreenHeader>` — NOT for a list inside a ScrollView / BottomSheet. `screenScroll` owns `onScroll`.
   */
  screenScroll?: boolean;
  className?: string;
  /**
   * Permission code guarding the list's VIEW (host gate). Role-denied (!granted) → the list area shows a
   * lock + "you don't have permission" message. Granted-but-PLAN-locked → the Upsell paywall. Either way
   * the screen's own chrome (header, search, tabs) stays. No gate / no code / SITE-locked → the list
   * renders normally (fail-open). Mirrors the ActionCard/Fab/MenuButton axes at the data-surface level.
   */
  permission?: string;
}

function FlashList<T>({
  data,
  isLoading = false,
  skeletonCount = 6,
  renderSkeletonItem,
  skeletonVariant = 'list',
  emptyText = 'No items found',
  EmptyComponent,
  className,
  screenScroll = false,
  permission,
  contentContainerStyle,
  refreshControl,
  onEndReached,
  onScrollBeginDrag,
  ...props
}: FlashListProps<T>) {
  // View-lock (fail-open — usePermission returns granted+unlocked when there's no gate/code):
  //  • role-denied (!granted) → a lock + "no permission" message (upgrading can't help, so no upsell);
  //  • locked → the Upsell paywall, themed by reason (PLAN → amber/upsell, SITE → destructive "Not
  //    enabled for this site" via the Upsell `variant`).
  const viewGate = usePermission(permission);
  const viewDenied = !viewGate.granted;
  const viewLocked = viewGate.granted && viewGate.locked;
  // In screenScroll mode, only track scroll / paginate AFTER a real user drag. FlashList fires spurious
  // events during its initial/relayout pass — an onScroll and an onEndReached (which would auto-fetch
  // page 2 with no user intent). Gating both on onScrollBeginDrag ignores the mount noise; drag +
  // momentum events all follow a begin-drag, so real tracking is unaffected.
  const hasScrolledRef = useRef(false);
  // Internal handle for the pre-drag rest correction below (no consumer passes a ref to this wrapper).
  const listRef = useRef<FlashListRef<T> | null>(null);
  // Screen-scroll integration (only applied when `screenScroll`): writing the route's scrollY on scroll
  // drives the ScreenHeader collapse, and the content is offset by the header's expanded height so the
  // list sits under the transparent header. Hooks are always called (cheap) to keep hook order stable.
  const scrollY = useScreenScrollY();
  const headerInset = useScreenHeaderInset();
  const measuredHeader = useMeasuredScreenHeaderHeight();
  const insets = useSafeAreaInsets();
  // Inside a ScreenHeader tabs pager page? The iOS inset regime differs per context (see
  // screenHeaderTabPageContext): root screens use the long-proven 'automatic' + hero-only inset; pager
  // pages (where 'automatic' contributes nothing) own the full inset with 'never' + initial contentOffset.
  const inTabPage = useInScreenHeaderTabPage();

  const isIos = Platform.OS === 'ios';
  // Full on-screen header height. Source of truth = the header's MEASURED painted height (registered from
  // its onLayout — the collapsible-header standard); the constants+safe-area formula is only the first-frame
  // fallback until the measurement lands, and gets corrected wherever the painted header differs from it.
  const computedFullHeight = screenScroll && headerInset > 0 ? headerInset + insets.top : 0;
  const headerFullHeight = screenScroll && measuredHeader > 0 ? measuredHeader : computedFullHeight;
  // iOS header-offset strategy: the FULL height rides the PROP contentInset with
  // `contentInsetAdjustmentBehavior='never'`, and the initial `contentOffset` prop places a fresh mount
  // exactly at the rest position. This is fully deterministic — the alternative (partial inset +
  // 'automatic' adding the safe area asynchronously) mis-rests fresh data mounts, because Fabric's
  // first-mount state restore CLAMPS the offset to the PROP inset only
  // (RCTScrollViewComponentView.mm updateState: `contentOffset.y = fmax(y, -contentInset.top)`, which runs
  // right after updateProps and reverts the contentOffset prop), and programmatic scrollTo clamps to the
  // same prop-only boundary. With the full height in the prop inset, updateProps, the updateState clamp,
  // and scrollTo all agree the rest is exactly -headerFullHeight, on every mount path.
  // (react-native-screens' Never→Automatic override only applies under its NATIVE tabs host; this app uses
  // JS bottom-tabs, so 'never' sticks.)
  // Android has no contentInset — the header offset is content padding (+ progressViewOffset for the
  // refresh spinner).
  // iOS inset per context: pager pages carry the FULL height in the prop inset; root screens carry only the
  // hero height and let UIKit's 'automatic' add the safe-area share (the git-proven original behavior —
  // forcing 'never'+full on root screens races iOS's nav scroll-view adoption and mis-rests the list).
  const screenContentInset =
    isIos && headerFullHeight > 0 ? { top: inTabPage ? headerFullHeight : headerInset } : undefined;
  // Android: the header offset is a paddingTop LONGHAND merged into the contentContainerStyle, and Yoga
  // resolves a longhand edge over a shorthand's implicit edge — a caller's `padding: 16` top would be
  // silently swallowed (iOS keeps it, since its offset is a native contentInset OUTSIDE the content box).
  // Bake the caller's declared top edge into our longhand so both platforms render header + callerTop.
  const androidCallerTop =
    !isIos && headerFullHeight > 0 ? resolveTopPadding(contentContainerStyle as Parameters<typeof resolveTopPadding>[0]) : 0;
  const androidHeaderPad =
    !isIos && headerFullHeight > 0 ? { paddingTop: headerFullHeight + androidCallerTop } : null;
  // contentOffset rests at -contentInset.top on iOS (= headerFullHeight) and 0 on Android. Normalize the
  // header-driving scrollY so it reads 0 at rest (else the first inset's worth of scroll is a dead zone
  // where the list moves but the header stays frozen and cards peek under the search).
  const scrollNormalize = isIos ? headerFullHeight : 0;
  // Shared screenScroll layout props for both branches (skeleton + data): disable FlashList v2's default
  // maintainVisibleContentPosition anchor (it pins item 0 and turns the top offset into a render-timing
  // race), own the insets fully ('never'), and mount directly at the rest offset.
  const screenScrollLayoutProps = screenScroll
    ? {
        maintainVisibleContentPosition: { disabled: true },
        contentInsetAdjustmentBehavior: inTabPage ? ('never' as const) : ('automatic' as const),
        ...(screenContentInset ? { contentInset: screenContentInset } : {}),
        // Initial rest offset only in the pager regime — under 'automatic' UIKit settles the rest natively.
        ...(screenContentInset && inTabPage ? { contentOffset: { x: 0, y: -headerFullHeight } } : {}),
      }
    : {};
  // Plain (non-screenScroll) lists: PushNavigator's native-stack headers are TRANSPARENT on iOS 26+
  // (Liquid Glass), so content must adopt UIKit's automatic bar insets or the first rows seat under the
  // header. Harmless pre-26 (opaque header = no bar overlap) and in sheets (Select uses @shopify/flash-list
  // directly). Callers can still override via their own contentInsetAdjustmentBehavior prop.
  const plainInsetProps = !screenScroll && isIos ? { contentInsetAdjustmentBehavior: 'automatic' as const } : {};

  // TEMPORARY diagnostics for the items-screen top-gap parity (iOS gap larger than Android with identical
  // static formulas). One line per mount with the four numbers that pin the divergence; the pre-drag scroll
  // branch below adds the actual rest offset on iOS. Remove after the measurement round.
  // Android: ONE flattened plain object (no style arrays — removes any ambiguity about array/longhand
  // resolution): every caller edge applies, and our top longhand (which already includes the caller's
  // declared top edge) deterministically wins.
  const composedContentContainerStyle = androidHeaderPad
    ? {
        ...StyleSheet.flatten(contentContainerStyle as Parameters<typeof resolveTopPadding>[0]),
        ...androidHeaderPad,
      }
    : contentContainerStyle;

  const skeletonRenderer =
    renderSkeletonItem ?? (skeletonVariant === 'card' ? () => <CardSkeleton /> : () => <ListItem loading title="" />);

  // Android: push the pull-to-refresh spinner below the transparent header (iOS rests it via contentInset).
  const screenRefreshControl =
    androidHeaderPad && isValidElement(refreshControl)
      ? cloneElement(refreshControl as ReactElement<RefreshControlProps>, {
          progressViewOffset: (refreshControl as ReactElement<RefreshControlProps>).props.progressViewOffset ?? headerFullHeight,
        })
      : refreshControl;

  // screenScroll lists must NOT be the screen's first-descendant scroll view: iOS navigation machinery
  // (react-native-screens/UIKit large-title + scroll-edge integration) walks the first descendant chain,
  // adopts that scroll view, and applies its own top adjustment (~a nav-bar height) ON TOP of our
  // deterministic inset — the phantom extra gap on root screens (tab pages were immune because the pager
  // breaks the chain; screens whose tabs wrapped FlashList in a View were immune for the same reason).
  // A plain flex View between the screen and the list breaks the adoption on every screen uniformly.
  const wrapScreenScroll = (list: ReactElement) =>
    screenScroll ? <View className="flex-1">{list}</View> : list;

  // Role-denied: a lock + "no permission" message replaces the list (no upsell — a plan upgrade can't
  // grant a role). Same container shell as the plan-lock branch so it sits in the list region.
  if (viewDenied) {
    return wrapScreenScroll(
      <View
        className="flex-1 items-center justify-center gap-3 bg-background px-6"
        style={headerFullHeight > 0 ? { paddingTop: headerFullHeight } : undefined}
      >
        <DynamicIcon icon={LOCK_ICON} size={40} className="text-warning" />
        <Text variant="muted" className="text-center">
          {viewGate.featureName
            ? `You don't have permission to view ${viewGate.featureName}.`
            : "You don't have permission to view this."}
        </Text>
      </View>,
    );
  }

  // View-locked: the paywall replaces rows/skeleton/empty (checked BEFORE isLoading so a locked+loading
  // list shows the paywall, not the skeleton). On screenScroll screens pad by the header height so the
  // centered paywall sits in the list region, not under the transparent header.
  if (viewLocked) {
    return wrapScreenScroll(
      <View
        className="flex-1 bg-background"
        style={headerFullHeight > 0 ? { paddingTop: headerFullHeight } : undefined}
      >
        <Upsell
          featureName={viewGate.featureName ?? ''}
          unlockPlans={viewGate.unlockPlans}
          variant={lockVariant(viewGate.reason)}
        />
      </View>,
    );
  }

  if (isLoading) {
    return wrapScreenScroll(
      <ShopifyFlashList
        data={Array.from({ length: skeletonCount }, (_, i) => i)}
        renderItem={() => skeletonRenderer()}
        keyExtractor={String}
        scrollEnabled={false}
        className={cn(screenScroll && 'flex-1 bg-background', className)}
        {...plainInsetProps}
        {...screenScrollLayoutProps}
        {...(composedContentContainerStyle != null ? { contentContainerStyle: composedContentContainerStyle } : {})}
      />,
    );
  }

  const emptyComponent = EmptyComponent ?? (
    <View className={cn('flex-1 items-center justify-center py-12')}>
      <Text variant="muted">{emptyText}</Text>
    </View>
  );

  const dataList = (
    <ShopifyFlashList
      ref={listRef}
      data={data}
      ListEmptyComponent={emptyComponent}
      className={cn(screenScroll && 'flex-1 bg-background', className)}
      refreshControl={screenRefreshControl}
      onEndReached={
        screenScroll
          ? () => {
              if (hasScrolledRef.current) onEndReached?.();
            }
          : onEndReached
      }
      {...(composedContentContainerStyle != null ? { contentContainerStyle: composedContentContainerStyle } : {})}
      {...plainInsetProps}
      {...props}
      {...screenScrollLayoutProps}
      {...(screenScroll
        ? {
            ...(androidHeaderPad ? { scrollIndicatorInsets: { top: headerFullHeight } } : {}),
            // The gate: only a real user drag opens scroll tracking + pagination (see hasScrolledRef above).
            onScrollBeginDrag: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
              hasScrolledRef.current = true;
              onScrollBeginDrag?.(e);
            },
            // JS handler is enough: writing the SharedValue propagates to the header's UI-thread animation.
            onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
              const rawY = e.nativeEvent.contentOffset.y;
              if (!hasScrolledRef.current) {
                // Pre-drag events are mount-pass noise, never header input. BIDIRECTIONAL rest settle:
                // native mount choreography can leave the list off its rest in EITHER direction — above
                // (content under the header) or below (extra top gap; iOS nav machinery adopting the scroll
                // view pushes it past the inset, timing-dependent — instrumentation delaying the mount even
                // masked it). Whatever the actor, its programmatic shift emits a scroll event; settle back
                // on the next one. Self-limiting (the correction's own event lands within the tolerance),
                // and unreachable once the user drags (gate above), so pulls/momentum are never fought.
                // Only in the pager regime, where WE own the rest position ('never'); under 'automatic'
                // UIKit manages the rest natively and must not be fought.
                if (inTabPage && isIos && headerFullHeight > 0 && Math.abs(rawY + headerFullHeight) > 1) {
                  listRef.current?.scrollToOffset({ offset: -headerFullHeight, animated: false });
                }
                return;
              }
              // Normalize: contentOffset.y rests at -contentInset.top on iOS (= headerFullHeight) and 0 on
              // Android, so +scrollNormalize makes the header see 0 at rest and track real scroll distance.
              // Without it the first inset's worth of scroll is a DEAD ZONE: the list slides up (cards peek
              // under the search) while the header stays frozen (interpolations clamp negatives).
              scrollY.value = rawY + scrollNormalize;
            },
            scrollEventThrottle: 16,
          }
        : onScrollBeginDrag != null
          ? { onScrollBeginDrag }
          : {})}
    />
  );

  return wrapScreenScroll(dataList);
}

FlashList.displayName = 'FlashList';

export { FlashList };
