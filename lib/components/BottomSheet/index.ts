export { BottomSheet, type BottomSheetProps, type BottomSheetRef, type SheetDetent } from './BottomSheet';
export {
  BottomSheetBackgroundScalerProvider,
  BottomSheetScaledScreen,
  type BottomSheetScaledScreenProps,
  useBottomSheetBackgroundScaler,
} from './BottomSheetBackgroundScaler';
// BottomSheetHeader and BottomSheetScrollView are intentionally not exported.
// They're internal subcomponents driven by props on <BottomSheet> itself:
//   <BottomSheet title="…" onClose={…} detents={['full']}>…</BottomSheet>
// renders the header + a scrollable body automatically.
