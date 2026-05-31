import * as React from 'react';
import { View } from 'react-native';
import { Field, FieldDescription, FieldError, FieldLabel } from '../../reusables/field';
import { Input } from '../../reusables/input';

export interface TextFieldProps extends React.ComponentProps<typeof Input> {
  /** Optional marker used by <Form> to auto-wire this field to react-hook-form. */
  name?: string;
  label?: string;
  /** Helper content rendered below the input when there is no error. */
  description?: React.ReactNode;
  /** Back-compat alias for description. */
  hint?: React.ReactNode;
  error?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
}

// TextField — Input + label/description/error composed with the Field system. A single,
// non-platform-specific file mirroring the web @vritti/quantum-ui TextField.
function TextField({
  label,
  description,
  hint,
  error,
  startAdornment,
  endAdornment,
  className,
  style,
  ...props
}: TextFieldProps) {
  const id = React.useId();
  const resolvedDescription = description ?? hint;

  return (
    <Field>
      {label ? <FieldLabel nativeID={id}>{label}</FieldLabel> : null}

      <View className="relative">
        {startAdornment ? (
          <View className="absolute bottom-0 left-3 top-0 z-10 justify-center" pointerEvents="none">
            {startAdornment}
          </View>
        ) : null}
        <Input
          aria-labelledby={label ? id : undefined}
          aria-invalid={!!error}
          className={className}
          style={[style, startAdornment ? { paddingLeft: 44 } : null, endAdornment ? { paddingRight: 44 } : null]}
          {...props}
        />
        {endAdornment ? (
          <View className="absolute bottom-0 right-3 top-0 z-10 px-2.5 justify-center">{endAdornment}</View>
        ) : null}
      </View>

      {error ? <FieldError>{error}</FieldError> : null}
      {!error && resolvedDescription ? (
        typeof resolvedDescription === 'string' ? (
          <FieldDescription>{resolvedDescription}</FieldDescription>
        ) : (
          <>{resolvedDescription}</>
        )
      ) : null}
    </Field>
  );
}

TextField.displayName = 'TextField';

export { TextField };
