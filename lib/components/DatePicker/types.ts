import type React from 'react';

export interface DatePickerProps {
  /** Optional marker used by <Form> to auto-wire this field to react-hook-form. */
  name?: string;
  label?: string;
  description?: React.ReactNode;
  error?: string;
  /** Trigger placeholder (Android / fallback). iOS's native compact control shows a date. */
  placeholder?: string;
  /** ISO date-only string, `yyyy-MM-dd`. Optional initial value — the component owns the selection. */
  value?: string;
  /** Called when the user picks a date. */
  onChange?: (value: string | undefined) => void;
  /** <Form> bridge: react-hook-form injects its field's `onChange` here. Mirrors `onChange`. */
  onChangeText?: (value: string | undefined) => void;
  /** When true, shows a clear (X) control while a value is selected; pressing it clears the value. */
  clearable?: boolean;
  disabled?: boolean;
  /** date-fns display pattern for the trigger text (default 'P'). iOS compact uses the OS format. */
  displayFormat?: string;
  minDate?: Date;
  maxDate?: Date;
  id?: string;
  onBlur?: () => void;
  onOpenChange?: (open: boolean) => void;
}
