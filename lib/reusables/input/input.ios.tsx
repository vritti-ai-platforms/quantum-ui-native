import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { cn } from '../../utils/index';
import {
  StyleSheet,
  TextInput,
  View,
  type ColorValue,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

function getFallbackTint(multiline: boolean): ViewStyle {
  return {
    backgroundColor: multiline ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.12)',
  };
}

function getGlassTint(multiline: boolean): ColorValue {
  return multiline ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)';
}

function Input({
  className,
  multiline = false,
  numberOfLines = multiline ? 5 : 1,
  style,
  ...props
}: TextInputProps & React.RefAttributes<TextInput>) {
  const radius = multiline ? 20 : 18;

  return (
    <View
      className={cn(
        'w-full overflow-hidden border border-white/20 bg-white/10 shadow-sm shadow-black/10',
        multiline ? 'min-h-28 rounded-[20px]' : 'h-14 rounded-[18px]',
        props.editable === false && 'opacity-50',
        className
      )}
      style={style as ViewStyle}>
      <LiquidGlassView
        style={[
          StyleSheet.absoluteFillObject,
          { borderRadius: radius },
          !isLiquidGlassSupported && getFallbackTint(multiline),
        ]}
        effect="regular"
        interactive={false}
        tintColor={getGlassTint(multiline)}
      />
      <TextInput
        className={cn(
          'text-foreground placeholder:text-muted-foreground/60 bg-transparent px-4 text-base',
          multiline ? 'min-h-28 py-3' : 'h-14 py-0'
        )}
        style={{ textShadowColor: 'transparent' } as TextStyle}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? 'top' : props.textAlignVertical}
        {...props}
      />
    </View>
  );
}

export { Input };
