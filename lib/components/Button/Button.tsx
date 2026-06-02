import { View } from 'react-native';
import {
  buttonTextVariants,
  buttonVariants,
  Button as RnrButton,
  type ButtonProps as RnrButtonProps,
} from '../../reusables/button';
import { Text } from '../Text';
import { cn } from '../../utils/cn';
import { Spinner } from '../Spinner';

export interface ButtonProps extends Omit<RnrButtonProps, 'children'> {
  children?: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
}

// Button with built-in loading state and adornment support — wraps the RNR reusable
function Button({
  children,
  isLoading = false,
  loadingText,
  startAdornment,
  endAdornment,
  disabled,
  variant,
  size,
  className,
  ...props
}: ButtonProps) {
  return (
    <RnrButton
      variant={variant}
      size={size}
      disabled={disabled || isLoading}
      className={className}
      {...props}
    >
      {isLoading ? (
        <View className="flex-row items-center gap-2">
          <Spinner size="small" />
          <Text className={cn(buttonTextVariants({ variant, size }))}>
            {loadingText ?? (typeof children === 'string' ? children : 'Loading...')}
          </Text>
        </View>
      ) : (
        <View className="flex-row items-center gap-2">
          {startAdornment}
          {children}
          {endAdornment}
        </View>
      )}
    </RnrButton>
  );
}

Button.displayName = 'Button';

export { Button, buttonTextVariants, buttonVariants };
