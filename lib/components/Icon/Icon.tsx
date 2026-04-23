import { DynamicIcon, type DynamicIconProps } from '../DynamicIcon';

export interface IconProps extends DynamicIconProps {}

function Icon(props: IconProps) {
  return <DynamicIcon {...props} />;
}

Icon.displayName = 'Icon';

export { Icon };
