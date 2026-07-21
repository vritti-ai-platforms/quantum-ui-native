import { useUnstableNativeVariable } from 'nativewind';
import { View } from 'react-native';
import { ScreenHeaderBackButton } from './ScreenHeaderBackButton';
import { ScreenHeaderBase } from './ScreenHeaderBase';
import type { ScreenHeaderProps } from './types';

export function ScreenHeader(props: ScreenHeaderProps) {
  const bgVar = (useUnstableNativeVariable as unknown as (name: string) => string | undefined)('--background');
  const bgColor = typeof bgVar === 'string' ? `hsl(${bgVar})` : undefined;
  const variant = props.variant ?? 'standard';

  return (
    <ScreenHeaderBase
      title={props.title}
      subtitle={props.subtitle}
      variant={variant}
      backdrop={<View style={{ flex: 1, backgroundColor: bgColor }} />}
      overlay
      animateBackdrop
      tabsBackground={undefined}
      backgroundImage={props.backgroundImage}
      leftActions={props.leftActions ?? (props.backButton ? <ScreenHeaderBackButton /> : undefined)}
      rightActions={props.rightActions}
      createLabel={props.createLabel}
      createPermission={props.createPermission}
      searchable={props.variant === 'tabs' ? undefined : props.searchable}
      searchPlaceholder={props.variant === 'tabs' ? undefined : props.searchPlaceholder}
      tabs={props.variant === 'tabs' ? props.tabs : undefined}
    />
  );
}
