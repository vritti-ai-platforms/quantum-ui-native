// Default fallback for non-iOS / non-Android platforms (web etc.).
// The platform-flavored variants live in ScreenContainer.ios.tsx and
// ScreenContainer.android.tsx; Metro picks the right file at bundle time.
import type { ReactNode } from 'react';
import { ScrollView, type ScrollViewProps, View, type ViewProps } from 'react-native';
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

export const ScreenContainer = (props: ScreenContainerProps) => {
  if (props.scrollable) {
    const { scrollable: _scrollable, className, ...rest } = props;
    return <ScrollView {...rest} className={cn('flex-1 bg-background', className)} />;
  }

  const { scrollable: _scrollable, className, ...rest } = props;
  return <View {...rest} className={cn('flex-1 bg-background', className)} />;
};
