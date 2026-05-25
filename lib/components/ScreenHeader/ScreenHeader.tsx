import { View } from 'react-native';
import { ScreenHeaderBase } from './ScreenHeaderBase';
import type { ScreenHeaderProps } from './types';

// Web fallback — a plain solid surface (no Liquid Glass) that fades in on scroll.
export function ScreenHeader({ title, subtitle, leftActions, rightActions }: ScreenHeaderProps) {
  return (
    <ScreenHeaderBase
      title={title}
      subtitle={subtitle}
      backdrop={<View className="flex-1 bg-background" />}
      overlay
      animateBackdrop
      leftActions={leftActions}
      rightActions={rightActions}
    />
  );
}
