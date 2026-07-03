import { useNavigation } from '@react-navigation/native';
import { type Context, createContext, type ReactNode, useContext, useEffect } from 'react';
import { InteractionManager, type ScrollViewProps, View, type ViewProps } from 'react-native';
import Animated, {
  type AnimatedRef,
  runOnUI,
  type SharedValue,
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlatformInfo } from '../../hooks/usePlatformInfo';
import { useInScreenHeaderTabPage } from '../ScreenHeader/screenHeaderTabPageContext';
import { cn } from '../../utils/cn';
import {
  getScreenRestoreY,
  setScreenRestoreY,
  useMeasuredScreenHeaderHeight,
  useScreenHeaderInset,
  useScreenRouteKey,
  useScreenScrollY,
} from './screenScrollRegistry';

// Reach @react-navigation/elements' HeaderHeightContext via its global map (lib/module/getNamedContext.js) instead of importing the package.
const NAMED_CONTEXTS_KEY = '__react_navigation__elements_contexts';
type NamedContextsMap = Map<string, Context<unknown>>;
const namedContexts: NamedContextsMap =
  ((globalThis as Record<string, unknown>)[NAMED_CONTEXTS_KEY] as NamedContextsMap | undefined) ?? new Map();
(globalThis as Record<string, unknown>)[NAMED_CONTEXTS_KEY] = namedContexts;

const HeaderHeightContext: Context<number | undefined> =
  (namedContexts.get('HeaderHeightContext') as Context<number | undefined> | undefined) ??
  (() => {
    const ctx = createContext<number | undefined>(undefined);
    ctx.displayName = 'HeaderHeightContext';
    namedContexts.set('HeaderHeightContext', ctx as Context<unknown>);
    return ctx;
  })();

type ScrollableProps = {
  scrollable: true;
  children?: ReactNode;
} & Omit<ScrollViewProps, 'children' | 'onScroll'>;

type StaticProps = {
  scrollable?: false;
  children?: ReactNode;
} & Omit<ViewProps, 'children'>;

export type ScreenContainerProps = ScrollableProps | StaticProps;

// react-native-screens re-pins the native scroll view to the top when the screen
// is relaid on a pop transition (contentInsetAdjustmentBehavior is forced to
// "automatic" and cannot be disabled). Save the offset on blur and restore it
// once the return transition settles so the list stays where the user left it.
function useScrollRestore(
  scrollRef: AnimatedRef<Animated.ScrollView>,
  scrollY: SharedValue<number>,
  normalizeOffset: number,
): void {
  const navigation = useNavigation();
  const routeKey = useScreenRouteKey();
  useEffect(() => {
    const unsubscribeBlur = navigation.addListener('blur', () => {
      setScreenRestoreY(routeKey, scrollY.value);
    });
    const unsubscribeFocus = navigation.addListener('focus', () => {
      const y = getScreenRestoreY(routeKey);
      if (y <= 0) return;
      InteractionManager.runAfterInteractions(() => {
        runOnUI(() => {
          // scrollY is normalized (0 at rest); the native content offset rests at -normalizeOffset, so
          // scrollTo needs the raw offset (y - normalizeOffset). onScroll re-derives scrollY from it.
          scrollTo(scrollRef, 0, y - normalizeOffset, false);
          scrollY.value = y;
        })();
      });
    });
    return () => {
      unsubscribeBlur();
      unsubscribeFocus();
    };
  }, [navigation, routeKey, scrollRef, scrollY, normalizeOffset]);
}

