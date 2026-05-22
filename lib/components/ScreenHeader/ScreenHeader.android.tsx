import { View } from 'react-native';
import { ScreenHeaderBase } from './ScreenHeaderBase';
import type { ScreenHeaderProps } from './types';

export function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  return (
    <ScreenHeaderBase
      title={title}
      subtitle={subtitle}
      backdrop={<View className="flex-1 bg-background border-b border-border" />}
    />
  );
}
