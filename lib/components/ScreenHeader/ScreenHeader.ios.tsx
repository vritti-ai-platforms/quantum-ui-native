import { View } from 'react-native';
import { usePlatformInfo } from '../../hooks/usePlatformInfo';
import { ScreenHeaderBase } from './ScreenHeaderBase';
import type { ScreenHeaderProps } from './types';

export function ScreenHeader({ title, subtitle, leftActions, rightActions }: ScreenHeaderProps) {
  const { version } = usePlatformInfo();
  const isIos26 = version >= 26;

  // iOS 26+: a soft top→bottom fade so content fades as it scrolls under the
  // transparent header. Pre-26: a plain solid surface with a divider that
  // fades in on scroll (animateBackdrop).
  const backdrop = isIos26 ? (
    <View className="flex-1 bg-linear-to-b from-background via-background via-[60%] to-transparent" />
  ) : (
    <View className="flex-1 bg-background" />
  );

  return (
    <ScreenHeaderBase
      title={title}
      subtitle={subtitle}
      backdrop={backdrop}
      overlay
      animateBackdrop={!isIos26}
      leftActions={leftActions}
      rightActions={rightActions}
    />
  );
}
