import { useUnstableNativeVariable } from 'nativewind';
import * as React from 'react';
import { Text } from 'react-native';
import { cn } from '../../utils/index';
import { TextClassContext } from '../Text';
import codepoints from './materialSymbols.codepoints.json';
import type { DynamicIconProps } from './types';

const CODEPOINTS = codepoints as Record<string, number>;

// Resolve the icon color inline from the className/nativewind var — nativewind's lift to `color` is
// unreliable on Android v5-preview, so we pass an explicit `color` to the glyph <Text>.
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
  style,
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

  const cp = CODEPOINTS[icon.materialSymbol];
  if (cp == null) return null;

  return (
    <Text
      allowFontScaling={false}
      {...props}
      // Caller `style` is MERGED after the glyph style (never replaces it) so an external
      // marginTop/marginRight can't wipe fontFamily/fontSize/color and blank the glyph.
      style={[
        {
          // Android matches fontFamily by the bundled asset's FILE BASENAME (no res/font XML
          // registration), so this must equal MaterialSymbols_400Regular.ttf — NOT the font's
          // internal "Material Symbols" family name. Link via `npx react-native-asset`.
          fontFamily: 'MaterialSymbols_400Regular',
          fontSize: size,
          lineHeight: size,
          color: resolvedColor,
          includeFontPadding: false,
        },
        style,
      ]}
    >
      {String.fromCharCode(cp)}
    </Text>
  );
}
