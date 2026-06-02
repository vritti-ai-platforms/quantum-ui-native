import { View } from 'react-native';
import { Text } from '../Text';
import { cn } from '../../utils/cn';

export interface TagGroupProps {
  tags: string[];
  className?: string;
}

// Horizontal row of rounded tag pills
function TagGroup({ tags, className }: TagGroupProps) {
  return (
    <View className={cn('flex-row flex-wrap gap-1.5', className)}>
      {tags.map((tag) => (
        <View key={tag} className="rounded-lg bg-muted py-1 px-2.5">
          <Text className="text-xs font-medium text-foreground">{tag}</Text>
        </View>
      ))}
    </View>
  );
}

TagGroup.displayName = 'TagGroup';

export { TagGroup };
