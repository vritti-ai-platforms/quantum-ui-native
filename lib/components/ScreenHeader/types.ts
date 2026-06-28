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
  /** Render a built-in native-style back button as the left action (chevron on iOS, arrow on Android). Ignored when `leftActions` is provided. */
  backButton?: boolean;
}

interface ScreenHeaderStandardProps extends ScreenHeaderCommonProps {
  variant?: 'standard';
  leftActions?: ReactNode;
  rightActions?: ReactNode;
  /** Show a collapsing search field below the title; its value is read via `useScreenSearch()`. */
  searchable?: boolean;
  searchPlaceholder?: string;
}

interface ScreenHeaderTabsProps extends ScreenHeaderCommonProps {
  variant: 'tabs';
  tabs: ScreenHeaderTabConfig[];
  /** Optional actions placed left/right of the centered title in the collapsing nav row (e.g. a back button). */
  leftActions?: ReactNode;
  rightActions?: ReactNode;
}

export type ScreenHeaderProps = ScreenHeaderStandardProps | ScreenHeaderTabsProps;
