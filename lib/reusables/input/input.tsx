import { Platform, TextInput, type TextInputProps } from 'react-native';
import { cn } from '../../utils/index';

function Input({
  className,
  multiline = false,
  numberOfLines = multiline ? Platform.select({ web: 4, native: 5 }) : 1,
  ...props
}: TextInputProps & React.RefAttributes<TextInput>) {
  return (
    <TextInput
      className={cn(
        'border-input bg-background text-foreground w-full min-w-0 rounded-xl border px-3 text-base shadow-sm shadow-black/5 md:text-sm',
        multiline ? 'min-h-24 py-3' : 'h-11 py-0',
        props.editable === false &&
          cn('opacity-50', Platform.select({ web: 'disabled:pointer-events-none disabled:cursor-not-allowed' })),
        Platform.select({
          web: cn(
            'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground outline-none transition-[color,box-shadow]',
            'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
            'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
          ),
          native: 'dark:bg-input/30 placeholder:text-muted-foreground/50',
        }),
        className,
      )}
      multiline={multiline}
      numberOfLines={numberOfLines}
      textAlignVertical={multiline ? 'top' : props.textAlignVertical}
      {...props}
    />
  );
}

export { Input };
