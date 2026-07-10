import { type RefObject, useCallback, useRef, useState } from 'react';
import type { BottomSheetRef } from '../components/BottomSheet';
import { useRegisterScreenCreateAction } from '../components/ScreenContainer/screenActionRegistry';

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
}

// Bundles the create/edit BottomSheet boilerplate every list screen used to hand-roll: a `sheetRef`, the
// `editing` item state, and the `openCreate` / `openEdit` presenters. With `registerCreateAction`, it also wires
// the ScreenHeader's create (+) button to `openCreate` via the per-route action registry (no per-feature context).
export function useCreateEditSheet<T>(options?: UseCreateEditSheetOptions): CreateEditSheet<T> {
  const sheetRef = useRef<BottomSheetRef>(null);
  const [editing, setEditing] = useState<T | null>(null);
  const openCreate = useCallback(() => {
    setEditing(null);
    sheetRef.current?.present();
  }, []);
  const openEdit = useCallback((item: T) => {
    setEditing(item);
    sheetRef.current?.present();
  }, []);
  useRegisterScreenCreateAction(options?.registerCreateAction ? openCreate : null);
  return { sheetRef, editing, openCreate, openEdit };
}
