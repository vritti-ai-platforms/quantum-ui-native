import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { useUnstableNativeVariable } from 'nativewind';
import { type Context, createContext, type ReactNode, useContext } from 'react';
import { type ScrollViewProps, useWindowDimensions, View, type ViewProps } from 'react-native';
import Animated, { useAnimatedScrollHandler } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '../../utils/cn';
import { computeFloatingTabBarHeight } from '../BottomNavigation/tabBarInset';
import { useScreenHeaderInset, useScreenScrollY } from './screenScrollRegistry';

// Bottom space a screen must reserve. Inside the bottom-tab navigator (BottomTabBarHeightContext
// is defined — react-navigation is a shared MF singleton, so this crosses the remote boundary)
// reserve the floating pill's height, computed locally from insets+width (a host-provided context
// would NOT reach a Module Federation remote). Outside tabs, reserve the system nav-bar inset.
function useScreenBottomInset(): number {
  const inTabs = useContext(BottomTabBarHeightContext) !== undefined;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  return inTabs ? computeFloatingTabBarHeight(insets.bottom, width) : insets.bottom;
}

// HeaderShownContext via the same globalThis-keyed Map that
// @react-navigation/elements uses internally (see the iOS file for the long
// comment on why we don't import the package directly). NativeStackView
// populates `HeaderShownContext.Provider` SYNCHRONOUSLY with a boolean —
// unlike `HeaderHeightContext`, which initialises to `0` and only updates
// once the native header reports its measured height, producing a race
// that adds extra padding on first paint.
const NAMED_CONTEXTS_KEY = '__react_navigation__elements_contexts';
const namedContexts: Map<string, Context<unknown>> = ((globalThis as Record<string, unknown>)[NAMED_CONTEXTS_KEY] as
  | Map<string, Context<unknown>>
  | undefined) ?? new Map();
(globalThis as Record<string, unknown>)[NAMED_CONTEXTS_KEY] = namedContexts;
const HeaderShownContext: Context<boolean | undefined> =
  (namedContexts.get('HeaderShownContext') as Context<boolean | undefined> | undefined) ??
  (() => {
    const ctx = createContext<boolean | undefined>(false);
    ctx.displayName = 'HeaderShownContext';
    namedContexts.set('HeaderShownContext', ctx as Context<unknown>);
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

const ScrollableBody = ({
  className,
  style,
  topPad,
  rest,
}: {
  className?: string;
  style?: ScrollViewProps['style'];
  topPad: number;
  rest: Omit<ScrollViewProps, 'children' | 'style' | 'onScroll'> & { children?: ReactNode };
}) => {
  const bgVar = (useUnstableNativeVariable as unknown as (name: string) => string | undefined)('--background');
  const bgColor = typeof bgVar === 'string' ? `hsl(${bgVar})` : undefined;
  const scrollY = useScreenScrollY();
  const headerInset = useScreenHeaderInset();
  const { top: safeAreaTop } = useSafeAreaInsets();
  // Reserve bottom space so the last row clears the floating tab bar (or the system nav bar
  // outside the tab navigator). See useScreenBottomInset for the MF-remote rationale.
  const bottomPad = useScreenBottomInset();
  // useAnimatedScrollHandler writes scrollY (which drives a collapsing
  // ScreenHeader) on real scroll events.
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  const { contentContainerStyle, ...scrollViewProps } = rest;
  // Add safeAreaTop so the effective padding matches the full header height
  // (heroHeight + insets.top). On iOS this gap is filled by
  // contentInsetAdjustmentBehavior="automatic", which has no effect on Android.
  const effectivePadding = headerInset > 0 ? headerInset + safeAreaTop : 0;
  const padStyle: { paddingTop?: number; paddingBottom?: number } = {};
  if (effectivePadding > 0) padStyle.paddingTop = effectivePadding;
  if (bottomPad > 0) padStyle.paddingBottom = bottomPad;
  const hasPad = padStyle.paddingTop != null || padStyle.paddingBottom != null;
  const composedContainerStyle = hasPad
    ? contentContainerStyle != null
      ? [padStyle, contentContainerStyle]
      : padStyle
    : contentContainerStyle;
  return (
    <Animated.ScrollView
      showsVerticalScrollIndicator={false}
      {...scrollViewProps}
      className={cn('flex-1', className)}
      style={[{ backgroundColor: bgColor }, topPad > 0 ? { paddingTop: topPad } : null, style]}
      {...(composedContainerStyle != null ? { contentContainerStyle: composedContainerStyle } : {})}
      scrollEventThrottle={16}
      onScroll={onScroll}
    />
  );
};

export const ScreenContainer = (props: ScreenContainerProps) => {
  const bgVar = (useUnstableNativeVariable as unknown as (name: string) => string | undefined)('--background');
  const bgColor = typeof bgVar === 'string' ? `hsl(${bgVar})` : undefined;
  const insets = useSafeAreaInsets();
  const isHeaderShown = useContext(HeaderShownContext) ?? false;
  const topPad = isHeaderShown ? 0 : insets.top;
  // Floating tab bar height inside the tab navigator, else the system nav-bar inset.
  const bottomPad = useScreenBottomInset();

  if (props.scrollable) {
    const { scrollable: _scrollable, className, style, ...rest } = props;
    return <ScrollableBody className={className} style={style} topPad={topPad} rest={rest} />;
  }

  const { scrollable: _scrollable, className, style, ...rest } = props;
  return (
    <View
      {...rest}
      className={cn('flex-1', className)}
      style={[
        { backgroundColor: bgColor },
        topPad > 0 ? { paddingTop: topPad } : null,
        bottomPad > 0 ? { paddingBottom: bottomPad } : null,
        style,
      ]}
    />
  );
};
