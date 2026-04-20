import { cn } from '../../utils/index';
import { TextInput, type TextInputProps } from 'react-native';

function Input({
  className,
  multiline = false,
  numberOfLines = multiline ? 5 : 1,
  ...props
}: TextInputProps & React.RefAttributes<TextInput>) {
  return (
    <TextInput
      className={cn(
        'border-input bg-background text-foreground w-full rounded-[14px] border px-4 text-base shadow-sm shadow-black/5 placeholder:text-muted-foreground/60',
        multiline ? 'min-h-28 py-3' : 'h-14 py-0',
        props.editable === false && 'opacity-50',
        className
      )}
      multiline={multiline}
      numberOfLines={numberOfLines}
      textAlignVertical={multiline ? 'top' : props.textAlignVertical}
      {...props}
    />
  );
}

export { Input };
