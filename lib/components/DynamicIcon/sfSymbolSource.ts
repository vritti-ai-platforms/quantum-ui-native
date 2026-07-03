import { processColor } from 'react-native';
import { renderSFSymbol } from '../../nitro/QuantumUI';

// Cache the native-rendered data URI per (name,size,color,weight,multicolor) so each unique icon is encoded
// once. Keys include the resolved ARGB color, so a theme / dark-mode change (new color) produces a new entry
// while identical icons reuse the cached PNG.
const cache = new Map<string, string>();

// Both branches below yield 0xAARRGGBB (the format RN `processColor` produces and QuantumUI.swift decodes).
function hslToArgb(h: number, s: number, l: number): number {
  const sN = s / 100;
  const lN = l / 100;
  const a = sN * Math.min(lN, 1 - lN);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return lN - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
  };
  const r = Math.round(f(0) * 255);
  const g = Math.round(f(8) * 255);
  const b = Math.round(f(4) * 255);
  return ((0xff << 24) | (r << 16) | (g << 8) | b) >>> 0;
}

// Resolve a color string to an 0xAARRGGBB int. HSL (NativeWind's `hsl(H S% L%)` / `hsl(H, S%, L%)`) is parsed
// directly so we don't depend on processColor's handling of the space-separated syntax; everything else
// (hex, rgb, named) goes through processColor. Returns 0 (→ opaque black-ish) if unresolvable.
function colorToArgb(color: string): number {
  const hsl = /^\s*hsla?\(\s*([\d.]+)[,\s]+([\d.]+)%[,\s]+([\d.]+)%/i.exec(color);
  if (hsl) return hslToArgb(Number(hsl[1]), Number(hsl[2]), Number(hsl[3]));
  const processed = processColor(color);
  return typeof processed === 'number' ? processed : 0;
}

// Returns a `data:image/png;base64,…` URI for an SF Symbol, rendered natively via the QuantumUI Nitro module,
// for display through RN's Fabric-native <Image>. This replaces the legacy react-native-sfsymbols view manager
// whose interop view crashed on unmount ("unmount a view mounted inside different view"). Returns '' when the
// symbol can't be resolved so callers render an empty icon box.
export function sfSymbolSource(
  name: string,
  size: number,
  color: string | undefined,
  weight: string,
  multicolor: boolean,
): string {
  const argb = color != null ? colorToArgb(color) : 0;

  const key = `${name}|${size}|${argb}|${weight}|${multicolor}`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  let uri = '';
  try {
    uri = renderSFSymbol(name, size, argb, weight, multicolor);
  } catch {
    uri = '';
  }
  cache.set(key, uri);
  return uri;
}
