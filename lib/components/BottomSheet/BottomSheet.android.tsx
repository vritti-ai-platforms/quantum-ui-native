import { useEffect } from 'react';
import {
  bottomSheetStore,
  BottomSheetModalProvider,
  HostedBottomSheetRenderer,
  NAV_THEME,
  useBottomSheetStoreSnapshot,
  useTheme,
} from './BottomSheet.shared';

// Mount once near the app root so all bottom sheets render above the navigator tree
export function BottomSheetHost() {
  const { entries } = useBottomSheetStoreSnapshot();
  const { isDark } = useTheme();
  const colors = NAV_THEME[isDark ? 'dark' : 'light'];

  useEffect(() => {
    bottomSheetStore.attachHost();
    return () => {
      bottomSheetStore.detachHost();
    };
  }, []);

  return (
    <BottomSheetModalProvider>
      {entries.map((entry) => (
        <HostedBottomSheetRenderer
          key={`${entry.id}:${entry.presentationId}`}
          entry={entry}
          cardColor={colors.card}
          borderColor={colors.border}
          containerComponent={undefined}
        />
      ))}
    </BottomSheetModalProvider>
  );
}

export { BottomSheet } from './BottomSheet.shared';
