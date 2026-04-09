import { View } from 'react-native';
import { Text } from '../../reusables/text';
import { cn } from '../../utils/cn';

export interface FormLabelProps {
  label: string;
  required?: boolean;
  className?: string;
}

// Form field label with optional required asterisk
function FormLabel({ label, required, className }: FormLabelProps) {
  return (
    <View className={cn('flex-row items-center gap-2', className)}>
      <Text className="text-sm font-medium text-foreground">{label}</Text>
      {required && (
        <Text className="text-sm font-medium text-destructive">*</Text>
      )}
    </View>
  );
}

FormLabel.displayName = 'FormLabel';

export { FormLabel };
