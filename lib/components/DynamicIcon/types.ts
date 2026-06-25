export interface PlatformIconDescriptor {
  sfSymbol: string;
  materialSymbol: string;
}

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
  weight?: import('react-native-sfsymbols').SymbolWeight;
  scale?: import('react-native-sfsymbols').SymbolScale;
}
