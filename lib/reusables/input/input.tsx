import { useUnstableNativeVariable } from 'nativewind';
import { useState } from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { cn } from '../../utils/index';

// Resolve theme colors from the NativeWind variable context — it's shared across the MF boundary
// and always reflects the active theme. ThemeContext/useTheme isn't reliably connected for a
// component bundled inside a micro-app, and NativeWind className colors don't apply to TextInput,
// so bg + border are resolved here and applied via inline style (like ScreenContainer does for
// --background). Matches the Select trigger: --input/30 fill, blue border on focus.
const useVar = useUnstableNativeVariable as unknown as (name: string) => string | undefined;

function Input({
  className,
  multiline = false,
  numberOfLines = multiline ? 5 : 1,
  style,
  onFocus,
  onBlur,
  'aria-invalid': ariaInvalid,
  ...props
}: TextInputProps & { 'aria-invalid'?: boolean | 'true' | 'false' } & React.RefAttributes<TextInput>) {
  const [focused, setFocused] = useState(false);
  const inputVar = useVar('--input');
  const borderVar = useVar('--border');
  const primaryVar = useVar('--primary');
  const destructiveVar = useVar('--destructive');
  const foregroundVar = useVar('--foreground');
  const mutedFgVar = useVar('--muted-foreground');

  const isError = ariaInvalid === true || ariaInvalid === 'true';
  const backgroundColor = inputVar ? `hsla(${inputVar.split(' ').join(', ')}, 0.3)` : undefined;
  const borderToken = isError ? destructiveVar : focused ? primaryVar : borderVar;
  const borderColor = borderToken ? `hsl(${borderToken})` : undefined;
  const borderWidth = isError ? 2 : focused ? 1.5 : 1;
  // Text + placeholder colors resolved inline too (not className): on Android, NativeWind className
  // color resolution follows the system Appearance, so app-dark/system-light made the placeholder
  // resolve to the light --muted-foreground and vanish on the dark input.
  const color = foregroundVar ? `hsl(${foregroundVar})` : undefined;
  const placeholderColor = mutedFgVar ? `hsla(${mutedFgVar.split(' ').join(', ')}, 0.9)` : undefined;

  return (
    <TextInput
      className={cn(
        'w-full min-w-0 rounded-md text-[16px]',
        multiline ? 'min-h-24' : 'h-12',
        props.editable === false && 'opacity-50',
        className,
      )}
      multiline={multiline}
      numberOfLines={numberOfLines}
      textAlignVertical={multiline ? 'top' : props.textAlignVertical}
      placeholderTextColor={placeholderColor}
      style={[
        {
          backgroundColor,
          borderColor,
          borderWidth,
          color,
          paddingHorizontal: 12,
          paddingVertical: multiline ? 12 : 0,
        },
        style,
      ]}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      {...props}
    />
  );
}

export { Input };
