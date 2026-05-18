import type { ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { Spinner } from '../Spinner';
import { Text } from '../Typography';

export interface SplashScreenProps {
  logo?: ReactNode;
  title?: string;
  subtitle?: string;
  statusText?: string;
  showSpinner?: boolean;
}

export function SplashScreen({ logo, title, subtitle, statusText, showSpinner = true }: SplashScreenProps) {
  const { palette: colors } = useTheme();

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      <View className="flex-1 items-center justify-center bg-background px-8">
        {logo ? <View className="items-center justify-center">{logo}</View> : null}
        {title ? <Text className="mt-6 text-2xl font-semibold text-foreground text-center">{title}</Text> : null}
        {subtitle ? <Text className="mt-2 text-sm text-muted-foreground text-center">{subtitle}</Text> : null}
        {showSpinner ? (
          <View className="mt-8 items-center">
            <Spinner size="large" />
            {statusText ? <Text className="mt-4 text-sm text-muted-foreground text-center">{statusText}</Text> : null}
          </View>
        ) : statusText ? (
          <Text className="mt-8 text-sm text-muted-foreground text-center">{statusText}</Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
