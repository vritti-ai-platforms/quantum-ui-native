import type { ReactNode } from 'react';
import type { StyleProp, ViewProps, ViewStyle } from 'react-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks';
import { getTheme } from '../../theme';
import { cn } from '../../utils/cn';

export interface ScreenLayoutProps extends ViewProps {
  children?: ReactNode;
  includeTopInset?: boolean;
  includeBottomInset?: boolean;
}

export const ScreenLayout = ({
  children,
  className,
  includeTopInset = true,
  includeBottomInset = false,
  style,
  ...props
}: ScreenLayoutProps) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const colors = getTheme(isDark ? 'dark' : 'light');

  const layoutStyle: StyleProp<ViewStyle> = {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: includeTopInset ? insets.top : 0,
    paddingBottom: includeBottomInset ? insets.bottom : 0,
  };

  return (
    <View {...props} className={cn('flex-1 bg-background', className)} style={[layoutStyle, style]}>
      {children}
    </View>
  );
};
