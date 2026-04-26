import { useUnstableNativeVariable } from 'nativewind';
import * as React from 'react';
import { SFSymbol } from 'react-native-sfsymbols';
import { TextClassContext } from '../../reusables/text';
import { cn } from '../../utils/index';
import type { DynamicIconProps } from './types';

// Same JS-side colour resolution as the Android sibling. We previously relied
// on nativewind's `styled(...)` HOC + `nativeStyleMapping` to lift the
// className-derived colour onto SFSymbol's `tintColor` / `color` prop, but in
// nativewind v5-preview that lift isn't reliable across SFSymbol either —
// every variant ended up rendering in the default primary tint. Switching to
// explicit CSS-variable lookup (`useUnstableNativeVariable`) and forwarding
// the resolved `hsl(...)` string as a real prop fixes it deterministically.
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

// Pick the *last* matching colour class so user overrides win (e.g. when
// TextClassContext supplies `text-foreground` and the call site adds
// `text-warning`, we want `text-warning`).
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
