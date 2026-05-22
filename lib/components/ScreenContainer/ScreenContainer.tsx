import type { ReactNode } from 'react';
import { ScrollView, type ScrollViewProps, View, type ViewProps } from 'react-native';
import { cn } from '../../utils/cn';

type ScrollableProps = {
  scrollable: true;
  children?: ReactNode;
} & Omit<ScrollViewProps, 'children' | 'onScroll'>;

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
