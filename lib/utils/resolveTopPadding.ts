import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

// Resolves the effective TOP padding a caller declared in a (possibly nested) style, honoring longhand
// precedence: paddingTop > paddingVertical > padding. Non-numeric (percent/string) values resolve to 0.
//
// Needed by the screen-scroll surfaces on Android: their header offset is a paddingTop LONGHAND merged into
// the same contentContainerStyle, and Yoga resolves a longhand edge over a shorthand's implicit edge — so a
// caller's `padding: 16` top edge would be silently swallowed. The Android composers add the caller's top
// back on top of the header offset, matching iOS (where the header offset is a native contentInset and the
// caller's padding is naturally additive).
export function resolveTopPadding(style: StyleProp<ViewStyle>): number {
  const flat = StyleSheet.flatten(style);
  if (!flat) return 0;
  const candidate = flat.paddingTop ?? flat.paddingVertical ?? flat.padding;
  return typeof candidate === 'number' ? candidate : 0;
}
