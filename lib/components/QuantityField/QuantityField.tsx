import * as React from 'react';
import { Platform, type TextInput, type TextInputProps, View } from 'react-native';
import { useLocale } from '../../hooks/useLocale';
import { Field, FieldDescription, FieldError, FieldLabel } from '../../reusables/field';
import { Input } from '../../reusables/input';
import {
  SelectContent,
  SelectList,
  type SelectListItem,
  SelectListRoot,
  SelectTrigger,
  SingleSelectRow,
} from '../../reusables/single-select';
import { cn } from '../../utils/cn';
import { formatNumber } from '../../utils/format';
import type { SelectOption } from '../Select/types';
import { Spinner } from '../Spinner';
import { Text } from '../Text';
import { fromPrimaryQty, type QuantityUnit, resolveQuantityMessage, toPrimaryQty } from './quantity';

export interface QuantityFieldProps {
  name?: string;
  units: QuantityUnit[];
  primaryUnitId: string;
  defaultUnitId?: string;
  value?: number | null;
  onChange?: (primaryQty: number | null | undefined) => void;
  onBlur?: () => void;
  nullable?: boolean;
  label?: string;
  description?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  loading?: boolean;
  className?: string;
  ref?: React.Ref<TextInput>;
}

const AMOUNT_PATTERN = /^-?\d*\.?\d*$/;

const AMOUNT_KEYBOARD: TextInputProps['keyboardType'] = Platform.OS === 'android' ? 'numeric' : 'decimal-pad';

// Quantity input typed in any of an item's units, starting in the default unit; the value is the amount in the primary
// unit, null when emptied where nullable, and quantities named in its error are shown in the unit being entered
function QuantityField({
  units,
  primaryUnitId,
  defaultUnitId,
  value,
  onChange,
  onBlur,
  nullable,
  label,
  description,
  placeholder,
  error,
  disabled,
  required: _required,
  loading,
  className,
  name: _name,
  ref,
}: QuantityFieldProps) {
  const labelId = React.useId();
  const locale = useLocale();
  const [pickedUnitId, setPickedUnitId] = React.useState<string>();
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [text, setText] = React.useState('');
  // The primary quantity and unit the text stands for; a value matching both came from this field
  const shown = React.useRef<{ qty: number | undefined; unitId: string } | null>(null);

  const unit =
    units.find((option) => option.id === pickedUnitId) ??
    units.find((option) => option.id === defaultUnitId) ??
    units.find((option) => option.id === primaryUnitId);
  const primaryUnit = units.find((option) => option.id === primaryUnitId);
  const isDisabled = !!disabled || !!loading || !unit;
  const listData = React.useMemo<SelectListItem[]>(
    () =>
      units.map((option) => ({
        type: 'option',
        key: option.id,
        option: { value: option.id, label: option.symbol, description: option.name },
      })),
    [units],
  );

  // Formats a number for the field's hint and messages in the active locale
  const formatAmount = (amount: number): string => formatNumber(amount, { localeTag: locale }).primary;

  // A value set from outside (reset, setValue, edit defaults) or a unit arriving late rewrites the text
  React.useEffect(() => {
    if (!unit) return;
    const qty = value ?? undefined;
    if (shown.current && shown.current.qty === qty && shown.current.unitId === unit.id) return;
    shown.current = { qty, unitId: unit.id };
    setText(fromPrimaryQty(qty, unit));
  }, [value, unit]);

  // Records what the text now stands for and reports the primary quantity when it changed
  const emit = (nextText: string, nextUnit: QuantityUnit) => {
    const qty = toPrimaryQty(nextText, nextUnit);
    const previous = shown.current?.qty;
    shown.current = { qty, unitId: nextUnit.id };
    if (qty !== previous) onChange?.(qty === undefined && nullable ? null : qty);
  };

  // Keeps the typed amount when it reads as a number and reports it in the primary unit
  const handleTextChange = (typed: string) => {
    const nextText = typed.replace(',', '.');
    if (!AMOUNT_PATTERN.test(nextText)) return;
    setText(nextText);
    if (unit) emit(nextText, unit);
  };

  // Reads the typed amount in the picked unit instead
  const handleUnitChange = (nextUnitId: SelectOption['value']) => {
    const nextUnit = units.find((option) => option.id === nextUnitId);
    if (!nextUnit) return;
    setPickedUnitId(nextUnit.id);
    emit(text, nextUnit);
  };

  // Renders a unit as its symbol with the unit name beneath
  const renderUnitRow = (option: SelectOption) => (
    <SingleSelectRow
      name={option.label}
      description={option.description}
      selected={option.value === unit?.id}
      onSelect={() => handleUnitChange(option.value)}
    />
  );

  const showHint = !!unit && !!primaryUnit && unit.id !== primaryUnit.id && value != null;
  const message = error && unit && primaryUnit ? resolveQuantityMessage(error, unit, primaryUnit, formatAmount) : error;

  return (
    <Field>
      {label ? <FieldLabel nativeID={labelId}>{label}</FieldLabel> : null}

      <View className={cn('flex-row items-center gap-2', className)}>
        <View className="min-w-0 flex-1">
          <Input
            ref={ref}
            aria-labelledby={label ? labelId : undefined}
            aria-invalid={!!message}
            aria-busy={loading || undefined}
            className="tabular-nums"
            keyboardType={AMOUNT_KEYBOARD}
            autoComplete="off"
            autoCorrect={false}
            value={text}
            onChangeText={handleTextChange}
            onBlur={onBlur}
            editable={!isDisabled}
            placeholder={placeholder}
          />
        </View>

        <SelectListRoot open={pickerOpen} onOpenChange={setPickerOpen} disabled={isDisabled} title="Unit">
          <SelectTrigger disabled={isDisabled} invalid={!!message} className="w-28">
            {loading ? (
              <Spinner size="small" />
            ) : (
              <Text className="text-foreground text-sm font-medium" numberOfLines={1}>
                {unit?.symbol ?? '—'}
              </Text>
            )}
          </SelectTrigger>

          <SelectContent>
            <SelectList data={listData} renderRow={renderUnitRow} />
          </SelectContent>
        </SelectListRoot>
      </View>

      {showHint ? (
        <Text className="text-muted-foreground text-xs tabular-nums" accessibilityLiveRegion="polite">
          = {formatAmount(value)} {primaryUnit.symbol}
        </Text>
      ) : null}
      {description && !message ? <FieldDescription>{description}</FieldDescription> : null}
      {message ? <FieldError>{message}</FieldError> : null}
    </Field>
  );
}

QuantityField.displayName = 'QuantityField';
// Lets <Form> auto-wire by `name`: the RHF value to `value`, onChange to `onChange`, plus onBlur + ref
QuantityField.fieldBinding = { valueProp: 'value', changeProp: 'onChange', blur: true };

export { QuantityField };
