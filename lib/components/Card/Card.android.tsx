// Android-flavored Card surface: Material 3 "Outlined" card with low elevation.
// We keep a hairline border AND a subtle shadow — pure-elevation cards
// disappear in light mode because our --card and --background tokens are both
// pure white. The border is the affordance; the shadow adds Material's
// tactile cue. 12px radius matches Material 3 "medium" shape.
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
