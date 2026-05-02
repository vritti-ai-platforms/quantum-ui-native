import type { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form';

export interface FieldMapping {
  [apiField: string]: string;
}

interface AxiosLikeError {
  response?: {
    data?: unknown;
  };
}

export interface FieldError {
  field: string;
  message: string;
}

// RFC 9457 Problem Details error structure
export interface ApiErrorResponse {
  type?: string;
  title?: string;
  status?: number;
  label?: string;
  detail?: string;
  instance?: string;
  errors?: FieldError[];
}

export interface MapApiErrorsOptions {
  fieldMapping?: FieldMapping;
  setRootError?: boolean;
}

// Maps an RFC 9457 API error response to react-hook-form errors
export function mapApiErrorsToForm<TFieldValues extends FieldValues = FieldValues>(
  error: unknown,
  form: UseFormReturn<TFieldValues>,
  options: MapApiErrorsOptions = {},
): void {
  const { fieldMapping = {}, setRootError = true } = options;

  if (!error || typeof error !== 'object') {
    if (setRootError) {
      form.setError('root', {
        type: 'Error',
        message: 'An error occurred',
      });
    }
    return;
  }

  // Extract error data from axios response structure
  const axiosError = error as AxiosLikeError;
  const errorData = axiosError.response?.data || error;
  const apiError = errorData as ApiErrorResponse;

  const errorTitle = apiError.label || apiError.title || 'Error';
  const generalMessage = apiError.detail;

  // Map field-specific errors. Track how many we successfully attached so the
  // root error only fires when none of the API errors matched a form field —
  // matches the web Form behaviour (same logic as
  // apps/.../quantum-ui/lib/utils/formHelpers.ts).
  let mappedFieldErrorsCount = 0;
  if (apiError.errors && Array.isArray(apiError.errors)) {
    for (const errorItem of apiError.errors) {
      const formField = fieldMapping[errorItem.field] || errorItem.field;

      form.setError(formField as FieldPath<TFieldValues>, {
        type: 'manual',
        message: errorItem.message,
      });
      mappedFieldErrorsCount += 1;
    }
  }

  // Root error is shown only when no field errors were mapped — otherwise the
  // detail/label is redundant with the inline field message that already
  // surfaces on the matching <TextField> / <PasswordField>.
  if (generalMessage && setRootError && mappedFieldErrorsCount === 0) {
    form.setError('root', {
      type: errorTitle,
      message: generalMessage,
    });
  }
}
