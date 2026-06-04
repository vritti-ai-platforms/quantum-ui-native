import { View, type ViewProps } from 'react-native';
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../reusables/card';
import { cn } from '../../utils/cn';
import { TextClassContext } from '../Text';

export interface CardProps extends ViewProps {
  loading?: boolean;
}

function Card({ loading, className, children, style, ...props }: CardProps) {
  return (
    <TextClassContext.Provider value="text-card-foreground">
      <View
        className={cn(
          'bg-card border border-border flex flex-col gap-6 rounded-xl py-6 shadow-sm',
          loading && 'opacity-60',
          className,
        )}
        // iOS squircle (cornerCurve = .continuous); ignored on Android/web
        style={[{ borderCurve: 'continuous' }, style]}
        {...props}
      >
        {children}
      </View>
    </TextClassContext.Provider>
  );
}

Card.displayName = 'Card';

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
