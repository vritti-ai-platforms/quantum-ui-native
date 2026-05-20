import { NavigationRouteContext } from '@react-navigation/core';
import { useContext } from 'react';
import { makeMutable, type SharedValue } from 'react-native-reanimated';

const registry = new Map<string, SharedValue<number>>();

export function getScreenScrollY(routeKey: string): SharedValue<number> {
  let sv = registry.get(routeKey);
  if (!sv) {
    sv = makeMutable(0);
    registry.set(routeKey, sv);
  }
  return sv;
}

export function useScreenScrollY(): SharedValue<number> {
  const route = useContext(NavigationRouteContext);
  return getScreenScrollY(route?.key ?? '__no_route__');
}
