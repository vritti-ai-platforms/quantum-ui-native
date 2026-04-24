import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../../reusables/text';
import { DynamicIcon } from '../DynamicIcon';
import { TextField, type TextFieldProps } from '../TextField';

export interface PasswordFieldProps extends Omit<TextFieldProps, 'secureTextEntry' | 'endAdornment'> {
  showStrengthIndicator?: boolean;
  showMatchIndicator?: boolean;
  matchPassword?: string;
  toggleAriaLabel?: string;
}

function getPasswordStrength(password: string) {
  let strength = 0;
  if (password.length >= 8) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;

  if (strength < 2) return { label: 'Weak', textClass: 'text-destructive', bgClass: 'bg-destructive', width: '25%' as const };
  if (strength < 4) return { label: 'Fair', textClass: 'text-warning', bgClass: 'bg-warning', width: '60%' as const };
  return { label: 'Strong', textClass: 'text-success', bgClass: 'bg-success', width: '100%' as const };
}

function PasswordField({
  showStrengthIndicator = false,
  showMatchIndicator = false,
  matchPassword,
  toggleAriaLabel,
  value = '',
  description,
  error,
  ...props
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = React.useState(false);

  const passwordStr = String(value ?? '');
  const strength = getPasswordStrength(passwordStr);
  const passwordsMatch = matchPassword !== undefined && passwordStr !== '' && passwordStr === matchPassword;

  const eyeToggle = (
    <Pressable
      onPress={() => setShowPassword((prev) => !prev)}
      accessibilityLabel={toggleAriaLabel ?? (showPassword ? 'Hide password' : 'Show password')}
      hitSlop={8}
    >
      <DynamicIcon
        icon={
          showPassword
            ? { sfSymbol: 'eye.slash', materialIcon: 'visibility-off' }
            : { sfSymbol: 'eye', materialIcon: 'visibility' }
        }
        size={18}
        className="text-muted-foreground"
      />
    </Pressable>
  );

  const enhancedDescription = (
    <>
      {showStrengthIndicator && passwordStr.length > 0 && !error && (
        <View className="gap-1 mt-0.5">
          <View className="flex-row justify-between items-center">
            <Text className="text-xs text-muted-foreground">Strength:</Text>
            <Text className={`text-xs ${strength.textClass}`}>{strength.label}</Text>
          </View>
          <View className="w-full h-1 rounded-full bg-muted">
            <View className={`h-1 rounded-full ${strength.bgClass}`} style={{ width: strength.width }} />
          </View>
        </View>
      )}
      {showMatchIndicator && passwordsMatch && !error && (
        <View className="flex-row items-center gap-1 mt-0.5">
          <DynamicIcon
            icon={{ sfSymbol: 'checkmark.circle', materialIcon: 'check-circle' }}
            size={12}
            className="text-success"
          />
          <Text className="text-xs text-success">Passwords match</Text>
        </View>
      )}
      {description}
    </>
  );

  return (
    <TextField
      {...props}
      value={value}
      secureTextEntry={!showPassword}
      error={error}
      description={enhancedDescription}
      endAdornment={eyeToggle}
    />
  );
}

PasswordField.displayName = 'PasswordField';

export { PasswordField };
