import { TextField, type TextFieldProps } from '../TextField';

export interface TextAreaProps extends Omit<TextFieldProps, 'multiline'> {}

function TextArea({ numberOfLines = 4, textAlignVertical = 'top', ...props }: TextAreaProps) {
  return <TextField multiline numberOfLines={numberOfLines} textAlignVertical={textAlignVertical} {...props} />;
}

TextArea.displayName = 'TextArea';

export { TextArea };
