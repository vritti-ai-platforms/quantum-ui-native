import { type Context, createContext, type ReactNode, useContext } from 'react';
import { ScrollView, type ScrollViewProps, View, type ViewProps } from 'react-native';
import { usePlatformInfo } from '../../hooks/usePlatformInfo';
import { cn } from '../../utils/cn';

// Reach the SAME HeaderHeightContext that @react-navigation/elements creates,
// without importing from the package. The package stores its named contexts on
// globalThis under the key below (see lib/module/getNamedContext.js); whichever
// of us touches the map first creates the context, and all subsequent callers
// reuse the same instance — so a NativeStack header's Provider in the host is
// observed correctly here.
//
const NAMED_CONTEXTS_KEY = '__react_navigation__elements_contexts';
type NamedContextsMap = Map<string, Context<number | undefined>>;
const namedContexts: NamedContextsMap =
  ((globalThis as Record<string, unknown>)[NAMED_CONTEXTS_KEY] as NamedContextsMap | undefined) ?? new Map();
(globalThis as Record<string, unknown>)[NAMED_CONTEXTS_KEY] = namedContexts;
const HeaderHeightContext: Context<number | undefined> =
  namedContexts.get('HeaderHeightContext') ??
  (() => {
    const ctx = createContext<number | undefined>(undefined);
    ctx.displayName = 'HeaderHeightContext';
    namedContexts.set('HeaderHeightContext', ctx);
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
  const { os, version } = usePlatformInfo();
  const isIosLiquidGlass = os === 'ios' && version >= 26;

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
  return (
    <View
      {...rest}
      className={cn('flex-1 bg-background', className)}
      style={[isIosLiquidGlass && headerHeight > 0 ? { paddingTop: headerHeight } : null, style]}
    />
  );
};
