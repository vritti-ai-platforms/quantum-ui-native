import type { UseMutationResult } from '@tanstack/react-query';
import type React from 'react';
import { Children, cloneElement, Fragment, isValidElement, useCallback } from 'react';
import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  FormProvider,
  type UseFormReturn,
} from 'react-hook-form';
import { View, type ViewProps } from 'react-native';
import { getAxios, restoreErrorToasts, suppressErrorToasts } from '../../utils/axios';
import { cn } from '../../utils/cn';
import { type FieldMapping, mapApiErrorsToForm } from '../../utils/formHelpers';
import { Button } from '../Button';
import { StaticAlert } from '../StaticAlert';

function processChildren<
  TFieldValues extends FieldValues = FieldValues,
  _TContext = any,
  TTransformedValues extends FieldValues | undefined = TFieldValues,
>(
  children: React.ReactNode,
  control: ControllerProps<TFieldValues, FieldPath<TFieldValues>, TTransformedValues>['control'],
  isSubmitting: boolean,
  setValue: UseFormReturn<TFieldValues, _TContext, TTransformedValues>['setValue'],
  handleSubmit: () => void,
): React.ReactNode {
  return Children.map(children, (child) => {
    if (!isValidElement(child)) {
      return child;
    }

    const childProps = child.props as any;
    const isFragment = child.type === Fragment;

    if (!isFragment && childProps.name && typeof childProps.name === 'string') {
      const name = childProps.name as FieldPath<TFieldValues>;

      return (
        <Controller
          key={name}
          control={control}
          name={name}
          render={({ field, fieldState }) => {
            const fieldProps = {
              value: field.value,
              onChangeText: field.onChange,
              onBlur: field.onBlur,
              ref: field.ref,
            };

            return cloneElement(child, {
              ...childProps,
              ...fieldProps,
              error: fieldState.error?.message || (fieldState.error ? 'Invalid' : undefined),
              name: undefined,
            });
          }}
        />
      );
    }

    if (childProps.submit === true) {
      const isButtonElement =
        child.type === Button || (typeof child.type === 'function' && (child.type as any).displayName === 'Button');

      if (isButtonElement) {
        return cloneElement(child, {
          ...childProps,
          isLoading: isSubmitting,
          onPress: handleSubmit,
          submit: undefined,
        });
      }
    }

    if (isFragment) {
      return processChildren(childProps.children, control, isSubmitting, setValue, handleSubmit);
    }

    if (childProps.children != null) {
      return cloneElement(child, {
        ...childProps,
        children: processChildren(childProps.children, control, isSubmitting, setValue, handleSubmit),
      });
    }

    return child;
  });
}

export interface FormProps<
  TFieldValues extends FieldValues = FieldValues,
  TContext = any,
  TTransformedValues extends FieldValues | undefined = TFieldValues,
  TMutationData = unknown,
  TMutationError = Error,
  TMutationVariables = any,
> extends ViewProps {
  form: UseFormReturn<TFieldValues, TContext, TTransformedValues>;
  onSubmit?: Parameters<UseFormReturn<TFieldValues, TContext, TTransformedValues>['handleSubmit']>[0];
  children: React.ReactNode;
  showRootError?: boolean;
  rootErrorPosition?: 'top' | 'bottom';
  rootErrorClassName?: string;
  rootErrorAction?: React.ReactNode;
  fieldMapping?: FieldMapping;
  mutation?: UseMutationResult<TMutationData, TMutationError, TMutationVariables, unknown>;
  transformSubmit?: (
    data: TTransformedValues extends undefined ? TFieldValues : TTransformedValues,
  ) => TMutationVariables;
}

export function Form<
  TFieldValues extends FieldValues = FieldValues,
  TContext = any,
  TTransformedValues extends FieldValues | undefined = TFieldValues,
  TMutationData = unknown,
  TMutationError = Error,
  TMutationVariables = any,
>({
  form,
  onSubmit,
  children,
  showRootError = true,
  rootErrorPosition = 'bottom',
  rootErrorClassName,
  rootErrorAction,
  fieldMapping,
  mutation,
  transformSubmit,
  className,
  ...props
}: FormProps<TFieldValues, TContext, TTransformedValues, TMutationData, TMutationError, TMutationVariables>) {
  const isSubmitting = form.formState.isSubmitting || (mutation?.isPending ?? false);

  const wrappedOnSubmit = useCallback(
    async (data: TTransformedValues extends undefined ? TFieldValues : TTransformedValues) => {
      const axiosInstance = getAxios();
      let interceptorId: number | undefined;

      if (axiosInstance) {
        interceptorId = suppressErrorToasts(axiosInstance);
      }

      try {
        if (mutation) {
          const variables = transformSubmit ? transformSubmit(data) : data;
          await mutation.mutateAsync(variables as TMutationVariables);
        } else if (onSubmit) {
          await onSubmit(data as any);
        }
      } catch (error) {
        mapApiErrorsToForm(error, form as any, {
          fieldMapping,
          setRootError: showRootError,
        });
        console.error('[Form Submission Error]', error);
      } finally {
        if (axiosInstance && interceptorId !== undefined) {
          restoreErrorToasts(axiosInstance, interceptorId);
        }
      }
    },
    [onSubmit, mutation, transformSubmit, fieldMapping, form, showRootError],
  );

  const handleSubmit = form.handleSubmit(wrappedOnSubmit as any);

  const processedChildren = processChildren(children, form.control, isSubmitting, form.setValue, handleSubmit);

  return (
    <FormProvider {...form}>
      <View className={cn('gap-4', className)} {...props}>
        {showRootError && rootErrorPosition === 'top' && form.formState.errors.root && (
          <StaticAlert
            variant="destructive"
            title={String(form.formState.errors.root.type || 'Error')}
            description={form.formState.errors.root.message}
            className={rootErrorClassName}
          />
        )}

        {processedChildren}

        {showRootError && rootErrorPosition === 'bottom' && form.formState.errors.root && (
          <StaticAlert
            variant="destructive"
            title={String(form.formState.errors.root.type || 'Error')}
            description={form.formState.errors.root.message}
            className={rootErrorClassName}
          />
        )}
      </View>
    </FormProvider>
  );
}

Form.displayName = 'Form';
