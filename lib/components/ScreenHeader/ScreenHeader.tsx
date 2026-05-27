import { View } from 'react-native';
import { ScreenHeaderBase } from './ScreenHeaderBase';
import type { ScreenHeaderProps } from './types';

// Web fallback — a plain solid surface (no Liquid Glass) that fades in on scroll.
export function ScreenHeader(props: ScreenHeaderProps) {
  const variant = props.variant ?? 'standard';

  return (
    <ScreenHeaderBase
      title={props.title}
      subtitle={props.subtitle}
      variant={variant}
      backdrop={<View className="flex-1 bg-background" />}
      overlay
      animateBackdrop
      tabsBackground={undefined}
      leftActions={props.variant === 'tabs' ? undefined : props.leftActions}
      rightActions={props.variant === 'tabs' ? undefined : props.rightActions}
      tabs={props.variant === 'tabs' ? props.tabs : undefined}
    />
  );
}