const ScrollableBody = ({
  className,
  rest,
}: {
  className?: string;
  rest: Omit<ScrollViewProps, 'children' | 'onScroll'> & { children?: ReactNode };
}) => {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollY = useScreenScrollY();
  const headerInset = useScreenHeaderInset();
  const measuredHeader = useMeasuredScreenHeaderHeight();
  const insets = useSafeAreaInsets();
  // Full on-screen header height: the header's MEASURED painted height when available (offset source of
  // truth — see screenScrollRegistry), else the constants+safe-area formula as the first-frame fallback.
  const headerFullHeight = headerInset > 0 ? (measuredHeader > 0 ? measuredHeader : headerInset + insets.top) : 0;
  useScrollRestore(scrollRef, scrollY, headerFullHeight);
  // Mirror FlashList screenScroll's deterministic iOS inset strategy under a transparent ScreenHeader:
  // the FULL header height (hero + status bar) rides the PROP contentInset with
  // contentInsetAdjustmentBehavior="never", and the initial contentOffset prop places a fresh mount exactly
  // at the rest position. The previous split (contentInset = headerInset + 'automatic' adding the safe
  // area) broke inside the ScreenHeader tabs' native pager: pager pages are child view controllers, where
  // UIKit's automatic safe-area addition doesn't apply — content rested one status-bar short and slid
  // under the transparent header (visible pre-iOS 26; masked by the glass header background on 26). Owning
  // the whole inset removes UIKit's async choreography on every mount path (pager or plain screen).
  // Screens WITHOUT a ScreenHeader inset keep 'automatic' — their safe-area handling is unchanged.
  const onScroll = useAnimatedScrollHandler((event) => {
    // contentOffset rests at -headerFullHeight; normalize so the header-driving scrollY reads 0 at rest
    // (else the first headerFullHeight of scroll is a dead zone where the collapse stays frozen).
    scrollY.value = event.contentOffset.y + headerFullHeight;
  });
  const { contentContainerStyle, ...scrollViewProps } = rest;
  const hasHeader = headerInset > 0;
  // iOS inset regime per context (see screenHeaderTabPageContext): inside a ScreenHeader tabs pager page,
  // 'automatic' contributes nothing (child view controller) → own the FULL inset with 'never' + an initial
  // contentOffset. On root screens, keep the git-proven original: 'automatic' + hero-only contentInset —
  // UIKit adds the safe-area share and settles the rest natively (forcing 'never'+full there races iOS's
  // nav scroll-view adoption and mis-rests the content, timing-dependently).
  const inTabPage = useInScreenHeaderTabPage();
  return (
    <Animated.ScrollView
      ref={scrollRef}
      showsVerticalScrollIndicator={false}
      {...scrollViewProps}
      className={cn('flex-1 bg-background', className)}
      contentInsetAdjustmentBehavior={hasHeader && inTabPage ? 'never' : 'automatic'}
      {...(hasHeader
        ? inTabPage
          ? {
              contentInset: { top: headerFullHeight },
              contentOffset: { x: 0, y: -headerFullHeight },
            }
          : { contentInset: { top: headerInset } }
        : {})}
      {...(contentContainerStyle != null ? { contentContainerStyle } : {})}
      {...(headerFullHeight > 0 ? { scrollIndicatorInsets: { top: headerFullHeight } } : {})}
      scrollEventThrottle={16}
      onScroll={onScroll}
    />
  );
};

export const ScreenContainer = (props: ScreenContainerProps) => {
  const headerHeight = useContext(HeaderHeightContext) ?? 0;
  const insets = useSafeAreaInsets();
  const { version } = usePlatformInfo();
  const isIosLiquidGlass = version >= 26;

  if (props.scrollable) {
    const { scrollable: _scrollable, className, ...rest } = props;
    return <ScrollableBody className={className} rest={rest} />;
  }

  const { scrollable: _scrollable, className, style, ...rest } = props;

  // iOS 26+ has a transparent header — offset by measured header height, fall back to safe-area when no header.
  // iOS <26 lets SafeAreaInsetsContext handle this since opaque headers zero out insets.top automatically.
  const topPad = isIosLiquidGlass ? (headerHeight > 0 ? headerHeight : insets.top) : insets.top;

  return (
    <View
      {...rest}
      className={cn('flex-1 bg-background', className)}
      style={[topPad > 0 ? { paddingTop: topPad } : null, style]}
    />
  );
};
