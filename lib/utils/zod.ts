import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Re-export zod + the @hookform/resolvers/zod adapter so native apps consume one bundled, version-locked copy.
export * from 'zod';
export { zodResolver };

export interface NumericFieldOptions {
  required?: string;
  nullable?: boolean;
  integer?: boolean;
  integerMessage?: string;
  nonZero?: boolean;
  nonZeroMessage?: string;
  positive?: boolean;
  positiveMessage?: string;
  min?: number;
  minMessage?: string;
  max?: number;
  maxMessage?: string;
}

// NaN-aware numeric field builder; overloads narrow the output type by `nullable`.
export function zodNumericField(
  options?: Omit<NumericFieldOptions, 'nullable'> & { nullable?: false },
): z.ZodType<number, number>;
export function zodNumericField(
  options: Omit<NumericFieldOptions, 'nullable'> & { nullable: true },
): z.ZodType<number | null, number | null>;
export function zodNumericField(
  options: NumericFieldOptions = {},
): z.ZodType<number, number> | z.ZodType<number | null, number | null> {
  const {
    required = 'Required',
    nullable = false,
    integer = false,
    integerMessage = 'Must be a whole number',
    nonZero = false,
    nonZeroMessage = 'Must not be zero',
    positive = false,
    positiveMessage = 'Must be greater than 0',
    min,
    minMessage,
    max,
    maxMessage,
  } = options;

  if (nullable) {
    return z
      .union([z.number(), z.nan(), z.null()])
      .transform((v) => (v === null || Number.isNaN(v as number) ? null : v))
      .pipe(
        z
          .number()
          .nullable()
          .superRefine((v, ctx) => {
            if (v === null) return;
            if (integer && !Number.isInteger(v)) {
              ctx.addIssue({ code: 'custom', message: integerMessage });
            } else if (nonZero && v === 0) {
              ctx.addIssue({ code: 'custom', message: nonZeroMessage });
            } else if (positive && v <= 0) {
              ctx.addIssue({ code: 'custom', message: positiveMessage });
            } else if (min != null && v < min) {
              ctx.addIssue({ code: 'custom', message: minMessage ?? `Must be at least ${min}` });
            } else if (max != null && v > max) {
              ctx.addIssue({ code: 'custom', message: maxMessage ?? `Must be at most ${max}` });
            }
          }),
      );
  }

  return z.union([z.number(), z.nan()]).superRefine((v, ctx) => {
    if (Number.isNaN(v)) {
      ctx.addIssue({ code: 'custom', message: required });
    } else if (integer && !Number.isInteger(v)) {
      ctx.addIssue({ code: 'custom', message: integerMessage });
    } else if (nonZero && v === 0) {
      ctx.addIssue({ code: 'custom', message: nonZeroMessage });
    } else if (positive && v <= 0) {
      ctx.addIssue({ code: 'custom', message: positiveMessage });
    } else if (min != null && v < min) {
      ctx.addIssue({ code: 'custom', message: minMessage ?? `Must be at least ${min}` });
    } else if (max != null && v > max) {
      ctx.addIssue({ code: 'custom', message: maxMessage ?? `Must be at most ${max}` });
    }
  });
}

export interface CurrencyFieldOptions {
  required?: string;
  positive?: boolean;
  positiveMessage?: string;
}

// CurrencyField returns undefined when empty and { currency, value } when filled.
export function zodCurrencyField(options: CurrencyFieldOptions = {}) {
  const { required = 'Required', positive = true, positiveMessage = 'Must be greater than 0' } = options;

  return z.union([z.object({ currency: z.string(), value: z.string() }), z.undefined()]).superRefine((v, ctx) => {
    if (!v?.value) {
      ctx.addIssue({ code: 'custom', message: required });
    } else if (positive && Number(v.value) <= 0) {
      ctx.addIssue({ code: 'custom', message: positiveMessage });
    }
  });
}

export interface PhoneFieldOptions {
  required?: string;
  optional?: boolean;
}

// PhoneField returns an E.164 string when filled or undefined when empty; optional:true skips the required check.
// Native has no libphonenumber, so this is a lightweight E.164 format check (leading + and 7-15 digits).
const E164_PATTERN = /^\+[1-9]\d{6,14}$/;

export function zodPhoneField(options?: { required?: string; optional?: false }): z.ZodType<string, string>;
export function zodPhoneField(options: {
  required?: string;
  optional: true;
}): z.ZodType<string | undefined, string | undefined>;
export function zodPhoneField(
  options: PhoneFieldOptions = {},
): z.ZodType<string, string> | z.ZodType<string | undefined, string | undefined> {
  const { required = 'Required', optional = false } = options;

  if (optional) {
    return z.union([z.string(), z.undefined()]).superRefine((v, ctx) => {
      if (v && !E164_PATTERN.test(v)) {
        ctx.addIssue({ code: 'custom', message: 'Invalid phone number' });
      }
    });
  }

  return z.string({ error: required }).refine((v) => E164_PATTERN.test(v), 'Invalid phone number');
}

// Canonical entity "code" format — keep in sync with @vritti/api-sdk/decorators (code-pattern.ts).
const CODE_SEGMENT = '[a-z][a-z0-9-]*';
export const CODE_PATTERN = new RegExp(`^${CODE_SEGMENT}$`);
export const DOTTED_CODE_PATTERN = new RegExp(`^${CODE_SEGMENT}(\\.${CODE_SEGMENT})*$`);

export interface CodeFieldOptions {
  dotted?: boolean;
  max?: number;
  required?: string;
  message?: string;
}

// A lowercase-kebab code field; { dotted: true } allows dot-separated segments (permission codes).
// `message` overrides the default format error (e.g. 'Enter a valid SKU').
export function zodCodeField(options: CodeFieldOptions = {}) {
  const { dotted = false, max, required = 'Code is required', message } = options;
  const pattern = dotted ? DOTTED_CODE_PATTERN : CODE_PATTERN;
  const defaultMessage = dotted ? 'Lowercase words separated by dots' : 'Lowercase letters, numbers, and hyphens only';
  const schema = z
    .string()
    .min(1, required)
    .regex(pattern, message ?? defaultMessage);
  return max != null ? schema.max(max, `Code must be ${max} characters or less`) : schema;
}
