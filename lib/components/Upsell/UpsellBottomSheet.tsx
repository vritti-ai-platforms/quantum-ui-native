import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { BottomSheet, type BottomSheetRef } from '../BottomSheet';
import { type LockVariant, UpsellContent } from './UpsellContent';

export interface UpsellSheetProps {
  /** Feature display name, e.g. "UOM". */
  featureName: string;
  /** Plan codes that unlock the action (from the permission gate result). */
  unlockPlans: string[];
  /** 'plan' (default) → amber upsell; 'site' → destructive "Not enabled for this site". */
  variant?: LockVariant;
}

type Presenter = (props: UpsellSheetProps) => void;

// Module Federation: each bundle that imports this file gets its OWN module instance, so a plain
// module-level presenter would be null inside a micro-app remote even though the host app mounted
// the host component. Stash the presenter on globalThis (same mechanism as PermissionGateContext /
// FormatContext) so `presentUpsellSheet` resolves the identical slot from every bundle.
const PRESENTER_KEY = '__quantum_ui_native_present_upsell_sheet';
function setPresenter(fn: Presenter | null) {
  (globalThis as Record<string, unknown>)[PRESENTER_KEY] = fn;
}
function getPresenter(): Presenter | null {
  return ((globalThis as Record<string, unknown>)[PRESENTER_KEY] as Presenter | null) ?? null;
}

/**
 * Presents the upsell bottom sheet for a plan-locked action (same visuals as the locked-screen Upsell).
 * No-op when no `<UpsellSheetHost />` is mounted (fail open — the package can't assume the host app).
 */
export function presentUpsellSheet(props: UpsellSheetProps) {
  getPresenter()?.(props);
}

// Mount ONCE at the app root (inside BottomSheetModalProvider, e.g. next to PortalHost). The sheet is
// portal-based (gorhom BottomSheetModal), so presenting works from anywhere — screens, headers, remotes.
export function UpsellSheetHost() {
  const sheetRef = useRef<BottomSheetRef>(null);
  const [props, setProps] = useState<UpsellSheetProps | null>(null);

  useEffect(() => {
    setPresenter((next) => {
      setProps(next);
      // Present on the next frame so the 'auto' detent measures the freshly-committed content.
      requestAnimationFrame(() => sheetRef.current?.present());
    });
    return () => setPresenter(null);
  }, []);

  return (
    <BottomSheet ref={sheetRef} variant="inline" detents={['auto']}>
      <View className="items-center gap-6 px-6 pb-10 pt-6">
        {props ? (
          <UpsellContent featureName={props.featureName} unlockPlans={props.unlockPlans} variant={props.variant} size="sm" />
        ) : null}
      </View>
    </BottomSheet>
  );
}
