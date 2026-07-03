// Web / non-native fallback — pure JS implementation.
// Metro resolves QuantumUI.native.ts on iOS/Android; this file is used on web.
export function multiply(a: number, b: number): number {
  return a * b;
}

// Web / non-native fallback — no SF Symbols off iOS; callers fall back to an empty icon box.
export function renderSFSymbol(
  _name: string,
  _size: number,
  _color: number,
  _weight: string,
  _multicolor: boolean,
): string {
  return '';
}
