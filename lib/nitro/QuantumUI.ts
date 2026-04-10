// Web / non-native fallback — pure JS implementation.
// Metro resolves QuantumUI.native.ts on iOS/Android; this file is used on web.
export function multiply(a: number, b: number): number {
  return a * b;
}
