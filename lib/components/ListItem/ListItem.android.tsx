// Android list row, Material 3 list-item-flavored:
//   • Roomier vertical rhythm (py-4 gap-4) — Material list items breathe more
//     than iOS Settings rows.
//   • Title weight is `font-medium` (Material typography emphasises titles).
//   • No auto-chevron — Material doesn't use trailing chevrons by convention;
//     pass `trailing` explicitly when needed (Switch, Badge, action icon, …).
//   • Press feedback is provided by CardPressable's android_ripple.
import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import { Skeleton } from '../../reusables/skeleton';
import { Text } from '../Text';
import { cn } from '../../utils/cn';
import { CardPressable } from '../CardPressable';

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
  index?: number;
  total?: number;
}

function groupItemStyle(index?: number, total?: number): string {
  if (index === undefined || total === undefined) return '';
  if (total === 1) return 'border border-border rounded-2xl';
  if (index === 0) return 'border-t border-l border-r border-b-0 border-border rounded-t-2xl rounded-b-none';
  if (index === total - 1) return 'border border-border rounded-b-2xl rounded-t-none';
  return 'border-t border-l border-r border-b-0 border-border rounded-none';
}

function ListItemSkeleton({ className, index, total }: { className?: string; index?: number; total?: number }) {
  return (
    <View className={cn('flex-row items-center gap-4 bg-card px-4 py-4', groupItemStyle(index, total), className)}>
      <Skeleton className="h-10 w-10 rounded-full" />
      <View className="flex-1 gap-1">
        <Skeleton className="h-4 w-36 rounded" />
        <Skeleton className="h-3 w-48 rounded" />
      </View>
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
  index,
  total,
  ...props
}: ListItemProps) {
  if (loading) return <ListItemSkeleton className={className} index={index} total={total} />;

  const body = (
    <>
      {leading != null && <View>{leading}</View>}
      <View className="flex-1 gap-1">
        {typeof title === 'string' ? <Text className="text-base font-medium text-foreground">{title}</Text> : title}
        {description != null &&
          (typeof description === 'string' ? (
            <Text className="text-sm text-muted-foreground">{description}</Text>
          ) : (
            description
          ))}
      </View>
      {meta != null &&
        (typeof meta === 'string' ? <Text className="text-sm text-muted-foreground">{meta}</Text> : meta)}
      {trailing != null && <View>{trailing}</View>}
    </>
  );

  const layout = 'flex-row items-center gap-4 bg-card px-4 py-4';
  const groupStyle = groupItemStyle(index, total);

  if (onPress) {
    return (
      <CardPressable
        onPress={onPress}
        selected={selected}
        disabled={disabled}
        className={cn(layout, groupStyle, className)}
        {...props}
      >
        {body}
      </CardPressable>
    );
  }

  return (
    <View className={cn(layout, groupStyle, className)} {...props}>
      {body}
    </View>
  );
}

ListItem.displayName = 'ListItem';

export { ListItem };
