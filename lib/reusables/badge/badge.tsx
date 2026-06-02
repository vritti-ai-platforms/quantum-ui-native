import { cva, type VariantProps } from 'class-variance-authority';
import { View, type ViewProps } from 'react-native';
import { TextClassContext } from '../../components/Text';
import { cn } from '../../utils/index';

// RN analog of the web shadcnBadge — a pill View with variants. The per-variant text color is pushed
// to text children via TextClassContext (RN has no CSS color inheritance). Web-only utilities
// (hover/focus-visible/[&>svg]/whitespace/transition/inline-flex) are dropped.
const badgeVariants = cva(
  'shrink-0 flex-row items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        secondary: 'bg-secondary',
        destructive: 'bg-destructive',
        success: 'bg-success/15',
        warning: 'bg-warning/15',
        outline: 'border-border',
        ghost: 'bg-transparent',
        link: 'bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const badgeTextVariants = cva('text-xs font-medium', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      destructive: 'text-white',
      success: 'text-success',
      warning: 'text-warning',
      outline: 'text-foreground',
      ghost: 'text-foreground',
      link: 'text-primary underline',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

type BadgeProps = ViewProps & VariantProps<typeof badgeVariants> & React.RefAttributes<View>;

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <TextClassContext.Provider value={badgeTextVariants({ variant })}>
      <View className={cn(badgeVariants({ variant }), className)} {...props} />
    </TextClassContext.Provider>
  );
}

export { Badge, badgeVariants };
export type { BadgeProps };
