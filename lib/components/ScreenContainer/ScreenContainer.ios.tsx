import { type Context, createContext, type ReactNode, useContext } from 'react';
import { ScrollView, type ScrollViewProps, View, type ViewProps } from 'react-native';
import Animated, { useAnimatedReaction, useAnimatedRef, useScrollViewOffset } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlatformInfo } from '../../hooks/usePlatformInfo';
import { cn } from '../../utils/cn';
import { useScreenScrollY } from './screenScrollRegistry';

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
} & Omit<ScrollViewProps, 'children'>;

type StaticProps = {
  scrollable?: false;
  children?: ReactNode;
} & Omit<ViewProps, 'children'>;

export type ScreenContainerProps = ScrollableProps | StaticProps;

const ScrollableBody = ({
  className,
  rest,
}: {
  className?: string;
  rest: Omit<ScrollViewProps, 'children'> & { children?: ReactNode };
}) => {
  const scrollRef = useAnimatedRef<ScrollView>();
  const offset = useScrollViewOffset(scrollRef);
  const scrollY = useScreenScrollY();
  useAnimatedReaction(
    () => offset.value,
    (current) => {
      scrollY.value = current;
    },
  );
  return (
    <Animated.ScrollView
      ref={scrollRef as never}
      {...rest}
      className={cn('flex-1 bg-background', className)}
      contentInsetAdjustmentBehavior="automatic"
      scrollEventThrottle={16}
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
