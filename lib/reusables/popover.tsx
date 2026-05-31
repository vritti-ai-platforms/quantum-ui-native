import * as PopoverPrimitive from '@rn-primitives/popover';
import { VariableContextProvider } from 'nativewind';
import * as React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import { FullWindowOverlay as RNFullWindowOverlay } from 'react-native-screens';
import { THEME_TOKENS } from '../theme/colors';
import { ThemeContext } from '../theme/ThemeProvider';
import { cn } from '../utils/index';
import { NativeOnlyAnimatedView } from './native-only-animated-view';
import { TextClassContext } from './text';

// RN analog of the web shadcnPopover — wraps @rn-primitives/popover with theming.
// The primitive Root is UNCONTROLLED (the Trigger toggles it); read `open` / call
// `onOpenChange(false)` from inside the content via usePopoverContext() to close it.
const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverClose = PopoverPrimitive.Close;
const usePopoverContext = PopoverPrimitive.useRootContext;

const FullWindowOverlay = Platform.OS === 'ios' ? RNFullWindowOverlay : React.Fragment;

function PopoverContent({
  ref,
  className,
  align = 'start',
  side = 'bottom',
  sideOffset = 4,
  portalHost,
  children,
  ...props
}: PopoverPrimitive.ContentProps &
  React.RefAttributes<PopoverPrimitive.ContentRef> & {
    className?: string;
    portalHost?: string;
  }) {
  // The portal teleports outside the app's provider tree, so re-inject the theme
  // (ThemeContext + NativeWind variables + the `dark` class) for correct colors.
  const themeCtx = React.useContext(ThemeContext);
  const isDark = themeCtx.colorScheme === 'dark';
  const themeValues = THEME_TOKENS[themeCtx.colorScheme].variables;

  return (
    <PopoverPrimitive.Portal hostName={portalHost}>
      <FullWindowOverlay>
        <PopoverPrimitive.Overlay closeOnPress style={Platform.select({ native: StyleSheet.absoluteFill })}>
          <ThemeContext.Provider value={themeCtx}>
            <VariableContextProvider value={themeValues}>
              <TextClassContext.Provider value="text-popover-foreground">
                <NativeOnlyAnimatedView className={cn('z-50', isDark && 'dark')} entering={FadeIn} exiting={FadeOut}>
                  <PopoverPrimitive.Content
                    ref={ref}
                    align={align}
                    side={side}
                    sideOffset={sideOffset}
                    className={cn(
                      'bg-popover border-border z-50 min-w-[12rem] rounded-md border shadow-md shadow-black/5',
                      className
                    )}
                    {...props}
                  >
                    {children}
                  </PopoverPrimitive.Content>
                </NativeOnlyAnimatedView>
              </TextClassContext.Provider>
            </VariableContextProvider>
          </ThemeContext.Provider>
        </PopoverPrimitive.Overlay>
      </FullWindowOverlay>
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverClose, PopoverContent, PopoverTrigger, usePopoverContext };
