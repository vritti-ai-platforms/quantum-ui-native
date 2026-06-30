import { FlashList as ShopifyFlashList, type FlashListProps as ShopifyFlashListProps } from '@shopify/flash-list';
import { cloneElement, isValidElement, type ReactElement, useRef } from 'react';
import { type NativeScrollEvent, type NativeSyntheticEvent, Platform, type RefreshControlProps, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '../../utils/cn';
import { ListItem } from '../ListItem';
import { CardSkeleton } from '../Skeleton/CardSkeleton';
import { useScreenHeaderInset, useScreenScrollY } from '../ScreenContainer/screenScrollRegistry';
import { Text } from '../Text';

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
  contentContainerStyle,
  refreshControl,
  onEndReached,
  ...props
}: FlashListProps<T>) {
  // In screenScroll mode, only paginate AFTER a real user scroll — FlashList fires onEndReached once
  // during the initial/relayout pass (e.g. a feature remount), which would auto-fetch the next page
  // (or continue from the last cursor) with no user intent.
  const hasScrolledRef = useRef(false);
  // Screen-scroll integration (only applied when `screenScroll`): writing the route's scrollY on scroll
  // drives the ScreenHeader collapse, and the content is padded by the header's expanded height so the
  // list sits under the transparent header. Hooks are always called (cheap) to keep hook order stable.
  const scrollY = useScreenScrollY();
  const headerInset = useScreenHeaderInset();
  const insets = useSafeAreaInsets();

  // The ScreenHeader reports `headerInset` = its hero height EXCLUDING the status-bar safe area. Mirror
  // ScreenContainer's proven offset: on iOS `contentInsetAdjustmentBehavior="automatic"` (below — and
  // react-native-screens forces it anyway) makes iOS add `insets.top` itself, so pad ONLY by headerInset
  // (adding insets.top here too would double-count it → an extra status-bar-sized gap). Android has no
  // automatic content inset, so include insets.top in the padding there.
  // NOTE: this only lays out correctly because screenScroll mode disables FlashList v2's default
  // `maintainVisibleContentPosition` (below). That anchor (minIndexForVisible: 0) pins item 0 and cancels
  // the native safe-area inset shift, so the offset becomes a render-timing race (overlap at rest, or a
  // double gap after scroll). Disabling it makes FlashList behave like ScreenContainer's plain ScrollView.
  const isIos = Platform.OS === 'ios';
  // Full on-screen header height = hero height (excl. safe area) + the status-bar inset.
  const headerFullHeight = screenScroll && headerInset > 0 ? headerInset + insets.top : 0;
  // Offset strategy differs by platform ONLY because of how each positions the pull-to-refresh spinner:
  // - iOS: put the header offset in the scroll view's CONTENT INSET (not contentContainerStyle padding). The
  //   native UIRefreshControl + scroll indicator rest at the content inset, so this lands them at the header
  //   bottom for free — no progressViewOffset/scrollIndicatorInsets pixel-tuning (tuning via padding left the
  //   spinner stuck inside the header). contentInsetAdjustmentBehavior="automatic" adds the safe-area inset on
  //   top, so the contentInset itself only needs headerInset.
  // - Android: no contentInset → keep the header offset in content padding + progressViewOffset.
  const screenContentInset = isIos && headerFullHeight > 0 ? { top: headerInset } : undefined;
  const androidHeaderPad = !isIos && headerFullHeight > 0 ? { paddingTop: headerFullHeight } : null;
  // contentOffset rests at -(adjustedContentInset.top): iOS = headerInset + insets.top, Android = 0. Normalize
  // the header-driving scrollY so it reads 0 at rest (else the first inset's worth of scroll is a dead zone
  // where the list moves but the header stays frozen and cards peek under the search).
  const scrollNormalize = isIos ? headerFullHeight : 0;

  const skeletonRenderer =
    renderSkeletonItem ?? (skeletonVariant === 'card' ? () => <CardSkeleton /> : () => <ListItem loading title="" />);
  const composedContentContainerStyle = androidHeaderPad
    ? contentContainerStyle != null
      ? [androidHeaderPad, contentContainerStyle]
      : androidHeaderPad
    : contentContainerStyle;

  // Android: push the pull-to-refresh spinner below the transparent header (iOS rests it via contentInset).
  const screenRefreshControl =
    androidHeaderPad && isValidElement(refreshControl)
      ? cloneElement(refreshControl as ReactElement<RefreshControlProps>, {
          progressViewOffset: (refreshControl as ReactElement<RefreshControlProps>).props.progressViewOffset ?? headerFullHeight,
        })
      : refreshControl;

  if (isLoading) {
    return (
      <ShopifyFlashList
        data={Array.from({ length: skeletonCount }, (_, i) => i)}
        renderItem={() => skeletonRenderer()}
        keyExtractor={String}
        scrollEnabled={false}
        className={cn(screenScroll && 'flex-1 bg-background', className)}
        {...(screenScroll
          ? {
              contentInsetAdjustmentBehavior: 'automatic' as const,
              maintainVisibleContentPosition: { disabled: true },
              ...(screenContentInset ? { contentInset: screenContentInset } : {}),
            }
          : {})}
        {...(composedContentContainerStyle != null ? { contentContainerStyle: composedContentContainerStyle } : {})}
      />
    );
  }

  const emptyComponent = EmptyComponent ?? (
    <View className={cn('flex-1 items-center justify-center py-12')}>
      <Text variant="muted">{emptyText}</Text>
    </View>
  );

  return (
    <ShopifyFlashList
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
      {...props}
      {...(screenScroll
        ? {
            // Disable FlashList v2's default maintainVisibleContentPosition anchor (minIndexForVisible: 0).
            // It pins item 0 and cancels the native safe-area inset, making the top offset a render-timing
            // race (overlap at rest / double gap after scroll). Off → behaves like a plain ScrollView, so
            // the inset offsets below resolve deterministically. (Append-pagination doesn't need it.)
            maintainVisibleContentPosition: { disabled: true },
            // Explicit "automatic" makes iOS apply the safe-area inset at rest (on top of contentInset).
            contentInsetAdjustmentBehavior: 'automatic' as const,
            // iOS: header offset rides the content inset (spinner/indicator follow it). Android: indicator is
            // inset to the header bottom manually (its offset is content padding).
            ...(screenContentInset ? { contentInset: screenContentInset } : {}),
            ...(androidHeaderPad ? { scrollIndicatorInsets: { top: headerFullHeight } } : {}),
            // JS handler is enough: writing the SharedValue propagates to the header's UI-thread animation.
            onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
              // Normalize: contentOffset.y rests at -(adjustedContentInset.top) on iOS (= headerFullHeight)
              // and 0 on Android, so +scrollNormalize makes the header see 0 at rest and track real scroll
              // distance. Without it the first inset's worth of scroll is a DEAD ZONE: the list slides up
              // (cards peek under the search) while the header stays frozen (interpolations clamp negatives).
              const y = e.nativeEvent.contentOffset.y + scrollNormalize;
              if (y > 4) hasScrolledRef.current = true; // gates onEndReached until a real scroll
              scrollY.value = y;
            },
            scrollEventThrottle: 16,
          }
        : {})}
    />
  );
}

FlashList.displayName = 'FlashList';

export { FlashList };
