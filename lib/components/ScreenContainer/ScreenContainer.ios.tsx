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
import { cn } from '../../utils/cn';
import {
  getScreenRestoreY,
  setScreenRestoreY,
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
function useScrollRestore(scrollRef: AnimatedRef<Animated.ScrollView>, scrollY: SharedValue<number>): void {
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
          scrollTo(scrollRef, 0, y, false);
          scrollY.value = y;
        })();
      });
    });
    return () => {
      unsubscribeBlur();
      unsubscribeFocus();
    };
  }, [navigation, routeKey, scrollRef, scrollY]);
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
  useScrollRestore(scrollRef, scrollY);
  // useAnimatedScrollHandler writes scrollY (which drives the ScreenHeader
  // collapse) on real scroll events; useScrollRestore handles the native
  // scroll-position loss across navigation.
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  const { contentContainerStyle, ...scrollViewProps } = rest;
  const topInset = headerInset;
  const composedContainerStyle =
    topInset > 0
      ? contentContainerStyle != null
        ? [{ paddingTop: topInset }, contentContainerStyle]
        : { paddingTop: topInset }
      : contentContainerStyle;
  return (
    <Animated.ScrollView
      ref={scrollRef}
      showsVerticalScrollIndicator={false}
      {...scrollViewProps}
      className={cn('flex-1 bg-background', className)}
      contentInsetAdjustmentBehavior="automatic"
      {...(composedContainerStyle != null ? { contentContainerStyle: composedContainerStyle } : {})}
      {...(topInset > 0 ? { scrollIndicatorInsets: { top: topInset } } : {})}
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
