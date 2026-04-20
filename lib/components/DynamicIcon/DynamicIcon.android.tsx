import { TextClassContext } from '../../reusables/text';
import { cn } from '../../utils/index';
import { styled } from 'nativewind';
import * as React from 'react';
import { MaterialIcons, type MaterialIconsIconName } from '@react-native-vector-icons/material-icons';
import type { DynamicIconProps } from './types';

function DynamicIconImpl({
  icon,
  multicolor: _multicolor,
  scale: _scale,
  weight: _weight,
  ...props
}: DynamicIconProps) {
  return <MaterialIcons name={icon.materialIcon as MaterialIconsIconName} {...props} />;
}

const StyledDynamicIconImpl = styled(DynamicIconImpl, {
  className: {
    target: 'style',
    nativeStyleMapping: {
      color: 'color',
      height: 'size',
      width: 'size',
    },
  },
} as any) as unknown as React.ComponentType<DynamicIconProps & { className?: string }>;

export function DynamicIcon({ className, color, size = 14, ...props }: DynamicIconProps) {
  const textClass = React.useContext(TextClassContext);

  return (
    <StyledDynamicIconImpl
      className={cn('text-foreground', textClass, className)}
      color={color}
      size={size}
      {...props}
    />
  );
}
