export interface PlatformIconDescriptor {
  sfSymbol: string;
  materialSymbol: string;
}

// SF Symbol rendering options (local unions — no longer sourced from the legacy react-native-sfsymbols types).
export type SfSymbolWeight =
  | 'ultralight'
  | 'thin'
  | 'light'
  | 'regular'
  | 'medium'
  | 'semibold'
  | 'bold'
  | 'heavy'
  | 'black';

export type SfSymbolScale = 'small' | 'medium' | 'large';

export interface DynamicIconProps {
  icon: PlatformIconDescriptor;
  size?: number;
  color?: string;
  className?: string;
  style?: any;
  testID?: string;
  accessibilityLabel?: string;
  accessible?: boolean;
  multicolor?: boolean;
  weight?: SfSymbolWeight;
  scale?: SfSymbolScale;
}
