import { type RefObject, useCallback, useRef, useState } from 'react';
import type { BottomSheetRef } from '../components/BottomSheet';
import { useRegisterScreenCreateAction } from '../components/ScreenContainer/screenActionRegistry';
import { presentUpsellSheet } from '../components/Upsell';
import { usePermission } from '../context/PermissionGateContext';

export interface CreateEditSheet<T> {
  /** Attach to the `<XFormSheet ref={sheetRef} …>`. */
  sheetRef: RefObject<BottomSheetRef | null>;
  /** The item being edited, or `null` for create. Pass to the form sheet as `editing`. */
  editing: T | null;
  /** Open the sheet in create mode (clears `editing`). Registered as the header create action when opted in. */
  openCreate: () => void;
  /** Open the sheet in edit mode for `item` (wire to a card's onEdit). */
  openEdit: (item: T) => void;
}

export interface UseCreateEditSheetOptions {
  /**
   * Register `openCreate` as this route's create action so a `<ScreenHeader createLabel="…">` (+) button opens
   * the sheet. Leave off for a Fab-triggered sheet, or when several sheets share one route (e.g. detail tabs) —
   * only one handler can own a route's create action.
   */
  registerCreateAction?: boolean;
  /**
   * Permission code gating `openCreate` (e.g. 'org.uom.dim.add'), resolved via the host's permission gate.
   * Not granted → openCreate is a no-op; granted but locked → the upsell sheet presents instead of the form.
   * Omitted → ungated (fail open).
   */
  createPermission?: string;
  /** Permission code gating `openEdit` (e.g. 'org.uom.dim.edit') — same semantics as `createPermission`. */
  editPermission?: string;
}

// Bundles the create/edit BottomSheet boilerplate every list screen used to hand-roll: a `sheetRef`, the
// `editing` item state, and the `openCreate` / `openEdit` presenters. With `registerCreateAction`, it also wires
// the ScreenHeader's create (+) button to `openCreate` via the per-route action registry (no per-feature context).
// With `createPermission`/`editPermission`, a locked action presents the upsell sheet instead of the form.
export function useCreateEditSheet<T>(options?: UseCreateEditSheetOptions): CreateEditSheet<T> {
  const sheetRef = useRef<BottomSheetRef>(null);
  const [editing, setEditing] = useState<T | null>(null);
  const createGate = usePermission(options?.createPermission);
  const editGate = usePermission(options?.editPermission);

  const { granted: createGranted, locked: createLocked, featureName: createFeature, unlockPlans: createPlans } = createGate;
  const openCreate = useCallback(() => {
    if (!createGranted) return;
    if (createLocked) {
      presentUpsellSheet({ featureName: createFeature ?? '', unlockPlans: createPlans });
      return;
    }
    setEditing(null);
    sheetRef.current?.present();
  }, [createGranted, createLocked, createFeature, createPlans]);

  const { granted: editGranted, locked: editLocked, featureName: editFeature, unlockPlans: editPlans } = editGate;
  const openEdit = useCallback(
    (item: T) => {
      if (!editGranted) return;
      if (editLocked) {
        presentUpsellSheet({ featureName: editFeature ?? '', unlockPlans: editPlans });
        return;
      }
      setEditing(item);
      sheetRef.current?.present();
    },
    [editGranted, editLocked, editFeature, editPlans],
  );

  useRegisterScreenCreateAction(options?.registerCreateAction ? openCreate : null);
  return { sheetRef, editing, openCreate, openEdit };
}
