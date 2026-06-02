import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { type GestureResponderEvent, Pressable } from 'react-native';
import { cn } from '../../utils/index';
import { TextClassContext } from '../../components/Text';

const buttonVariants = cva(
  'group shrink-0 flex-row items-center justify-center gap-2 rounded-[14px] shadow-sm shadow-black/5',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        destructive: 'bg-destructive',
        secondary: 'bg-secondary',
        warning: 'bg-warning',
        success: 'bg-success',
        outline: 'border-border bg-background border',
        ghost: 'bg-transparent',
        glass: 'bg-primary',
        link: 'bg-transparent shadow-none',
      },
      size: {
        default: 'h-12 px-5 py-2',
        sm: 'h-10 px-4 py-2',
        lg: 'h-14 px-7 py-2',
        icon: 'h-12 w-12 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const buttonTextVariants = cva('text-foreground text-sm font-medium', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      destructive: 'text-destructive-foreground',
      secondary: 'text-secondary-foreground',
      warning: 'text-warning-foreground',
      success: 'text-success-foreground',
      outline: 'text-foreground',
      ghost: 'text-foreground',
      glass: 'text-primary-foreground',
      link: 'text-primary underline',
    },
    size: {
      default: '',
      sm: '',
      lg: '',
      icon: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

type ButtonProps = Omit<React.ComponentProps<typeof Pressable>, 'children'> &
  React.RefAttributes<typeof Pressable> &
  VariantProps<typeof buttonVariants> & {
    children?: React.ReactNode;
  };

function Button({ className, variant, size, onPressIn, onPressOut, ...props }: ButtonProps) {
  const [pressed, setPressed] = React.useState(false);

  const handlePressIn = React.useCallback(
    (e: GestureResponderEvent) => {
      setPressed(true);
      onPressIn?.(e);
    },
    [onPressIn],
  );
  const handlePressOut = React.useCallback(
    (e: GestureResponderEvent) => {
      setPressed(false);
      onPressOut?.(e);
    },
    [onPressOut],
  );

  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable
        android_ripple={{ color: 'rgba(0,0,0,0.14)', borderless: false }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className={cn(
          props.disabled && 'opacity-50',
          pressed && 'opacity-75',
          buttonVariants({ variant, size }),
          className,
        )}
        role="button"
        {...props}
      />
    </TextClassContext.Provider>
  );
}

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
