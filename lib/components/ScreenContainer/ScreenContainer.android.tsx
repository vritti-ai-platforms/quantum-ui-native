import { type Context, createContext, type ReactNode, useContext } from 'react';
import { ScrollView, type ScrollViewProps, View, type ViewProps } from 'react-native';
import Animated, { useAnimatedReaction, useAnimatedRef, useScrollViewOffset } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '../../utils/cn';
import { useScreenScrollY } from './screenScrollRegistry';

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
} & Omit<ScrollViewProps, 'children'>;

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
  rest: Omit<ScrollViewProps, 'children' | 'style'> & { children?: ReactNode };
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
      style={topPad > 0 ? [{ paddingTop: topPad }, style] : style}
      scrollEventThrottle={16}
    />
  );
};

export const ScreenContainer = (props: ScreenContainerProps) => {
  const insets = useSafeAreaInsets();
  const isHeaderShown = useContext(HeaderShownContext) ?? false;
  const topPad = isHeaderShown ? 0 : insets.top;

  if (props.scrollable) {
    const { scrollable: _scrollable, className, style, ...rest } = props;
    return <ScrollableBody className={className} style={style} topPad={topPad} rest={rest} />;
  }

  const { scrollable: _scrollable, className, style, ...rest } = props;
  return (
    <View
      {...rest}
      className={cn('flex-1 bg-background', className)}
      style={[topPad > 0 ? { paddingTop: topPad } : null, style]}
    />
  );
};
