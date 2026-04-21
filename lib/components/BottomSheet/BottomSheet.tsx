import GorhomBottomSheet, {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Portal, PortalHost } from '@rn-primitives/portal';
import { Fragment, useCallback, useEffect, useId, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { FullWindowOverlay as RNFullWindowOverlay } from 'react-native-screens';
import { useTheme } from '../../hooks/useTheme';
import { NAV_THEME } from '../../theme/colors';
import type { BottomSheetProps } from './types';

const PORTAL_HOST_NAME = 'quantum-ui-native-bottom-sheet';
const DEFAULT_SNAP_POINTS = ['50%', '90%'];
const FullWindowOverlay = Platform.OS === 'ios' ? RNFullWindowOverlay : Fragment;

/**
 * Mount once near the app root so all bottom sheets render above the navigator tree.
 */
export function BottomSheetHost() {
  return (
    <FullWindowOverlay>
      <PortalHost name={PORTAL_HOST_NAME} />
    </FullWindowOverlay>
  );
}

/**
 * Bottom sheet built on @gorhom/bottom-sheet. Rendered through @rn-primitives/portal
 * so it overlays the entire app without requiring BottomSheetModalProvider.
 *
 * Host app must wrap its root in <GestureHandlerRootView> and mount
 * <BottomSheetHost /> near the root for the sheet to render.
 */
export function BottomSheet({
  isVisible,
  onClose,
  children,
  snapPoints: snapPointsProp,
  initialSnapIndex = 0,
  showHandle = true,
  closeOnBackdrop = true,
  style,
}: BottomSheetProps) {
  const { isDark } = useTheme();
  const colors = NAV_THEME[isDark ? 'dark' : 'light'];
  const sheetRef = useRef<GorhomBottomSheet>(null);
  const portalName = useId();

  const snapPoints = useMemo(
    () => snapPointsProp ?? DEFAULT_SNAP_POINTS,
    [snapPointsProp],
  );

  const backgroundStyle = useMemo(
    () => [{ backgroundColor: colors.card }, style],
    [colors.card, style],
  );

  const handleStyle = useMemo(
    () => ({ backgroundColor: colors.card }),
    [colors.card],
  );

  const handleIndicatorStyle = useMemo(
    () => ({ backgroundColor: colors.border }),
    [colors.border],
  );

  // Drive open/close imperatively so external isVisible changes animate
  useEffect(() => {
    if (isVisible) sheetRef.current?.snapToIndex(initialSnapIndex);
    else sheetRef.current?.close();
  }, [isVisible, initialSnapIndex]);

  const handleChange = useCallback(
    (index: number) => {
      if (index === -1) onClose();
    },
    [onClose],
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior={closeOnBackdrop ? 'close' : 'none'}
      />
    ),
    [closeOnBackdrop],
  );

  return (
    <Portal name={portalName} hostName={PORTAL_HOST_NAME}>
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <GorhomBottomSheet
          ref={sheetRef}
          index={isVisible ? initialSnapIndex : -1}
          snapPoints={snapPoints}
          enablePanDownToClose
          onChange={handleChange}
          backdropComponent={renderBackdrop}
          backgroundStyle={backgroundStyle}
          handleStyle={handleStyle}
          handleIndicatorStyle={handleIndicatorStyle}
          handleComponent={showHandle ? undefined : null}
        >
          {children}
        </GorhomBottomSheet>
      </View>
    </Portal>
  );
}
