import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ComponentType,
  type ElementRef,
  type PropsWithChildren,
  type RefObject,
  type ReactNode,
} from 'react';
import { type ViewStyle } from 'react-native';
import { NativeViewGestureHandler } from 'react-native-gesture-handler';
import type { BottomSheetProps } from './types';

export const DEFAULT_SNAP_POINTS = ['50%', '90%'];

export type HostedBottomSheetConfig = {
  id: string;
  onClose: () => void;
  children: ReactNode;
  snapPoints: string[];
  initialSnapIndex: number;
  showHandle: boolean;
  closeOnBackdrop: boolean;
  style?: ViewStyle;
};

type HostedBottomSheetEntry = HostedBottomSheetConfig & {
  isVisible: boolean;
  presentationId: number;
};

type BottomSheetStoreSnapshot = {
  entries: HostedBottomSheetEntry[];
  hostCount: number;
};

export const bottomSheetStore = (() => {
  let entries = new Map<string, HostedBottomSheetEntry>();
  let hostCount = 0;
  let snapshot: BottomSheetStoreSnapshot = {
    entries: [],
    hostCount: 0,
  };
  const listeners = new Set<() => void>();

  const emit = () => {
    snapshot = {
      entries: Array.from(entries.values()),
      hostCount,
    };

    listeners.forEach((listener) => listener());
  };

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot() {
      return snapshot;
    },
    getHostSnapshot() {
      return hostCount > 0;
    },
    attachHost() {
      hostCount += 1;
      emit();
    },
    detachHost() {
      hostCount = Math.max(0, hostCount - 1);

      if (hostCount === 0 && entries.size > 0) {
        entries = new Map();
      }

      emit();
    },
    upsert(entry: HostedBottomSheetConfig) {
      const existing = entries.get(entry.id);
      const nextEntry: HostedBottomSheetEntry = existing
        ? {
            ...existing,
            ...entry,
            isVisible: true,
            presentationId: existing.isVisible
              ? existing.presentationId
              : existing.presentationId + 1,
          }
        : {
            ...entry,
            isVisible: true,
            presentationId: 0,
          };

      entries = new Map(entries);
      entries.set(entry.id, nextEntry);
      emit();
    },
    requestClose(id: string) {
      const existing = entries.get(id);

      if (!existing || !existing.isVisible) {
        return;
      }

      entries = new Map(entries);
      entries.set(id, {
        ...existing,
        isVisible: false,
      });
      emit();
    },
    remove(id: string) {
      if (!entries.has(id)) {
        return;
      }

      entries = new Map(entries);
      entries.delete(id);
      emit();
    },
  };
})();

export function useBottomSheetStoreSnapshot() {
  return useSyncExternalStore(
    bottomSheetStore.subscribe,
    bottomSheetStore.getSnapshot,
    bottomSheetStore.getSnapshot
  );
}

function useIsBottomSheetHostMounted() {
  return useSyncExternalStore(
    bottomSheetStore.subscribe,
    bottomSheetStore.getHostSnapshot,
    bottomSheetStore.getHostSnapshot
  );
}

export type HostedBottomSheetRendererProps = {
  entry: HostedBottomSheetEntry;
  cardColor: string;
  borderColor: string;
  containerComponent?: ComponentType<PropsWithChildren>;
};

type HostedBottomSheetSurfaceProps = {
  backgroundStyle: Array<{ backgroundColor: string } | ViewStyle | undefined>;
  children: ReactNode;
  containerComponent?: ComponentType<PropsWithChildren>;
  handleIndicatorStyle: { backgroundColor: string };
  handleSheetDismissed: () => void;
  handleStyle: { backgroundColor: string };
  initialSnapIndex: number;
  name: string;
  renderBackdrop: (props: BottomSheetBackdropProps) => ReactNode;
  sheetRef: RefObject<ElementRef<typeof BottomSheetModal> | null>;
  showHandle: boolean;
  snapPoints: string[];
};

