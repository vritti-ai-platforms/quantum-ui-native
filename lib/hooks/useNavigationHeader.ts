import { useNavigation } from '@react-navigation/native';
import { type ReactNode, useLayoutEffect } from 'react';

export interface NavigationHeaderOptions {
  /** Header title; omit to leave the route's configured title untouched. */
  title?: string;
  /** Right-slot element (e.g. an actions MenuButton); omit to leave untouched, null to clear. */
  right?: ReactNode | null;
}

// Sets the native-stack header's dynamic options BEFORE paint — useLayoutEffect (react-navigation's own
// recommendation for setOptions) kills the post-render pop-in a plain useEffect causes. Replaces the
// hand-rolled setOptions effect + per-screen navigation type casts on detail screens. `right` is a plain
// element (the hook wraps it in the headerRight render fn); memoize it on render-hot screens if needed.
export function useNavigationHeader({ title, right }: NavigationHeaderOptions) {
  const navigation = useNavigation();
  useLayoutEffect(() => {
    const options: Record<string, unknown> = {};
    if (title !== undefined) options.title = title;
    if (right !== undefined) options.headerRight = right == null ? undefined : () => right;
    if (Object.keys(options).length > 0) navigation.setOptions(options);
  }, [navigation, title, right]);
}
