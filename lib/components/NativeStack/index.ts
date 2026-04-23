/**
 * Re-export of React Navigation v8 native stack navigator.
 *
 * Uses native navigation controllers:
 * - iOS: UINavigationController (Liquid Glass header on iOS 26+)
 * - Android: Fragment transactions (Material transitions)
 *
 * WARNING: Requires a development build (EAS Build or local).
 * Will NOT work in Expo Go.
 */
export {
  createNativeStackNavigator,
  type NativeStackNavigationOptions,
  type NativeStackNavigationProp,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
