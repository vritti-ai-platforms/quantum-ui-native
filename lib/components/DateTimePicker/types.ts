import type React from 'react';

export interface DateTimePickerProps {
  /** Optional marker used by <Form> to auto-wire this field to react-hook-form. */
  name?: string;
  label?: string;
  description?: React.ReactNode;
  error?: string;
  placeholder?: string;
  /** UTC ISO instant string (e.g. '2026-06-10T09:30:00.000Z'). Optional initial — the component owns the selection. */
  value?: string;
  /** Called when the user picks a date+time. Emits a UTC ISO instant (or undefined when cleared). */
  onChange?: (value: string | undefined) => void;
  /** <Form> bridge: react-hook-form injects its field's `onChange` here. Mirrors `onChange`. */
  onChangeText?: (value: string | undefined) => void;
  /** When true, shows a clear (X) control while a value is selected; pressing it clears the value. */
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
  onBlur?: () => void;
  onOpenChange?: (open: boolean) => void;
}
