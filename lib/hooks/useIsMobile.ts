import { useWindowDimensions } from 'react-native';

const MOBILE_BREAKPOINT = 768;

// Returns true when screen width is below the mobile breakpoint (768px).
// React Native adaptation of the web version — uses useWindowDimensions
// instead of window.matchMedia.
export function useIsMobile(): boolean {
  const { width } = useWindowDimensions();
  return width < MOBILE_BREAKPOINT;
}
