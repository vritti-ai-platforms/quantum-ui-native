import { TextClassContext } from './text';
import { cn } from '../utils/index';
import { View, type ViewProps } from 'react-native';

type BadgeProps = ViewProps & React.RefAttributes<View>;

// Simple muted pill badge — no variants
function Badge({ className, ...props }: BadgeProps) {
  return (
    <TextClassContext.Provider value="text-xs font-medium text-muted-foreground">
      <View
        className={cn(
          'shrink-0 flex-row items-center justify-center rounded-full bg-muted px-2 py-0.5',
          className
        )}
        {...props}
      />
    </TextClassContext.Provider>
  );
}

export { Badge };
export type { BadgeProps };
