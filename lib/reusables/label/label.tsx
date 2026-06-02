import * as LabelPrimitive from '@rn-primitives/label';
import { Platform } from 'react-native';
import { cn } from '../../utils/index';

// RN analog of the web shadcnLabel — same text-sm/font-medium/gap-2/items-center/select-none and the
// peer/group disabled + leading-none states (web-only, since native handles line-height/disabled
// differently). @rn-primitives/label splits into Root (the pressable) + Text, so the text classes live
// on Text and the layout/disabled classes on Root.
function Label({
  className,
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  disabled,
  ...props
}: LabelPrimitive.TextProps & React.RefAttributes<LabelPrimitive.TextRef>) {
  return (
    <LabelPrimitive.Root
      className={cn(
        'flex select-none flex-row items-center gap-2',
        Platform.select({
          web: 'cursor-default leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50 group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50',
        }),
        disabled && 'opacity-50',
      )}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
    >
      <LabelPrimitive.Text
        className={cn('text-foreground text-md font-small', Platform.select({ web: 'leading-none' }), className)}
        {...props}
      />
    </LabelPrimitive.Root>
  );
}

export { Label };
