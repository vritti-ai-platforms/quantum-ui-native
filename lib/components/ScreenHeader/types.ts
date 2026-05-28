import type { ReactNode } from 'react';
import type { ImageSourcePropType } from 'react-native';
import type { PlatformIconDescriptor } from '../DynamicIcon';

export interface ScreenHeaderTabConfig {
  id: string;
  label: string;
  content: ReactNode;
  icon: PlatformIconDescriptor;
  activeIcon?: PlatformIconDescriptor;
  backgroundImage?: ImageSourcePropType;
}

export type ScreenHeaderVariant = 'standard' | 'tabs';

interface ScreenHeaderCommonProps {
  title: string;
  subtitle?: string;
  backgroundImage?: ImageSourcePropType;
}

interface ScreenHeaderStandardProps extends ScreenHeaderCommonProps {
  variant?: 'standard';
  leftActions?: ReactNode;
  rightActions?: ReactNode;
}

interface ScreenHeaderTabsProps extends ScreenHeaderCommonProps {
  variant: 'tabs';
  tabs: ScreenHeaderTabConfig[];
}

export type ScreenHeaderProps = ScreenHeaderStandardProps | ScreenHeaderTabsProps;
