import {
  type NavigationProp,
  type ParamListBase,
  useNavigation,
  useNavigationState,
} from '@react-navigation/native';
import { useCallback } from 'react';
import type { PushNavigatorContextValue } from '../components/PushNavigator/types';

type PushNavigatorNavigation = NavigationProp<ParamListBase> & {
  popToTop: () => void;
};

export const usePushNavigator = <RouteName extends string = string>(): PushNavigatorContextValue<RouteName> => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>() as unknown as PushNavigatorNavigation;
  const canPop = navigation.canGoBack();
  const currentRoute = useNavigationState((state) => state.routes[state.index]?.name ?? '') as RouteName;

  const pop = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  const popToRoot = useCallback(() => {
    navigation.popToTop();
  }, [navigation]);

  // navigate() propagates up the navigator tree, so this works correctly when the
  // component is rendered inside a Tab screen or nested navigator (e.g. More tab)
  // where push() doesn't exist or can't reach the root PushNavigator's screens.
  const push = useCallback(
    (nextRoute: RouteName) => {
      navigation.navigate(nextRoute as string);
    },
    [navigation],
  );

  return { canPop, currentRoute, pop, popToRoot, push };
};