function useHostedBottomSheetController({
  entry,
  cardColor,
  borderColor,
}: HostedBottomSheetRendererProps) {
  const sheetRef = useRef<ElementRef<typeof BottomSheetModal>>(null);
  const hasDismissedRef = useRef(false);
  const hasPresentedRef = useRef(false);
  const {
    children,
    closeOnBackdrop,
    id: entryId,
    initialSnapIndex,
    isVisible,
    onClose,
    showHandle,
    snapPoints,
    style,
  } = entry;

  const backgroundStyle = useMemo(
    () => [{ backgroundColor: cardColor }, style],
    [cardColor, style]
  );

  const handleStyle = useMemo(
    () => ({ backgroundColor: cardColor }),
    [cardColor]
  );

  const handleIndicatorStyle = useMemo(
    () => ({ backgroundColor: borderColor }),
    [borderColor]
  );

  const handleSheetDismissed = useCallback(() => {
    if (hasDismissedRef.current) {
      return;
    }

    hasDismissedRef.current = true;
    bottomSheetStore.remove(entryId);
    onClose();
  }, [entryId, onClose]);

  useEffect(() => {
    if (isVisible) {
      if (!hasPresentedRef.current) {
        hasPresentedRef.current = true;
        sheetRef.current?.present();
      }

      return;
    }

    if (hasPresentedRef.current && sheetRef.current) {
      sheetRef.current.dismiss();
      return;
    }

    bottomSheetStore.remove(entryId);
  }, [entryId, isVisible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior={closeOnBackdrop ? 'close' : 'none'}
      />
    ),
    [closeOnBackdrop]
  );

  return {
    backgroundStyle,
    children,
    handleIndicatorStyle,
    handleSheetDismissed,
    handleStyle,
    initialSnapIndex,
    name: entryId,
    renderBackdrop,
    sheetRef,
    showHandle,
    snapPoints,
  };
}

function HostedBottomSheetSurface({
  backgroundStyle,
  children,
  containerComponent,
  handleIndicatorStyle,
  handleSheetDismissed,
  handleStyle,
  initialSnapIndex,
  name,
  renderBackdrop,
  sheetRef,
  showHandle,
  snapPoints,
}: HostedBottomSheetSurfaceProps) {
  return (
    <BottomSheetModal
      ref={sheetRef}
      name={name}
      index={initialSnapIndex}
      snapPoints={snapPoints}
      enablePanDownToClose
      enableDismissOnClose
      enableDynamicSizing={false}
      onDismiss={handleSheetDismissed}
      backdropComponent={renderBackdrop}
      backgroundStyle={backgroundStyle}
      handleStyle={handleStyle}
      handleIndicatorStyle={handleIndicatorStyle}
      handleComponent={showHandle ? undefined : null}
      containerComponent={containerComponent}
    >
      <NativeViewGestureHandler disallowInterruption>
        <BottomSheetView>{children}</BottomSheetView>
      </NativeViewGestureHandler>
    </BottomSheetModal>
  );
}

export function HostedBottomSheetRenderer({
  containerComponent,
  ...props
}: HostedBottomSheetRendererProps) {
  const {
    backgroundStyle,
    children,
    handleIndicatorStyle,
    handleSheetDismissed,
    handleStyle,
    initialSnapIndex,
    name,
    renderBackdrop,
    sheetRef,
    showHandle,
    snapPoints,
  } = useHostedBottomSheetController(props);

  return (
    <HostedBottomSheetSurface
      backgroundStyle={backgroundStyle}
      children={children}
      containerComponent={containerComponent}
      handleIndicatorStyle={handleIndicatorStyle}
      handleSheetDismissed={handleSheetDismissed}
      handleStyle={handleStyle}
      initialSnapIndex={initialSnapIndex}
      name={name}
      renderBackdrop={renderBackdrop}
      sheetRef={sheetRef}
      showHandle={showHandle}
      snapPoints={snapPoints}
    />
  );
}

// Exported for platform host files to build BottomSheetHost
export { BottomSheetModalProvider };
export { useTheme } from '../../hooks/useTheme';
export { NAV_THEME } from '../../theme/colors';

// Declarative component — pushes config into the store, renders nothing itself
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
  const id = useId();
  const hostMounted = useIsBottomSheetHostMounted();
  const hasWarnedWithoutHostRef = useRef(false);

  const snapPoints = useMemo(
    () => snapPointsProp ?? DEFAULT_SNAP_POINTS,
    [snapPointsProp]
  );

  const entry = useMemo<HostedBottomSheetConfig>(
    () => ({
      id,
      onClose,
      children,
      snapPoints,
      initialSnapIndex,
      showHandle,
      closeOnBackdrop,
      style,
    }),
    [
      children,
      closeOnBackdrop,
      id,
      initialSnapIndex,
      onClose,
      showHandle,
      snapPoints,
      style,
    ]
  );

  useEffect(() => {
    if (
      !isVisible ||
      hostMounted ||
      hasWarnedWithoutHostRef.current ||
      !__DEV__
    ) {
      return;
    }

    hasWarnedWithoutHostRef.current = true;
    console.warn(
      'BottomSheetHost is not mounted. Render <BottomSheetHost /> near the app root to use <BottomSheet />.'
    );
  }, [hostMounted, isVisible]);

  useEffect(() => {
    if (!hostMounted) {
      return;
    }

    if (isVisible) {
      bottomSheetStore.upsert(entry);
      return;
    }

    bottomSheetStore.requestClose(id);
  }, [entry, hostMounted, id, isVisible]);

  useEffect(() => {
    return () => {
      bottomSheetStore.remove(id);
    };
  }, [id]);

  return null;
}
