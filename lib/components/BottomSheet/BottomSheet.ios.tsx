import { useEffect, type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';
import {
  bottomSheetStore,
  BottomSheetModalProvider,
  HostedBottomSheetRenderer,
  NAV_THEME,
  useBottomSheetStoreSnapshot,
  useTheme,
} from './BottomSheet.shared';

function BottomSheetModalContainer({ children }: PropsWithChildren) {
  return (
    <FullWindowOverlay>
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {children}
      </View>
    </FullWindowOverlay>
  );
}

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
          containerComponent={BottomSheetModalContainer}
        />
      ))}
    </BottomSheetModalProvider>
  );
}

export { BottomSheet } from './BottomSheet.shared';
