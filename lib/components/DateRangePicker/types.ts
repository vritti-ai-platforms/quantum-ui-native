import type React from 'react';

export interface DateRange {
  /** ISO date-only string, `yyyy-MM-dd`. */
  from?: string;
  /** ISO date-only string, `yyyy-MM-dd`. */
  to?: string;
}

export interface DateRangePickerProps {
  name?: string;
  label?: string;
  description?: React.ReactNode;
  error?: string;
  fromPlaceholder?: string;
  toPlaceholder?: string;
  /** Optional initial range — the component owns the selection. */
  value?: DateRange;
  /** Called when the user changes From or To. */
  onChange?: (value: DateRange | undefined) => void;
  disabled?: boolean;
  /** date-fns display pattern for the triggers (default 'P'). iOS compact uses the OS format. */
  displayFormat?: string;
  minDate?: Date;
  maxDate?: Date;
  id?: string;
}
