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
  push: (name: string) => void;
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

  const push = useCallback(
    (nextRoute: RouteName) => {
      navigation.push(nextRoute);
    },
    [navigation],
  );

  return { canPop, currentRoute, pop, popToRoot, push };
};
