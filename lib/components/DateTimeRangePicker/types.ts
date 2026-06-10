import type React from 'react';

export interface DateTimeRange {
  /** UTC ISO instant string. */
  from?: string;
  /** UTC ISO instant string. */
  to?: string;
}

export interface DateTimeRangePickerProps {
  name?: string;
  label?: string;
  description?: React.ReactNode;
  error?: string;
  fromPlaceholder?: string;
  toPlaceholder?: string;
  /** Optional initial range — the component owns the selection. From/To are UTC ISO instants. */
  value?: DateTimeRange;
  /** Called when the user changes From or To. Emits UTC ISO instants (or undefined when both clear). */
  onChange?: (value: DateTimeRange | undefined) => void;
  /** <Form> bridge: react-hook-form injects its field's `onChange` here. Mirrors `onChange`. */
  onChangeText?: (value: DateTimeRange | undefined) => void;
  /** When true, each From/To field shows its own clear (X) control while it has a value. */
  clearable?: boolean;
  disabled?: boolean;
  /**
   * IANA timezone for selection + display (e.g. 'Asia/Kolkata'). Defaults to the active BU zone
   * (useBUTimezone) and finally the device zone.
   */
  timeZone?: string;
  minDate?: Date;
  maxDate?: Date;
  id?: string;
}
