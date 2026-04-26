import { MaterialIcons, type MaterialIconsIconName } from '@react-native-vector-icons/material-icons';
import { useUnstableNativeVariable } from 'nativewind';
import * as React from 'react';
import { TextClassContext } from '../../reusables/text';
import { cn } from '../../utils/index';
import type { DynamicIconProps } from './types';

// Why this file does its own colour resolution instead of leaning on nativewind
// like the iOS file does:
//
// `@react-native-vector-icons/material-icons` (v12+) is a `<Text>` under the
// hood that picks `color` from BOTH the `color` prop and `style.color`. The
// nativewind `styled(...)` / `useCssElement` path is supposed to resolve
// className → style.color and then `nativeStyleMapping` should lift it to the
// `color` prop. In practice that lift doesn't happen reliably on Android in
// nativewind v5-preview when the wrapped component is a vector-icon, so the
// icon ended up rendering in the default font colour regardless of variant.
//
// Workaround: detect which Tailwind text-* class was passed, look up the
// matching CSS variable on the live ThemeProvider (via VariableContextProvider
// → `useUnstableNativeVariable`), and pass the resolved `hsl(...)` string as
// MaterialIcons' `color` prop directly. iOS file is unchanged because SFSymbol
// reads `style.color` correctly there and doesn't need this bridge.
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

  return (
    <MaterialIcons name={icon.materialIcon as MaterialIconsIconName} color={resolvedColor} size={size} {...props} />
  );
}
