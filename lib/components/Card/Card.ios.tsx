// iOS-flavored Card surface: hairline border, almost-flat (HIG eschews drop
// shadows), and a 16px corner radius that matches the iOS 26 superellipse.
import { View, type ViewProps } from 'react-native';
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../reusables/card';
import { TextClassContext } from '../../reusables/text';
import { cn } from '../../utils/cn';

export interface CardProps extends ViewProps {
  loading?: boolean;
}

function Card({ loading, className, children, ...props }: CardProps) {
  return (
    <TextClassContext.Provider value="text-card-foreground">
      <View
        className={cn(
          'bg-card border border-border flex flex-col gap-6 rounded-xl py-6 shadow-sm',
          loading && 'opacity-60',
          className,
        )}
        {...props}
      >
        {children}
      </View>
    </TextClassContext.Provider>
  );
}

Card.displayName = 'Card';

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
