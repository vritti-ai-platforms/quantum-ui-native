import * as React from 'react';
import { type LayoutChangeEvent, type TextInputProps, View } from 'react-native';
import { Field, FieldDescription, FieldError, FieldLabel } from '../../reusables/field';
import { Input } from '../../reusables/input';
import { Text } from '../Text';

export interface TextFieldProps extends Omit<React.ComponentProps<typeof Input>, 'value' | 'onChangeText'> {
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
  /**
   * Numeric mode — mirrors the web @vritti/quantum-ui TextField. When enabled (either explicitly or
   * implied by any numeric constraint below) the field parses input to a number and emits
   * `number | NaN` via onChangeText, so it pairs with `zodNumericField` (NaN → Required / null on clear).
   */
  numeric?: boolean;
  positive?: boolean;
  nonZero?: boolean;
  integer?: boolean;
  min?: number;
  max?: number;
  value?: string | number;
  onChangeText?: (value: string | number) => void;
}

// Keeps only valid numeric characters for the current mode, mirroring web's keyDown blocking.
function sanitizeNumeric(text: string, integer: boolean, positive: boolean): string {
  const negative = !positive && text.trimStart().startsWith('-');
  const sign = negative ? '-' : '';
  if (integer) {
    return sign + text.replace(/[^0-9]/g, '');
  }
  let cleaned = text.replace(/[^0-9.]/g, '');
  const firstDot = cleaned.indexOf('.');
  if (firstDot !== -1) {
    cleaned = `${cleaned.slice(0, firstDot + 1)}${cleaned.slice(firstDot + 1).replace(/\./g, '')}`;
  }
  return sign + cleaned;
}

// TextField — Input + label/description/error composed with the Field system. A single,
// non-platform-specific file mirroring the web @vritti/quantum-ui TextField, including its
// numeric mode (integer / positive / nonZero / min / max + number|NaN emission).
function TextField({
  label,
  description,
  hint,
  error,
  startAdornment,
  endAdornment,
  className,
  style,
  numeric,
  positive,
  nonZero,
  integer,
  min,
  max,
  value,
  onChangeText,
  keyboardType,
  ...props
}: TextFieldProps) {
  const id = React.useId();
  const resolvedDescription = description ?? hint;
  const isNumeric = !!(numeric || integer || positive || nonZero || min != null || max != null);

  // Tracks the last raw string typed so intermediate states like "-", "0." or "1.50" survive the
  // round-trip through the numeric RHF value (a number can't hold a trailing dot).
  const [rawInput, setRawInput] = React.useState('');
  const [endWidth, setEndWidth] = React.useState<number | undefined>(undefined);

  const handleChangeText = React.useCallback(
    (text: string) => {
      if (!isNumeric) {
        onChangeText?.(text);
        return;
      }
      let clean = sanitizeNumeric(text, !!integer, !!positive);
      // Block a lone leading zero for integer fields that must be > 0 (mirrors web).
      if ((positive || nonZero) && integer && clean === '0') clean = '';
      setRawInput(clean);
      onChangeText?.(clean === '' ? Number.NaN : Number(clean));
    },
    [isNumeric, integer, positive, nonZero, onChangeText],
  );

  // In numeric mode `value` is a number; prefer the raw typed string when it maps to the same number
  // so intermediate states aren't clobbered. NaN (empty/cleared) shows the raw string (usually '').
  let displayValue: string;
  if (isNumeric) {
    if (typeof value === 'number') {
      if (Number.isNaN(value)) displayValue = rawInput;
      else if (rawInput !== '' && Number(rawInput) === value) displayValue = rawInput;
      else displayValue = String(value);
    } else {
      displayValue = value != null ? String(value) : '';
    }
  } else {
    displayValue = value != null ? String(value) : '';
  }

  // Auto constraint hints, rendered as a trailing overlay (mirrors web's endAdornment hint text).
  const hints: string[] = [];
  if (isNumeric) {
    const integerLabel = positive ? '+Int' : 'Int';
    if (integer && nonZero) hints.push(`${integerLabel} ≠0`);
    else if (integer) hints.push(integerLabel);
    else if (positive && nonZero) hints.push('+ ≠0');
    else if (positive) hints.push('+');
    else if (nonZero) hints.push('≠0');
    if (min != null && max != null) hints.push(`Range: ${min} - ${max}`);
    else if (max != null) hints.push(`Max: ${max}`);
    else if (min != null) hints.push(`Min: ${min}`);
  }
  const hintText = hints.join(', ');
  const hasTrailing = !!hintText || !!endAdornment;

  const resolvedKeyboardType: TextInputProps['keyboardType'] =
    keyboardType ?? (isNumeric ? (integer ? 'number-pad' : 'decimal-pad') : undefined);

  const onEndLayout = React.useCallback((e: LayoutChangeEvent) => setEndWidth(e.nativeEvent.layout.width), []);

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
          keyboardType={resolvedKeyboardType}
          value={displayValue}
          onChangeText={handleChangeText}
          style={[
            style,
            startAdornment ? { paddingLeft: 44 } : null,
            hasTrailing ? { paddingRight: (endWidth ?? 40) + 8 } : null,
          ]}
          {...props}
        />
        {hasTrailing ? (
          <View
            onLayout={onEndLayout}
            className="absolute bottom-0 right-3 top-0 z-10 flex-row items-center gap-2"
          >
            {hintText ? <Text className="text-xs text-muted-foreground">{hintText}</Text> : null}
            {endAdornment}
          </View>
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
