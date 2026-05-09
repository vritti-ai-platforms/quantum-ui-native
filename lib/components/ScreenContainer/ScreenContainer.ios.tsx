import { type Context, createContext, type ReactNode, useContext } from 'react';
import { ScrollView, type ScrollViewProps, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlatformInfo } from '../../hooks/usePlatformInfo';
import { cn } from '../../utils/cn';

// Reach the SAME HeaderHeightContext that @react-navigation/elements creates,
// without importing from the package. The package stores its named contexts on
// globalThis under the key below (see lib/module/getNamedContext.js); whichever
// of us touches the map first creates the context, and all subsequent callers
// reuse the same instance — so a NativeStack header's Provider in the host is
// observed correctly here.
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

export const ScreenContainer = (props: ScreenContainerProps) => {
  const headerHeight = useContext(HeaderHeightContext) ?? 0;
  const insets = useSafeAreaInsets();
  const { version } = usePlatformInfo();
  const isIosLiquidGlass = version >= 26;

  if (props.scrollable) {
    const { scrollable: _scrollable, className, ...rest } = props;
    return (
      <ScrollView
        {...rest}
        className={cn('flex-1 bg-background', className)}
        contentInsetAdjustmentBehavior="automatic"
      />
    );
  }

  const { scrollable: _scrollable, className, style, ...rest } = props;

  // iOS 26+ (Liquid Glass): the header is transparent, so content must be manually
  // offset by the measured header height. When there is no header, fall back to the
  // top safe area inset.
  //
  // iOS <26: React Navigation's SafeAreaInsetsContext already adjusts insets.top to 0
  // when an opaque header is consuming the safe area, and to the full notch/status-bar
  // height when there is no header — so we can use it directly without checking
  // HeaderShownContext (which leaks from parent navigators and gives false positives).
  const topPad = isIosLiquidGlass ? (headerHeight > 0 ? headerHeight : insets.top) : insets.top;

  return (
    <View
      {...rest}
      className={cn('flex-1 bg-background', className)}
      style={[topPad > 0 ? { paddingTop: topPad } : null, style]}
    />
  );
};
