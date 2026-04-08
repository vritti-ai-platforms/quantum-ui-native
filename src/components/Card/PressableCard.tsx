import { TextClassContext } from '../../reusables/text';
import { cn } from '../../utils/cn';
import { cva, type VariantProps } from 'class-variance-authority';
import { Pressable, View, type ViewProps } from 'react-native';

// CVA variants for interactive card container states
const pressableCardVariants = cva('', {
  variants: {
    state: {
      default: '',
      selected: 'bg-primary/5 border-primary border-[1.5px]',
    },
  },
  defaultVariants: {
    state: 'default',
  },
});

export interface PressableCardProps extends ViewProps {
  onPress?: () => void;
  selected?: boolean;
  disabled?: boolean;
}

// Interactive card container — renders Pressable when onPress is provided, View otherwise
function PressableCard({
  onPress,
  selected,
  disabled,
  className,
  children,
  ...props
}: PressableCardProps) {
  const state = selected ? 'selected' : 'default';
  const combinedClassName = cn(
    pressableCardVariants({ state }),
    disabled && 'opacity-50',
    className
  );

  if (onPress) {
    return (
      <TextClassContext.Provider value="text-card-foreground">
        <Pressable
          onPress={onPress}
          disabled={disabled}
          className={cn(combinedClassName, 'active:bg-accent')}
          {...(props as any)}
        >
          {children}
        </Pressable>
      </TextClassContext.Provider>
    );
  }

  return (
    <TextClassContext.Provider value="text-card-foreground">
      <View className={combinedClassName} {...props}>
        {children}
      </View>
    </TextClassContext.Provider>
  );
}

PressableCard.displayName = 'PressableCard';

export { PressableCard, pressableCardVariants };
