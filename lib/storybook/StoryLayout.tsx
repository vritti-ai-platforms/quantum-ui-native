import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { Text } from '../components/Typography';
import { cn } from '../utils/cn';

interface StoryStackProps extends PropsWithChildren {
  className?: string;
}

interface StorySectionProps extends StoryStackProps {
  title?: string;
}

export function StoryStack({ children, className }: StoryStackProps) {
  return <View className={cn('w-full gap-4', className)}>{children}</View>;
}

export function StoryRow({ children, className }: StoryStackProps) {
  return <View className={cn('flex-row flex-wrap items-center gap-3', className)}>{children}</View>;
}

export function StorySection({ title, children, className }: StorySectionProps) {
  return (
    <View className={cn('w-full gap-3 rounded-2xl border border-border bg-card p-4', className)}>
      {title ? <Text className="text-sm font-semibold text-muted-foreground">{title}</Text> : null}
      {children}
    </View>
  );
}
