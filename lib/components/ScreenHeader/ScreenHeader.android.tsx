import { View } from 'react-native';
import { ScreenHeaderBase } from './ScreenHeaderBase';
import type { ScreenHeaderProps } from './types';

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
      backgroundImage={props.backgroundImage}
      leftActions={props.variant === 'tabs' ? undefined : props.leftActions}
      rightActions={props.variant === 'tabs' ? undefined : props.rightActions}
      tabs={props.variant === 'tabs' ? props.tabs : undefined}
    />
  );
}
