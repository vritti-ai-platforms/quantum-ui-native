// Android press feedback: native ripple via Pressable's android_ripple prop.
// We deliberately skip the JS opacity dim — Material's tactile language is the
// ripple, not the dim — so the press feels native instead of cross-platform.
//
// Ripple color is theme-aware: in light mode the card bg is light so we use a
// dark ripple (~12% black, Material 3 state-layer opacity for light themes);
// in dark mode the card bg is dark so we flip to a light ripple
// (~16% white, Material 3 state-layer opacity for dark themes). Without this
// flip the dark-mode ripple is black-on-dark — invisible.
import type * as React from 'react';
import { Pressable, type PressableProps, useColorScheme } from 'react-native';
import { TextClassContext } from '../../reusables/text';
import { cn } from '../../utils/cn';

export interface CardPressableProps extends Omit<PressableProps, 'children'> {
  selected?: boolean;
  children?: React.ReactNode;
}

function CardPressable({ className, selected, disabled, android_ripple, children, ...props }: CardPressableProps) {
  const colorScheme = useColorScheme();
  const defaultRipple =
    colorScheme === 'dark'
      ? { color: 'rgba(255,255,255,0.16)', foreground: true }
      : { color: 'rgba(0,0,0,0.12)', foreground: true };

  return (
    <TextClassContext.Provider value="text-card-foreground">
      <Pressable
        disabled={disabled}
        android_ripple={android_ripple ?? defaultRipple}
        className={cn(selected && 'bg-secondary/40 border-primary border', disabled && 'opacity-50', className)}
        {...props}
      >
        {children}
      </Pressable>
    </TextClassContext.Provider>
  );
}

CardPressable.displayName = 'CardPressable';

export { CardPressable };
