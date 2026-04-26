// iOS list row, Settings.app-flavored:
//   • Tight vertical rhythm (py-3 gap-3) — iOS rows are denser than Material.
//   • Title is `font-normal` (HIG body weight); description is muted small.
//   • If `onPress` is set and no explicit `trailing` is supplied, we auto-add
//     a chevron — that's the iOS convention for "tap to drill in".
//   • Caller is expected to wrap a stack of <ListItem>s in a parent
//     `bg-card rounded-xl` group container and pass `border-b border-border`
//     between siblings to get the iOS grouped-list separator. Auto-grouping is
//     deliberately not done here so the list composition stays in the screen.
import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import { Skeleton } from '../../reusables/skeleton';
import { Text } from '../../reusables/text';
import { cn } from '../../utils/cn';
import { CardPressable } from '../CardPressable';
import { COMMON_ICONS, DynamicIcon } from '../DynamicIcon';

export interface ListItemProps extends Omit<ViewProps, 'children'> {
  leading?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  selected?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

function ListItemSkeleton({ className }: { className?: string }) {
  return (
    <View className={cn('flex-row items-center gap-3 bg-card px-4 py-3', className)}>
      <Skeleton className="h-8 w-8 rounded-lg" />
      <View className="flex-1 gap-1">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-3 w-44 rounded" />
      </View>
      <Skeleton className="h-4 w-4 rounded" />
    </View>
  );
}

function ListItem({
  leading,
  title,
  description,
  meta,
  trailing,
  onPress,
  selected,
  disabled,
  loading,
  className,
  ...props
}: ListItemProps) {
  if (loading) return <ListItemSkeleton className={className} />;

  const resolvedTrailing =
    trailing !== undefined ? (
      trailing
    ) : onPress ? (
      <DynamicIcon icon={COMMON_ICONS.chevronRight} size={18} className="text-muted-foreground" />
    ) : null;

  const body = (
    <>
      {leading != null && <View>{leading}</View>}
      <View className="flex-1 gap-0.5">
        {typeof title === 'string' ? <Text className="text-base font-normal text-foreground">{title}</Text> : title}
        {description != null &&
          (typeof description === 'string' ? (
            <Text className="text-sm text-muted-foreground">{description}</Text>
          ) : (
            description
          ))}
      </View>
      {meta != null &&
        (typeof meta === 'string' ? <Text className="text-sm text-muted-foreground">{meta}</Text> : meta)}
      {resolvedTrailing != null && <View>{resolvedTrailing}</View>}
    </>
  );

  const layout = 'flex-row items-center gap-3 bg-card px-4 py-3';

  if (onPress) {
    return (
      <CardPressable
        onPress={onPress}
        selected={selected}
        disabled={disabled}
        className={cn(layout, className)}
        {...props}
      >
        {body}
      </CardPressable>
    );
  }

  return (
    <View className={cn(layout, className)} {...props}>
      {body}
    </View>
  );
}

ListItem.displayName = 'ListItem';

export { ListItem };
