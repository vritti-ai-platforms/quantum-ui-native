import { FlashList as ShopifyFlashList, type FlashListProps as ShopifyFlashListProps } from '@shopify/flash-list';
import type React from 'react';
import { View } from 'react-native';
import { Text } from '../../reusables/text';
import { cn } from '../../utils/cn';
import { ListItem } from '../ListItem';

export interface FlashListProps<T> extends Omit<ShopifyFlashListProps<T>, 'ListEmptyComponent'> {
  isLoading?: boolean;
  skeletonCount?: number;
  renderSkeletonItem?: () => React.ReactElement;
  emptyText?: string;
  EmptyComponent?: React.ReactElement;
  className?: string;
}

function FlashList<T>({
  data,
  isLoading = false,
  skeletonCount = 6,
  renderSkeletonItem,
  emptyText = 'No items found',
  EmptyComponent,
  className,
  ...props
}: FlashListProps<T>) {
  const skeletonRenderer = renderSkeletonItem ?? (() => <ListItem loading title="" />);

  if (isLoading) {
    return (
      <ShopifyFlashList
        data={Array.from({ length: skeletonCount }, (_, i) => i)}
        renderItem={() => skeletonRenderer()}
        keyExtractor={String}
        scrollEnabled={false}
        className={className}
      />
    );
  }

  return (
    <ShopifyFlashList
      data={data}
      ListEmptyComponent={
        EmptyComponent ?? (
          <View className={cn('flex-1 items-center justify-center py-12')}>
            <Text variant="muted">{emptyText}</Text>
          </View>
        )
      }
      className={className}
      {...props}
    />
  );
}

FlashList.displayName = 'FlashList';

export { FlashList };
