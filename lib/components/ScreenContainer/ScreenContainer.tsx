import { useHeaderHeight } from '@react-navigation/elements';
import type { ReactNode } from 'react';
import { ScrollView, type ScrollViewProps, View, type ViewProps } from 'react-native';
import { usePlatformInfo } from '../../hooks';
import { cn } from '../../utils/cn';

type ScrollableProps = {
  scrollable: true;
  children?: ReactNode;
} & Omit<ScrollViewProps, 'children'>;

type StaticProps = {
  scrollable?: false;
  children?: ReactNode;
} & Omit<ViewProps, 'children'>;

export type ScreenContainerProps = ScrollableProps | StaticProps;

// Screen root for any screen rendered inside a navigator with a transparent
// header (iOS 26 liquid glass). Handles content insets dynamically:
// - scrollable: ScrollView with iOS-native automatic inset adjustment.
// - static: View with paddingTop = current header height, only when iOS 26
//   transparent header is active. Other platforms get no extra padding.
export const ScreenContainer = (props: ScreenContainerProps) => {
  const headerHeight = useHeaderHeight();
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
