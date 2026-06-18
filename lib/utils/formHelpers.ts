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

export interface ApiErrorResponse {
  type?: string;
  title?: string;
  status?: number;
  label?: string;
  detail?: string;
  instance?: string;
  errors?: FieldError[];
}

// GraphQL (Apollo) error shape. Apollo v4 surfaces GraphQL errors as `error.errors`
// (CombinedGraphQLErrors); v3 used `error.graphQLErrors`. Each entry carries the server-shaped
// `extensions` (code/label/detail/fieldErrors). Duck-typed so this stays Apollo-dependency-free.
interface GraphQLErrorLike {
  message?: string;
  extensions?: {
    code?: string;
    label?: string;
    detail?: string;
    fieldErrors?: FieldError[];
  };
}

interface ApolloLikeError {
  graphQLErrors?: GraphQLErrorLike[];
  errors?: GraphQLErrorLike[];
}

export interface MapApiErrorsOptions {
  fieldMapping?: FieldMapping;
  setRootError?: boolean;
}

// Normalizes an Apollo/GraphQL error into the common ApiErrorResponse shape, or null if `error`
// isn't a GraphQL error. Collects `extensions.fieldErrors` (so they surface inline) and the
// label/detail from the GraphQL errors' extensions.
function apiErrorFromGraphQL(error: object): ApiErrorResponse | null {
  const apollo = error as ApolloLikeError;
  const gqlErrors = apollo.graphQLErrors ?? apollo.errors;
  if (!Array.isArray(gqlErrors) || gqlErrors.length === 0) {
    return null;
  }
  // Only treat as GraphQL when entries carry `extensions` — distinguishes a GraphQL errors[] from
  // an RFC-9457 `errors: [{ field, message }]` array (which has no `extensions`).
  if (!gqlErrors.some((entry) => entry && typeof entry === 'object' && 'extensions' in entry)) {
    return null;
  }

  const fieldErrors: FieldError[] = [];
  let label: string | undefined;
  let detail: string | undefined;

  for (const gqlError of gqlErrors) {
    const extensions = gqlError?.extensions;
    if (Array.isArray(extensions?.fieldErrors)) {
      fieldErrors.push(...extensions.fieldErrors);
    }
    label ??= extensions?.label ?? extensions?.code;
    detail ??= extensions?.detail ?? gqlError?.message;
  }

  return { label, detail, errors: fieldErrors };
}

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

  // GraphQL (Apollo) errors carry the server-shaped payload under `extensions`. Fall back to the
  // axios RFC-9457 body at `response.data`, then to the error object itself.
  const apiError: ApiErrorResponse =
    apiErrorFromGraphQL(error) ?? (((error as AxiosLikeError).response?.data ?? error) as ApiErrorResponse);

  const errorTitle = apiError.label || apiError.title || 'Error';
  const generalMessage = apiError.detail;

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

  // Skip root error when field errors already surfaced inline — avoids duplicate messaging.
  if (generalMessage && setRootError && mappedFieldErrorsCount === 0) {
    form.setError('root', {
      type: errorTitle,
      message: generalMessage,
    });
  }
}
