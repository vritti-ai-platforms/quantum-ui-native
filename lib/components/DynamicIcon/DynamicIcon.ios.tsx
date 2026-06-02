import { useUnstableNativeVariable } from 'nativewind';
import * as React from 'react';
import { SFSymbol } from 'react-native-sfsymbols';
import { TextClassContext } from '../Text';
import { cn } from '../../utils/index';
import type { DynamicIconProps } from './types';

// nativewind v5-preview's lift to SFSymbol's tintColor prop isn't reliable — resolve the CSS variable ourselves.
const CLASS_TO_VAR: Record<string, string> = {
  'text-foreground': '--foreground',
  'text-muted-foreground': '--muted-foreground',
  'text-card-foreground': '--card-foreground',
  'text-popover-foreground': '--popover-foreground',
  'text-primary': '--primary',
  'text-primary-foreground': '--primary-foreground',
  'text-secondary': '--secondary',
  'text-secondary-foreground': '--secondary-foreground',
  'text-accent': '--accent',
  'text-accent-foreground': '--accent-foreground',
  'text-destructive': '--destructive',
  'text-destructive-foreground': '--destructive-foreground',
  'text-warning': '--warning',
  'text-warning-foreground': '--warning-foreground',
  'text-success': '--success',
  'text-success-foreground': '--success-foreground',
  'text-info': '--info',
  'text-info-foreground': '--info-foreground',
};

// Last-class-wins so call-site overrides beat TextClassContext.
function pickVariableFromClassName(className: string): string {
  const tokens = className.split(/\s+/);
  for (let i = tokens.length - 1; i >= 0; i--) {
    const v = CLASS_TO_VAR[tokens[i]];
    if (v) return v;
  }
  return '--primary';
}

export function DynamicIcon({
  className,
  color,
  size = 14,
  icon,
  multicolor: _multicolor,
  scale: _scale,
  weight: _weight,
  ...props
}: DynamicIconProps) {
  const textClass = React.useContext(TextClassContext);
  const fullClassName = cn('text-foreground', textClass, className);
  const cssVar = pickVariableFromClassName(fullClassName);
  const useVar = useUnstableNativeVariable as unknown as (name: string) => string | undefined;
  const hsl = useVar(cssVar);
  const resolvedColor = color ?? (typeof hsl === 'string' ? `hsl(${hsl})` : undefined);

  return <SFSymbol name={icon.sfSymbol} size={size} color={resolvedColor} {...(props as Record<string, unknown>)} />;
}
