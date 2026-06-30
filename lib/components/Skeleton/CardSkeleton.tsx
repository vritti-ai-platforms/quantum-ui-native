import { View } from 'react-native';
import { cn } from '../../utils/cn';
import { Card } from '../Card';
import { Skeleton } from './Skeleton';

// Generic card-shaped loading placeholder — ONE reusable skeleton for any card list, so screens don't
// hand-write a bespoke `<XxxCardSkeleton>` each time. Pass it to FlashList via `skeletonVariant="card"`
// (or `renderSkeletonItem`). Loading states are approximations, so this stays intentionally generic rather
// than mirroring each card. `mb-3` reproduces the list gap (FlashList renders no separators while loading).
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('mb-3 gap-3 p-4', className)}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1 gap-2">
          <Skeleton className="h-4 w-3/5 rounded" />
          <Skeleton className="h-3 w-2/5 rounded" />
        </View>
        <Skeleton className="h-6 w-16 rounded-full" />
      </View>
      <Skeleton className="h-3 w-1/2 rounded" />
    </Card>
  );
}
