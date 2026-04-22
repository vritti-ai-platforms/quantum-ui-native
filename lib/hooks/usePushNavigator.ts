import {
  type NavigationProp,
  type ParamListBase,
  useNavigation,
  useNavigationState,
  useRoute,
} from '@react-navigation/native';
import type { PushNavigatorContextValue } from '../components/PushNavigator/types';

type PushNavigatorNavigation = NavigationProp<ParamListBase> & {
  popToTop: () => void;
  push: (name: string) => void;
};

export const usePushNavigator = <RouteName extends string = string>(): PushNavigatorContextValue<RouteName> => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>() as unknown as PushNavigatorNavigation;
  const route = useRoute();
  const canPop = navigation.canGoBack();
  const currentRoute = useNavigationState((state) => state.routes[state.index]?.name ?? route.name);

  return {
    canPop,
    currentRoute: currentRoute as RouteName,
    pop: () => {
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    },
    popToRoot: () => {
      navigation.popToTop();
    },
    push: (nextRoute: RouteName) => {
      navigation.push(nextRoute);
    },
  };
};
