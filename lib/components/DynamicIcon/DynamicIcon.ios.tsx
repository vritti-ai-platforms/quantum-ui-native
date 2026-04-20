import { TextClassContext } from '../../reusables/text';
import { cn } from '../../utils/index';
import { styled } from 'nativewind';
import * as React from 'react';
import { SFSymbol } from 'react-native-sfsymbols';
import type { DynamicIconProps } from './types';

function DynamicIconImpl({ icon, ...props }: DynamicIconProps) {
  return <SFSymbol name={icon.sfSymbol} {...props} />;
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
