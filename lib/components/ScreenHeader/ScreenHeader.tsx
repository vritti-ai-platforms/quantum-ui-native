import { View } from 'react-native';
import { ScreenHeaderBase } from './ScreenHeaderBase';
import type { ScreenHeaderProps } from './types';

// Web fallback — a plain solid surface (no Liquid Glass).
export function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  return (
    <ScreenHeaderBase
      title={title}
      subtitle={subtitle}
      backdrop={<View className="flex-1 bg-background border-b border-border" />}
    />
  );
}
